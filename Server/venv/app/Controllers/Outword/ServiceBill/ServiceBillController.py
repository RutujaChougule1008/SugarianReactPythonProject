from flask import Flask, jsonify, request
from app import app, db
from sqlalchemy import text, func
from sqlalchemy.exc import SQLAlchemyError
import os

from app.models.Outward.ServiceBill.ServiceBillModel import ServiceBillHead, ServiceBillDetail

API_URL = os.getenv('API_URL')


from app.models.Outward.ServiceBill.ServiceBillSchema import ServiceBillHeadSchema, ServiceBillDetailSchema
from app.utils.CommonGLedgerFunctions import fetch_company_parameters,get_accoid,getSaleAc, get_acShort_Name
import requests


SERVICE_BILL_DETAILS_QUERY = '''
SELECT        customer.Ac_Code AS partyaccode, customer.Ac_Name_E AS partyname, customer.accoid AS partyacid, tdsac.Ac_Code AS millaccode, tdsac.Ac_Name_E AS millname, tdsac.accoid AS millacid, item.systemid, 
                         item.System_Code, item.System_Name_E AS itemname, dbo.nt_1_gstratemaster.Doc_no AS gstdocno, dbo.nt_1_gstratemaster.Rate AS gstrate, dbo.nt_1_gstratemaster.gstid AS gstdocid, dbo.nt_1_rentbillhead.Customer_Code, 
                         dbo.nt_1_rentbillhead.TDS_Ac, dbo.nt_1_rentbillhead.cc, dbo.nt_1_rentbilldetails.Item_Code, dbo.nt_1_rentbilldetails.Doc_No, dbo.nt_1_rentbilldetails.Detail_Id, dbo.nt_1_rentbilldetails.Description, 
                         dbo.nt_1_rentbilldetails.Amount, dbo.nt_1_rentbilldetails.Company_Code, dbo.nt_1_rentbilldetails.Year_Code, dbo.nt_1_rentbilldetails.ic, dbo.nt_1_rentbilldetails.rbid AS Expr1, dbo.nt_1_rentbilldetails.rbdid, 
                         dbo.nt_1_rentbillhead.gstid, dbo.nt_1_rentbillhead.ta, dbo.nt_1_rentbillhead.GstRateCode
FROM            dbo.nt_1_rentbillhead LEFT OUTER JOIN
                         dbo.nt_1_gstratemaster ON dbo.nt_1_rentbillhead.gstid = dbo.nt_1_gstratemaster.gstid LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS tdsac ON dbo.nt_1_rentbillhead.ta = tdsac.accoid LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS customer ON dbo.nt_1_rentbillhead.cc = customer.accoid LEFT OUTER JOIN
                         dbo.nt_1_rentbilldetails LEFT OUTER JOIN
                         dbo.nt_1_systemmaster AS item ON dbo.nt_1_rentbilldetails.ic = item.systemid ON dbo.nt_1_rentbillhead.rbid = dbo.nt_1_rentbilldetails.rbid
WHERE        (item.System_Type = 'I') and dbo.nt_1_rentbillhead.rbid = :rbid

'''

service_bill_head_schema = ServiceBillHeadSchema()
service_bill_head_schemas = ServiceBillHeadSchema(many=True)

service_bill_detail_schema = ServiceBillDetailSchema()
service_bill_detail_schemas = ServiceBillDetailSchema(many=True)

def format_dates(task):
    return {
        "Date": task.Date.strftime('%Y-%m-%d') if task.Date else None,
    }

