# app/routes/group_routes.py
from flask import jsonify, request
from app import app, db
from app.models.Masters.OtherMasters.BrandMasterModels import BrandMaster
import os
# Get the base URL from environment variables
API_URL = os.getenv('API_URL')
# Get all groups API
@app.route(API_URL+"/getall-BrandMaster", methods=["GET"])
def get_BrandMasterallData():
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
        records = BrandMaster.query.filter_by(Company_Code = Company_Code).all()

        # Convert groups to a list of dictionaries
        record_data = []
        for record in records:
            selected_Record_data = {column.key: getattr(record, column.key) for column in record.__table__.columns}
            record_data.append (selected_Record_data)

        return jsonify(record_data)
    except Exception as e:
        print (e)
        return jsonify({'error': 'internal server error'}), 500
 
@app.route(API_URL + "/get-BrandMaster-lastRecord", methods=["GET"])
def get_last_Record_by_company_code():
     try:
         # Extract Company_Code from query parameters
         company_code = request.args.get('Company_Code')
         if company_code is None:
             return jsonify({'error': 'Missing Company_Code parameter'}), 400
 
         try:
             company_code = int(company_code)
         except ValueError:
             return jsonify({'error': 'Invalid Company_Code parameter'}), 400
 
         # Fetch the last group by Company_Code Ordered by selected_RecOrd
         last_Record = BrandMaster.query.filter_by(Company_Code=company_code).order_by(BrandMaster.Code.desc()).first()
 
         if last_Record is None:
             return jsonify({'error': 'No group found fOr the provided Company_Code'}), 404
 
         # Convert group to a dictionary
         last_Record_data = {column.key: getattr(last_Record, column.key) for column in last_Record.__table__.columns}
 
         return jsonify(last_Record_data)
     except Exception as e:
         print (e)
         return jsonify({'error': 'internal server error'}), 500

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

        # Convert group to a dictionary
        selected_Record_data = {column.key: getattr(Record, column.key) for column in Record.__table__.columns}

        return jsonify(selected_Record_data)
    except Exception as e:
        print (e)
        return jsonify({'error': 'internal server error'}), 500
  
# Create a new group API
@app.route(API_URL+"/create-Record", methods=["POST"])
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
        max_record = db.session.query(db.func.max(BrandMaster.Code)).filter_by(Company_Code = company_code).scalar() or 0

        # Create a new GroupMaster entry with the generated group_Code
        new_Record_data = request.json
        new_Record_data ['Code'] = max_record + 1
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
        first_user_creation = BrandMaster.query.order_by(BrandMaster.Code.asc()).first()
        if first_user_creation:
            # Convert SQLAlchemy object to dictionary
            serialized_user_creation = {key: value for key, value in first_user_creation.__dict__.items() if not key.startswith('_')}
            return jsonify([serialized_user_creation])
        else:
            return jsonify({'error': 'No records found'}), 404
    except Exception as e:
        print (e)
        return jsonify({'error': 'internal server error'}), 500

@app.route("/get_last_BrandMaster", methods=["GET"])
def get_last_BrandMaster():
    try:
        last_user_creation = BrandMaster.query.order_by(BrandMaster.Code.desc()).first()
        if last_user_creation:
            serialized_last_user_creation = {}
            for key, value in last_user_creation.__dict__.items():
                if not key.startswith('_'):
                    serialized_last_user_creation [key] = value
            return jsonify([serialized_last_user_creation])
        else:
            return jsonify({'error': 'No records found'}), 404
    except Exception as e:
        print (e)
        return jsonify({'error': 'internal server error'}), 500

@app.route("/get_previous_BrandMaster", methods=["GET"])
def get_previous_BrandMaster():
    try:
        Selected_Record = request.args.get('Code')
        if Selected_Record is None:
            return jsonify({'errOr': 'Selected_Record parameter is required'}), 400

        previous_selected_record = BrandMaster.query.filter(BrandMaster.Code < Selected_Record)\
            .order_by(BrandMaster.Code.desc()).first()
        if previous_selected_record:
            # Serialize the BrandMaster object to a dictionary
            serialized_previous_selected_record = {key: value for key, value in previous_selected_record.__dict__.items() if not key.startswith('_')}
            return jsonify(serialized_previous_selected_record)
        else:
            return jsonify({'error': 'No previous record found'}), 404
    except Exception as e:
        print (e)
        return jsonify({'error': 'internal server error'}), 500

@app.route("/get_next_BrandMaster", methods=["GET"])
def get_next_BrandMaster():
    try:
        Selected_Record = request.args.get('Code')
        if Selected_Record is None:
            return jsonify({'error': 'Selected_Record parameter is required'}), 400

        next_Selected_Record = BrandMaster.query.filter(BrandMaster.Code > Selected_Record)\
            .order_by(BrandMaster.Code.asc()).first()
        if next_Selected_Record:
            # Serialize the BrandMaster object to a dictionary
            serialized_next_Selected_Record = {key: value for key, value in next_Selected_Record.__dict__.items() if not key.startswith('_')}
            return jsonify({'nextSelectedRecord': serialized_next_Selected_Record})
        else:
            return jsonify({'error': 'No next record found'}), 404
    except Exception as e:
        print (e)
        return jsonify({'error': 'internal server error'}), 500

