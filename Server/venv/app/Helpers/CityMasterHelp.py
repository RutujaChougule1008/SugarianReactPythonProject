
from flask import jsonify
from app import app, db
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import text


@app.route('/group_city_master', methods=['GET'])
def group_city_master():
    try:
        # Start a database transaction
        with db.session.begin_nested():
            query = db.session.execute(text('''
               select city_code,city_name_e,city_name_r,state,cityid from nt_1_citymaster where company_code=1 order by city_name_e
            '''))

            result = query.fetchall()

        response = []
        for row in result:
            response.append({
                'city_code': row.city_code,
                'city_name_e': row.city_name_e,
                'city_name_r': row.city_name_r,
                'state': row.state,
                'cityid': row.cityid
            })

        return jsonify(response)

    except SQLAlchemyError as error:
        # Handle database errors
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500