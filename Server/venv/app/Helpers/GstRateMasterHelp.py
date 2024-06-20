from flask import jsonify, request
from app import app, db
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text
import os
# Get the base URL from environment variables
API_URL = os.getenv('API_URL')

@app.route(API_URL+'/gst_rate_master', methods=['GET'])
def gst_rate_master():
    try:
        # Extract Company_Code from query parameters
        Company_Code = request.args.get('Company_Code')
        if Company_Code is None:
            return jsonify({'error': 'Missing Company_Code parameter'}), 400

        try:
            Company_Code = int(Company_Code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code parameter'}), 400

        # Start a database transaction
        with db.session.begin_nested():
            query = db.session.execute(text('''
                SELECT Doc_no, GST_Name, Rate
                FROM NT_1_GSTRateMaster
                WHERE Company_Code=:company_code
            '''), {'company_code': Company_Code})

            result = query.fetchall()

        response = []
        for row in result:
            response.append({
                'Doc_no': row.Doc_no,
                'GST_Name': row.GST_Name,
                'Rate': row.Rate
            })

        return jsonify(response)

    except SQLAlchemyError as error:
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
