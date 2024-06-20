from flask import jsonify
from app import app, db 
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text

@app.route('/gst_state_master', methods=['GET'])
def gst_state_master():
    try:
        # Start a database transaction
        with db.session.begin_nested():
            query = db.session.execute(text('''
                SELECT State_Code, State_Name
                FROM GSTStateMaster
            '''))

            result = query.fetchall()

        response = []
        for row in result:
            response.append({
                'State_Code': row.State_Code,
                'State_Name': row.State_Name
            })

        return jsonify(response)

    except SQLAlchemyError as error:
        # Handle database errors
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

