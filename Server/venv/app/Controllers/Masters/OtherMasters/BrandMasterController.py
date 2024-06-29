# app/routes/group_routes.py
from flask import jsonify, request
from app import app, db
from app.models.Masters.OtherMasters.BrandMasterModels import BrandMaster
from datetime import datetime
import os
from sqlalchemy import text
# Get the base URL from environment variables
API_URL = os.getenv('API_URL')

# Global SQL Query
TASK_DETAILS_QUERY = '''
                SELECT dbo.Brand_Master.Mal_Code, dbo.qryItemMaster.System_Name_E,dbo.Brand_Master.Company_Code, dbo.Brand_Master.Code
                FROM  dbo.Brand_Master LEFT OUTER JOIN
                dbo.qryItemMaster ON dbo.Brand_Master.Company_Code = dbo.qryItemMaster.Company_Code AND
                dbo.Brand_Master.Mal_Code = dbo.qryItemMaster.System_Code
                where dbo.Brand_Master.Code=:Code
''' 

# Get all groups API
@app.route(API_URL+"/getall-BrandMaster", methods=["GET"])
def get_BrandMasterallData():
    try:
        company_code = request.args.get('Company_Code')
        
        if company_code is None:
            return jsonify({'error': 'Missing Company_Code parameter'}), 400

        try:
            company_code = int(company_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code parameter'}), 400

        records = BrandMaster.query.filter_by(Company_Code=company_code).order_by(BrandMaster.Code.desc()).all()

        if not records:
            return jsonify({'error': 'No records found for the provided Company_Code'}), 404

        all_records_data = []
        for record in records:
            record_data = {column.key: getattr(record, column.key) for column in record.__table__.columns}

            # Execute the additional SQL query to fetch more details for each record
            additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"Code": record.Code})
            additional_data_rows = additional_data.fetchall()

            # Assuming TASK_DETAILS_QUERY returns one row per BrandMaster record
            if additional_data_rows:
                additional_data_row = additional_data_rows[0]
                record_data["Mal_Code"] = additional_data_row.Mal_Code
                record_data["System_Name_E"] = additional_data_row.System_Name_E

            all_records_data.append(record_data)

        return jsonify(all_records_data), 200
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500

@app.route(API_URL + "/get-BrandMaster-lastRecord", methods=["GET"])
def get_BrandMaster_lastRecord():
    try:
        company_code = request.args.get('Company_Code') 
        
        if company_code is None:
            return jsonify({'error': 'Missing Company_Code parameter'}), 400

        try:
            company_code = int(company_code) 
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code parameter'}), 400

        last_Record = BrandMaster.query.filter_by(Company_Code=company_code).order_by(BrandMaster.Code.desc()).first()

        if last_Record is None:
            return jsonify({'error': 'No record found for the provided Company_Code'}), 404

        last_Record_data = {column.key: getattr(last_Record, column.key) for column in last_Record.__table__.columns}

        # Execute the additional SQL query to fetch more details
        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"Code": last_Record.Code})
        additional_data_rows = additional_data.fetchall()

        formatted_last_record_data = {**last_Record_data}

        response = {    
            "last_BrandMaster_data": formatted_last_record_data,
            "label_names": [{"Mal_Code": row.Mal_Code, "System_Name_E": row.System_Name_E} for row in additional_data_rows]
        }

        return jsonify(response), 200
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500
    

@app.route(API_URL + "/get-BrandMasterSelectedRecord", methods=["GET"])
def get_SelectedRecord():
    try:
        # Extract selected Code and Company_Code from query parameters
        selected_code = request.args.get('Code')
        company_code = request.args.get('Company_Code')

        if selected_code is None or company_code is None:
            return jsonify({'error': 'Missing selected_code or Company_Code parameter'}), 400

        try:
            selected_Record = int(selected_code)
            company_code = int(company_code)
        except ValueError:
            return jsonify({'error': 'Invalid selected_Record Or Company_Code parameter'}), 400

        # Fetch group by selected_Record and Company_Code
        Record = BrandMaster.query.filter_by(Code=selected_Record, Company_Code = company_code).first()

        if Record is None:
            return jsonify({'error': 'Selected Record not found'}), 404

         # Convert record to a dictionary
        selected_Record_data = {column.key: getattr(Record, column.key) for column in Record.__table__.columns}
    

        # Execute the additional SQL query to fetch more details
        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"Code": Record.Code})
        additional_data_rows = additional_data.fetchall()

        response = {
            "selected_Record_data": selected_Record_data,
            "label_names": [{"Mal_Code": row.Mal_Code, "System_Name_E": row.System_Name_E} for row in additional_data_rows]
         }

        return jsonify(response), 200
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500

