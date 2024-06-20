# app/routes/group_routes.py
from flask import jsonify, request
from app import app, db
from app.models.Transactions.OtherPurchaseModels import OtherPurchase
import os
from sqlalchemy import text
# Get the base URL from environment variables
API_URL= os.getenv('API_URL')

# Global SQL Query
TASK_DETAILS_QUERY = '''
 SELECT        dbo.nt_1_other_purchase.GST_RateCode, dbo.nt_1_gstratemaster.GST_Name, dbo.nt_1_other_purchase.TDS_AcCode, qrymsttdaccode.Ac_Name_E AS tdsacname, dbo.nt_1_other_purchase.TDS_Cutt_AcCode, 
                         qrymsttdscutaccode.Ac_Name_E AS TDSCutAcName, dbo.nt_1_other_purchase.Exp_Ac, qrymstexp.Ac_Name_E AS ExpAcName, dbo.nt_1_other_purchase.Supplier_Code, qrymstsuppiler.Ac_Name_E AS SupplierName
FROM            dbo.nt_1_other_purchase LEFT OUTER JOIN
                         dbo.nt_1_gstratemaster ON dbo.nt_1_other_purchase.Company_Code = dbo.nt_1_gstratemaster.Company_Code AND dbo.nt_1_other_purchase.GST_RateCode = dbo.nt_1_gstratemaster.Doc_no LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS qrymsttdaccode ON dbo.nt_1_other_purchase.tac = qrymsttdaccode.accoid LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS qrymsttdscutaccode ON dbo.nt_1_other_purchase.tca = qrymsttdscutaccode.accoid LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS qrymstexp ON dbo.nt_1_other_purchase.ea = qrymstexp.accoid LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS qrymstsuppiler ON dbo.nt_1_other_purchase.sc = qrymstsuppiler.accoid
						 where dbo.nt_1_other_purchase.opid=:opid
'''
def format_dates(task):
    return {
        "Doc_Date": task.Doc_Date.strftime('%Y-%m-%d') if task.Doc_Date else None,
    }

# Get all groups API
@app.route(API_URL + "/getall-OtherPurchase", methods=["GET"])
def get_OtherPurchase():
    try:
        # Extract Company_Code from query parameters
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if Company_Code is None:
            return jsonify({'error': 'Missing Company_Code Or Year_Code parameter'}), 400

        try:
            Company_Code = int(Company_Code)
            year_code = int(Year_Code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code parameter'}), 400

        # Fetch records by Company_Code
        records = OtherPurchase.query.filter_by(Company_Code=Company_Code, Year_Code=year_code).all()

        # Convert groups to a list of dictionaries
        record_data = []
        for record in records:
            selected_record_data = {column.key: getattr(record, column.key) for column in record.__table__.columns}
            formatted_record_data = format_dates(record)  # Format dates
            selected_record_data.update(formatted_record_data)  # Update with formatted dates
            record_data.append(selected_record_data)

        return jsonify(record_data)
    except Exception as e:
        print(e)
        return jsonify({'error': 'internal server error'}), 500

 

@app.route(API_URL + "/get-OtherPurchase-lastRecord", methods=["GET"])
def get_OtherPurchase_lastRecord():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        
        if company_code is None or year_code is None:
            return jsonify({'error': 'Missing Company_Code or Year_Code parameter'}), 400

        try:
            company_code = int(company_code)
            year_code = int(year_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code or Year_Code parameter'}), 400

        last_Record = OtherPurchase.query.filter_by(Company_Code=company_code, Year_Code=year_code).order_by(OtherPurchase.Doc_No.desc()).first()

        if last_Record is None:
            return jsonify({'error': 'No record found for the provided Company_Code and Year_Code'}), 404

        last_Record_data = {column.key: getattr(last_Record, column.key) for column in last_Record.__table__.columns}

        # Execute the additional SQL query to fetch more details
        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"opid": last_Record.opid})
        additional_data_rows = additional_data.fetchall()

        formatted_last_record_data = {**last_Record_data, **format_dates(last_Record)}

        response = {
            "last_OtherPurchase_data": formatted_last_record_data,
            "label_names": [{"GST_Name": row.GST_Name, "TDSCutAcName": row.TDSCutAcName, "ExpAcName": row.ExpAcName, "SupplierName": row.SupplierName,"tdsacname": row.tdsacname} for row in additional_data_rows]
        }

        return jsonify(response), 200
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500
    

