from flask import Flask, jsonify, request
from app import app, db
from app.models.Inword.PurchaseBill.PurchaseBillModels import SugarPurchase, SugarPurchaseDetail 
from app.models.Reports.GLedeger.GLedgerModels import Gledger
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import func,desc
import os
import requests
from app.utils.CommonGLedgerFunctions import fetch_company_parameters,get_accoid,getPurchaseAc

# Get the base URL from environment variables
API_URL= os.getenv('API_URL')

# Import schemas from the schemas module
from app.models.Inword.PurchaseBill.PurchaseBillSchemas import SugarPurchaseHeadSchema, SugarPurchaseDetailSchema

# Global SQL Query
TASK_DETAILS_QUERY = '''
  SELECT        dbo.nt_1_sugarpurchase.doc_no , dbo.nt_1_sugarpurchase.Tran_Type, dbo.nt_1_sugarpurchase.GstRateCode,dbo.nt_1_gstratemaster.GST_Name, dbo.nt_1_sugarpurchase.Ac_Code, qryFrom.Ac_Name_E AS FromName, 
                         dbo.nt_1_sugarpurchase.Unit_Code, qryUnit.Ac_Name_E AS Unit_Name, dbo.nt_1_sugarpurchase.mill_code, qryMill.Ac_Name_E AS Mill_Name, dbo.nt_1_sugarpurchase.BROKER, qryBroker.Ac_Name_E AS Broker_Name, 
                         dbo.nt_1_sugarpurchasedetails.doc_no, dbo.nt_1_sugarpurchasedetails.detail_id, dbo.nt_1_sugarpurchasedetails.Tran_Type, dbo.nt_1_sugarpurchasedetails.item_code, dbo.qryItemMaster.System_Name_E AS ItemName, 
                         dbo.nt_1_sugarpurchasedetails.narration, dbo.nt_1_sugarpurchasedetails.Quantal, dbo.nt_1_sugarpurchasedetails.packing, dbo.nt_1_sugarpurchasedetails.bags, dbo.nt_1_sugarpurchasedetails.rate, 
                         dbo.nt_1_sugarpurchasedetails.item_Amount, dbo.nt_1_sugarpurchasedetails.Company_Code, dbo.nt_1_sugarpurchasedetails.Year_Code, dbo.nt_1_sugarpurchasedetails.Branch_Code, 
                         dbo.nt_1_sugarpurchasedetails.Created_By, dbo.nt_1_sugarpurchasedetails.Modified_By, dbo.nt_1_sugarpurchasedetails.purchasedetailid, dbo.nt_1_sugarpurchasedetails.purchaseid, dbo.nt_1_sugarpurchasedetails.ic, 
                         dbo.nt_1_sugarpurchasedetails.Brand_Code, dbo.qryBrand_Master.Marka AS Brand_Name
FROM            dbo.qryBrand_Master RIGHT OUTER JOIN
                         dbo.nt_1_sugarpurchasedetails ON dbo.qryBrand_Master.Company_Code = dbo.nt_1_sugarpurchasedetails.Company_Code AND dbo.qryBrand_Master.Code = dbo.nt_1_sugarpurchasedetails.Branch_Code LEFT OUTER JOIN
                         dbo.qryItemMaster ON dbo.nt_1_sugarpurchasedetails.Company_Code = dbo.qryItemMaster.Company_Code AND dbo.nt_1_sugarpurchasedetails.item_code = dbo.qryItemMaster.System_Code RIGHT OUTER JOIN
                         dbo.nt_1_sugarpurchase ON dbo.nt_1_sugarpurchasedetails.purchaseid = dbo.nt_1_sugarpurchase.purchaseid LEFT OUTER JOIN
                         dbo.nt_1_gstratemaster ON dbo.nt_1_sugarpurchase.Company_Code = dbo.nt_1_gstratemaster.Company_Code AND dbo.nt_1_sugarpurchase.GstRateCode = dbo.nt_1_gstratemaster.Doc_no LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS qryBroker ON dbo.nt_1_sugarpurchase.bk = qryBroker.accoid LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS qryMill ON dbo.nt_1_sugarpurchase.mc = qryMill.accoid LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS qryUnit ON dbo.nt_1_sugarpurchase.uc = qryUnit.accoid LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS qryFrom ON dbo.nt_1_sugarpurchase.ac = qryFrom.accoid
WHERE    nt_1_sugarpurchase.purchaseid=:purchaseid
'''

