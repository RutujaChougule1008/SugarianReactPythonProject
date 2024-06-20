from flask import jsonify
from app import app, db 
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text

@app.route('/brand_master', methods=['GET'])
def brand_master():
    try:
        # Start a database transaction
        with db.session.begin_nested():
            query = db.session.execute(text('''
                SELECT Code as brand_Code, English_Name AS brand_Name
                FROM Brand_Master
                WHERE Company_Code=1
            '''))

            result = query.fetchall()

        response = []
        for row in result:
            response.append({
                'brand_Code': row.brand_Code,
                'brand_Name': row.brand_Name,
               
            })

        return jsonify(response)

    except SQLAlchemyError as error:
        # Handle database errors
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500


