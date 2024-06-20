from flask import jsonify
from app import app, db 
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text

@app.route('/api/task-master/userselection_master_help', methods=['GET'])
def userselection_master_help():
    try:
        # Start a database transaction
        with db.session.begin_nested():
            query = db.session.execute(text('''
               select User_Id,User_Name,User_Type,userfullname from tbluser;
            '''))

            result = query.fetchall()

        response = []
        for row in result:
            response.append({
                'User_Id': row.User_Id,
                'User_Name': row.User_Name,
                'User_Type': row.User_Type,
                'userfullname': row.userfullname,
            
            })

        return jsonify(response)

    except SQLAlchemyError as error:
        # Handle database errors
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500


