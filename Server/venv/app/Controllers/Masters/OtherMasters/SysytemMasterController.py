# app/routes/group_routes.py
from flask import jsonify, request
from app import app, db
from app.models.Masters.OtherMasters.SystemMasterModels import SystemMaster
import os
from sqlalchemy import text
# Get the base URL from environment variables
API_URL = os.getenv('API_URL')

# Global SQL Query
TASK_DETAILS_QUERY = '''
SELECT        dbo.nt_1_systemmaster.Purchase_AC, dbo.nt_1_systemmaster.Sale_AC, purcac.Ac_Code AS purccode, purcac.Ac_Name_E AS purcAcname, saleac.Ac_Code AS SaleAccode, saleac.Ac_Name_E AS saleAcname, 
                         dbo.nt_1_gstratemaster.GST_Name 
FROM            dbo.nt_1_systemmaster LEFT OUTER JOIN
                         dbo.nt_1_gstratemaster ON dbo.nt_1_systemmaster.Gst_Code = dbo.nt_1_gstratemaster.Doc_no AND dbo.nt_1_systemmaster.Company_Code = dbo.nt_1_gstratemaster.Company_Code LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS saleac ON dbo.nt_1_systemmaster.Company_Code = saleac.company_code AND dbo.nt_1_systemmaster.Sale_AC = saleac.Ac_Code LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS purcac ON dbo.nt_1_systemmaster.Company_Code = purcac.company_code AND dbo.nt_1_systemmaster.Purchase_AC = purcac.Ac_Code
WHERE 
    dbo.nt_1_systemmaster.System_Type = :system_type 
    AND dbo.nt_1_systemmaster.System_Code = :system_code
'''

# Get all groups API
@app.route(API_URL+"/getall-SystemMaster", methods=["GET"])
def getall_SystemMaster():
    try:
        # Extract Company_Code from query parameters
        Company_Code = request.args.get('Company_Code')
        if Company_Code is None:
            return jsonify({'error': 'Missing Company_Code parameter'}), 400

        try:
            Company_Code = int(Company_Code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code parameter'}), 400

        # Fetch records by Company_Code
        records = SystemMaster.query.filter_by(Company_Code = Company_Code).all()

        # Convert groups to a list of dictionaries
        record_data = []
        for record in records:
            selected_Record_data = {column.key: getattr(record, column.key) for column in record.__table__.columns}
            record_data.append (selected_Record_data)

        return jsonify(record_data)
    except Exception as e:
        print (e)
        return jsonify({'error': 'internal server error'}), 500
    

@app.route(API_URL + "/get-SystemMaster-lastRecord", methods=["GET"])
def get_SystemMaster_lastRecord():
    try:
        # Extract parameters from the query
        company_code = request.args.get('Company_Code')
        system_type = request.args.get('System_Type')
        
        # Validate input parameters
        if company_code is None or system_type is None:
            return jsonify({'error': 'Missing Company_Code or System_Type parameter'}), 400
        
        # Convert parameters to correct types
        try:
            company_code = int(company_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code parameter'}), 400
        
        # Fetch the last record for the given System_Type and Company_Code
        last_record = db.session.query(SystemMaster).filter(
            SystemMaster.System_Type == system_type,
            SystemMaster.Company_Code == company_code
        ).order_by(SystemMaster.System_Code.desc()).first()

        # If no record found, return 404 error
        if last_record is None:
            return jsonify({'error': 'No record found for the provided System_Type and Company_Code'}), 404

        # Execute the SQL query to fetch additional details
        additional_data = db.session.execute(
            text(TASK_DETAILS_QUERY),
            {"system_code": last_record.System_Code, "system_type": system_type}
        )
        additional_data_rows = additional_data.fetchall()
        
        # Convert the last record to a dictionary
        last_record_data = {column.key: getattr(last_record, column.key) for column in last_record.__table__.columns}

        # Prepare the response
        response = {
            "last_SystemMaster_data": last_record_data,
            "label_names": [{"purcAcname": row.purcAcname, "saleAcname": row.saleAcname, "GST_Name": row.GST_Name} for row in additional_data_rows]
        }
        
        return jsonify(response)
    
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal Server Error'}), 500
    
#GET Seleceted Record Data
@app.route(API_URL + "/get-SystemMaster-SelectedRecord", methods=["GET"])
def get_SystemMaster_SelectedRecord():
    try:
        # Extract selected Code and Company_Code from query parameters
        selected_code = request.args.get('system_code')
        company_code = request.args.get('Company_Code')
        system_type = request.args.get('System_Type')
        
        if selected_code is None or company_code is None:
            return jsonify({'error': 'Missing selected_code or Company_Code or System_Type parameter'}), 400

        try:
            selected_Record = int(selected_code)
            company_code = int(company_code)
            system_type = str(system_type)
        except ValueError:
            return jsonify({'error': 'Invalid selected_Record Or Company_Code parameter'}), 400

        # Fetch group by selected_Record and Company_Code
        Record = SystemMaster.query.filter_by(System_Code = selected_Record, Company_Code = company_code,System_Type=system_type).first()

        if Record is None:
            return jsonify({'error': 'Selected Record not found'}), 404
        
        # Execute the additional SQL query to fetch more details
        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"system_code": Record.System_Code, "system_type": system_type})
        additional_data_rows = additional_data.fetchall()
        
        if Record is None:
            return jsonify({'error': 'No record found for the provided System_Type and Company_Code'}), 404

        # Convert group to a dictionary
        selected_Record_data = {column.key: getattr(Record, column.key) for column in Record.__table__.columns}
        response = {
            "Selected_SystemMaster_data": selected_Record_data,
            "label_names": [{"purcAcname": row.purcAcname,"saleAcname": row.saleAcname,"GST_Name": row.GST_Name} for row in additional_data_rows]
        }

        return jsonify(response)
    except Exception as e:
        print (e)
        return jsonify({'error': 'internal server error'}), 500
  
