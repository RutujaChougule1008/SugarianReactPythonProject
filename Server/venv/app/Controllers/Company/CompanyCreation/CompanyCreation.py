# project_folder/app/routes/tender_routes.py
from base64 import b64encode
from flask import jsonify, request
import werkzeug
from app import app, db
from app.models.Company.CompanyCreation.CompanyCreationModels import CompanyCreation
from app.models.Company.CompanyCreation.CompanyCreationSchemas import CompanyCreationSchema
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import text
from sqlalchemy import func
from sqlalchemy.orm.exc import StaleDataError
from werkzeug.utils import secure_filename
import os




# Initialize schema
company_schema = CompanyCreationSchema()


def serialize_company(company):
    """ Helper function to serialize company data including binary fields. """
    result = {key: getattr(company, key) for key in company.__table__.columns.keys() if not key.startswith('_')}
    if company.Logo:
        result['Logo'] = b64encode(company.Logo).decode('utf-8')
    else:
        result['Logo'] = None
    if company.Signature:
        result['Signature'] = b64encode(company.Signature).decode('utf-8')
    else:
        result['Signature'] = None
    return result




# Get data from the Company table
@app.route("/get_company_data_All", methods=["GET"])
def get_company_data():
    try:
        companies = CompanyCreation.query.all()
        result = [serialize_company(company) for company in companies]
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


# Get the maximum Company_Code
@app.route("/get_last_company_code", methods=["GET"])
def get_last_company_code():
    try:
        max_company_code = db.session.query(func.max(CompanyCreation.Company_Code)).scalar()
        return jsonify({"last_company_code": max_company_code}), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
# GET endpoint to retrieve data for the last company code along with all its associated data
@app.route("/get_last_company_data", methods=["GET"])
def get_last_company_data():
    try:
        max_company_code = db.session.query(func.max(CompanyCreation.Company_Code)).scalar()
        if not max_company_code:
            return jsonify({"error": "Not Found", "message": "No companies found"}), 404

        last_company = CompanyCreation.query.filter_by(Company_Code=max_company_code).first()
        if not last_company:
            return jsonify({"error": "Not Found", "message": "Company not found"}), 404

        data = serialize_company(last_company)
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500


    
@app.route("/get_company_by_code", methods=["GET"])
def get_company_by_code():
    company_code = request.args.get("company_code")
    if not company_code:
        return jsonify({"error": "Bad Request", "message": "Company_Code is required"}), 400

    company = CompanyCreation.query.filter_by(Company_Code=company_code).first()
    if not company:
        return jsonify({"error": "Not Found", "message": "Company not found"}), 404

    data = serialize_company(company)
    return jsonify(data), 200