def format_dates(task):
    return {
        "doc_date": task.doc_date.strftime('%Y-%m-%d') if task.doc_date else None,
        "mill_inv_date": task.mill_inv_date.strftime('%Y-%m-%d') if task.mill_inv_date else None,
    }

# Define schemas
Sugar_head_Schema = SugarPurchaseHeadSchema()
Sugar_head_Schemas = SugarPurchaseHeadSchema(many=True)

Sugar_detail_Schema = SugarPurchaseDetailSchema()
Sugar_detail_Schemas = SugarPurchaseDetailSchema(many=True)

# Get data from both tables DebitcreditNote and DebitcreditNoteDetail
@app.route(API_URL+"/getdata-sugarpurchase", methods=["GET"])
def getdata_sugarpurchase():
    try:
          # Extract company_code and year_code from the request arguments
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')

        # Validate that the parameters are present
        if not company_code or not year_code:
            return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' parameter"}), 400
        
        # Query both tables and get the data
        task_data = SugarPurchase.query.filter_by(Company_Code=company_code, Year_Code=year_code).order_by(desc(SugarPurchase.doc_no)).all()
        
        # Serialize the data using schemas
        task_result = Sugar_head_Schemas.dump(task_data)
    
        response = {
            "SugarPurchase_Head": task_result
            # "SugarPurchase_Detail": user_result
        }

        return jsonify(response), 200
    except Exception as e:
        # Handle any potential exceptions and return an error response with a 500 Internal Server Error status code
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
# We have to get the data By the Particular doc_no AND tran_type
@app.route(API_URL+"/getsugarpurchasebyid", methods=["GET"])
def getsugarpurchasebyid():
    try:
        # Extract taskNo from request query parameters
        doc_no = request.args.get('doc_no')

        if not doc_no:
            return jsonify({"error": "Document number not provided"}), 400
        
        # Extract Company_Code from query parameters
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if Company_Code is None:
            return jsonify({'error': 'Missing Company_Code Or Year_Code parameter'}), 400

        try:
            Company_Code = int(Company_Code)
            year_code = int(Year_Code)
        except ValueError:
            return jsonify({'error': 'Invalid Company_Code parameter'}), 400

        # Use SQLAlchemy to find the record by Task_No
        task_head = SugarPurchase.query.filter_by(doc_no=doc_no).first()

        newtaskid = task_head.purchaseid

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"purchaseid": newtaskid})

        # Extracting category name from additional_data
        additional_data_rows = [row._asdict() for row in additional_data.fetchall()]
    
        # Prepare response data
        response = {
            "getData_SugarPurchaseHead_data": {
                **{column.name: getattr(task_head, column.name) for column in task_head.__table__.columns},
                **format_dates(task_head),
                # "category_name": category
            },
            "getData_SugarPurchaseDetail_data": additional_data_rows
        }
        # If record found, return it
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

