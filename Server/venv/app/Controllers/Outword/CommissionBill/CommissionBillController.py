from flask import jsonify, request
from app import app, db
from app.models.Outword.CommissionBill.CommissionBillModel import CommissionBill
from sqlalchemy.sql import text
import os

# Get the base URL from environment variables
API_URL = os.getenv('API_URL')

sql_query = text('''
    SELECT        dbo.commission_bill.ac_code, dbo.commission_bill.ac, party.Ac_Name_E AS PartyName, party.Ac_Code AS PartyCode, dbo.commission_bill.unit_code, dbo.commission_bill.uc, unit.Ac_Name_E AS UnitName, 
                         unit.Ac_Code AS Unitcode, dbo.commission_bill.broker_code, broker.Ac_Name_E AS brokername, broker.Ac_Code AS Brokercode, dbo.commission_bill.bc, dbo.commission_bill.transport_code, 
                         transport.Ac_Name_E AS transportname, dbo.commission_bill.tc, transport.Ac_Code AS transportcode, dbo.commission_bill.mill_code, dbo.commission_bill.mc, mill.Ac_Name_E AS millname, mill.Ac_Code AS millcode, 
                         dbo.commission_bill.TDS_Ac, dbo.commission_bill.ta, tdsac.Ac_Code AS tdsac, tdsac.Ac_Name_E AS tdsacname, dbo.commission_bill.item_code, dbo.commission_bill.ic, itemcode.System_Code AS Itemcode, 
                         itemcode.System_Name_E AS Itemname, dbo.commission_bill.gst_code, gstratecode.GST_Name AS gstratename, gstratecode.Doc_no AS gstratecode
FROM            dbo.commission_bill LEFT OUTER JOIN
                         dbo.nt_1_gstratemaster AS gstratecode ON dbo.commission_bill.gst_code = gstratecode.Doc_no LEFT OUTER JOIN
                         dbo.nt_1_systemmaster AS itemcode ON dbo.commission_bill.ic = itemcode.systemid LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS tdsac ON dbo.commission_bill.ta = tdsac.accoid LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS transport ON dbo.commission_bill.tc = transport.accoid LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS mill ON dbo.commission_bill.mc = mill.accoid LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS broker ON dbo.commission_bill.bc = broker.accoid LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS unit ON dbo.commission_bill.uc = unit.accoid LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS party ON dbo.commission_bill.ac = party.accoid
WHERE        itemcode.System_Type = 'I' and dbo.commission_bill.Tran_Type = :tran_type and dbo.commission_bill.doc_no = :doc_no and 
                 dbo.commission_bill.Company_Code = :company_code and dbo.commission_bill.Year_Code = :year_code
''')

def format_dates(input):
    """Format the date from an input record."""
    return input.doc_date.strftime('%Y-%m-%d') if input.doc_date else None

@app.route(API_URL + "/getall-CommissionBill", methods=["GET"])
def get_CommissionBillallData():
    try:
        # Extract Company_Code, Year_Code, and Tran_Type from query parameters
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        tran_type = request.args.get('Tran_Type')
        
        if company_code is None or year_code is None or tran_type is None:
            return jsonify({'error': 'Missing Company_Code, Year_Code, or Tran_Type parameter'}), 400

        try:
            company_code = int(company_code)
            year_code = int(year_code)
            tran_type = str(tran_type)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code, Year_Code, or Tran_Type parameter'}), 400

        # Fetch records by Company_Code, Year_Code, and Tran_Type
        records = CommissionBill.query.filter_by(Company_Code=company_code, Year_Code=year_code, Tran_Type=tran_type).all()

        # Prepare response data
        result_list = []
        for record in records:
            record_data = {column.name: getattr(record, column.name) for column in record.__table__.columns}
            record_data['Formatted_Doc_Date'] = format_dates(record)

            account_details = db.session.execute(sql_query, {
                'doc_no': record.doc_no,
                'company_code': company_code,
                'year_code': year_code,
                'tran_type': tran_type
            })
            account_info = account_details.first()

            # If account_info exists, iterate and update record_data
            if account_info:
                result_keys = account_details.keys()  # Fetch column names from the SQL result
                for key, value in zip(result_keys, account_info):
                    record_data[key] = value if value is not None else ""

            result_list.append(record_data)

        return jsonify(result_list)
    except Exception as e:
        print(e)
        return jsonify({'error': 'internal server error'}), 500