# GET endpoint to retrieve previous data for a specific company by Company_Code(this API use for that last some record are deleted that time show previous record avilable on datatabse)
@app.route("/get_previous_company_data", methods=["GET"])
def get_previous_company_data():
    try:
        company_code = request.args.get("company_code")

        if not company_code:
            return jsonify({"error": "Bad Request", "message": "Company_Code is required"}), 400

        previous_company = CompanyCreation.query.filter(CompanyCreation.Company_Code < company_code)\
            .order_by(CompanyCreation.Company_Code.desc()).first()

        if not previous_company:
            return jsonify({"error": "Not Found", "message": "Previous company data not found"}), 404

        data = serialize_company(previous_company)
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500

    
# POST endpoint to create a new company with logo and signature uploads
@app.route('/create_company', methods=['POST'])
def create_company():
    if 'logo' not in request.files or 'signature' not in request.files:
        return jsonify({"error": "Missing logo or signature file"}), 400

    logo = request.files['logo']
    signature = request.files['signature']

    if not logo or logo.filename == '':
        return jsonify({"error": "No logo file selected"}), 400
    if not signature or signature.filename == '':
        return jsonify({"error": "No signature file selected"}), 400

    # Save the files to the uploads directory
    logo_filename = secure_filename(logo.filename)
    signature_filename = secure_filename(signature.filename)
    logo_path = os.path.join(app.config['UPLOAD_FOLDER'], logo_filename)
    signature_path = os.path.join(app.config['UPLOAD_FOLDER'], signature_filename)

    # Read the binary data first and then save the files to disk
    logo_data = logo.read()
    signature_data = signature.read()

    # Rewind the streams if you need to use them again
    logo.seek(0)
    signature.seek(0)

    # Now save the files to disk
    with open(logo_path, 'wb') as f:
        f.write(logo_data)
    with open(signature_path, 'wb') as f:
        f.write(signature_data)

    try:
        # Assuming textual data is sent as part of the form
        data = {key: value for key, value in request.form.items() if key not in ['logo', 'signature']}

        # Create a new company instance with both binary and non-binary data
        new_company = CompanyCreation(
            Logo=logo_data,
            Signature=signature_data,
            **data
        )

        # Add the new company to the session and commit to the database
        db.session.add(new_company)
        db.session.commit()

        return jsonify({"message": "Company created successfully", "Company_Code": new_company.Company_Code}), 201

    except werkzeug.exceptions.BadRequest as e:
        db.session.rollback()
        return jsonify({"error": "Bad Request", "message": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to create company", "message": str(e)}), 500


#Update Company By Company Code
@app.route("/update_company", methods=["PUT"])
def update_company():
    company_code = request.args.get('company_code')
    if not company_code:
        return jsonify({"error": "Company_Code is required"}), 400

    company = CompanyCreation.query.filter_by(Company_Code=company_code).first()
    if not company:
        return jsonify({"error": "Company not found"}), 404

    try:
        # Update text data, ensure not to include Company_Code in the updateable fields
        data = request.form.to_dict()
        for key in data:
            if hasattr(company, key) and key != 'Company_Code':  # Protect the Company_Code from being updated
                setattr(company, key, data[key])

        # Handle binary data updates
        logo = request.files.get('logo')
        if logo:
            company.Logo = logo.read()
        signature = request.files.get('signature')
        if signature:
            company.Signature = signature.read()

        db.session.commit()
        return jsonify({"message": "Company updated successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to update company", "message": str(e)}), 500
    
# Lock Record update call
@app.route("/lock_unlock_record", methods=["PUT"])
def lock_unlock_record():
    try:
        company_code = request.args.get('company_code')
        

        if not company_code:
            return jsonify({"error": "Bad Request", "message": "Company_Code is required in query parameters"}), 400

        company = CompanyCreation.query.filter_by(Company_Code=company_code).first()
        if not company:
            return jsonify({"error": "Not Found", "message": "Company not found"}), 404

        data = request.json
        for key, value in data.items():
            setattr(company, key, value)

        db.session.commit()

        return jsonify({"message": "Company updated successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500
    




#Delete Company
@app.route("/delete_company", methods=["DELETE"])
def delete_company():
    try:
        company_code = request.args.get('company_code')
        if not company_code:
            return jsonify({"error": "Bad Request", "message": "Company_Code is required in query parameters"}), 400

        company = CompanyCreation.query.filter_by(Company_Code=company_code).first()
        if not company:
            return jsonify({"error": "Not Found", "message": "Company not found"}), 404

        # Verify if the version/timestamp matches the one in the database before deletion
        if request.args.get('version') and company.version != request.args.get('version'):
            return jsonify({"error": "Conflict", "message": "Record has been modified by another user"}), 409

        db.session.delete(company)
        db.session.commit()
        return jsonify({"message": "Company deleted successfully"}), 200
    except StaleDataError:
        db.session.rollback()
        return jsonify({"error": "Conflict", "message": "Record has been modified by another user"}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500
    

#Navigation APIS
@app.route("/get_first_navigation", methods=["GET"])
def get_first_navigation():
    try:
        # Retrieve the first company entry based on ascending order of Company_Code
        first_company = CompanyCreation.query.order_by(CompanyCreation.Company_Code.asc()).first()
        if not first_company:
            return jsonify({'error': 'No records found'}), 404
        
        # Serialize the company data including binary fields like Logo and Signature
        response_data = serialize_company(first_company)
        return jsonify(response_data), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500
    

@app.route("/get_last_navigation", methods=["GET"])
def get_last_navigation():
    try:
        last_company = CompanyCreation.query.order_by(CompanyCreation.Company_Code.desc()).first()
        if not last_company:
            return jsonify({'error': 'No records found'}), 404
        
        data = serialize_company(last_company)
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500

@app.route("/get_previous_navigation", methods=["GET"])
def get_previous_navigation():
    current_company_code = request.args.get('current_company_code')
    if not current_company_code:
        return jsonify({'error': 'current_company_code parameter is required'}), 400
    
    previous_company = CompanyCreation.query.filter(CompanyCreation.Company_Code < current_company_code)\
        .order_by(CompanyCreation.Company_Code.desc()).first()
    if not previous_company:
        return jsonify({'error': 'No previous record found'}), 404

    data = serialize_company(previous_company)
    return jsonify(data), 200

@app.route("/get_next_navigation", methods=["GET"])
def get_next_navigation():
    current_company_code = request.args.get('current_company_code')
    if not current_company_code:
        return jsonify({'error': 'current_company_code parameter is required'}), 400

    next_company = CompanyCreation.query.filter(CompanyCreation.Company_Code > current_company_code)\
        .order_by(CompanyCreation.Company_Code.asc()).first()
    if not next_company:
        return jsonify({'error': 'No next record found'}), 404

    data = serialize_company(next_company)
    return jsonify(data), 200

