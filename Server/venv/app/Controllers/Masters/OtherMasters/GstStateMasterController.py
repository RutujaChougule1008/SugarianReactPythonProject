# app/routes/group_routes.py
from flask import jsonify, request
from app import app, db
from app.models.Masters.OtherMasters.GstStateMaster import GSTStateMaster
import os
from sqlalchemy import text

# Get the base URL from environment variables
API_URL = os.getenv('API_URL')

# Get all groups API
@app.route(API_URL+"/getall-gststatemaster", methods=["GET"])
def get_all_gst_state_master():
    # Query the database to get all records from the GSTStateMaster table
    gst_state_masters = GSTStateMaster.query.all()

    # Convert the SQLAlchemy objects to a list of dictionaries
    gst_state_master_list = []
    for gst_state_master in gst_state_masters:
        gst_state_master_dict = {
            'State_Code': gst_state_master.State_Code,
            'State_Name': gst_state_master.State_Name
        }
        gst_state_master_list.append(gst_state_master_dict)

    # Convert the list of dictionaries to JSON and return as a response
    return jsonify(gst_state_master_list)


# Get last State_Code
@app.route(API_URL+"/get-last-state-data", methods=["GET"])
def get_last_state_data():
    try:
        # Query the row corresponding to the maximum State_Code from the database
        last_state_data = db.session.query(GSTStateMaster).filter_by(State_Code=db.session.query(db.func.max(GSTStateMaster.State_Code)).scalar()).first()

        if not last_state_data:
            return jsonify({'error': 'No data found for the last State_Code'}), 404

        # Convert the SQLAlchemy object to a dictionary
        data = {
            'State_Code': last_state_data.State_Code,
            'State_Name': last_state_data.State_Name,
            # Add other fields as needed
        }

        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
#GET Particular State Code whole data 
@app.route(API_URL + "/getdatabyStateCode", methods=["GET"])
def get_state_data():
    try:
        # Get the State_Code from the query parameters
        state_code = request.args.get('State_Code')

        if not state_code:
            return jsonify({'error': 'State_Code parameter is missing'}), 400

        # Query the database for data associated with the provided State_Code
        state_data = GSTStateMaster.query.filter_by(State_Code=state_code).all()

        if not state_data:
            return jsonify({'error': 'No data found for the provided State_Code'}), 404

        # Convert data to a list of dictionaries
        serialized_data = []
        for state in state_data:
            serialized_state = {
                'State_Code': state.State_Code,
                'State_Name': state.State_Name,
                # Add more fields if needed
            }
            serialized_data.append(serialized_state)

        return jsonify(serialized_data), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


#create a new GSt state
@app.route(API_URL+"/create-gststatemaster", methods=["POST"])
def create_gst_state_master():
    try:
        # Extract State_Name from the request data
        state_name = request.json.get('State_Name')
        if not state_name:
            return jsonify({'error': 'Missing State_Name parameter'}), 400

        # Extract State_Code from the request data
        state_code = request.json.get('State_Code')

        # Execute the SQL query to insert the record
        query = text("INSERT INTO gststatemaster (State_Code, State_Name) VALUES (:state_code, :state_name)")
        db.session.execute(query, {"state_code": state_code, "state_name": state_name})
        db.session.commit()

        return jsonify({'message': 'GST State Master record created successfully', 'State_Code': state_code}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
# Update GST State Master record
@app.route(API_URL+"/update-gststatemaster", methods=["PUT"])
def update_gst_state_master():
    try:
        # Extract State_Code and State_Name from the request data
        state_code = request.args.get('State_Code', type=int)
        state_name = request.json.get('State_Name')

        if state_code is None:
            return jsonify({'error': 'Missing State_Code parameter'}), 400
        if not state_name:
            return jsonify({'error': 'Missing State_Name parameter'}), 400

        # Find the GSTStateMaster record to update
        gst_state_master = GSTStateMaster.query.filter_by(State_Code=state_code).first()
        if not gst_state_master:
            return jsonify({'error': 'GST State Master record not found'}), 404

        # Update the State_Name
        gst_state_master.State_Name = state_name

        # Commit the changes to the database
        db.session.commit()

        return jsonify({'message': 'GST State Master record updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    

# Delete GST State Master record
@app.route(API_URL+"/delete-gststatemaster", methods=["DELETE"])
def delete_gst_state_master():
    try:
        # Extract State_Code from the request data
        state_code = request.args.get('State_Code', type=int)

        if state_code is None:
            return jsonify({'error': 'Missing State_Code parameter'}), 400

        # Find the GSTStateMaster record to delete
        gst_state_master = GSTStateMaster.query.filter_by(State_Code=state_code).first()
        if not gst_state_master:
            return jsonify({'error': 'GST State Master record not found'}), 404

        # Delete the record
        db.session.delete(gst_state_master)
        db.session.commit()

        return jsonify({'message': 'GST State Master record deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500