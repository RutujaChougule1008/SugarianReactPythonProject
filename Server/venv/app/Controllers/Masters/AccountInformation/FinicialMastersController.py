# app/routes/group_routes.py
from flask import jsonify, request
from app import app, db
from app.models.Masters.AccountInformation.FinicialMasterModels import GroupMaster
import os
# Get the base URL from environment variables
API_URL = os.getenv('API_URL')

# Get all groups API
@app.route(API_URL+"/getall-finicial-groups", methods=["GET"])
def get_groups_by_company_code():
    try:
        # Extract Company_Code from query parameters
        company_code = request.args.get('Company_Code')
        if company_code is None:
            return jsonify({'error': 'Missing Company_Code parameter'}), 400

        try:
            company_code = int(company_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code parameter'}), 400

        # Fetch groups by Company_Code
        groups = GroupMaster.query.filter_by(Company_Code=company_code).all()

        # Convert groups to a list of dictionaries
        groups_data = []
        for group in groups:
            group_data = {column.key: getattr(group, column.key) for column in group.__table__.columns}
            groups_data.append(group_data)

        return jsonify(groups_data)
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500
    
# Get last group by Company_Code API
@app.route(API_URL + "/get_last_group_by_company_code", methods=["GET"])
def get_last_group_by_company_code():
    try:
        # Extract Company_Code from query parameters
        company_code = request.args.get('Company_Code')
        if company_code is None:
            return jsonify({'error': 'Missing Company_Code parameter'}), 400

        try:
            company_code = int(company_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code parameter'}), 400

        # Fetch the last group by Company_Code ordered by group_Code
        last_group = GroupMaster.query.filter_by(Company_Code=company_code).order_by(GroupMaster.group_Code.desc()).first()

        if last_group is None:
            return jsonify({'error': 'No group found for the provided Company_Code'}), 404

        # Convert group to a dictionary
        last_group_data = {column.key: getattr(last_group, column.key) for column in last_group.__table__.columns}

        return jsonify(last_group_data)
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500
    

@app.route(API_URL + "/get-group-by-codes", methods=["GET"])
def get_group_by_codes():
    try:
        # Extract group_Code and Company_Code from query parameters
        group_code = request.args.get('group_Code')
        company_code = request.args.get('Company_Code')

        if group_code is None or company_code is None:
            return jsonify({'error': 'Missing group_Code or Company_Code parameter'}), 400

        try:
            group_code = int(group_code)
            company_code = int(company_code)
        except ValueError:
            return jsonify({'error': 'Invalid group_Code or Company_Code parameter'}), 400

        # Fetch group by group_Code and Company_Code
        group = GroupMaster.query.filter_by(group_Code=group_code, Company_Code=company_code).first()

        if group is None:
            return jsonify({'error': 'Group not found'}), 404

        # Convert group to a dictionary
        group_data = {column.key: getattr(group, column.key) for column in group.__table__.columns}

        return jsonify(group_data)
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500


# Create a new group API
@app.route(API_URL+"/create-finicial-group", methods=["POST"])
def create_group():
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
        max_group_code = db.session.query(db.func.max(GroupMaster.group_Code)).filter_by(Company_Code=company_code).scalar() or 0

        # Create a new GroupMaster entry with the generated group_Code
        new_group_data = request.json
        new_group_data.pop('bsid', None)  # Remove bsid from the data
        new_group_data['group_Code'] = max_group_code + 1
        new_group_data['Company_Code'] = company_code

        new_group = GroupMaster(**new_group_data)

        db.session.add(new_group)
        db.session.commit()

        return jsonify({
            'message': 'Group created successfully',
            'group': new_group_data
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    

# Update a group API
@app.route(API_URL+"/update-finicial-group", methods=["PUT"])
def update_group():
    try:
        # Extract Company_Code and group_Code from query parameters
        company_code = request.args.get('Company_Code')
        group_code = request.args.get('group_Code')
        if company_code is None or group_code is None:
            return jsonify({'error': 'Missing Company_Code or group_Code parameter'}), 400

        try:
            company_code = int(company_code)
            group_code = int(group_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code or group_Code parameter'}), 400

        # Fetch the group to update
        group = GroupMaster.query.filter_by(Company_Code=company_code, group_Code=group_code).first()
        if group is None:
            return jsonify({'error': 'Group not found'}), 404

        # Update group data
        update_data = request.json
        for key, value in update_data.items():
            setattr(group, key, value)

        db.session.commit()

        return jsonify({
            'message': 'Group updated successfully',
            'group': update_data
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
# Delete a group API
@app.route(API_URL+"/delete-finicial-group", methods=["DELETE"])
def delete_group():
    try:
        # Extract Company_Code and group_Code from query parameters
        company_code = request.args.get('Company_Code')
        group_code = request.args.get('group_Code')
        if company_code is None or group_code is None:
            return jsonify({'error': 'Missing Company_Code or group_Code parameter'}), 400

        try:
            company_code = int(company_code)
            group_code = int(group_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code or group_Code parameter'}), 400

        # Fetch the group to delete
        group = GroupMaster.query.filter_by(Company_Code=company_code, group_Code=group_code).first()
        if group is None:
            return jsonify({'error': 'Group not found'}), 404

        db.session.delete(group)
        db.session.commit()

        return jsonify({'message': 'Group deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
#Navigation API
@app.route(API_URL+"/get_First_GroupMaster", methods=["GET"])
def get_First_GroupMaster():
    try:
        first_user_creation = GroupMaster.query.order_by(GroupMaster.group_Code.asc()).first()
        if first_user_creation:
            # Convert SQLAlchemy object to dictionary
            serialized_user_creation = {key: value for key, value in first_user_creation.__dict__.items() if not key.startswith('_')}
            return jsonify([serialized_user_creation])
        else:
            return jsonify({'error': 'No records found'}), 404
    except Exception as e:
        print (e)
        return jsonify({'error': 'internal server error'}), 500

@app.route(API_URL+"/get_last_GroupMaster", methods=["GET"])
def get_last_GroupMaster():
    try:
        last_user_creation = GroupMaster.query.order_by(GroupMaster.group_Code.desc()).first()
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

@app.route(API_URL+"/get_previous_GroupMaster", methods=["GET"])
def get_previous_GroupMaster():
    try:
        Selected_Record = request.args.get('group_Code')
        if Selected_Record is None:
            return jsonify({'error': 'Selected_Record parameter is required'}), 400

        previous_selected_record = GroupMaster.query.filter(GroupMaster.group_Code < Selected_Record)\
            .order_by(GroupMaster.group_Code.desc()).first()
        if previous_selected_record:
            # Serialize the GroupMaster object to a dictionary
            serialized_previous_selected_record = {key: value for key, value in previous_selected_record.__dict__.items() if not key.startswith('_')}
            return jsonify(serialized_previous_selected_record)
        else:
            return jsonify({'error': 'No previous record found'}), 404
    except Exception as e:
        print (e)
        return jsonify({'error': 'internal server error'}), 500

@app.route(API_URL+"/get_next_GroupMaster", methods=["GET"])
def get_next_GroupMaster():
    try:
        Selected_Record = request.args.get('group_Code')
        if Selected_Record is None:
            return jsonify({'error': 'Selected_Record parameter is required'}), 400

        next_Selected_Record = GroupMaster.query.filter(GroupMaster.group_Code > Selected_Record)\
            .order_by(GroupMaster.group_Code.asc()).first()
        if next_Selected_Record:
            # Serialize the GroupMaster object to a dictionary
            serialized_next_Selected_Record = {key: value for key, value in next_Selected_Record.__dict__.items() if not key.startswith('_')}
            return jsonify({'nextSelectedRecord': serialized_next_Selected_Record})
        else:
            return jsonify({'error': 'No next record found'}), 404
    except Exception as e:
        print (e)
        return jsonify({'error': 'internal server error'}), 500