# Create a new group API
@app.route(API_URL+"/create-RecordBrandMaster", methods=["POST"])
def create_BrandMaster():
    try:
        # Extract Company_Code from query parameters
        company_code = request.args.get('Company_Code')
        if company_code is None:
            return jsonify({'error': 'Missing Company_Code parameter'}), 400

        try:
            company_code = int(company_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code parameter'}), 400

        # Fetch the maximum group_Code for the given Company_Code
        # max_record = db.session.query(db.func.max(BrandMaster.Code)).filter_by(Company_Code = company_code).scalar() or 0

        # Create a new GroupMaster entry with the generated group_Code
        new_Record_data = request.json

        print('new_Record_data',new_Record_data);
        if 'Code' in new_Record_data:
            del new_Record_data['Code']
             
        new_Record_data ['Company_Code'] = company_code

        new_Record = BrandMaster(**new_Record_data)

        db.session.add (new_Record)
        db.session.commit()

        return jsonify({
            'message': 'Record created successfully',
            'record': new_Record_data
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Update a group API
@app.route(API_URL+"/update-BrandMaster", methods=["PUT"])
def update_BrandMaster():
    try:
        # Extract Company_Code and selected record from query parameters
        company_code = request.args.get('Company_Code')
        selected_Record = request.args.get('Code')
        if company_code is None or selected_Record is None:
            return jsonify({'error': 'Missing Company_Code Or selected_Record parameter'}), 400

        try:
            company_code = int(company_code)
            selected_Record = int(selected_Record)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code Or selected_Record parameter'}), 400

        # Fetch the record to update
        update_Record_data = BrandMaster.query.filter_by(Company_Code = company_code, Code = selected_Record).first()
        if update_Record_data is None:
            return jsonify({'error': 'record not found'}), 404

    
# Update operation with converted date

        # Update selected record data
        update_data = request.json
        created_date_str = 'Thu, 27 Jun 2024 00:00:00 GMT'
        created_date = datetime.strptime(created_date_str, '%a, %d %b %Y %H:%M:%S %Z').strftime('%Y-%m-%d %H:%M:%S')

        update_data['Created_Date'] = created_date

        Modified_Date_str = 'Thu, 27 Jun 2024 00:00:00 GMT'
        Modified_Date = datetime.strptime(Modified_Date_str, '%a, %d %b %Y %H:%M:%S %Z').strftime('%Y-%m-%d %H:%M:%S')

        update_data['Modified_Date'] = Modified_Date

        update_data.pop('Code', None)
        update_data.pop('Created_By', None)
        update_data.pop('Created_Date', None)

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
@app.route(API_URL+"/delete-BrandMaster", methods=["DELETE"])
def delete_BrandMaster():
    try:
        # Extract Company_Code and group_Code from query parameters
        company_code = request.args.get('Company_Code')
        Selected_Record = request.args.get('Code')
        if company_code is None or Selected_Record is None:
            return jsonify({'error': 'Missing Company_Code or Selected_Record parameter'}), 400

        try:
            company_code = int(company_code)
            Selected_Record = int(Selected_Record)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code Or Selected_Record parameter'}), 400

        # Fetch the group to delete
        Deleted_Record = BrandMaster.query.filter_by(Company_Code = company_code, Code = Selected_Record).first()
        if Deleted_Record is None:
            return jsonify({'error': 'record not found'}), 404

        db.session.delete (Deleted_Record)
        db.session.commit()

        return jsonify({'message': 'record deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route(API_URL+"/get-first-BrandMaster", methods=["GET"])
def get_first_BrandMaster():
    try:
        company_code = request.args.get('Company_Code') 
        
        if company_code is None:
            return jsonify({'error': 'Missing Company_Code parameter'}), 400

        try:
            company_code = int(company_code) 
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code parameter'}), 400

        first_Record = BrandMaster.query.filter_by(Company_Code=company_code).order_by(BrandMaster.Code.asc()).first()
        
        if first_Record:
            first_Record_data = {column.key: getattr(first_Record, column.key) for column in first_Record.__table__.columns}

            # Execute the additional SQL query to fetch more details
            additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"Code": first_Record.Code})
            additional_data_rows = additional_data.fetchall()
 
            formatted_first_record_data = {**first_Record_data}

            response = {    
            "first_BrandMaster_data": formatted_first_record_data,
            "label_names": [{"Mal_Code": row.Mal_Code, "System_Name_E": row.System_Name_E} for row in additional_data_rows]
            }

            return jsonify(response), 200
        else:
            return jsonify({'error': 'No records found for the provided Company_Code '}), 404
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500

 
@app.route(API_URL+"/get_previous_BrandMaster", methods=["GET"])
def get_previous_BrandMaster():
    try:
        Selected_Record = request.args.get('Code')
        company_code = request.args.get('Company_Code') 

        if Selected_Record is None or company_code is None:
            return jsonify({'error': 'Missing Code or Company_Code parameter'}), 400

        try:
            Selected_Record = int(Selected_Record)
            company_code = int(company_code) 
        except ValueError:
            return jsonify({'error': 'Invalid Code or Company_Code parameter'}), 400

        previous_selected_record = BrandMaster.query.filter(
            BrandMaster.Code < Selected_Record,
            BrandMaster.Company_Code == company_code, 
        ).order_by(BrandMaster.Code.desc()).first()

        if previous_selected_record:
            previous_selected_record_data = {column.key: getattr(previous_selected_record, column.key) for column in previous_selected_record.__table__.columns}

            # Execute the additional SQL query to fetch more details
            additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"Code": previous_selected_record.Code})
            additional_data_rows = additional_data.fetchall()

            formatted_previous_record_data = {**previous_selected_record_data}

            response = {
                "previous_BrandMaster_data": formatted_previous_record_data,
                "label_names": [{"Mal_Code": row.Mal_Code, "System_Name_E": row.System_Name_E} for row in additional_data_rows]
           }

            return jsonify(response), 200
        else:
            return jsonify({'error': 'No previous record found'}), 404
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500


@app.route(API_URL+"/get_next_BrandMaster", methods=["GET"])
def get_next_BrandMaster():
    try:
        Selected_Record = request.args.get('Code')
        company_code = request.args.get('Company_Code') 

        if Selected_Record is None or company_code is None:
            return jsonify({'error': 'Missing Code or Company_Code parameter'}), 400

        try:
            Selected_Record = int(Selected_Record)
            company_code = int(company_code) 
        except ValueError:
            return jsonify({'error': 'Invalid Code or Company_Code parameter'}), 400

        next_selected_record = BrandMaster.query.filter(
            BrandMaster.Code > Selected_Record,
            BrandMaster.Company_Code == company_code, 
        ).order_by(BrandMaster.Code.asc()).first()

        if next_selected_record:
            next_selected_record_data = {column.key: getattr(next_selected_record, column.key) for column in next_selected_record.__table__.columns}

            # Execute the additional SQL query to fetch more details
            additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"Code": next_selected_record.Code})
            additional_data_rows = additional_data.fetchall()

            formatted_next_record_data = {**next_selected_record_data}

            response = {
                "next_BrandMaster_data": formatted_next_record_data,
                "label_names": [{"Mal_Code": row.Mal_Code, "System_Name_E": row.System_Name_E} for row in additional_data_rows]
           }

            return jsonify(response), 200
        else:
            return jsonify({'error': 'No previous record found'}), 404
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500

@app.route(API_URL+"/get_last_BrandMaster", methods=["GET"])
def get_last_BrandMaster():
    try:
        company_code = request.args.get('Company_Code') 
        
        if company_code is None :
            return jsonify({'error': 'Missing Company_Codeparameter'}), 400

        try:
            company_code = int(company_code) 
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code parameter'}), 400

        last_Record = BrandMaster.query.filter_by(Company_Code=company_code).order_by(BrandMaster.Code.desc()).first()
        
        if last_Record:
            last_Record_data = {column.key: getattr(last_Record, column.key) for column in last_Record.__table__.columns}

            # Execute the additional SQL query to fetch more details
            additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"Code": last_Record.Code})
            additional_data_rows = additional_data.fetchall()

            formatted_last_record_data = {**last_Record_data}

          
            response = {
                "last_BrandMaster_data": formatted_last_record_data,
                "label_names": [{"Mal_Code": row.Mal_Code, "System_Name_E": row.System_Name_E} for row in additional_data_rows]
           }

            return jsonify(response), 200
        else:
            return jsonify({'error': 'No records found for the provided Company_Code and Year_Code'}), 404
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500
    