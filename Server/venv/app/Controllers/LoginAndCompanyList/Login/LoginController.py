from flask import jsonify, request
from flask_jwt_extended import create_access_token
from app import app
from app.models.LoginModels.LoginModels import GroupUser 

# API route for user login
@app.route('/api/login', methods=['POST'])
def login():
    # Get login credentials from request
    login_data = request.json
    if not login_data:
        return jsonify({'error': 'No data provided'}), 400

    login_name = login_data.get('Login_Name')
    password = login_data.get('Password')

    if not login_name or not password:
        return jsonify({'error': 'Login name and password are required'}), 400

    # Check if user exists
    user = GroupUser.query.filter_by(Login_Name=login_name).first() 

    if not user:
        return jsonify({'error': 'Invalid Login Credentials'}), 401

    # Check password
    if user.Password != password:
        return jsonify({'error': 'Invalid Login Credentials'}), 401

    # User authenticated successfully
    user_data = user.__dict__

    # Remove unnecessary keys
    user_data.pop('_sa_instance_state', None)
    user_data.pop('Password', None)  # Optionally remove sensitive information

    # Generate JWT token
    access_token = create_access_token(identity=login_name)

    # Return user data and JWT token in the response
    return jsonify({'message': 'Login successful', 'user_data': user_data, 'access_token': access_token}), 200