# Get data from both tables ServiceBillHead and ServiceBillDetail
@app.route(API_URL + "/getdata-servicebill", methods=["GET"])
def getdata_servicebill():
    try:
        
        head_data = ServiceBillHead.query.all()
        detail_data = ServiceBillDetail.query.all()
        # Serialize the data using schemas
        head_result = service_bill_head_schemas.dump(head_data)
        detail_result = service_bill_detail_schemas.dump(detail_data)
        response = {
            "ServiceBill_Head": head_result,
            "ServiceBill_Detail": detail_result
        }

        return jsonify(response), 200
    except Exception as e:
        
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Get data by the particular doc_no
@app.route(API_URL + "/getservicebillByid", methods=["GET"])
def getservicebillByid():
    try:
        # Extract doc_no from request query parameters
        Company_Code = request.args.get('Company_Code')
        doc_no = request.args.get('doc_no')
        Year_Code = request.args.get('Year_Code')
        if not all([Company_Code, doc_no, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        service_bill_head = ServiceBillHead.query.filter_by(doc_no=doc_no,Company_Code=Company_Code,Year_Code=Year_Code).first()
        if not service_bill_head:
            return jsonify({"error": "No records found"}), 404

        rbid = service_bill_head.rbid
        additional_data = db.session.execute(text(SERVICE_BILL_DETAILS_QUERY), {"rbid": rbid})
        additional_data_rows = additional_data.fetchall()

        row = additional_data_rows[0] if additional_data_rows else None
        partyName = row.partyname if row else None
        millName = row.millname if row else None
        itemName = row.itemname if row else None
        gstRate = row.gstrate if row else None

       
        response = {
            "service_bill_head": {
                **{column.name: getattr(service_bill_head, column.name) for column in service_bill_head.__table__.columns},
                **format_dates(service_bill_head),
                "partyName" : partyName,
                "millName" : millName,
                "itemName" : itemName,
                "gstRate" : gstRate
            },
            "service_bill_details": [{"Doc_No": row.Doc_No,"Detail_Id": row.Detail_Id, "Amount": row.Amount, "Item_Code": row.Item_Code, "Description": row.Description,"ic": row.ic,"rbdid":row.rbdid} for row in additional_data_rows]
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Insert record for ServiceBillHead and ServiceBillDetail
@app.route(API_URL + "/insert-servicebill", methods=["POST"])
def insert_servicebill():
    tran_type = "RB"
    def create_gledger_entry(data, amount, drcr, ac_code, accoid):
        partyName = get_acShort_Name(data['Customer_Code'],data['Company_Code'])
        return {
            "TRAN_TYPE": tran_type,
            "DOC_NO": new_doc_no,
            "DOC_DATE": data['Date'],
            "AC_CODE": ac_code,
            "AMOUNT": amount,
            "COMPANY_CODE": data['Company_Code'],
            "YEAR_CODE": data['Year_Code'],
            "ORDER_CODE": 12,
            "DRCR": drcr,
            "UNIT_Code": 0,
            "NARRATION": "Service Bill No"+ str(data['Doc_No']) + partyName ,
            "TENDER_ID": 0,
            "TENDER_ID_DETAIL": 0,
            "VOUCHER_ID": 0,
            "DRCR_HEAD": 0,
            "ADJUSTED_AMOUNT": 0,
            "Branch_Code": 1,
            "SORT_TYPE": tran_type,
            "SORT_NO": new_doc_no,
            "vc": 0,
            "progid": 0,
            "tranid": 0,
            "saleid": 0,
            "ac": accoid
        }

    def add_gledger_entry(entries, data, amount, drcr, ac_code, accoid):
        if amount > 0:
            entries.append(create_gledger_entry(data, amount, drcr, ac_code, accoid))
    try:
        data = request.get_json()
        head_data = data['head_data']
        detail_data = data['detail_data']

        max_doc_no = db.session.query(func.max(ServiceBillHead.Doc_No)).scalar() or 0

       
        new_doc_no = max_doc_no + 1
        head_data['Doc_No'] = new_doc_no

        new_head = ServiceBillHead(**head_data)
        db.session.add(new_head)

        createdDetails = []
        updatedDetails = []
        deletedDetailIds = []

        for item in detail_data:
            item['Doc_No'] = new_doc_no
            item['rbid'] = new_head.rbid
            if 'rowaction' in item and item['rowaction'] == "add":
                del item['rowaction']
                new_detail = ServiceBillDetail(**item)
                new_head.details.append(new_detail)
                createdDetails.append(new_detail)

            elif item['rowaction'] == "update":
                rbdid = item['rbdid']
                update_values = {k: v for k, v in item.items() if k not in ('rbdid', 'rowaction', 'rbid')}
                db.session.query(ServiceBillDetail).filter(ServiceBillDetail.rbdid == rbdid).update(update_values)
                updatedDetails.append(rbdid)

            elif item['rowaction'] == "delete":
                rbdid = item['rbdid']
                detail_to_delete = db.session.query(ServiceBillDetail).filter(ServiceBillDetail.rbdid == rbdid).one_or_none()
                if detail_to_delete:
                    db.session.delete(detail_to_delete)
                    deletedDetailIds.append(rbdid)

        

        db.session.commit()

        igst_amount = float(head_data.get('IGSTAmount', 0) or 0)
        final_amount = float(head_data.get('Final_Amount', 0) or 0)
        sgst_amount = float(head_data.get('SGSTAmount', 0) or 0)
        cgst_amount = float(head_data.get('CGSTAmount', 0) or 0)
        TCS_Amt = float(head_data.get('TCS_Amt', 0) or 0)
        TDS_Amt = float(head_data.get('TDS', 0) or 0)

        company_parameters = fetch_company_parameters(head_data['Company_Code'], head_data['Year_Code'])

        gledger_entries = []

        if igst_amount > 0:
            ac_code = company_parameters.IGSTAc
            accoid = get_accoid(company_parameters.IGSTAc,head_data['Company_Code'])
            add_gledger_entry(gledger_entries, head_data, igst_amount, "C", ac_code, accoid)

        if cgst_amount > 0:
            ac_code = company_parameters.CGSTAc
            accoid = get_accoid(company_parameters.CGSTAc,head_data['Company_Code'])
            add_gledger_entry(gledger_entries, head_data, cgst_amount, "C", ac_code, accoid)

        if sgst_amount > 0:
            ac_code = company_parameters.SGSTAc
            accoid = get_accoid(company_parameters.SGSTAc,head_data['Company_Code'])
            add_gledger_entry(gledger_entries, head_data, sgst_amount, "C", ac_code, accoid)
        
        if TCS_Amt > 0:
            ac_code = head_data['Customer_Code']
            accoid = get_accoid(ac_code,head_data['Company_Code'])
            add_gledger_entry(gledger_entries, head_data, TCS_Amt, 'D', ac_code, accoid)
            ac_code = company_parameters.SaleTCSAc
            accoid = get_accoid(ac_code,head_data['Company_Code'])
            add_gledger_entry(gledger_entries, head_data, TCS_Amt, 'D', ac_code, accoid)

        if TDS_Amt > 0:
            ac_code = head_data['Customer_Code']
            accoid = get_accoid(ac_code,head_data['Company_Code'])
            add_gledger_entry(gledger_entries, head_data, TDS_Amt, 'C', ac_code, accoid)
            ac_code = company_parameters.SaleTDSAc
            accoid = get_accoid(ac_code,head_data['Company_Code'])
            add_gledger_entry(gledger_entries, head_data, TDS_Amt, 'C', ac_code, accoid)





        add_gledger_entry(gledger_entries, head_data, final_amount, "D", head_data['Customer_Code'], get_accoid(head_data['Customer_Code'],head_data['Company_Code']))

        for item in detail_data:
            Item_amount = float(item.get('Amount', 0) or 0)
            ic = item.get('ic')

            if Item_amount>0:
                ac_code = getSaleAc(ic)
                add_gledger_entry(gledger_entries, head_data, Item_amount, 'C', ac_code, get_accoid(ac_code,head_data['Company_Code'])) 
                
        query_params = {
            'Company_Code': head_data['Company_Code'],
            'DOC_NO': new_doc_no,
            'Year_Code': head_data['Year_Code'],
            'TRAN_TYPE': tran_type
        }

        response = requests.post("http://localhost:8080/api/sugarian/create-Record-gLedger", params=query_params, json=gledger_entries)

        if response.status_code == 201:
            db.session.commit()
        else:
            db.session.rollback()
            return jsonify({"error": "Failed to create gLedger record", "details": response.json()}), response.status_code

        return jsonify({
            "message": "Data Inserted successfully",
            "head": service_bill_head_schema.dump(new_head),
            "addedDetails": service_bill_detail_schemas.dump(createdDetails),
             "updatedDetails": updatedDetails,
            "deletedDetailIds": deletedDetailIds
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Update record for ServiceBillHead and ServiceBillDetail
@app.route(API_URL + "/update-servicebill", methods=["PUT"])
def update_servicebill():
    tran_type = "RB"
    def create_gledger_entry(data, amount, drcr, ac_code, accoid):
        partyName = get_acShort_Name(data['Customer_Code'],data['Company_Code'])
        return {
            "TRAN_TYPE": tran_type,
            "DOC_NO": updated_head.Doc_No,
            "DOC_DATE": data['Date'],
            "AC_CODE": ac_code,
            "AMOUNT": amount,
            "COMPANY_CODE": data['Company_Code'],
            "YEAR_CODE": data['Year_Code'],
            "ORDER_CODE": 12,
            "DRCR": drcr,
            "UNIT_Code": 0,
            "NARRATION":  "Service Bill No"+ str(data['Doc_No']) + partyName ,
            "TENDER_ID": 0,
            "TENDER_ID_DETAIL": 0,
            "VOUCHER_ID": 0,
            "DRCR_HEAD": 0,
            "ADJUSTED_AMOUNT": 0,
            "Branch_Code": 1,
            "SORT_TYPE": tran_type,
            "SORT_NO": updated_head.Doc_No,
            "vc": 0,
            "progid": 0,
            "tranid": 0,
            "saleid": 0,
            "ac": accoid
        }

    def add_gledger_entry(entries, data, amount, drcr, ac_code, accoid):
        if amount > 0:
            entries.append(create_gledger_entry(data, amount, drcr, ac_code, accoid))
    try:
        rbid = request.args.get('rbid')
        if not all([rbid]):
            return jsonify({"error": "Missing required parameters"}), 400

        data = request.get_json()
        head_data = data['head_data']
        detail_data = data['detail_data']

        
        updated_head_counts=db.session.query(ServiceBillHead).filter(ServiceBillHead.rbid == rbid).update(head_data)
        updated_head = ServiceBillHead.query.filter_by(rbid=rbid).first()

        created_details = []
        updated_details = []
        deleted_detail_ids = []

        for item in detail_data:
            item['rbid'] = updated_head.rbid

            if 'rowaction' in item:
                if item['rowaction'] == "add":
                    del item['rowaction']
                    item['Doc_No'] = updated_head.Doc_No
                    new_detail = ServiceBillDetail(**item)
                    db.session.add(new_detail)
                    created_details.append(new_detail)

                elif item['rowaction'] == "update":
                    rbdid = item['rbdid']
                    update_values = {k: v for k, v in item.items() if k not in ('rbdid', 'rowaction', 'rbid')}
                    db.session.query(ServiceBillDetail).filter(ServiceBillDetail.rbdid == rbdid).update(update_values)
                    updated_details.append(rbdid)

                elif item['rowaction'] == "delete":
                    rbdid = item['rbdid']
                    detail_to_delete = db.session.query(ServiceBillDetail).filter(ServiceBillDetail.rbdid == rbdid).one_or_none()
                    if detail_to_delete:
                        db.session.delete(detail_to_delete)
                        deleted_detail_ids.append(rbdid)

        db.session.commit()

        igst_amount = float(head_data.get('IGSTAmount', 0) or 0)
        final_amount = float(head_data.get('Final_Amount', 0) or 0)
        sgst_amount = float(head_data.get('SGSTAmount', 0) or 0)
        cgst_amount = float(head_data.get('CGSTAmount', 0) or 0)
        TCS_Amt = float(head_data.get('TCS_Amt', 0) or 0)
        TDS_Amt = float(head_data.get('TDS', 0) or 0)

        print(TDS_Amt)

        company_parameters = fetch_company_parameters(head_data['Company_Code'], head_data['Year_Code'])

        gledger_entries = []

        if igst_amount > 0:
            ac_code = company_parameters.IGSTAc
            accoid = get_accoid(company_parameters.IGSTAc,head_data['Company_Code'])
            add_gledger_entry(gledger_entries, head_data, igst_amount, "C", ac_code, accoid)

        if cgst_amount > 0:
            ac_code = company_parameters.CGSTAc
            accoid = get_accoid(company_parameters.CGSTAc,head_data['Company_Code'])
            add_gledger_entry(gledger_entries, head_data, cgst_amount, "C", ac_code, accoid)

        if sgst_amount > 0:
            ac_code = company_parameters.SGSTAc
            accoid = get_accoid(company_parameters.SGSTAc,head_data['Company_Code'])
            add_gledger_entry(gledger_entries, head_data, sgst_amount, "C", ac_code, accoid)
        
        if TCS_Amt > 0:
            ac_code = head_data['Customer_Code']
            accoid = get_accoid(ac_code,head_data['Company_Code'])
            add_gledger_entry(gledger_entries, head_data, TCS_Amt, 'D', ac_code, accoid)
            ac_code = company_parameters.SaleTCSAc
            accoid = get_accoid(ac_code,head_data['Company_Code'])
            add_gledger_entry(gledger_entries, head_data, TCS_Amt, 'D', ac_code, accoid)

        if TDS_Amt > 0:
            ac_code = head_data['Customer_Code']
            accoid = get_accoid(ac_code,head_data['Company_Code'])
            add_gledger_entry(gledger_entries, head_data, TDS_Amt, 'C', ac_code, accoid)
            ac_code = company_parameters.SaleTDSAc
            accoid = get_accoid(ac_code,head_data['Company_Code'])
            add_gledger_entry(gledger_entries, head_data, TDS_Amt, 'C', ac_code, accoid)





        add_gledger_entry(gledger_entries, head_data, final_amount, "D", head_data['Customer_Code'], get_accoid(head_data['Customer_Code'],head_data['Company_Code']))

        for item in detail_data:
            Item_amount = float(item.get('Amount', 0) or 0)
            ic = item.get('ic')

            if Item_amount>0:
                ac_code = getSaleAc(ic)
                add_gledger_entry(gledger_entries, head_data, Item_amount, 'C', ac_code, get_accoid(ac_code,head_data['Company_Code'])) 
                
        query_params = {
            'Company_Code': head_data['Company_Code'],
            'DOC_NO': updated_head.Doc_No,
            'Year_Code': head_data['Year_Code'],
            'TRAN_TYPE': tran_type
        }

        response = requests.post("http://localhost:8080/api/sugarian/create-Record-gLedger", params=query_params, json=gledger_entries)

        if response.status_code == 201:
            db.session.commit()
        else:
            db.session.rollback()
            return jsonify({"error": "Failed to create gLedger record", "details": response.json()}), response.status_code

        return jsonify({
            "message": "Data updated successfully",
            "head": updated_head_counts,
            "created_details": service_bill_detail_schemas.dump(created_details),
            "updated_details": updated_details,
            "deleted_detail_ids": deleted_detail_ids
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Delete record from database based on rbid
@app.route(API_URL + "/delete_data_by_rbid", methods=["DELETE"])
def delete_data_by_rbid():
    try:
        rbid = request.args.get('rbid')
        Company_Code = request.args.get('Company_Code')
        doc_no = request.args.get('doc_no')
        Year_Code = request.args.get('Year_Code')

        # Check if the required parameters are provided
        if not all([rbid, Company_Code, doc_no, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400
       
        with db.session.begin():
            
            deleted_detail_rows = ServiceBillDetail.query.filter_by(rbid=rbid).delete()

            
            deleted_head_rows = ServiceBillHead.query.filter_by(rbid=rbid).delete()

        if deleted_detail_rows > 0 and deleted_head_rows > 0:
            query_params = {
                'Company_Code': Company_Code,
                'DOC_NO': doc_no,
                'Year_Code': Year_Code,
                'TRAN_TYPE': "",
            }

            # Make the external request
            response = requests.delete("http://localhost:8080/api/sugarian/delete-Record-gLedger", params=query_params)
            
            if response.status_code != 200:
                raise Exception("Failed to create record in gLedger")


        
        db.session.commit()

        return jsonify({
            "message": f"Deleted {deleted_head_rows} head row(s) and {deleted_detail_rows} detail row(s) successfully"
        }), 200

    except Exception as e:
       
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Fetch the last record from the database by rbid
@app.route(API_URL + "/get-lastservicebilldata", methods=["GET"])
def get_lastservicebilldata():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if not all([ Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        last_service_bill_head = ServiceBillHead.query.filter_by(Company_Code=Company_Code,Year_Code=Year_Code).order_by(ServiceBillHead.rbid.desc()).first()
        if not last_service_bill_head:
            return jsonify({"error": "No records found in ServiceBillHead table"}), 404

        rbid = last_service_bill_head.rbid
        additional_data = db.session.execute(text(SERVICE_BILL_DETAILS_QUERY), {"rbid": rbid})
        additional_data_rows = additional_data.fetchall()

        row = additional_data_rows[0] if additional_data_rows else None
        partyName = row.partyname if row else None
        millName = row.millname if row else None
        itemName = row.itemname if row else None
        gstRate = row.gstrate if row else None

        
        last_head_data = {
            **{column.name: getattr(last_service_bill_head, column.name) for column in last_service_bill_head.__table__.columns},
            **format_dates(last_service_bill_head),
            "partyName" : partyName,
            "millName" : millName,
            "itemName" : itemName,
            "gstRate" : gstRate
        }

        last_details_data = [{"Doc_No": row.Doc_No,"Detail_Id": row.Detail_Id, "Amount": row.Amount, "Item_Code": row.Item_Code, "Description": row.Description,"ic": row.ic,"rbdid":row.rbdid} for row in additional_data_rows]

        response = {
            "last_head_data": last_head_data,
            "last_details_data": last_details_data
        }

        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Get first record from the database
@app.route(API_URL + "/get-firstservicebill-navigation", methods=["GET"])
def get_firstservicebill_navigation():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if not all([ Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400
        first_service_bill_head = ServiceBillHead.query.filter_by(Company_Code=Company_Code,Year_Code=Year_Code).order_by(ServiceBillHead.rbid.asc()).first()
        if not first_service_bill_head:
            return jsonify({"error": "No records found in ServiceBillHead table"}), 404

        rbid = first_service_bill_head.rbid
        additional_data = db.session.execute(text(SERVICE_BILL_DETAILS_QUERY), {"rbid": rbid})
        additional_data_rows = additional_data.fetchall()

        row = additional_data_rows[0] if additional_data_rows else None
        partyName = row.partyname if row else None
        millName = row.millname if row else None
        itemName = row.itemname if row else None
        gstRate = row.gstrate if row else None

        
        first_head_data = {
            **{column.name: getattr(first_service_bill_head, column.name) for column in first_service_bill_head.__table__.columns},
            **format_dates(first_service_bill_head),
            "partyName" : partyName,
            "millName" : millName,
            "itemName" : itemName,
            "gstRate" : gstRate
        }

        first_details_data = [{"Doc_No": row.Doc_No,"Detail_Id": row.Detail_Id, "Amount": row.Amount, "Item_Code": row.Item_Code, "Description": row.Description,"ic": row.ic,"rbdid":row.rbdid} for row in additional_data_rows]

        response = {
            "first_head_data": first_head_data,
            "first_details_data": first_details_data
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Get last record from the database
@app.route(API_URL + "/get-lastservicebill-navigation", methods=["GET"])
def get_lastservicebill_navigation():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if not all([ Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400
        
        last_service_bill_head = ServiceBillHead.query.filter_by(Company_Code=Company_Code,Year_Code=Year_Code).order_by(ServiceBillHead.rbid.desc()).first()
        if not last_service_bill_head:
            return jsonify({"error": "No records found in ServiceBillHead table"}), 404

        rbid = last_service_bill_head.rbid
        additional_data = db.session.execute(text(SERVICE_BILL_DETAILS_QUERY), {"rbid": rbid})
        additional_data_rows = additional_data.fetchall()

        row = additional_data_rows[0] if additional_data_rows else None
        partyName = row.partyname if row else None
        millName = row.millname if row else None
        itemName = row.itemname if row else None
        gstRate = row.gstrate if row else None

       
        last_head_data = {
            **{column.name: getattr(last_service_bill_head, column.name) for column in last_service_bill_head.__table__.columns},
            **format_dates(last_service_bill_head),
            "partyName" : partyName,
            "millName" : millName,
            "itemName" : itemName,
            "gstRate" : gstRate
        }

        last_details_data = [{"Doc_No": row.Doc_No,"Detail_Id": row.Detail_Id, "Amount": row.Amount, "Item_Code": row.Item_Code, "Description": row.Description,"ic": row.ic,"rbdid":row.rbdid} for row in additional_data_rows]

        response = {
            "last_head_data": last_head_data,
            "last_details_data": last_details_data
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Get previous record from the database
@app.route(API_URL + "/get-previousservicebill-navigation", methods=["GET"])
def get_previousservicebill_navigation():
    try:
        current_doc_no = request.args.get('currentDocNo')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if not all([ Company_Code, Year_Code,current_doc_no]):
            return jsonify({"error": "Missing required parameters"}), 400

        
        previous_service_bill_head = ServiceBillHead.query.filter(ServiceBillHead.Doc_No < current_doc_no).order_by(ServiceBillHead.Doc_No.desc()).first()
        if not previous_service_bill_head:
            return jsonify({"error": "No previous records found"}), 404

        rbid = previous_service_bill_head.rbid
        additional_data = db.session.execute(text(SERVICE_BILL_DETAILS_QUERY), {"rbid": rbid})
        additional_data_rows = additional_data.fetchall()

        row = additional_data_rows[0] if additional_data_rows else None
        partyName = row.partyname if row else None
        millName = row.millname if row else None
        itemName = row.itemname if row else None
        gstRate = row.gstrate if row else None

        
        previous_head_data = {
            **{column.name: getattr(previous_service_bill_head, column.name) for column in previous_service_bill_head.__table__.columns},
            **format_dates(previous_service_bill_head),
            "partyName" : partyName,
            "millName" : millName,
            "itemName" : itemName,
            "gstRate" : gstRate
        }

        previous_details_data = [{"Doc_No": row.Doc_No,"Detail_Id": row.Detail_Id, "Amount": row.Amount, "Item_Code": row.Item_Code, "Description": row.Description,"ic": row.ic,"rbdid":row.rbdid} for row in additional_data_rows]

        response = {
            "previous_head_data": previous_head_data,
            "previous_details_data": previous_details_data
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Get next record from the database
@app.route(API_URL + "/get-nextservicebill-navigation", methods=["GET"])
def get_nextservicebill_navigation():
    try:
        current_doc_no = request.args.get('currentDocNo')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if not all([ Company_Code, Year_Code, current_doc_no ]):
            return jsonify({"error": "Missing required parameters"}), 400
       
        next_service_bill_head = ServiceBillHead.query.filter(ServiceBillHead.Doc_No > current_doc_no).filter_by(Company_Code=Company_Code,Year_Code=Year_Code).order_by(ServiceBillHead.Doc_No.asc()).first()
        if not next_service_bill_head:
            return jsonify({"error": "No next records found"}), 404

        rbid = next_service_bill_head.rbid
        additional_data = db.session.execute(text(SERVICE_BILL_DETAILS_QUERY), {"rbid": rbid})
        additional_data_rows = additional_data.fetchall()

        row = additional_data_rows[0] if additional_data_rows else None
        partyName = row.partyname if row else None
        millName = row.millname if row else None
        itemName = row.itemname if row else None
        gstRate = row.gstrate if row else None

        
        next_head_data = {
            **{column.name: getattr(next_service_bill_head, column.name) for column in next_service_bill_head.__table__.columns},
            **format_dates(next_service_bill_head),
            "partyName" : partyName,
            "millName" : millName,
            "itemName" : itemName,
            "gstRate" : gstRate
        }

        next_details_data = [{"Doc_No": row.Doc_No,"Detail_Id": row.Detail_Id, "Amount": row.Amount, "Item_Code": row.Item_Code, "Description": row.Description,"ic": row.ic,"rbdid":row.rbdid} for row in additional_data_rows]

        response = {
            "next_head_data": next_head_data,
            "next_details_data": next_details_data
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
