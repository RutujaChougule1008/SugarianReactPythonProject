from flask import jsonify, request
from app import app, db
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import text
import os

API_URL = os.getenv('API_URL')

@app.route(API_URL + '/deliveryorder-all', methods=['GET'])
def deliveryorder_all():
    company_code = request.args.get('Company_Code')
    year_code = request.args.get('Year_Code')
    
    if not company_code or not year_code:
        return jsonify({'error': 'Missing required query parameters'}), 400

    try:
        # Start a database transaction
        with db.session.begin_nested():
            query = db.session.execute(text('''
                SELECT 
                    ROW_NUMBER() OVER (order by doc_no ASC) AS RowNumber,
                    dbo.nt_1_deliveryorder.doc_no,
                    CONVERT(varchar(10), dbo.nt_1_deliveryorder.doc_date, 103) AS doc_date, 
                    dbo.nt_1_deliveryorder.purc_no,
                    dbo.nt_1_deliveryorder.tenderdetailid AS purc_order, 
                    mill.Short_Name AS millshortname, 
                    dbo.nt_1_deliveryorder.quantal, 
                    salebillto.Ac_Name_E AS billtoshortname, 
                    salebillcity.city_name_e AS salebillcityname, 
                    shiptocity.city_name_e AS shiptocityname,
                    dbo.nt_1_deliveryorder.sale_rate, 
                    dbo.nt_1_deliveryorder.Tender_Commission, 
                    dbo.nt_1_deliveryorder.tran_type AS desp_type,
                    dbo.nt_1_deliveryorder.truck_no, 
                    dbo.nt_1_deliveryorder.SB_No, 
                    dbo.nt_1_deliveryorder.EWay_Bill_No, 
                    dbo.nt_1_deliveryorder.Delivery_Type, 
                    dbo.nt_1_deliveryorder.doid, 
                    shipto.Short_Name AS shiptoshortname, 
                    transport.Short_Name AS transportshortname, 
                    dbo.nt_1_deliveryorder.mill_rate,
                    dbo.nt_1_deliveryorder.MM_Rate, 
                    dbo.nt_1_deliveryorder.vasuli_rate1 
                FROM dbo.nt_1_citymaster AS salebillcity 
                RIGHT OUTER JOIN dbo.nt_1_accountmaster AS salebillto 
                    ON salebillcity.cityid = salebillto.cityid 
                RIGHT OUTER JOIN dbo.nt_1_deliveryorder 
                    ON salebillto.accoid = dbo.nt_1_deliveryorder.sb 
                LEFT OUTER JOIN dbo.nt_1_accountmaster AS transport 
                    ON dbo.nt_1_deliveryorder.tc = transport.accoid 
                LEFT OUTER JOIN dbo.nt_1_accountmaster AS shipto 
                    ON dbo.nt_1_deliveryorder.st = shipto.accoid 
                LEFT OUTER JOIN dbo.nt_1_accountmaster AS mill 
                    ON dbo.nt_1_deliveryorder.mc = mill.accoid 
                LEFT OUTER JOIN dbo.nt_1_citymaster AS shiptocity 
                    ON shipto.cityid = shiptocity.cityid 
                WHERE dbo.nt_1_deliveryorder.company_code = :company_code 
                    AND dbo.nt_1_deliveryorder.Year_Code = :year_code
                ORDER BY dbo.nt_1_deliveryorder.doc_no DESC
            '''), {'company_code': company_code, 'year_code': year_code})

            result = query.fetchall()

        response = []
        for row in result:
            response.append({
                'doc_no': row.doc_no,
                'doc_date': row.doc_date,
                'purc_no': row.purc_no,
                'billtoshortname': row.billtoshortname,
                'salebillcityname': row.salebillcityname,
                'shiptocityname': row.shiptocityname,
                'sale_rate': row.sale_rate,
                'Tender_Commission': row.Tender_Commission,
                'desp_type': row.desp_type,
                'truck_no': row.truck_no,
                'SB_No': row.SB_No,
                'EWay_Bill_No': row.EWay_Bill_No,
                'Delivery_Type': row.Delivery_Type,
                'shiptoshortname': row.shiptoshortname,
                'transportshortname': row.transportshortname,
                'mill_rate': row.mill_rate,
                'MM_Rate': row.MM_Rate,
                'vasuli_rate1': row.vasuli_rate1,
                'doid': row.doid
            })

        return jsonify(response)

    except SQLAlchemyError as error:
        # Handle database errors
        print("Error fetching data:", error)
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
