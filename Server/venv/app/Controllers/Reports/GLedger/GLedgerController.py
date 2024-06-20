# app/routes/group_routes.py
from flask import jsonify, request
from app import app, db
from app.models.Reports.GLedeger.GLedgerModels import Gledger
import os
# Get the base URL from environment variables
API_URL = os.getenv('API_URL')

def format_dates(task):
    return {
        "DOC_DATE": task.DOC_DATE.strftime('%Y-%m-%d') if task.DOC_DATE else None
    }
# Get all groups API
# Get all groups API
@app.route(API_URL+"/getall-Gledger", methods=["GET"])
def get_GledgerallData():
    try:
        # Extract Company_Code from query parameters
        Company_Code = request.args.get('Company_Code')
        yearCode = request.args.get('Year_Code')
        AC_CODE = request.args.get('AC_CODE')
        if Company_Code is None:
            return jsonify({'error': 'Missing Company_Code parameter'}), 400

        try:
            Company_Code = int(Company_Code)
            yearCode = int(yearCode)
            AC_CODE = int(AC_CODE)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code and Year Code and AC CODE parameter'}), 400

        # Fetch records by Company_Code
        records = Gledger.query.filter_by(COMPANY_CODE = Company_Code, YEAR_CODE = yearCode, AC_CODE = AC_CODE).order_by(Gledger.DOC_DATE,Gledger.TRAN_TYPE,Gledger.DOC_NO).all()

        # Convert groups to a list of dictionaries
        record_data = []
        for record in records:
            selected_Record_data = {column.key: getattr(record, column.key) for column in record.__table__.columns}
            # Format dates and append to selected_Record_data
            formatted_dates = format_dates(record)
            selected_Record_data.update(formatted_dates)
            record_data.append(selected_Record_data)

        return jsonify(record_data)
    except Exception as e:
        print(e)
        return jsonify({'error': 'internal server error'}), 500

  
# # Create a new group API
@app.route(API_URL+"/create-Record-gLedger", methods=["POST"])
def create_Record_Gledger():
    try:
        # Extract parameters from the request
        company_code = request.args.get('Company_Code')
        doc_no = request.args.get('DOC_NO')
        year_code = request.args.get('Year_Code')
        tran_type = request.args.get('TRAN_TYPE')
        
        # Check if required parameters are missing
        if None in [company_code, doc_no, year_code, tran_type]:
            return jsonify({'error': 'Missing parameters in the request'}), 400
        
        # Convert parameters to appropriate types
        company_code = int(company_code)
        doc_no = int(doc_no)
        year_code = int(year_code)
        tran_type = str(tran_type)

        # Check if the record exists
        existing_records = Gledger.query.filter_by(
            COMPANY_CODE=company_code,
            DOC_NO=doc_no,
            YEAR_CODE=year_code,
            TRAN_TYPE=tran_type
        ).all()

        # Delete all existing records
        for record in existing_records:
            db.session.delete(record)
        
        db.session.commit()

        # Create new records
        new_records_data = request.json

        # Check if the request body is a list
        if not isinstance(new_records_data, list):
            return jsonify({'error': 'Request body must be a list of records'}), 400

        new_records = []
        for record_data in new_records_data:
            record_data['COMPANY_CODE'] = company_code
            record_data['DOC_NO'] = doc_no
            record_data['YEAR_CODE'] = year_code
            record_data['TRAN_TYPE'] = tran_type
            new_record = Gledger(**record_data)
            new_records.append(new_record)

        # Add new records to the session
        db.session.add_all(new_records)
        db.session.commit()

        return jsonify({
            'message': 'Records created successfully',
            'records': [record_data for record_data in new_records_data]
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route(API_URL + "/delete-Record-gLedger", methods=["DELETE"])
def delete_Record_Gledger():
    try:
        # Extract parameters from the request
        company_code = request.args.get('Company_Code')
        doc_no = request.args.get('DOC_NO')
        year_code = request.args.get('Year_Code')
        tran_type = request.args.get('TRAN_TYPE')
        
        # Check if required parameters are missing
        if None in [company_code, doc_no, year_code, tran_type]:
            return jsonify({'error': 'Missing parameters in the request'}), 400
        
        # Convert parameters to appropriate types
        try:
            company_code = int(company_code)
            doc_no = int(doc_no)
            year_code = int(year_code)
            tran_type = str(tran_type)
        except ValueError:
            return jsonify({'error': 'Invalid parameter type'}), 400

        # Start a transaction
        with db.session.begin():
            # Fetch and delete all existing records
            existing_records = Gledger.query.filter_by(
                COMPANY_CODE=company_code,
                DOC_NO=doc_no,
                YEAR_CODE=year_code,
                TRAN_TYPE=tran_type
            ).delete(synchronize_session='fetch')
        
        db.session.commit()

        return jsonify({
            'message': 'Records deleted successfully',
            'deleted_records_count': existing_records
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500