##Insert Operation with the Gledger Effcets
@app.route(API_URL + "/insert_SugarPurchase", methods=["POST"])
def insert_SugarPurchase():

    trans_typeNew  = "PS"
    DRCRHead = "C"
    DRCRDetail ="D"
   
    def create_gledger_entry(data, amount, drcr, ac_code, accoid):
        return {
            "TRAN_TYPE": trans_typeNew,
            "DOC_NO": new_doc_no,
            "DOC_DATE": data['doc_date'],
            "AC_CODE": ac_code,
            "AMOUNT": amount,
            "COMPANY_CODE": data['Company_Code'],
            "YEAR_CODE": data['Year_Code'],
            "ORDER_CODE": 12,
            "DRCR": drcr,
            "UNIT_Code": 0,
            "NARRATION": "aaaa",
            "TENDER_ID": 0,
            "TENDER_ID_DETAIL": 0,
            "VOUCHER_ID": 0,
            "DRCR_HEAD": 0,
            "ADJUSTED_AMOUNT": 0,
            "Branch_Code": 1,
            "SORT_TYPE": trans_typeNew,
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
        headData = data['headData']
        detailData = data['detailData']

        # Find the maximum doc_no for the provided tran_type
        max_doc_no = db.session.query(func.max(SugarPurchase.doc_no)).scalar() or 0

        # Increment the doc_no for the new entry
        new_doc_no = max_doc_no + 1
        headData['doc_no'] = new_doc_no 

        # Create the Task
        new_head = SugarPurchase(**headData)
        db.session.add(new_head)

        createdDetails = []
        updatedDetails = []
        deletedDetailIds = []

        for item in detailData:
            item['doc_no'] = new_doc_no

            if 'rowaction' in item:
                if item['rowaction'] == "add":
                    del item['rowaction']
                    new_detail = SugarPurchaseDetail(**item)
                    new_head.details.append(new_detail)
                    createdDetails.append(new_detail)

                elif item['rowaction'] == "update":
                    purchasedetailid = item['purchasedetailid']
                    update_values = {k: v for k, v in item.items() if k not in ('purchasedetailid', 'rowaction', 'purchaseid')}
                    db.session.query(SugarPurchaseDetail).filter(SugarPurchaseDetail.purchasedetailid == purchasedetailid).update(update_values)
                    updatedDetails.append(purchasedetailid)

                elif item['rowaction'] == "delete":
                    purchasedetailid = item['purchasedetailid']
                    detail_to_delete = db.session.query(SugarPurchaseDetail).filter(SugarPurchaseDetail.purchasedetailid == purchasedetailid).one_or_none()
                    if detail_to_delete:
                        db.session.delete(detail_to_delete)
                        deletedDetailIds.append(purchasedetailid)

            db.session.commit()

        # Use Marshmallow schemas to serialize the data
        sugar_purchase_head_schema = SugarPurchaseHeadSchema()
        sugar_purchase_detail_schema = SugarPurchaseDetailSchema(many=True)

        IGSTAmount = float(headData.get('IGSTAmount', 0) or 0)
        bill_amount = float(headData.get('Bill_Amount', 0) or 0)
        SGSTAmount = float(headData.get('SGSTAmount', 0) or 0)
        CGSTAmount = float(headData.get('CGSTAmount', 0) or 0)
        TCS_Amt = float(headData.get('TCS_Amt', 0) or 0)
        TDS_Amt = float(headData.get('TDS_Amt', 0) or 0)

        company_parameters = fetch_company_parameters(headData['Company_Code'], headData['Year_Code'])

        gledger_entries = []

        if IGSTAmount > 0:
            ac_code = company_parameters.PurchaseIGSTAc
            accoid = get_accoid(company_parameters.PurchaseIGSTAc,headData['Company_Code'])
            add_gledger_entry(gledger_entries, headData, IGSTAmount,DRCRDetail , ac_code, accoid)

        if CGSTAmount > 0:
            ac_code = company_parameters.PurchaseCGSTAc
            accoid = get_accoid(company_parameters.PurchaseCGSTAc,headData['Company_Code'])
            add_gledger_entry(gledger_entries, headData, CGSTAmount, DRCRDetail, ac_code, accoid)

        if SGSTAmount > 0:
            ac_code = company_parameters.PurchaseSGSTAc
            accoid = get_accoid(company_parameters.PurchaseSGSTAc,headData['Company_Code'])
            add_gledger_entry(gledger_entries, headData, SGSTAmount, DRCRDetail, ac_code, accoid)
        
        if TCS_Amt > 0:
            ac_code = headData['Ac_Code']
            accoid = get_accoid(ac_code,headData['Company_Code'])
            add_gledger_entry(gledger_entries, headData, TCS_Amt, DRCRHead, ac_code, accoid)
            ac_code = company_parameters.PurchaseTCSAc
            accoid = get_accoid(ac_code,headData['Company_Code'])
            add_gledger_entry(gledger_entries, headData, TCS_Amt,DRCRDetail, ac_code, accoid)

        if TDS_Amt > 0:
            ac_code = headData['Ac_Code']
            accoid = get_accoid(ac_code,headData['Company_Code'])
            add_gledger_entry(gledger_entries, headData, TDS_Amt, DRCRDetail, ac_code, accoid)
            ac_code = company_parameters.PurchaseTDSAc
            accoid = get_accoid(ac_code,headData['Company_Code'])
            add_gledger_entry(gledger_entries, headData, TDS_Amt, DRCRHead, ac_code, accoid)

        add_gledger_entry(gledger_entries, headData, bill_amount,DRCRHead, headData['Ac_Code'], get_accoid(headData['Ac_Code'],headData['Company_Code']))
    
        for item in detailData:
            ic_value = item['ic']
            purchase_ac_code = getPurchaseAc(ic_value)
            
            detailLedger_entry = create_gledger_entry({
                "tran_type": trans_typeNew,
                "doc_date": headData['doc_date'],
                "Ac_Code": purchase_ac_code,
                "Company_Code": headData['Company_Code'],
                "Year_Code": headData['Year_Code'],
                "Narration": "aaaa",
            }, float(item['item_Amount']), DRCRDetail, purchase_ac_code, get_accoid(purchase_ac_code,headData['Company_Code']))
            gledger_entries.append(detailLedger_entry)

        query_params = {
            'Company_Code': headData['Company_Code'],
            'DOC_NO': new_doc_no,
            'Year_Code': headData['Year_Code'],
            'TRAN_TYPE': trans_typeNew,
        }

        response = requests.post("http://localhost:8080/api/sugarian/create-Record-gLedger", params=query_params, json=gledger_entries)

        if response.status_code == 201:
            db.session.commit()
        else:
            db.session.rollback()
            return jsonify({"error": "Failed to create gLedger record", "details": response.json()}), response.status_code


        return jsonify({
            "message": "Data Inserted successfully",
            "head": sugar_purchase_head_schema.dump(new_head),
            "addedDetails": sugar_purchase_detail_schema.dump(createdDetails),
            "updatedDetails": updatedDetails,
            "deletedDetailIds": deletedDetailIds
        }), 201  # HTTP 201 Created

    except Exception as e:
        db.session.rollback()
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


#Update record operation with the Gledger Effects
@app.route(API_URL + "/update-SugarPurchase", methods=["PUT"])
def update_SugarPurchase():
    trans_typeNew = "PS"
    DRCRHead = "C"
    DRCRDetail = "D"
    
    def create_gledger_entry(data, amount, drcr, ac_code, accoid):
        return {
            "TRAN_TYPE": trans_typeNew,
            "DOC_NO": doc_no,
            "DOC_DATE": data['doc_date'],
            "AC_CODE": ac_code,
            "AMOUNT": amount,
            "COMPANY_CODE": data['Company_Code'],
            "YEAR_CODE": data['Year_Code'],
            "ORDER_CODE": 12,
            "DRCR": drcr,
            "UNIT_Code": 0,
            "NARRATION": "aaaa",
            "TENDER_ID": 0,
            "TENDER_ID_DETAIL": 0,
            "VOUCHER_ID": 0,
            "DRCR_HEAD": 0,
            "ADJUSTED_AMOUNT": 0,
            "Branch_Code": 1,
            "SORT_TYPE": trans_typeNew,
            "SORT_NO": doc_no,
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
        purchaseid = request.args.get('purchaseid')

        if purchaseid is None:
            return jsonify({"error": "Missing 'purchaseid' parameter"}), 400

        data = request.get_json()
        headData = data['headData']
        detailData = data['detailData']
        transaction = db.session.begin_nested()
        # Update the head data
        updatedHeadCount = db.session.query(SugarPurchase).filter(SugarPurchase.purchaseid == purchaseid).update(headData)
        
        createdDetails = []
        updatedDetails = []
        deletedDetailIds = []

        updated_tender_head = db.session.query(SugarPurchase).filter(SugarPurchase.purchaseid == purchaseid).one()
        doc_no = updated_tender_head.doc_no

        for item in detailData:
            if item['rowaction'] == "add":
                item['doc_no'] = doc_no
                item['purchaseid'] = purchaseid
                del item['rowaction']
                new_detail = SugarPurchaseDetail(**item)
                db.session.add(new_detail)
                createdDetails.append(item)

            elif item['rowaction'] == "update":
                item['doc_no'] = doc_no
                item['purchaseid'] = purchaseid
                purchasedetailid = item['purchasedetailid']
                update_values = {k: v for k, v in item.items() if k not in ('purchasedetailid', 'purchaseid', 'rowaction')}
                db.session.query(SugarPurchaseDetail).filter(SugarPurchaseDetail.purchasedetailid == purchasedetailid).update(update_values)
                updatedDetails.append(purchasedetailid)

            elif item['rowaction'] == "delete":
                purchasedetailid = item['purchasedetailid']
                detail_to_delete = db.session.query(SugarPurchaseDetail).filter(SugarPurchaseDetail.purchasedetailid == purchasedetailid).one_or_none()

                if detail_to_delete:
                    db.session.delete(detail_to_delete)
                    deletedDetailIds.append(purchasedetailid)
        db.session.commit()

        IGSTAmount = float(headData.get('IGSTAmount', 0) or 0)
        bill_amount = float(headData.get('Bill_Amount', 0) or 0)
        SGSTAmount = float(headData.get('SGSTAmount', 0) or 0)
        CGSTAmount = float(headData.get('CGSTAmount', 0) or 0)
        TCS_Amt = float(headData.get('TCS_Amt', 0) or 0)
        TDS_Amt = float(headData.get('TDS_Amt', 0) or 0)

        company_parameters = fetch_company_parameters(headData['Company_Code'], headData['Year_Code'])
        gledger_entries = []

        if IGSTAmount > 0:
            ac_code = company_parameters.PurchaseIGSTAc
            accoid = get_accoid(company_parameters.PurchaseIGSTAc, headData['Company_Code'])
            add_gledger_entry(gledger_entries, headData, IGSTAmount, DRCRDetail, ac_code, accoid)

        if CGSTAmount > 0:
            ac_code = company_parameters.PurchaseCGSTAc
            accoid = get_accoid(company_parameters.PurchaseCGSTAc, headData['Company_Code'])
            add_gledger_entry(gledger_entries, headData, CGSTAmount, DRCRDetail, ac_code, accoid)

        if SGSTAmount > 0:
            ac_code = company_parameters.PurchaseSGSTAc
            accoid = get_accoid(company_parameters.PurchaseSGSTAc, headData['Company_Code'])
            add_gledger_entry(gledger_entries, headData, SGSTAmount, DRCRDetail, ac_code, accoid)

        if TCS_Amt > 0:
            ac_code = headData['Ac_Code']
            accoid = get_accoid(ac_code, headData['Company_Code'])
            add_gledger_entry(gledger_entries, headData, TCS_Amt, DRCRHead, ac_code, accoid)
            ac_code = company_parameters.PurchaseTCSAc
            accoid = get_accoid(ac_code, headData['Company_Code'])
            add_gledger_entry(gledger_entries, headData, TCS_Amt, DRCRDetail, ac_code, accoid)

        if TDS_Amt > 0:
            ac_code = headData['Ac_Code']
            accoid = get_accoid(ac_code, headData['Company_Code'])
            add_gledger_entry(gledger_entries, headData, TDS_Amt, DRCRDetail, ac_code, accoid)
            ac_code = company_parameters.PurchaseTDSAc
            accoid = get_accoid(ac_code, headData['Company_Code'])
            add_gledger_entry(gledger_entries, headData, TDS_Amt, DRCRHead, ac_code, accoid)

        add_gledger_entry(gledger_entries, headData, bill_amount, DRCRHead, headData['Ac_Code'], get_accoid(headData['Ac_Code'], headData['Company_Code']))

        for item in detailData:
            ic_value = item['ic']
            purchase_ac_code = getPurchaseAc(ic_value)
            
            detailLedger_entry = create_gledger_entry({
                "tran_type": trans_typeNew,
                "doc_date": headData['doc_date'],
                "Ac_Code": purchase_ac_code,
                "Company_Code": headData['Company_Code'],
                "Year_Code": headData['Year_Code'],
                "Narration": "aaaa",
            }, float(item['item_Amount']), DRCRDetail, purchase_ac_code, get_accoid(purchase_ac_code,headData['Company_Code']))
            gledger_entries.append(detailLedger_entry)

        query_params = {
            'Company_Code': headData['Company_Code'],
            'DOC_NO': doc_no,
            'Year_Code': headData['Year_Code'],
            'TRAN_TYPE': trans_typeNew,
        }

        response = requests.post("http://localhost:8080/api/sugarian/create-Record-gLedger", params=query_params, json=gledger_entries)

        if response.status_code == 201:
            db.session.commit()
        else:
            db.session.rollback()
            return jsonify({"error": "Failed to create gLedger record", "details": response.json()}), response.status_code

        serialized_created_details = createdDetails

        return jsonify({
            "message": "Data updated successfully",
            "updatedHeadCount": updatedHeadCount,
            "addedDetails": serialized_created_details,
            "updatedDetails": updatedDetails,
            "deletedDetailIds": deletedDetailIds
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

#Delete record from Operation and also delet the Gledger Effect.  
@app.route(API_URL + "/delete_data_SugarPurchase", methods=["DELETE"])
def delete_data_SugarPurchase():
    try:
        purchaseid = request.args.get('purchaseid')
        Company_Code = request.args.get('Company_Code')
        doc_no = request.args.get('doc_no')
        Year_Code = request.args.get('Year_Code')
        tran_type = request.args.get('tran_type')
     
        # Check if the required parameters are provided
        if not all([purchaseid, Company_Code, doc_no, Year_Code, tran_type]):
            return jsonify({"error": "Missing required parameters"}), 400

        # Start a transaction
        with db.session.begin():
            # Delete records from DebitCreditNoteDetail table
            deleted_user_rows = SugarPurchase.query.filter_by(purchaseid=purchaseid).delete()

            # Delete record from DebitCreditNoteHead table
            deleted_task_rows = SugarPurchaseDetail.query.filter_by(purchaseid=purchaseid).delete()

        # If both deletions were successful, proceed with the external request
        if deleted_user_rows > 0 and deleted_task_rows > 0:
            query_params = {
                'Company_Code': Company_Code,
                'DOC_NO': doc_no,
                'Year_Code': Year_Code,
                'TRAN_TYPE': tran_type,
            }

            # Make the external request
            response = requests.delete("http://localhost:8080/api/sugarian/delete-Record-gLedger", params=query_params)
            
            if response.status_code != 200:
                raise Exception("Failed to create record in gLedger")

        # Commit the transaction
            db.session.commit()

        return jsonify({
            "message": f"Deleted {deleted_task_rows} Task row(s) and {deleted_user_rows} User row(s) successfully"
        }), 200

    except Exception as e:
        # Roll back the transaction if any error occurs
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


#Fetch the last Record on database by purchaseid
@app.route(API_URL+"/get-lastrecordsugarpurchase", methods=["GET"])
def get_lastrecordsugarpurchase():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')

        if not company_code:
            return jsonify({"error": "Company_Code and Year_Code query parameter is required"}), 400
        
        # Use SQLAlchemy to get the last record from the Task table
        last_tender_head = SugarPurchase.query.filter_by(Company_Code=company_code,Year_Code=year_code).order_by(SugarPurchase.purchaseid.desc()).first()

        if not last_tender_head:
            return jsonify({"error": "No records found in last_tender_head table"}), 404

        # Get the last Taskid
        last_tenderid = last_tender_head.purchaseid

        # Execute the additional SQL query
        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"purchaseid": last_tenderid})
     
        # Fetching additional data and converting to a list of dictionaries
        additional_data_rows = [row._asdict() for row in additional_data.fetchall()]
    
        # Prepare the response data
        last_tender_head_data = {
            **{column.name: getattr(last_tender_head, column.name) for column in last_tender_head.__table__.columns},
            **format_dates(last_tender_head), 
        }

        last_tender_details_data = additional_data_rows
        response = {
            "last_SugarPurchasehead": last_tender_head_data,
            "last_SugarPurchasedetail": last_tender_details_data
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
#Navigations API    
#Get First record from database 
@app.route(API_URL+"/get-firstsugarpurchase-navigation", methods=["GET"])
def get_firstsugarpurchase_navigation():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')

        if not company_code:
            return jsonify({"error": "Company_Code and Year_Code query parameter is required"}), 400
        
        # Use SQLAlchemy to get the first record from the Task table
        first_task = SugarPurchase.query.filter_by(Company_Code=company_code,Year_Code=year_code).order_by(SugarPurchase.purchaseid.asc()).first()

        if not first_task:
            return jsonify({"error": "No records found in Task_Entry table"}), 404

        # Get the purchaseid of the first record
        first_taskid = first_task.purchaseid

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"purchaseid": first_taskid})
        additional_data_rows = [row._asdict() for row in additional_data.fetchall()]
       
        # Prepare response data
        response = {
            "first_SugarPurchaseHead_data": {
                **{column.name: getattr(first_task, column.name) for column in first_task.__table__.columns},
                **format_dates(first_task), 
            },
            "first_SugarPurchasedetail_data": additional_data_rows
        }

        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


# #Get last Record from Database in navigation 
@app.route(API_URL+"/getlastSugarPurchase-record-navigation", methods=["GET"])
def getlastSugarPurchase_record_navigation():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')

        if not company_code:
            return jsonify({"error": "Company_Code and Year_Code query parameter is required"}), 400
        
        # Use SQLAlchemy to get the last record from the Task table
        last_task = SugarPurchase.query.filter_by(Company_Code=company_code,Year_Code=year_code).order_by(SugarPurchase.purchaseid.desc()).first()

        if not last_task:
            return jsonify({"error": "No records found in Task_Entry table"}), 404

        # Get the purchaseid  of the last record
        last_taskid = last_task.purchaseid

        # Additional SQL query execution
        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"purchaseid": last_taskid})
        additional_data_rows = [row._asdict() for row in additional_data.fetchall()]
      
        # Prepare response data
        response = {
            "last_SugarPurchaseHead_data": {
                **{column.name: getattr(last_task, column.name) for column in last_task.__table__.columns},
                **format_dates(last_task),
            },
            "last_SugarPurchasedetail_data": additional_data_rows
        }

        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
