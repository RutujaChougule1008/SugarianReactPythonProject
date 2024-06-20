from flask import jsonify, request
from app import app, db
from app.models.Company.UserLogin.UserLoginModels import UserLogin

@app.route('/api/userlogin', methods=['POST'])
def userlogin():
    # Parse login credentials from JSON request data
    login_data = request.get_json()
    if not login_data:
        return jsonify({'error': 'No data provided'}), 400

    # Retrieve user name and password from the request data
    login_name = login_data.get('User_Name')
    password = login_data.get('User_Password')

    # Validate that the necessary data is present
    if not login_name or not password:
        return jsonify({'error': 'Both username and password are required'}), 400

    # Check if user exists in the database
    user = UserLogin.query.filter_by(User_Name=login_name).first()
    if user is None:
        return jsonify({'error': 'User not found'}), 404

    # return jsonify({'error': 'Invalid password'}), 401
    if user.User_Password != password:
        return jsonify({'error': 'Invalid login credentials'}), 401

    # If the credentials are correct, respond with a success message (and perhaps a JWT token or session cookie)
    return jsonify({'message': 'Login successful', 'user_id': user.uid}), 200