@app.route(API_URL + "/get-OtherPurchaseSelectedRecord", methods=["GET"])
def get_OtherPurchaseSelectedRecord():
    try:
        # Extract selected Code, Company_Code, and Year_Code from query parameters
        selected_code = request.args.get('Doc_No')
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')

        if selected_code is None or company_code is None or year_code is None:
            return jsonify({'error': 'Missing selected_code, Company_Code, or Year_Code parameter'}), 400

        try:
            selected_Record = int(selected_code)
            company_code = int(company_code)
            year_code = int(year_code)
        except ValueError:
            return jsonify({'error': 'Invalid selected_Record, Company_Code, or Year_Code parameter'}), 400

        # Fetch record by selected_Code, Company_Code, and Year_Code
        Record = OtherPurchase.query.filter_by(Doc_No=selected_Record, Company_Code=company_code, Year_Code=year_code).first()

        if Record is None:
            return jsonify({'error': 'Selected Record not found'}), 404

        # Convert record to a dictionary
        selected_Record_data = {column.key: getattr(Record, column.key) for column in Record.__table__.columns}
        formatted_record_data = format_dates(Record)  # Format dates
        selected_Record_data.update(formatted_record_data)  # Update with formatted dates

        # Execute the additional SQL query to fetch more details
        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"opid": Record.opid})
        additional_data_rows = additional_data.fetchall()

        response = {
            "selected_Record_data": selected_Record_data,
           "label_names": [{"GST_Name": row.GST_Name, "TDSCutAcName": row.TDSCutAcName, "ExpAcName": row.ExpAcName, "SupplierName": row.SupplierName,"tdsacname": row.tdsacname} for row in additional_data_rows]
        }

        return jsonify(response), 200
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500

  
# Create a new group API
@app.route(API_URL+"/create-Record-OtherPurchase", methods=["POST"])
def create_OtherPurchase():
    try:
        # Extract Company_Code and Year_Code from query parameters or JSON data
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        
        if company_code is None or year_code is None:
            return jsonify({'error': 'Missing Company_Code or Year_Code parameter'}), 400

        try:
            company_code = int(company_code)
            year_code = int(year_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code or Year_Code parameter'}), 400

        # Fetch the maximum Doc_No for the given Company_Code and Year_Code
        max_record = db.session.query(db.func.max(OtherPurchase.Doc_No)).filter_by(Company_Code=company_code, Year_Code=year_code).scalar() or 0

        # Create a new entry with the generated Doc_No
        new_record_data = request.json
        new_record_data['Doc_No'] = max_record + 1
        new_record_data['Company_Code'] = company_code
        new_record_data['Year_Code'] = year_code

        new_record = OtherPurchase(**new_record_data)

        db.session.add(new_record)
        db.session.commit()

        return jsonify({
            'message': 'Record created successfully',
            'record': new_record_data
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Update a group API
@app.route(API_URL+"/update-OtherPurchase", methods=["PUT"])
def update_OtherPurchase():
    try:
        # Extract Company_Code and selected record from query parameters
        company_code = request.args.get('Company_Code')
        selected_Record = request.args.get('Doc_No')
        year_code = request.args.get('Year_Code')
        
        if company_code is None or selected_Record is None:
            return jsonify({'error': 'Missing Company_Code Or selected_Record Or year_code parameter'}), 400

        try:
            company_code = int(company_code)
            selected_Record = int(selected_Record)
            year_code = int(year_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code Or selected_Record Or year_code parameter'}), 400

        # Fetch the record to update
        update_Record_data = OtherPurchase.query.filter_by(Company_Code = company_code,Year_Code=year_code, Doc_No = selected_Record).first()
        if update_Record_data is None:
            return jsonify({'error': 'record not found'}), 404

        # Update selected record data
        update_data = request.json
        for key, value in update_data.items():
            setattr(update_Record_data, key, value)

        db.session.commit()

        return jsonify({
            'message': 'record updated successfully',
            'record': update_data
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Delete a group API
@app.route(API_URL+"/delete-OtherPurchase", methods=["DELETE"])
def delete_OtherPurchase():
    try:
        # Extract Company_Code and group_Code from query parameters
        company_code = request.args.get('Company_Code')
        Selected_Record = request.args.get('Doc_No')
        year_code = request.args.get('Year_Code')
        if company_code is None or Selected_Record is None:
            return jsonify({'error': 'Missing Company_Code or Selected_Record Or year_code parameter'}), 400

        try:
            company_code = int(company_code)
            Selected_Record = int(Selected_Record)
            year_code = int(year_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code Or Selected_Record Or year_code parameter'}), 400

        # Fetch the group to delete
        Deleted_Record = OtherPurchase.query.filter_by(Company_Code = company_code,Year_Code=year_code, Doc_No = Selected_Record).first()
        if Deleted_Record is None:
            return jsonify({'error': 'record not found'}), 404

        db.session.delete (Deleted_Record)
        db.session.commit()

        return jsonify({'message': 'record deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route(API_URL + "/get-first-OtherPurchase", methods=["GET"])
def get_first_OtherPurchase():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        
        if company_code is None or year_code is None:
            return jsonify({'error': 'Missing Company_Code or Year_Code parameter'}), 400

        try:
            company_code = int(company_code)
            year_code = int(year_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code or Year_Code parameter'}), 400

        first_Record = OtherPurchase.query.filter_by(Company_Code=company_code, Year_Code=year_code).order_by(OtherPurchase.Doc_No.asc()).first()
        
        if first_Record:
            first_Record_data = {column.key: getattr(first_Record, column.key) for column in first_Record.__table__.columns}

            # Execute the additional SQL query to fetch more details
            additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"opid": first_Record.opid})
            additional_data_rows = additional_data.fetchall()

            formatted_first_record_data = {**first_Record_data, **format_dates(first_Record)}

            response = {
                "first_OtherPurchase_data": formatted_first_record_data,
                "label_names": [{"GST_Name": row.GST_Name, "TDSCutAcName": row.TDSCutAcName, "ExpAcName": row.ExpAcName, "SupplierName": row.SupplierName,"tdsacname": row.tdsacname} for row in additional_data_rows]
            }

            return jsonify(response), 200
        else:
            return jsonify({'error': 'No records found for the provided Company_Code and Year_Code'}), 404
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500


@app.route(API_URL+"/get-OtherPurchase-lastRecordNavigation", methods=["GET"])
def get_OtherPurchase_lastRecordNavigation():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        
        if company_code is None or year_code is None:
            return jsonify({'error': 'Missing Company_Code or Year_Code parameter'}), 400

        try:
            company_code = int(company_code)
            year_code = int(year_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code or Year_Code parameter'}), 400

        last_Record = OtherPurchase.query.filter_by(Company_Code=company_code, Year_Code=year_code).order_by(OtherPurchase.Doc_No.desc()).first()
        
        if last_Record:
            last_Record_data = {column.key: getattr(last_Record, column.key) for column in last_Record.__table__.columns}

            # Execute the additional SQL query to fetch more details
            additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"opid": last_Record.opid})
            additional_data_rows = additional_data.fetchall()

            formatted_last_record_data = {**last_Record_data, **format_dates(last_Record)}

            response = {
                "last_OtherPurchase_data": formatted_last_record_data,
                "label_names": [{"GST_Name": row.GST_Name, "TDSCutAcName": row.TDSCutAcName, "ExpAcName": row.ExpAcName, "SupplierName": row.SupplierName,"tdsacname": row.tdsacname} for row in additional_data_rows]
            }

            return jsonify(response), 200
        else:
            return jsonify({'error': 'No records found for the provided Company_Code and Year_Code'}), 404
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500
    

@app.route(API_URL + "/get-previous-OtherPurchase", methods=["GET"])
def get_previous_OtherPurchase():
    try:
        Selected_Record = request.args.get('Doc_No')
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')

        if Selected_Record is None or company_code is None or year_code is None:
            return jsonify({'error': 'Missing Doc_No, Company_Code, or Year_Code parameter'}), 400

        try:
            Selected_Record = int(Selected_Record)
            company_code = int(company_code)
            year_code = int(year_code)
        except ValueError:
            return jsonify({'error': 'Invalid Doc_No, Company_Code, or Year_Code parameter'}), 400

        previous_selected_record = OtherPurchase.query.filter(
            OtherPurchase.Doc_No < Selected_Record,
            OtherPurchase.Company_Code == company_code,
            OtherPurchase.Year_Code == year_code
        ).order_by(OtherPurchase.Doc_No.desc()).first()

        if previous_selected_record:
            previous_selected_record_data = {column.key: getattr(previous_selected_record, column.key) for column in previous_selected_record.__table__.columns}

            # Execute the additional SQL query to fetch more details
            additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"opid": previous_selected_record.opid})
            additional_data_rows = additional_data.fetchall()

            formatted_previous_record_data = {**previous_selected_record_data, **format_dates(previous_selected_record)}

            response = {
                "previous_OtherPurchase_data": formatted_previous_record_data,
                "label_names": [{"GST_Name": row.GST_Name, "TDSCutAcName": row.TDSCutAcName, "ExpAcName": row.ExpAcName, "SupplierName": row.SupplierName, "tdsacname": row.tdsacname} for row in additional_data_rows]
            }

            return jsonify(response), 200
        else:
            return jsonify({'error': 'No previous record found'}), 404
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500


@app.route(API_URL + "/get-next-OtherPurchase", methods=["GET"])
def get_next_OtherPurchase():
    try:
        Selected_Record = request.args.get('Doc_No')
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')

        if Selected_Record is None or company_code is None or year_code is None:
            return jsonify({'error': 'Missing Doc_No, Company_Code, or Year_Code parameter'}), 400

        try:
            Selected_Record = int(Selected_Record)
            company_code = int(company_code)
            year_code = int(year_code)
        except ValueError:
            return jsonify({'error': 'Invalid Doc_No, Company_Code, or Year_Code parameter'}), 400

        next_Selected_Record = OtherPurchase.query.filter(
            OtherPurchase.Doc_No > Selected_Record,
            OtherPurchase.Company_Code == company_code,
            OtherPurchase.Year_Code == year_code
        ).order_by(OtherPurchase.Doc_No.asc()).first()

        if next_Selected_Record:
            next_Selected_Record_data = {column.key: getattr(next_Selected_Record, column.key) for column in next_Selected_Record.__table__.columns}

            # Execute the additional SQL query to fetch more details
            additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"opid": next_Selected_Record.opid})
            additional_data_rows = additional_data.fetchall()

            formatted_next_record_data = {**next_Selected_Record_data, **format_dates(next_Selected_Record)}

            response = {
                "next_OtherPurchase_data": formatted_next_record_data,
                "label_names": [{"GST_Name": row.GST_Name, "TDSCutAcName": row.TDSCutAcName, "ExpAcName": row.ExpAcName, "SupplierName": row.SupplierName, "tdsacname": row.tdsacname} for row in additional_data_rows]
            }

            return jsonify(response), 200
        else:
            return jsonify({'error': 'No next record found'}), 404
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500


