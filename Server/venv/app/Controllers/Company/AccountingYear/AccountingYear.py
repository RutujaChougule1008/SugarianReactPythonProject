# app/routes/tender_routes.py
from flask import jsonify, request
from app import app, db
from app.models.Company.AccountingYearModels.AccountingYearModels import AccountingYear
from sqlalchemy import func,desc

# Get all accounting years for a specific company code
@app.route("/get_accounting_years", methods=["GET"])
def get_accounting_years():
    company_code = request.args.get('Company_Code')
    if not company_code:
        return jsonify({'error': 'Missing company_code parameter'}), 400

    try:
        company_code = int(company_code)
    except ValueError:
        return jsonify({'error': 'Invalid company_code parameter'}), 400

    accounting_years = AccountingYear.query.filter_by(Company_Code=company_code).all()
    return jsonify([{
        'yearCode': a.yearCode,
        'year': a.year,
        'Start_Date': a.Start_Date.strftime('%Y-%m-%d'),
        'End_Date': a.End_Date.strftime('%Y-%m-%d'),
        'Company_Code': a.Company_Code
    } for a in accounting_years]), 200

#Create a New Accounting Year API
@app.route("/create_accounting_year", methods=["POST"])
def create_accounting_year():
    company_code = request.args.get('Company_Code')
    if not company_code:
        return jsonify({'error': 'Missing company_code parameter'}), 400

    try:
        company_code = int(company_code)
    except ValueError:
        return jsonify({'error': 'Invalid company_code parameter'}), 400

    # Fetch the highest yearCode for the given company_code or default to 0 if none exist
    max_year_code = db.session.query(func.max(AccountingYear.yearCode)).filter_by(Company_Code=company_code).scalar() or 0
    new_year_code = max_year_code + 1

    # Create a new AccountingYear entry
    new_accounting_year = AccountingYear(
        yearCode=new_year_code,
        Company_Code=company_code,
        year=request.json.get('year', ''),
        Start_Date=request.json.get('Start_Date', ''),
        End_Date=request.json.get('End_Date', '')
    )

    db.session.add(new_accounting_year)
    try:
        db.session.commit()
        return jsonify({
            'yearCode': new_accounting_year.yearCode,
            'year': new_accounting_year.year,
            'Start_Date': new_accounting_year.Start_Date.strftime('%Y-%m-%d'),
            'End_Date': new_accounting_year.End_Date.strftime('%Y-%m-%d'),
            'Company_Code': new_accounting_year.Company_Code
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
#Update Accounting year API
@app.route("/update_accounting_year", methods=["PUT"])
def update_accounting_year():
    # Retrieve 'yearCode' and 'Company_Code' from query parameters
    year_code = request.args.get('yearCode')
    company_code = request.args.get('Company_Code')

    # Validate presence of required query parameters
    if not year_code or not company_code:
        return jsonify({'error': 'Both yearCode and company_code are required'}), 400

    try:
        # Convert parameters to integers
        year_code = int(year_code)
        company_code = int(company_code)
    except ValueError:
        return jsonify({'error': 'Invalid format for yearCode or company_code, must be integers'}), 400

    # Fetch the accounting year based on yearCode and Company_Code
    accounting_year = AccountingYear.query.filter_by(yearCode=year_code, Company_Code=company_code).first()
    if not accounting_year:
        return jsonify({'error': 'Accounting year not found'}), 404

    # Update fields with data from the request body
    data = request.json
    accounting_year.year = data.get('year', accounting_year.year)
    accounting_year.Start_Date = data.get('Start_Date', accounting_year.Start_Date)
    accounting_year.End_Date = data.get('End_Date', accounting_year.End_Date)

    # Commit changes to the database
    try:
        db.session.commit()
        return jsonify({'message': 'Accounting year updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
#Delete Accounting Year from database
@app.route("/delete_accounting_year", methods=["DELETE"])
def delete_accounting_year():
    # Retrieve 'yearCode' and 'Company_Code' from query parameters
    year_code = request.args.get('yearCode')
    company_code = request.args.get('Company_Code')

    # Validate presence of required query parameters
    if not year_code or not company_code:
        return jsonify({'error': 'Missing yearCode or company_code parameter'}), 400

    try:
        # Convert parameters to integers
        year_code = int(year_code)
        company_code = int(company_code)
    except ValueError:
        return jsonify({'error': 'Invalid format for yearCode or company_code, must be integers'}), 400

    # Fetch the accounting year based on yearCode and Company_Code
    accounting_year = AccountingYear.query.filter_by(yearCode=year_code, Company_Code=company_code).first()
    if not accounting_year:
        return jsonify({'error': 'Accounting year not found'}), 404

    # Attempt to delete the accounting year
    try:
        db.session.delete(accounting_year)
        db.session.commit()
        return jsonify({'message': 'Accounting year deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    

@app.route("/get_latest_accounting_year", methods=["GET"])
def get_latest_accounting_year():
    company_code = request.args.get('Company_Code')

    if not company_code:
        return jsonify({'error': 'Company_Code parameter is required'}), 400

    try:
        company_code = int(company_code)
    except ValueError:
        return jsonify({'error': 'Invalid Company_Code parameter'}), 400

    # Retrieve the most recent accounting year for the specified company code
    latest_accounting_year = AccountingYear.query.filter_by(Company_Code=company_code).order_by(desc(AccountingYear.yearCode)).first()

    if not latest_accounting_year:
        return jsonify({'error': 'No accounting years found for the given company'}), 404

    # Return the data as JSON
    return jsonify({
        'yearCode': latest_accounting_year.yearCode,
        'year': latest_accounting_year.year,
        'Start_Date': latest_accounting_year.Start_Date.strftime('%Y-%m-%d'),
        'End_Date': latest_accounting_year.End_Date.strftime('%Y-%m-%d'),
        'Company_Code': latest_accounting_year.Company_Code
    }), 200


#Navigation APIS
@app.route("/get_first_navigationData", methods=["GET"])
def get_first_navigationData():
    company_code = request.args.get('Company_Code')
    
    # Validate the presence of the Company_Code query parameter
    if not company_code:
        return jsonify({'error': 'Company_Code parameter is required'}), 400

    try:
        company_code = int(company_code)  # Ensure it's an integer
        first_accounting_year = AccountingYear.query.filter_by(Company_Code=company_code).order_by(AccountingYear.yearCode.asc()).first()

        if first_accounting_year:
            # Serialize the SQLAlchemy object using __dict__ and filter out SQLAlchemy instance state
            serialized_accounting_year = {key: getattr(first_accounting_year, key) for key in first_accounting_year.__dict__ if not key.startswith('_sa_instance_state')}
            return jsonify(serialized_accounting_year), 200
        else:
            return jsonify({'error': 'No accounting year found for the given Company_Code'}), 404

    except ValueError:
        return jsonify({'error': 'Invalid Company_Code format'}), 400
    except Exception as e:
        print(f"Error retrieving the first accounting year: {e}")
        return jsonify({'error': 'Internal server error'}), 500