# #Get Previous record by database 
@app.route(API_URL+"/getprevioussugarpurchase-navigation", methods=["GET"])
def getprevioussugarpurchase_navigation():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        current_doc_no = request.args.get('doc_no')

        if not company_code:
            return jsonify({"error": "Company_Code and Year_Code query parameter is required"}), 400
        
        # Check if the Task_No is provided
        if not current_doc_no:
            return jsonify({"error": "Current Task No is required"}), 400

        # Use SQLAlchemy to get the previous record from the Task table
        previous_task = SugarPurchase.query.filter(
            SugarPurchase.doc_no < current_doc_no,
            SugarPurchase.Company_Code == company_code,
            SugarPurchase.Year_Code == year_code
        ).order_by(SugarPurchase.doc_no.desc()).first()
    
        if not previous_task:
            return jsonify({"error": "No previous records found"}), 404

        # Get the purchaseid of the previous record
        previous_purchaseid_id = previous_task.purchaseid
        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"purchaseid": previous_purchaseid_id})
        additional_data_rows = [row._asdict() for row in additional_data.fetchall()]

        response = {
            "previous_SugarPurchaseHead_data": {
                **{column.name: getattr(previous_task, column.name) for column in previous_task.__table__.columns},
                **format_dates(previous_task), 
            },
            "previous_SugarPurchasedetail_data":additional_data_rows
        }
        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
