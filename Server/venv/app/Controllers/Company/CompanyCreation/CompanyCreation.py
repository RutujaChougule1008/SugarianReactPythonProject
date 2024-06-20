# project_folder/app/routes/tender_routes.py
from flask import jsonify, request
from app import app, db
from app.models.Company.CompanyCreation.CompanyCreationModels import CompanyCreation
from app.models.Company.CompanyCreation.CompanyCreationSchemas import CompanyCreationSchema
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import text
from sqlalchemy import func
from sqlalchemy.orm.exc import StaleDataError


# Initialize schema
company_schema = CompanyCreationSchema()

# Get data from the Company table
@app.route("/get_company_data_All", methods=["GET"])
def get_company_data():
    try:
        companies = CompanyCreation.query.all()
        serialized_companies = [company_schema.dump(company) for company in companies]
        return jsonify(serialized_companies), 200
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
        # Get the last company code
        max_company_code = db.session.query(func.max(CompanyCreation.Company_Code)).scalar()
        if not max_company_code:
            return jsonify({"error": "Not Found", "message": "No companies found"}), 404

        # Retrieve data for the company with the last company code
        last_company = CompanyCreation.query.filter_by(Company_Code=max_company_code).first()
        if not last_company:
            return jsonify({"error": "Not Found", "message": "Company not found"}), 404

        # Serialize the data
        serialized_company = company_schema.dump(last_company)

        return jsonify(serialized_company), 200
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500
    

# GET endpoint to retrieve data for a specific company by Company_Code
@app.route("/get_company_by_code", methods=["GET"])
def get_company_by_code():
    try:
        # Get Company_Code from query parameters
        company_code = request.args.get("company_code")

        # Check if Company_Code is provided
        if not company_code:
            return jsonify({"error": "Bad Request", "message": "Company_Code is required"}), 400

        # Retrieve company data for the given Company_Code
        company = CompanyCreation.query.filter_by(Company_Code=company_code).first()

        # Check if company exists
        if not company:
            return jsonify({"error": "Not Found", "message": "Company not found"}), 404

        # Serialize the company data
        serialized_company = company_schema.dump(company)

        return jsonify(serialized_company), 200
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500
    

# GET endpoint to retrieve previous data for a specific company by Company_Code(this API use for that last some record are deleted that time show previous record avilable on datatabse)
@app.route("/get_previous_company_data", methods=["GET"])
def get_previous_company_data():
    try:
        # Get Company_Code from query parameters
        company_code = request.args.get("company_code")

        # Check if Company_Code is provided
        if not company_code:
            return jsonify({"error": "Bad Request", "message": "Company_Code is required"}), 400

        # Retrieve previous data for the given Company_Code
        previous_company = CompanyCreation.query.filter(CompanyCreation.Company_Code < company_code)\
            .order_by(CompanyCreation.Company_Code.desc()).first()

        # Check if previous company data exists
        if not previous_company:
            return jsonify({"error": "Not Found", "message": "Previous company data not found"}), 404

        # Serialize the previous company data
        serialized_previous_company = company_schema.dump(previous_company)

        return jsonify(serialized_previous_company), 200
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500


# POST endpoint to create a new company
@app.route("/create_company", methods=["POST"])
def create_company():
    try:
        data = request.json

        # Find the maximum Company_Code
        max_company_code = db.session.query(func.max(CompanyCreation.Company_Code)).scalar()
        if max_company_code is None:
            max_company_code = 0
        # Increment by one for the new company
        data['Company_Code'] = max_company_code + 1
        
        # Create and save the new company
        new_company = CompanyCreation(**data)
        db.session.add(new_company)
        db.session.commit()
        
        serialized_company = company_schema.dump(new_company)
        return jsonify(serialized_company), 201
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    

# PUT endpoint to update a company by Company_Code
@app.route("/update_company", methods=["PUT"])
def update_company():
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
        first_user_creation = CompanyCreation.query.order_by(CompanyCreation.Company_Code.asc()).first()
        if first_user_creation:
            # Convert SQLAlchemy object to dictionary
            serialized_user_creation = {key: value for key, value in first_user_creation.__dict__.items() if not key.startswith('_')}
            return jsonify([serialized_user_creation])
        else:
            return jsonify({'error': 'No records found'}), 404
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500
    

@app.route("/get_last_navigation", methods=["GET"])
def get_last_navigation():
    try:
        last_user_creation = CompanyCreation.query.order_by(CompanyCreation.Company_Code.desc()).first()
        if last_user_creation:
            serialized_last_user_creation = {}
            for key, value in last_user_creation.__dict__.items():
                if not key.startswith('_'):
                    serialized_last_user_creation[key] = value
            return jsonify([serialized_last_user_creation])
        else:
            return jsonify({'error': 'No records found'}), 404
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500
    

@app.route("/get_previous_navigation", methods=["GET"])
def get_previous_navigation():
    try:
        current_company_code = request.args.get('current_company_code')
        if current_company_code is None:
            return jsonify({'error': 'current_company_code parameter is required'}), 400

        previous_company_creation = CompanyCreation.query.filter(CompanyCreation.Company_Code < current_company_code)\
            .order_by(CompanyCreation.Company_Code.desc()).first()
        if previous_company_creation:
            # Serialize the CompanyCreation object to a dictionary
            serialized_previous_company_creation = {key: value for key, value in previous_company_creation.__dict__.items() if not key.startswith('_')}
            return jsonify(serialized_previous_company_creation)
        else:
            return jsonify({'error': 'No previous record found'}), 404
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500
    

@app.route("/get_next_navigation", methods=["GET"])
def get_next_navigation():
    try:
        current_company_code = request.args.get('current_company_code')
        if current_company_code is None:
            return jsonify({'error': 'current_company_code parameter is required'}), 400

        next_company_creation = CompanyCreation.query.filter(CompanyCreation.Company_Code > current_company_code)\
            .order_by(CompanyCreation.Company_Code.asc()).first()
        if next_company_creation:
            # Serialize the CompanyCreation object to a dictionary
            serialized_next_company_creation = {key: value for key, value in next_company_creation.__dict__.items() if not key.startswith('_')}
            return jsonify({'nextCompanyCreation': serialized_next_company_creation})
        else:
            return jsonify({'error': 'No next record found'}), 404
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500

