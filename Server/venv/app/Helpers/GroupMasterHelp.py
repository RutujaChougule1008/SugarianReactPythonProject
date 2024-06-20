from flask import jsonify
from app import app, db 
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text

@app.route('/group_master', methods=['GET'])
def group_master():
    try:
        # Start a database transaction
        with db.session.begin_nested():
            query = db.session.execute(text('''
               SELECT group_Code, group_Name_E, group_Name_R, bsid
               FROM nt_1_bsgroupmaster
               ORDER BY group_Name_E
            '''))

            result = query.fetchall()

        response = []
        for row in result:
            response.append({
                'group_Code': row.group_Code,
                'group_Name_E': row.group_Name_E,
                'group_Name_R': row.group_Name_R,
                'bsid': row.bsid
            })

        return jsonify(response)

    except SQLAlchemyError as error:
        # Handle database errors
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500