# # #Get Next record by database 
@app.route(API_URL+"/getnextsugarpurchase-navigation", methods=["GET"])
def getnextsugarpurchase_navigation():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        current_doc_no = request.args.get('doc_no')

        if not company_code:
            return jsonify({"error": "Company_Code and Year_Code query parameter is required"}), 400
        
        # Check if the currentTaskNo is provided
        if not current_doc_no:
            return jsonify({"error": "Current doc No required"}), 400

        # Use SQLAlchemy to get the next record from the Task table
        next_purchseid = SugarPurchase.query.filter(SugarPurchase.doc_no > current_doc_no,SugarPurchase.Company_Code == company_code,
            SugarPurchase.Year_Code == year_code).order_by(SugarPurchase.doc_no.asc()).first()

        if not next_purchseid:
            return jsonify({"error": "No next records found"}), 404

        # Get the purchaseid of the next record
        next_purchseid_id = next_purchseid.purchaseid
        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"purchaseid": next_purchseid_id})
        additional_data_rows = [row._asdict() for row in additional_data.fetchall()]
        
        # Prepare response data
        response = {
            "next_SugarPurchasehead_data": {
                **{column.name: getattr(next_purchseid, column.name) for column in next_purchseid.__table__.columns},
                **format_dates(next_purchseid)
            },
            "next_SugarPurchasedetails_data": additional_data_rows
        }
        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500