# # Create a new group API
@app.route(API_URL + "/create-Record-SystemMaster", methods=["POST"])
def create_Record_SystemMaster():
    try:
        # Extract Company_Code and System_Type from query parameters
        company_code = request.args.get('Company_Code')
        system_type = request.args.get('System_Type')

        if company_code is None:
            return jsonify({'error': 'Missing Company_Code parameter'}), 400
        if system_type is None:
            return jsonify({'error': 'Missing System_Type parameter'}), 400

        try:
            company_code = int(company_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code parameter'}), 400

        # Fetch the maximum System_Code for the given Company_Code and System_Type
        max_system_code = db.session.query(db.func.max(SystemMaster.System_Code)).filter_by(
            Company_Code=company_code, System_Type=system_type).scalar() or 0

        # Create a new SystemMaster entry with the generated System_Code
        new_record_data = request.json
        new_record_data.pop('System_Code', None)  # Remove System_Code from the data
        new_record_data['System_Code'] = max_system_code + 1
        new_record_data['Company_Code'] = company_code
        new_record_data['System_Type'] = system_type

        new_record = SystemMaster(**new_record_data)

        db.session.add(new_record)
        db.session.commit()

        return jsonify({
            'message': 'Record created successfully',
            'record': new_record_data
        }), 201
    except Exception as e:
        db.session.rollback()
        print(e)
        return jsonify({'error': 'Internal Server Error'}), 500


# # Update a group API
@app.route(API_URL + "/update-SystemMaster", methods=["PUT"])
def update_SystemMaster():
    try:
        # Extract Company_Code, System_Code, and System_Type from query parameters
        company_code = request.args.get('Company_Code')
        system_code = request.args.get('System_Code')
        system_type = request.args.get('System_Type')

        if company_code is None or system_code is None or system_type is None:
            return jsonify({'error': 'Missing Company_Code, System_Code, or System_Type parameter'}), 400

        try:
            company_code = int(company_code)
            system_code = int(system_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code or System_Code parameter'}), 400

        # Fetch the record to update
        update_record = SystemMaster.query.filter_by(
            Company_Code=company_code,
            System_Code=system_code,
            System_Type=system_type
        ).first()

        if update_record is None:
            return jsonify({'error': 'Record not found'}), 404

        # Update the record with the new data
        update_data = request.json
        for key, value in update_data.items():
            setattr(update_record, key, value)

        db.session.commit()

        return jsonify({
            'message': 'Record updated successfully',
            'record': {column.key: getattr(update_record, column.key) for column in update_record.__table__.columns}
        })
    except Exception as e:
        db.session.rollback()
        print(e)
        return jsonify({'error': 'Internal Server Error'}), 500


 # Delete a group API
@app.route(API_URL + "/delete-SystemMaster", methods=["DELETE"])
def delete_SystemMaster():
    try:
        # Extract Company_Code, System_Code, and System_Type from query parameters
        company_code = request.args.get('Company_Code')
        system_code = request.args.get('System_Code')
        system_type = request.args.get('System_Type')

        if company_code is None or system_code is None or system_type is None:
            return jsonify({'error': 'Missing Company_Code, System_Code, or System_Type parameter'}), 400

        try:
            company_code = int(company_code)
            system_code = int(system_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code or System_Code parameter'}), 400

        # Fetch the record to delete
        delete_record = SystemMaster.query.filter_by(
            Company_Code=company_code,
            System_Code=system_code,
            System_Type=system_type
        ).first()

        if delete_record is None:
            return jsonify({'error': 'Record not found'}), 404

        # Delete the record
        db.session.delete(delete_record)
        db.session.commit()

        return jsonify({'message': 'Record deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        print(e)
        return jsonify({'error': 'Internal Server Error'}), 500
    
#navigation APIS
@app.route(API_URL + "/get-first-systemmaster", methods=["GET"])
def get_first_systemmaster():
    try:
        company_code = request.args.get('Company_Code')
        system_type = request.args.get('System_Type')
        
        if company_code is None or system_type is None:
            return jsonify({'error': 'Missing Company_Code or System_Type parameter'}), 400

        try:
            company_code = int(company_code)
            system_type = str(system_type)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code or System_Type parameter'}), 400

        first_Record = SystemMaster.query.filter_by(Company_Code=company_code,System_Type=system_type).order_by(SystemMaster.System_Code.asc()).first()
        
        if first_Record is None:
            return jsonify({'error': 'No records found for the provided Company_Code and System_Type'}), 404

        # Execute the additional SQL query to fetch more details
        additional_data = db.session.execute(
            text(TASK_DETAILS_QUERY),
            {"system_code": first_Record.System_Code, "system_type": system_type}
        )
        additional_data_rows = additional_data.fetchall()

        # Convert the first record to a dictionary
        first_Record_data = {column.key: getattr(first_Record, column.key) for column in first_Record.__table__.columns}

        response = {
            "first_SystemMaster_data": first_Record_data,
            "label_names": [{"purcAcname": row.purcAcname,"saleAcname": row.saleAcname,"GST_Name": row.GST_Name} for row in additional_data_rows]
        }

        return jsonify(response), 200
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500



@app.route(API_URL+"/get-systemmaster-lastRecordNavigation", methods=["GET"])
def get_systemmaster_lastRecordNavigation():
    try:
        company_code = request.args.get('Company_Code')
        system_type = request.args.get('System_Type')

        if company_code is None or system_type is None:
            return jsonify({'error': 'Missing Company_Code or System_Type parameter'}), 400

        try:
            company_code = int(company_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code parameter'}), 400

        # Fetch the last record
        last_record = SystemMaster.query.filter_by(Company_Code=company_code, System_Type=system_type).order_by(SystemMaster.System_Code.desc()).first()

        if last_record:
            last_record_data = {column.key: getattr(last_record, column.key) for column in last_record.__table__.columns}

            # Execute the additional SQL query to fetch more details
            additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"system_code": last_record.System_Code, "system_type": system_type})
            additional_data_rows = additional_data.fetchall()

            # Format the data for response
            response = {
                "last_systemmaster_data": last_record_data,
                "label_names": [{"purcAcname": row.purcAcname, "saleAcname": row.saleAcname, "GST_Name": row.GST_Name} for row in additional_data_rows]
            }

            return jsonify(response), 200
        else:
            return jsonify({'error': 'No records found for the provided Company_Code and System_Type'}), 404
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500

    

@app.route(API_URL + "/get-previous-Systemmaster", methods=["GET"])
def get_previous_Systemmaster():
    try:
        Selected_Record = request.args.get('System_Code')
        company_code = request.args.get('Company_Code')
        system_type = request.args.get('System_Type')

        if Selected_Record is None or company_code is None or system_type is None:
            return jsonify({'error': 'Missing System_Code, Company_Code, or System_Type parameter'}), 400

        try:
            Selected_Record = int(Selected_Record)
            company_code = int(company_code)
            system_type = str(system_type)
        except ValueError:
            return jsonify({'error': 'Invalid System_Code, Company_Code, or System_Type parameter'}), 400

        previous_selected_record = SystemMaster.query.filter(
            SystemMaster.System_Code < Selected_Record,
            SystemMaster.Company_Code == company_code,
            SystemMaster.System_Type == system_type
        ).order_by(SystemMaster.System_Code.desc()).first()

        if previous_selected_record:
            previous_selected_record_data = {column.key: getattr(previous_selected_record, column.key) for column in previous_selected_record.__table__.columns}

            # Execute the additional SQL query to fetch more details
            additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"system_code": previous_selected_record_data['System_Code'], "system_type": system_type})
            additional_data_rows = additional_data.fetchall()

            formatted_previous_record_data = {**previous_selected_record_data}

            response = {
                "previous_Systemmaster_data": formatted_previous_record_data,
                "label_names": [{"purcAcname": row.purcAcname, "saleAcname": row.saleAcname, "GST_Name": row.GST_Name} for row in additional_data_rows]
            }

            return jsonify(response), 200
        else:
            return jsonify({'error': 'No previous record found'}), 404
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500

@app.route(API_URL + "/get-next-SystemMaster", methods=["GET"])
def get_next_SystemMaster():
    try:
        Selected_Record = request.args.get('System_Code')
        company_code = request.args.get('Company_Code')
        system_type = request.args.get('System_Type')

        if Selected_Record is None or company_code is None or system_type is None:
            return jsonify({'error': 'Missing System_Code, Company_Code, or System_Type parameter'}), 400

        try:
            Selected_Record = int(Selected_Record)
            company_code = int(company_code)
            system_type = str(system_type)
        except ValueError:
            return jsonify({'error': 'Invalid System_Code, Company_Code, or System_Type parameter'}), 400

        next_Selected_Record = SystemMaster.query.filter(
            SystemMaster.System_Code > Selected_Record,
            SystemMaster.Company_Code == company_code,
            SystemMaster.System_Type == system_type
        ).order_by(SystemMaster.System_Code.asc()).first()

        if next_Selected_Record:
            next_Selected_Record_data = {column.key: getattr(next_Selected_Record, column.key) for column in next_Selected_Record.__table__.columns}

            # Execute the additional SQL query to fetch more details
            additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"system_code": next_Selected_Record_data['System_Code'], "system_type": system_type})
            additional_data_rows = additional_data.fetchall()

            formatted_next_record_data = {**next_Selected_Record_data}

            response = {
                "next_SystemMaster_data": formatted_next_record_data,
                "label_names": [{"purcAcname": row.purcAcname, "saleAcname": row.saleAcname, "GST_Name": row.GST_Name} for row in additional_data_rows]
            }

            return jsonify(response), 200
        else:
            return jsonify({'error': 'No next record found'}), 404
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500
