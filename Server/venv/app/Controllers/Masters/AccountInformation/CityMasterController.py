# app/routes/group_routes.py
from flask import jsonify, request
from app import app, db
from app.models.Masters.AccountInformation.CityMasterModels import CityMaster
import os
# Get the base URL from environment variables
API_URL = os.getenv('API_URL')

# Get all City API
@app.route(API_URL+"/getall-cities", methods=["GET"])
def getAll_Cities():
    try:
        # Extract Company_Code from query parameters
        company_code = request.args.get('company_code')
        if company_code is None:
            return jsonify({'error': 'Missing Company_Code parameter'}), 400

        try:
            company_code = int(company_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code parameter'}), 400

        # Fetch groups by Company_Code
        groups = CityMaster.query.filter_by(company_code=company_code).all()

        # Convert groups to a list of dictionaries
        groups_data = []
        for group in groups:
            group_data = {column.key: getattr(group, column.key) for column in group.__table__.columns}
            groups_data.append(group_data)

        return jsonify(groups_data)
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500
    
# # Get last City by Company_Code API
@app.route(API_URL + "/getlast-city", methods=["GET"])
def getLast_City():
    try:
        # Extract Company_Code from query parameters
        company_code = request.args.get('company_code')
        if company_code is None:
            return jsonify({'error': 'Missing Company_Code parameter'}), 400

        try:
            company_code = int(company_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code parameter'}), 400

        # Fetch the last group by Company_Code ordered by group_Code
        last_group = CityMaster.query.filter_by(company_code=company_code).order_by(CityMaster.city_code.desc()).first()

        if last_group is None:
            return jsonify({'error': 'No group found for the provided Company_Code'}), 404

        # Convert group to a dictionary
        last_group_data = {column.key: getattr(last_group, column.key) for column in last_group.__table__.columns}

        return jsonify(last_group_data)
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500
    
#GET City by city_Code
@app.route(API_URL + "/get-citybycitycode", methods=["GET"])
def get_CityByCityCode():
    try:
        # Extract group_Code and Company_Code from query parameters
        city_code = request.args.get('city_code')
        company_code = request.args.get('company_code')

        if city_code is None or company_code is None:
            return jsonify({'error': 'Missing city_code or Company_Code parameter'}), 400

        try:
            city_code = int(city_code)
            company_code = int(company_code)
        except ValueError:
            return jsonify({'error': 'Invalid city_code or Company_Code parameter'}), 400

        # Fetch group by group_Code and Company_Code
        group = CityMaster.query.filter_by(city_code=city_code, company_code=company_code).first()

        if group is None:
            return jsonify({'error': 'city_code not found'}), 404

        # Convert group to a dictionary
        group_data = {column.key: getattr(group, column.key) for column in group.__table__.columns}

        return jsonify(group_data)
    except Exception as e:
        print(e)
        return jsonify({'error': 'Internal server error'}), 500


# Create a new City
@app.route(API_URL + "/create-city", methods=["POST"])
def create_city():
    try:
        # Extract Company_Code from query parameters
        company_code = request.args.get('company_code')
        if company_code is None:
            return jsonify({'error': 'Missing Company_Code parameter'}), 400

        try:
            company_code = int(company_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code parameter'}), 400

        # Fetch the maximum group_Code for the given Company_Code
        max_group_code = db.session.query(db.func.max(CityMaster.city_code)).filter_by(company_code=company_code).scalar() or 0

        # Create a new GroupMaster entry with the generated group_Code
        new_group_data = request.json
        new_group_data['city_code'] = max_group_code + 1
        new_group_data['company_code'] = company_code

        new_group = CityMaster(**new_group_data)

        db.session.add(new_group)
        db.session.commit()

        return jsonify({
            'message': 'City created successfully',
            'city': new_group_data
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    

# # Update a group API
@app.route(API_URL+"/update-city", methods=["PUT"])
def update_City():
    try:
        # Extract Company_Code and group_Code from query parameters
        company_code = request.args.get('company_code')
        city_code = request.args.get('city_code')
        if company_code is None or city_code is None:
            return jsonify({'error': 'Missing Company_Code or city_code parameter'}), 400

        try:
            company_code = int(company_code)
            city_code = int(city_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code or city_code parameter'}), 400

        # Fetch the group to update
        group = CityMaster.query.filter_by(company_code=company_code, city_code=city_code).first()
        if group is None:
            return jsonify({'error': 'City not found'}), 404

        # Update group data
        update_data = request.json
        for key, value in update_data.items():
            setattr(group, key, value)

        db.session.commit()

        return jsonify({
            'message': 'City updated successfully',
            'city': update_data
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
# # Delete a City API
@app.route(API_URL+"/delete-city", methods=["DELETE"])
def delete_city():
    try:
        # Extract Company_Code and group_Code from query parameters
        company_code = request.args.get('company_code')
        city_code = request.args.get('city_code')
        if company_code is None or city_code is None:
            return jsonify({'error': 'Missing Company_Code or city_code parameter'}), 400

        try:
            company_code = int(company_code)
            city_code = int(city_code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code or city_code parameter'}), 400

        # Fetch the group to delete
        group = CityMaster.query.filter_by(company_code=company_code, city_code=city_code).first()
        if group is None:
            return jsonify({'error': 'City not found'}), 404

        db.session.delete(group)
        db.session.commit()

        return jsonify({'message': 'City deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
#Navigation API
@app.route(API_URL+"/get_First_Record", methods=["GET"])
def get_First_Record():
    try:
        first_user_creation = CityMaster.query.order_by(CityMaster.city_code.asc()).first()
        if first_user_creation:
            # Convert SQLAlchemy object to dictionary
            serialized_user_creation = {key: value for key, value in first_user_creation.__dict__.items() if not key.startswith('_')}
            return jsonify([serialized_user_creation])
        else:
            return jsonify({'error': 'No records found'}), 404
    except Exception as e:
        print (e)
        return jsonify({'error': 'internal server error'}), 500

@app.route(API_URL+"/get_last_record", methods=["GET"])
def get_last_record():
    try:
        last_user_creation = CityMaster.query.order_by(CityMaster.city_code.desc()).first()
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

@app.route(API_URL+"/get_previous_record", methods=["GET"])
def get_previous_record():
    try:
        Selected_Record = request.args.get('city_code')
        if Selected_Record is None:
            return jsonify({'error': 'Selected_Record parameter is required'}), 400

        previous_selected_record = CityMaster.query.filter(CityMaster.city_code < Selected_Record)\
            .order_by(CityMaster.city_code.desc()).first()
        if previous_selected_record:
            # Serialize the GroupMaster object to a dictionary
            serialized_previous_selected_record = {key: value for key, value in previous_selected_record.__dict__.items() if not key.startswith('_')}
            return jsonify(serialized_previous_selected_record)
        else:
            return jsonify({'error': 'No previous record found'}), 404
    except Exception as e:
        print (e)
        return jsonify({'error': 'internal server error'}), 500

@app.route(API_URL+"/get_next_record", methods=["GET"])
def get_next_record():
    try:
        Selected_Record = request.args.get('group_Code')
        if Selected_Record is None:
            return jsonify({'error': 'Selected_Record parameter is required'}), 400

        next_Selected_Record = CityMaster.query.filter(CityMaster.city_code > Selected_Record)\
            .order_by(CityMaster.city_code.asc()).first()
        if next_Selected_Record:
            # Serialize the GroupMaster object to a dictionary
            serialized_next_Selected_Record = {key: value for key, value in next_Selected_Record.__dict__.items() if not key.startswith('_')}
            return jsonify({'nextSelectedRecord': serialized_next_Selected_Record})
        else:
            return jsonify({'error': 'No next record found'}), 404
    except Exception as e:
        print (e)
        return jsonify({'error': 'internal server error'}), 500