@app.route("/api/sugarian/get-CommissionBill-lastRecord", methods=["GET"])
def get_CommissionBill_lastRecord():
    try:
        # Extract and validate query parameters
        company_code = request.args.get('Company_Code')
        tran_type = request.args.get('Tran_Type')
        year_code = request.args.get('Year_Code')
        if not company_code or not year_code or not tran_type:
            return jsonify({'error': 'Missing Company_Code, Tran_Type, or Year_Code parameter'}), 400

        try:
            company_code = int(company_code)
            tran_type = str(tran_type)
            year_code = int(year_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code, Tran_Type, or Year_Code parameter'}), 400

        # Fetch the last record matching criteria
        last_Record = CommissionBill.query.filter_by(Company_Code=company_code, Tran_Type=tran_type, Year_Code=year_code).order_by(CommissionBill.doc_no.desc()).first()
        if last_Record is None:
            response_data = {
                'Company_Code': company_code,
                'Tran_Type': tran_type,
                'Year_Code': year_code,
                'doc_no': 0  # Default to 1 if no record exists
            }
            return jsonify(response_data), 200

        # Execute additional SQL query
        account_details = db.session.execute(sql_query, {'doc_no': last_Record.doc_no, 'company_code': company_code, 'year_code': year_code, 'tran_type': tran_type})
        account_info = account_details.first()  # Get the first result, if any

        # Prepare response data
        last_Record_data = {column.name: getattr(last_Record, column.name) for column in last_Record.__table__.columns}
        last_Record_data['doc_date'] = format_dates(last_Record)

        # If account_info exists, iterate and update last_Record_data
        if account_info:
            result_keys = account_details.keys()  # Fetch column names from the SQL result
            for key, value in zip(result_keys, account_info):
                last_Record_data[key] = value if value is not None else ""

        return jsonify(last_Record_data)
    except Exception as e:
        print(e)  # For debugging, better to log error
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500

@app.route(API_URL+"/get-CommissionBillSelectedRecord", methods=["GET"])
def get_CommissionBillSelectedRecord():
    try:
        # Extract selected Code and Company_Code from query parameters
        selected_code = request.args.get('doc_no')
        company_code = request.args.get('Company_Code')
        tran_type = request.args.get('Tran_Type')
        year_code = request.args.get('Year_Code')

        if selected_code is None or company_code is None or tran_type is None or year_code is None:
            return jsonify({'error': 'Missing selected_code, Company_Code, tran_type, or year code parameter'}), 400

        try:
            selected_code = int(selected_code)
            company_code = int(company_code)
            tran_type = str(tran_type)
            year_code = int(year_code)
        except ValueError:
            return jsonify({'error': 'Invalid selected_Record, Company_Code, or tran_type parameter'}), 400

        # Fetch group by selected_Record and Company_Code
        Record = CommissionBill.query.filter_by(doc_no=selected_code, Company_Code=company_code, Tran_Type=tran_type, Year_Code=year_code).first()

        if Record is None:
            return jsonify({'error': 'Selected Record not found'}), 404
        
        account_details = db.session.execute(sql_query, {'doc_no': selected_code, 'company_code': company_code, 'year_code': year_code, 'tran_type': Record.Tran_Type})
        account_info = account_details.first()  # Assuming there is only one or zero result

        selected_Record_data = {column.name: getattr(Record, column.name) if getattr(Record, column.name) is not None else "" for column in Record.__table__.columns}
        selected_Record_data['doc_date'] = format_dates(Record)

        if account_info:
            result_keys = account_details.keys()  # This fetches column names from the SQL result
            for key, value in zip(result_keys, account_info):
                selected_Record_data[key] = value if value is not None else ""

        return jsonify(selected_Record_data)
    except Exception as e:
        print(e)
        return jsonify({'error': 'internal server error'}), 500
  
# Create a new group API
@app.route(API_URL+"/create-RecordCommissionBill", methods=["POST"])
def create_CommissionBill():
    try:
        # Extract Company_Code from query parameters
        company_code = request.args.get('Company_Code')
        tran_type = request.args.get('Tran_Type')
        year_code = request.args.get('Year_Code')
        if company_code is None or tran_type is None or year_code is None:
            return jsonify({'error': 'Missing Company_Code, tran_type, or Year_Code parameter'}), 400

        try:
            company_code = int(company_code)
            tran_type = str(tran_type)
            year_code = int(year_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code parameter'}), 400

        # Fetch the maximum doc_no for the given Company_Code
        max_record = db.session.query(db.func.max(CommissionBill.doc_no)).filter_by(Company_Code=company_code, Tran_Type=tran_type, Year_Code=year_code).scalar() or 0

        # Create a new CommissionBill entry with the generated doc_no
        new_Record_data = request.json
        new_Record_data['doc_no'] = max_record + 1 
        new_Record_data['Company_Code'] = company_code
        new_Record_data['Tran_Type'] = tran_type
        new_Record_data['Year_Code'] = year_code

        new_Record = CommissionBill(**new_Record_data)

        db.session.add(new_Record)
        db.session.commit()

        return jsonify({
            'message': 'Record created successfully',
            'record': new_Record_data
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Update a group API
@app.route(API_URL+"/update-CommissionBill", methods=["PUT"])
def update_CommissionBill():
    try:
        # Extract Company_Code and selected record from query parameters
        company_code = request.args.get('Company_Code')
        tran_type = request.args.get('Tran_Type')
        year_code = request.args.get('Year_Code')
        selected_code = request.args.get('doc_no')
        if company_code is None or selected_code is None or tran_type is None or year_code is None:
            return jsonify({'error': 'Missing Company_Code, selected_Record, tran_type, or year code parameter'}), 400

        try:
            company_code = int(company_code)
            selected_code = int(selected_code)
            tran_type = str(tran_type)
            year_code = int(year_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code, selected_code, tran_type, or year code parameter'}), 400

        # Fetch the record to update
        update_Record_data = CommissionBill.query.filter_by(Company_Code=company_code, doc_no=selected_code, Tran_Type=tran_type, Year_Code=year_code).first()
        if update_Record_data is None:
            return jsonify({'error': 'Record not found'}), 404

        # Update selected record data
        update_data = request.json
        for key, value in update_data.items():
            setattr(update_Record_data, key, value)

        db.session.commit()

        return jsonify({
            'message': 'Record updated successfully',
            'record': update_data
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Delete a group API
@app.route(API_URL+"/delete-CommissionBill", methods=["DELETE"])
def delete_CommissionBill():
    try:
        # Extract Company_Code and doc_no from query parameters
        company_code = request.args.get('Company_Code')
        tran_type = request.args.get('Tran_Type')
        year_code = request.args.get('Year_Code')
        selected_code = request.args.get('doc_no')
        if company_code is None or selected_code is None or tran_type is None or year_code is None:
            return jsonify({'error': 'Missing Company_Code, selected_code, tran_type, or year code parameter'}), 400

        try:
            company_code = int(company_code)
            selected_code = int(selected_code)
            tran_type = str(tran_type)
            year_code = int(year_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code, selected_code, tran_type, or year code parameter'}), 400

        # Fetch the record to delete
        Deleted_Record = CommissionBill.query.filter_by(Company_Code=company_code, doc_no=selected_code, Tran_Type=tran_type, Year_Code=year_code).first()
        if Deleted_Record is None:
            return jsonify({'error': 'Record not found'}), 404

        db.session.delete(Deleted_Record)
        db.session.commit()

        return jsonify({'message': 'Record deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route(API_URL+"/get-first-CommissionBill", methods=["GET"])
def get_first_CommissionBill():
    try:
        company_code = request.args.get('Company_Code')
        tran_type = request.args.get('Tran_Type')
        year_code = request.args.get('Year_Code')

        if company_code is None or tran_type is None or year_code is None:
            return jsonify({'error': 'Missing Company_Code, tran_type, or year code parameter'}), 400

        try:
            company_code = int(company_code)
            tran_type = str(tran_type)
            year_code = int(year_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code, tran_type, or year code parameter'}), 400
        
        first_record = CommissionBill.query.filter_by(Company_Code=company_code, Tran_Type=tran_type, Year_Code=year_code).order_by(CommissionBill.doc_no.asc()).first()
        
        if first_record:
            account_details = db.session.execute(sql_query, {'doc_no': first_record.doc_no, 'company_code': company_code, 'year_code': year_code, 'tran_type': first_record.Tran_Type})
            account_info = account_details.first()

            serialized_record = {column.name: getattr(first_record, column.name) if getattr(first_record, column.name) is not None else "" for column in first_record.__table__.columns}
            serialized_record['Formatted_Doc_Date'] = format_dates(first_record)
            
            if account_info:
                result_keys = account_details.keys()
                for key, value in zip(result_keys, account_info):
                    serialized_record[key] = value if value is not None else ""

            return jsonify([serialized_record])
        else:
            return jsonify({'error': 'No records found'}), 404
    except Exception as e:
        print(e)
        return jsonify({'error': 'internal server error'}), 500

@app.route(API_URL+"/get-last-CommissionBill", methods=["GET"])
def get_last_CommissionBill():
    try:
        company_code = request.args.get('Company_Code')
        tran_type = request.args.get('Tran_Type')
        year_code = request.args.get('Year_Code')

        if company_code is None or tran_type is None or year_code is None:
            return jsonify({'error': 'Missing Company_Code, tran_type, or year code parameter'}), 400

        try:
            company_code = int(company_code)
            tran_type = str(tran_type)
            year_code = int(year_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code, tran_type, or year code parameter'}), 400

        last_record = CommissionBill.query.filter_by(Company_Code=company_code, Tran_Type=tran_type, Year_Code=year_code).order_by(CommissionBill.doc_no.desc()).first()
        if last_record:
            account_details = db.session.execute(sql_query, {'doc_no': last_record.doc_no, 'company_code': company_code, 'year_code': year_code, 'tran_type': last_record.Tran_Type})
            account_info = account_details.first()

            serialized_record = {column.name: getattr(last_record, column.name) if getattr(last_record, column.name) is not None else "" for column in last_record.__table__.columns}
            serialized_record['Formatted_Doc_Date'] = format_dates(last_record)

            if account_info:
                result_keys = account_details.keys()
                for key, value in zip(result_keys, account_info):
                    serialized_record[key] = value if value is not None else ""

            return jsonify([serialized_record])
        else:
            return jsonify({'error': 'No records found'}), 404
    except Exception as e:
        print(e)
        return jsonify({'error': 'internal server error'}), 500

@app.route(API_URL+"/get-previous-CommissionBill", methods=["GET"])
def get_previous_CommissionBill():
    try:
        company_code = request.args.get('Company_Code')
        tran_type = request.args.get('Tran_Type')
        year_code = request.args.get('Year_Code')
        selected_code = request.args.get('doc_no')

        if company_code is None or tran_type is None or year_code is None or selected_code is None:
            return jsonify({'error': 'Missing Company_Code, tran_type, year code, or selected_code parameter'}), 400

        try:
            company_code = int(company_code)
            tran_type = str(tran_type)
            year_code = int(year_code)
            selected_code = int(selected_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code, tran_type, year code, or selected_code parameter'}), 400

        previous_record = CommissionBill.query.filter(CommissionBill.doc_no < selected_code).filter_by(Company_Code=company_code, Tran_Type=tran_type, Year_Code=year_code).order_by(CommissionBill.doc_no.desc()).first()
        if previous_record:
            account_details = db.session.execute(sql_query, {'doc_no': previous_record.doc_no, 'company_code': company_code, 'year_code': year_code, 'tran_type': previous_record.Tran_Type})
            account_info = account_details.first()

            serialized_record = {column.name: getattr(previous_record, column.name) if getattr(previous_record, column.name) is not None else "" for column in previous_record.__table__.columns}
            serialized_record['Formatted_Doc_Date'] = format_dates(previous_record)

            if account_info:
                result_keys = account_details.keys()
                for key, value in zip(result_keys, account_info):
                    serialized_record[key] = value if value is not None else ""

            return jsonify([serialized_record])
        else:
            return jsonify({'error': 'No previous record found'}), 404
    except Exception as e:
        print(e)
        return jsonify({'error': 'internal server error'}), 500

@app.route(API_URL+"/get-next-CommissionBill", methods=["GET"])
def get_next_CommissionBill():
    try:
        company_code = request.args.get('Company_Code')
        tran_type = request.args.get('Tran_Type')
        year_code = request.args.get('Year_Code')
        selected_code = request.args.get('doc_no')

        if company_code is None or tran_type is None or year_code is None or selected_code is None:
            return jsonify({'error': 'Missing Company_Code, tran_type, year code, or selected_code parameter'}), 400

        try:
            company_code = int(company_code)
            tran_type = str(tran_type)
            year_code = int(year_code)
            selected_code = int(selected_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code, tran_type, year code, or selected_code parameter'}), 400

        next_record = CommissionBill.query.filter(CommissionBill.doc_no > selected_code).filter_by(Company_Code=company_code, Tran_Type=tran_type, Year_Code=year_code).order_by(CommissionBill.doc_no.asc()).first()
        if next_record:
            account_details = db.session.execute(sql_query, {'doc_no': next_record.doc_no, 'company_code': company_code, 'year_code': year_code, 'tran_type': next_record.Tran_Type})
            account_info = account_details.first()

            serialized_record = {column.name: getattr(next_record, column.name) if getattr(next_record, column.name) is not None else "" for column in next_record.__table__.columns}
            serialized_record['Formatted_Doc_Date'] = format_dates(next_record)

            if account_info:
                result_keys = account_details.keys()
                for key, value in zip(result_keys, account_info):
                    serialized_record[key] = value if value is not None else ""

            return jsonify([serialized_record])
        else:
            return jsonify({'error': 'No next record found'}), 404
    except Exception as e:
        print(e)
        return jsonify({'error': 'internal server error'}), 500
