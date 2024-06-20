from flask import Flask, jsonify, request
from app import app, db
from sqlalchemy import text, func
from sqlalchemy.exc import SQLAlchemyError
import os

from app.models.Transactions.ReceiptPayment.ReceiptPaymentModels import ReceiptPaymentHead, ReceiptPaymentDetail
import requests
from app.utils.CommonGLedgerFunctions import get_accoid

API_URL = os.getenv('API_URL')

from app.models.Transactions.ReceiptPayment.ReceiptPaymentSchema import ReceiptPaymentHeadSchema, ReceiptPaymentDetailSchema

RECEIPT_PAYMENT_DETAILS_QUERY = '''
SELECT        dbo.nt_1_transactdetail.Tran_Type, dbo.nt_1_transactdetail.doc_no, dbo.nt_1_transactdetail.doc_date, dbo.nt_1_transactdetail.detail_id, dbo.nt_1_transactdetail.debit_ac, dbo.nt_1_transactdetail.credit_ac, 
                         dbo.nt_1_transactdetail.Unit_Code, dbo.nt_1_transactdetail.amount, dbo.nt_1_transactdetail.narration, dbo.nt_1_transactdetail.narration2, dbo.nt_1_transactdetail.Voucher_No, dbo.nt_1_transactdetail.Voucher_Type, 
                         dbo.nt_1_transactdetail.Adjusted_Amount, dbo.nt_1_transactdetail.Tender_No, dbo.nt_1_transactdetail.TenderDetail_ID, dbo.nt_1_transactdetail.drpFilterValue, dbo.nt_1_transactdetail.CreditAcAdjustedAmount, 
                         dbo.nt_1_transactdetail.Branch_name, dbo.nt_1_transactdetail.YearCodeDetail, dbo.nt_1_transactdetail.tranid, dbo.nt_1_transactdetail.ca, dbo.nt_1_transactdetail.uc, dbo.nt_1_transactdetail.tenderdetailid, 
                         dbo.nt_1_transactdetail.sbid, dbo.nt_1_transactdetail.da, dbo.nt_1_transactdetail.trandetailid, dbo.nt_1_transactdetail.drcr, dbo.nt_1_transactdetail.AcadjAccode, dbo.nt_1_transactdetail.AcadjAmt, dbo.nt_1_transactdetail.ac, 
                         dbo.nt_1_transactdetail.TDS_Rate, dbo.nt_1_transactdetail.TDS_Amt, dbo.nt_1_transactdetail.GRN, dbo.nt_1_transactdetail.TReceipt, dbo.nt_1_transacthead.company_code, dbo.nt_1_transacthead.year_code, 
                         dbo.nt_1_transacthead.cashbank, dbo.nt_1_transacthead.cb, cashbank.Ac_Code AS cashbankaccode, cashbank.Ac_Name_E AS cashbankname, cashbank.accoid AS cashbankacid, debitac.Ac_Code AS debitaccode, 
                         debitac.Ac_Name_E AS debitacname, creditac.Ac_Code AS creditaccode, creditac.Ac_Name_E AS creditacname, creditac.accoid AS creditacid, debitac.accoid AS debitacid, unit.Ac_Code AS unitaccode, 
                         unit.Ac_Name_E AS unitacname, unit.accoid AS unitacid, adjustedac.Ac_Code AS adjustedaccode, adjustedac.Ac_Name_E AS adjustedacname, adjustedac.accoid AS adjustedacid
FROM            dbo.nt_1_accountmaster AS creditac RIGHT OUTER JOIN
                         dbo.nt_1_accountmaster AS unit RIGHT OUTER JOIN
                         dbo.nt_1_accountmaster AS adjustedac RIGHT OUTER JOIN
                         dbo.nt_1_transactdetail ON adjustedac.accoid = dbo.nt_1_transactdetail.ac ON unit.accoid = dbo.nt_1_transactdetail.uc ON creditac.accoid = dbo.nt_1_transactdetail.ca LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS debitac ON dbo.nt_1_transactdetail.da = debitac.accoid RIGHT OUTER JOIN
                         dbo.nt_1_transacthead LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS cashbank ON dbo.nt_1_transacthead.cb = cashbank.accoid ON dbo.nt_1_transactdetail.tranid = dbo.nt_1_transacthead.tranid
WHERE dbo.nt_1_transacthead.tranid = :tranid
'''

receipt_payment_head_schema = ReceiptPaymentHeadSchema()
receipt_payment_head_schemas = ReceiptPaymentHeadSchema(many=True)

receipt_payment_detail_schema = ReceiptPaymentDetailSchema()
receipt_payment_detail_schemas = ReceiptPaymentDetailSchema(many=True)

def format_dates(task):
    return {
        "doc_date": task.doc_date.strftime('%Y-%m-%d') if task.doc_date else None,
    }

# Get data from both tables ReceiptPaymentHead and ReceiptPaymentDetail
@app.route(API_URL + "/getdata-receiptpayment", methods=["GET"])
def getdata_receiptpayment():
    try:
        head_data = ReceiptPaymentHead.query.all()
        detail_data = ReceiptPaymentDetail.query.all()
        # Serialize the data using schemas
        head_result = receipt_payment_head_schemas.dump(head_data)
        detail_result = receipt_payment_detail_schemas.dump(detail_data)
        response = {
            "ReceiptPayment_Head": head_result,
            "ReceiptPayment_Detail": detail_result
        }

        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Get data by the particular doc_no
@app.route(API_URL + "/getreceiptpaymentByid", methods=["GET"])
def getreceiptpaymentByid():
    try:
        # Extract doc_no from request query parameters
        doc_no = request.args.get('doc_no')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        tran_type = request.args.get('tran_type')
        if not all([Company_Code, Year_Code, tran_type, doc_no]):
            return jsonify({"error": "Missing required parameters"}), 400

        receipt_payment_head = ReceiptPaymentHead.query.filter_by(doc_no=doc_no,company_code=Company_Code,year_code=Year_Code,tran_type=tran_type).first()
        if not receipt_payment_head:
            return jsonify({"error": "No records found"}), 404

        tranid = receipt_payment_head.tranid
        additional_data = db.session.execute(text(RECEIPT_PAYMENT_DETAILS_QUERY), {"tranid": tranid})
        additional_data_rows = additional_data.fetchall()

        row = additional_data_rows[0] if additional_data_rows else None
        cashbankname = row.cashbankname if row else None
        debitacname = row.debitacname if row else None
        creditacname = row.creditacname if row else None
        unitacname = row.unitacname if row else None
        adjustedacname = row.adjustedacname if row else None

        response = {
            "receipt_payment_head": {
                **{column.name: getattr(receipt_payment_head, column.name) for column in receipt_payment_head.__table__.columns},
                **format_dates(receipt_payment_head),
                "cashbankname":cashbankname,
                "debitacname":debitacname,
                "creditacname":creditacname,
                "unitacname":unitacname,
                "adjustedacname":adjustedacname

            },
            "receipt_payment_details": [{"Tran_Type": row.Tran_Type, "doc_no": row.doc_no, "doc_date": row.doc_date.strftime('%Y-%m-%d') if row.doc_date else None, "detail_id": row.detail_id, "debit_ac": row.debit_ac, "credit_ac": row.credit_ac, "amount": row.amount, "narration": row.narration,
                                         "Adjusted_Amount":row.Adjusted_Amount,"Tender_No":row.Tender_No,"TenderDetail_ID":row.TenderDetail_ID,
                                         "drpFilterValue":row.drpFilterValue,"CreditAcAdjustedAmount":row.CreditAcAdjustedAmount,
                                         "Branch_name":row.Branch_name,"YearCodeDetail":row.YearCodeDetail,"ca":row.ca,"uc":row.uc,
                                         "tenderdetailid":row.tenderdetailid,"sbid":row.sbid,"da":row.da,"trandetailid":row.trandetailid,
                                         "drcr":row.drcr,"AcadjAccode":row.AcadjAccode,"AcadjAmt":row.AcadjAmt,"ac":row.ac,"TDS_Rate":row.TDS_Rate,
                                         "TDS_Amt":row.TDS_Amt,"GRN":row.GRN,"TReceipt":row.TReceipt} for row in additional_data_rows],
                                         
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Insert record for ReceiptPaymentHead and ReceiptPaymentDetail
@app.route(API_URL + "/insert-receiptpayment", methods=["POST"])
def insert_receiptpayment():
    def get_max_doc_no(tran_type):
        return db.session.query(func.max(ReceiptPaymentHead.doc_no)).filter(ReceiptPaymentHead.tran_type == tran_type).scalar() or 0
    
    def create_gledger_entry(data, amount, drcr, ac_code, accoid, DRCR_Head):
        return {
            "TRAN_TYPE": tran_type,
            "DOC_NO": new_doc_no,
            "DOC_DATE": data['doc_date'],
            "AC_CODE": ac_code,
            "AMOUNT": amount,
            "COMPANY_CODE": data['company_code'],
            "YEAR_CODE": data['year_code'],
            "ORDER_CODE": 12,
            "DRCR": drcr,
            "UNIT_Code": 0,
            "NARRATION": item['narration'],
            "TENDER_ID": 0,
            "TENDER_ID_DETAIL": 0,
            "VOUCHER_ID": 0,
            "DRCR_HEAD": DRCR_Head,
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
    
    def add_gledger_entry(entries, data, amount, drcr, ac_code, accoid, DRCR_Head):
        if amount > 0:
            entries.append(create_gledger_entry(data, amount, drcr, ac_code, accoid, DRCR_Head))
            
    try:
        data = request.get_json()
        headData = data['head_data']
        detailData = data['detail_data']
       
        tran_type = headData.get('tran_type')
        if not tran_type:
            return jsonify({"error": "Bad Request", "message": "tran_type is required"}), 400

        max_doc_no = get_max_doc_no(tran_type)
        new_doc_no = max_doc_no + 1
        headData['doc_no'] = new_doc_no

        new_head = ReceiptPaymentHead(**headData)
        db.session.add(new_head)

        print(new_head)

        createdDetails = []
        updatedDetails = []
        deletedDetailIds = []

        for item in detailData:
            item['doc_no'] = new_doc_no
            item['tranid'] = new_head.tranid
            item['Tran_Type'] = new_head.tran_type
        
            if 'rowaction' in item:
                if item['rowaction'] == "add":
                    del item['rowaction']
                    new_detail = ReceiptPaymentDetail(**item)
                    new_head.details.append(new_detail)
                    print(new_head.details)
                    createdDetails.append(new_detail)

                elif item['rowaction'] == "update":
                    trandetailid = item['trandetailid']
                    update_values = {k: v for k, v in item.items() if k not in ('trandetailid', 'rowaction', 'tranid')}
                    db.session.query(ReceiptPaymentDetail).filter(ReceiptPaymentDetail.trandetailid == trandetailid).update(update_values)
                    updatedDetails.append(trandetailid)

                elif item['rowaction'] == "delete":
                    trandetailid = item['trandetailid']
                    detail_to_delete = db.session.query(ReceiptPaymentDetail).filter(ReceiptPaymentDetail.trandetailid == trandetailid).one_or_none()
                    if detail_to_delete:
                        db.session.delete(detail_to_delete)
                        deletedDetailIds.append(trandetailid)

        db.session.commit()

        gledger_entries = []

        for item in detailData:
            amount = float(item.get('amount', 0) or 0)
            DrCr = item['drcr']
            credit_ac = item['credit_ac']
            cashbank = headData['cashbank']
            debit_ac = item['debit_ac']
        
            if amount > 0:
                if tran_type in ["CP", "BP"]:
                    add_gledger_entry(gledger_entries, headData, amount, "C", cashbank, get_accoid(cashbank, headData['company_code']), credit_ac)
                    add_gledger_entry(gledger_entries, headData, amount, "D", credit_ac, get_accoid(credit_ac, headData['company_code']), cashbank)
                elif tran_type in ["BR", "CR"]:
                    add_gledger_entry(gledger_entries, headData, amount, "D", cashbank, get_accoid(cashbank, headData['company_code']), credit_ac)
                    add_gledger_entry(gledger_entries, headData, amount, "C", credit_ac, get_accoid(credit_ac, headData['company_code']), cashbank)
                elif tran_type in ["JV"]:
                    add_gledger_entry(gledger_entries, headData, amount, DrCr, debit_ac, get_accoid(debit_ac, headData['company_code']), 99999999)

        query_params = {
            'Company_Code': headData['company_code'],
            'DOC_NO': new_doc_no,
            'Year_Code': headData['year_code'],
            'TRAN_TYPE': headData['tran_type'],
        }

        response = requests.post("http://localhost:8080/api/sugarian/create-Record-gLedger", params=query_params, json=gledger_entries)

        if response.status_code == 201:
            db.session.commit()
        else:
            db.session.rollback()
            return jsonify({"error": "Failed to create gLedger record", "details": response.json()}), response.status_code

        return jsonify({
            "message": "Data Inserted successfully",
            "head": receipt_payment_head_schema.dump(new_head),
            "addedDetails": receipt_payment_detail_schemas.dump(createdDetails),
            "updatedDetails": updatedDetails,
            "deletedDetailIds": deletedDetailIds
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Update record for ReceiptPaymentHead and ReceiptPaymentDetail
@app.route(API_URL + "/update-receiptpayment", methods=["PUT"])
def update_receiptpayment():
    def create_gledger_entry(data, amount, drcr, ac_code, accoid, DRCR_Head):
        return {
            "TRAN_TYPE": tran_type,
            "DOC_NO": updated_head.doc_no,
            "DOC_DATE": data['doc_date'],
            "AC_CODE": ac_code,
            "AMOUNT": amount,
            "COMPANY_CODE": data['company_code'],
            "YEAR_CODE": data['year_code'],
            "ORDER_CODE": 12,
            "DRCR": drcr,
            "UNIT_Code": 0,
            "NARRATION": item['narration'],
            "TENDER_ID": 0,
            "TENDER_ID_DETAIL": 0,
            "VOUCHER_ID": 0,
            "DRCR_HEAD": DRCR_Head,
            "ADJUSTED_AMOUNT": 0,
            "Branch_Code": 1,
            "SORT_TYPE": tran_type,
            "SORT_NO": updated_head.doc_no,
            "vc": 0,
            "progid": 0,
            "tranid": 0,
            "saleid": 0,
            "ac": accoid
        }
    
    def add_gledger_entry(entries, data, amount, drcr, ac_code, accoid, DRCR_Head):
        if amount > 0:
            entries.append(create_gledger_entry(data, amount, drcr, ac_code, accoid, DRCR_Head))
            
    try:
        tranid = request.args.get('tranid')
        if not tranid:
            return jsonify({"error": "Missing 'tranid' parameter"}), 400

        data = request.get_json()
        headData = data['head_data']
        detailData = data['detail_data']

        tran_type = headData.get('tran_type')
        if not tran_type:
            return jsonify({"error": "Bad Request", "message": "tran_type is required"}), 400

        updated_head_count = db.session.query(ReceiptPaymentHead).filter(ReceiptPaymentHead.tranid == tranid).update(headData)
        updated_head = ReceiptPaymentHead.query.filter_by(tranid=tranid).first()

        created_details = []
        updated_details = []
        deleted_detail_ids = []

        for item in detailData:
            item['tranid'] = updated_head.tranid
            item['Tran_Type'] = updated_head.tran_type

            if 'rowaction' in item:
                if item['rowaction'] == "add":
                    del item['rowaction']
                    item['doc_no'] = updated_head.doc_no
                    new_detail = ReceiptPaymentDetail(**item)
                    db.session.add(new_detail)
                    created_details.append(new_detail)

                elif item['rowaction'] == "update":
                    trandetailid = item['trandetailid']
                    update_values = {k: v for k, v in item.items() if k not in ('trandetailid', 'rowaction', 'tranid')}
                    db.session.query(ReceiptPaymentDetail).filter(ReceiptPaymentDetail.trandetailid == trandetailid).update(update_values)
                    updated_details.append(trandetailid)

                elif item['rowaction'] == "delete":
                    trandetailid = item['trandetailid']
                    detail_to_delete = db.session.query(ReceiptPaymentDetail).filter(ReceiptPaymentDetail.trandetailid == trandetailid).one_or_none()
                    if detail_to_delete:
                        db.session.delete(detail_to_delete)
                        deleted_detail_ids.append(trandetailid)

        db.session.commit()

        gledger_entries = []

        for item in detailData:
            amount = float(item.get('amount', 0) or 0)
            credit_ac = item['credit_ac']
            cashbank = headData['cashbank']
            DrCr = item['drcr']
            debit_ac = item['debit_ac']

            if amount > 0:
                if tran_type in ["CP", "BP"]:
                    add_gledger_entry(gledger_entries, headData, amount, "C", cashbank, get_accoid(cashbank, headData['company_code']), credit_ac)
                    add_gledger_entry(gledger_entries, headData, amount, "D", credit_ac, get_accoid(credit_ac, headData['company_code']), cashbank)
                elif tran_type in ["BR", "CR"]:
                    add_gledger_entry(gledger_entries, headData, amount, "D", cashbank, get_accoid(cashbank, headData['company_code']), credit_ac)
                    add_gledger_entry(gledger_entries, headData, amount, "C", credit_ac, get_accoid(credit_ac, headData['company_code']), cashbank)
                elif tran_type in ["JV"]:
                    add_gledger_entry(gledger_entries, headData, amount, DrCr, debit_ac, get_accoid(debit_ac, headData['company_code']), 99999999)

        query_params = {
            'Company_Code': headData['company_code'],
            'DOC_NO': updated_head.doc_no,
            'Year_Code': headData['year_code'],
            'TRAN_TYPE': headData['tran_type'],
        }

        response = requests.post("http://localhost:8080/api/sugarian/create-Record-gLedger", params=query_params, json=gledger_entries)

        if response.status_code == 201:
            db.session.commit()
        else:
            db.session.rollback()
            return jsonify({"error": "Failed to create gLedger record", "details": response.json()}), response.status_code

        return jsonify({
            "message": "Data updated successfully",
            "head": updated_head_count,
            "created_details": receipt_payment_detail_schemas.dump(created_details),
            "updated_details": updated_details,
            "deleted_detail_ids": deleted_detail_ids
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


# Delete record from database based on tranid
@app.route(API_URL + "/delete_data_by_tranid", methods=["DELETE"])
def delete_data_by_tranid():
    try:
        tranid = request.args.get('tranid')
        company_code = request.args.get('company_code')
        year_code = request.args.get('year_code')
        doc_no = request.args.get('doc_no')
        tran_type = request.args.get('Tran_Type')

        if not all([tranid, company_code,year_code,doc_no,tran_type]):
            return jsonify({"error": "Missing required parameters"}), 400

        with db.session.begin():
            deleted_detail_rows = ReceiptPaymentDetail.query.filter_by(tranid=tranid).delete()
            deleted_head_rows = ReceiptPaymentHead.query.filter_by(tranid=tranid).delete()

        if deleted_detail_rows > 0 and deleted_head_rows > 0:
            query_params = {
                'Company_Code': company_code,
                'DOC_NO': doc_no,
                'Year_Code': year_code,
                'TRAN_TYPE': tran_type,
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

# Fetch the last record from the database by tranid
@app.route(API_URL + "/get-lastreceiptpaymentdata", methods=["GET"])
def get_lastreceiptpaymentdata():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if not all([ Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400

        last_receipt_payment_head = ReceiptPaymentHead.query.filter_by(company_code=Company_Code,year_code=Year_Code).order_by(ReceiptPaymentHead.tranid.desc()).first()
        if not last_receipt_payment_head:
            return jsonify({"error": "No records found in ReceiptPaymentHead table"}), 404

        tranid = last_receipt_payment_head.tranid
        additional_data = db.session.execute(text(RECEIPT_PAYMENT_DETAILS_QUERY), {"tranid": tranid})
        additional_data_rows = additional_data.fetchall()

        row = additional_data_rows[0] if additional_data_rows else None
        cashbankname = row.cashbankname if row else None
        debitacname = row.debitacname if row else None
        creditacname = row.creditacname if row else None
        unitacname = row.unitacname if row else None
        adjustedacname = row.adjustedacname if row else None

        last_head_data = {
            **{column.name: getattr(last_receipt_payment_head, column.name) for column in last_receipt_payment_head.__table__.columns},
            **format_dates(last_receipt_payment_head),
            "cashbankname":cashbankname,
            "debitacname":debitacname,
            "creditacname":creditacname,
            "unitacname":unitacname,
            "adjustedacname":adjustedacname
        }

        last_details_data = [{"Tran_Type": row.Tran_Type, "doc_no": row.doc_no, "doc_date": row.doc_date.strftime('%Y-%m-%d') if row.doc_date else None, "detail_id": row.detail_id, "debit_ac": row.debit_ac, "credit_ac": row.credit_ac, "amount": row.amount, "narration": row.narration,
                                         "Adjusted_Amount":row.Adjusted_Amount,"Tender_No":row.Tender_No,"TenderDetail_ID":row.TenderDetail_ID,
                                         "drpFilterValue":row.drpFilterValue,"CreditAcAdjustedAmount":row.CreditAcAdjustedAmount,
                                         "Branch_name":row.Branch_name,"YearCodeDetail":row.YearCodeDetail,"ca":row.ca,"uc":row.uc,
                                         "tenderdetailid":row.tenderdetailid,"sbid":row.sbid,"da":row.da,"trandetailid":row.trandetailid,
                                         "drcr":row.drcr,"AcadjAccode":row.AcadjAccode,"AcadjAmt":row.AcadjAmt,"ac":row.ac,"TDS_Rate":row.TDS_Rate,
                                         "TDS_Amt":row.TDS_Amt,"GRN":row.GRN,"TReceipt":row.TReceipt} for row in additional_data_rows]

        response = {
            "last_head_data": last_head_data,
            "last_details_data": last_details_data
        }

        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Get first record from the database
@app.route(API_URL + "/get-firstreceiptpayment-navigation", methods=["GET"])
def get_firstreceiptpayment_navigation():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if not all([ Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400
        
        first_receipt_payment_head = ReceiptPaymentHead.query.filter_by(Company_Code=Company_Code,Year_Code=Year_Code).order_by(ReceiptPaymentHead.tranid.asc()).first()
        if not first_receipt_payment_head:
            return jsonify({"error": "No records found in ReceiptPaymentHead table"}), 404

        tranid = first_receipt_payment_head.tranid
        additional_data = db.session.execute(text(RECEIPT_PAYMENT_DETAILS_QUERY), {"tranid": tranid})
        additional_data_rows = additional_data.fetchall()

        row = additional_data_rows[0] if additional_data_rows else None
        cashbankname = row.cashbankname if row else None
        debitacname = row.debitacname if row else None
        creditacname = row.creditacname if row else None
        unitacname = row.unitacname if row else None
        adjustedacname = row.adjustedacname if row else None

        first_head_data = {
            **{column.name: getattr(first_receipt_payment_head, column.name) for column in first_receipt_payment_head.__table__.columns},
            **format_dates(first_receipt_payment_head),
            "cashbankname":cashbankname,
            "debitacname":debitacname,
            "creditacname":creditacname,
            "unitacname":unitacname,
            "adjustedacname":adjustedacname
        }

        first_details_data = [{"Tran_Type": row.Tran_Type, "doc_no": row.doc_no, "doc_date": row.doc_date.strftime('%Y-%m-%d') if row.doc_date else None, "detail_id": row.detail_id, "debit_ac": row.debit_ac, "credit_ac": row.credit_ac, "amount": row.amount, "narration": row.narration,
                                         "Adjusted_Amount":row.Adjusted_Amount,"Tender_No":row.Tender_No,"TenderDetail_ID":row.TenderDetail_ID,
                                         "drpFilterValue":row.drpFilterValue,"CreditAcAdjustedAmount":row.CreditAcAdjustedAmount,
                                         "Branch_name":row.Branch_name,"YearCodeDetail":row.YearCodeDetail,"ca":row.ca,"uc":row.uc,
                                         "tenderdetailid":row.tenderdetailid,"sbid":row.sbid,"da":row.da,"trandetailid":row.trandetailid,
                                         "drcr":row.drcr,"AcadjAccode":row.AcadjAccode,"AcadjAmt":row.AcadjAmt,"ac":row.ac,"TDS_Rate":row.TDS_Rate,
                                         "TDS_Amt":row.TDS_Amt,"GRN":row.GRN,"TReceipt":row.TReceipt} for row in additional_data_rows]

        response = {
            "first_head_data": first_head_data,
            "first_details_data": first_details_data
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Get last record from the database
@app.route(API_URL + "/get-lastreceiptpayment-navigation", methods=["GET"])
def get_lastreceiptpayment_navigation():
    try:
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if not all([ Company_Code, Year_Code]):
            return jsonify({"error": "Missing required parameters"}), 400
        
        last_receipt_payment_head = ReceiptPaymentHead.query.filter_by(Company_Code=Company_Code,Year_Code=Year_Code).order_by(ReceiptPaymentHead.tranid.desc()).first()
        if not last_receipt_payment_head:
            return jsonify({"error": "No records found in ReceiptPaymentHead table"}), 404

        tranid = last_receipt_payment_head.tranid
        additional_data = db.session.execute(text(RECEIPT_PAYMENT_DETAILS_QUERY), {"tranid": tranid})
        additional_data_rows = additional_data.fetchall()

        row = additional_data_rows[0] if additional_data_rows else None
        cashbankname = row.cashbankname if row else None
        debitacname = row.debitacname if row else None
        creditacname = row.creditacname if row else None
        unitacname = row.unitacname if row else None
        adjustedacname = row.adjustedacname if row else None

        last_head_data = {
            **{column.name: getattr(last_receipt_payment_head, column.name) for column in last_receipt_payment_head.__table__.columns},
            **format_dates(last_receipt_payment_head),
            "cashbankname":cashbankname,
            "debitacname":debitacname,
            "creditacname":creditacname,
            "unitacname":unitacname,
            "adjustedacname":adjustedacname
        }

        last_details_data = [{"Tran_Type": row.Tran_Type, "doc_no": row.doc_no, "doc_date": row.doc_date.strftime('%Y-%m-%d') if row.doc_date else None, "detail_id": row.detail_id, "debit_ac": row.debit_ac, "credit_ac": row.credit_ac, "amount": row.amount, "narration": row.narration,
                                         "Adjusted_Amount":row.Adjusted_Amount,"Tender_No":row.Tender_No,"TenderDetail_ID":row.TenderDetail_ID,
                                         "drpFilterValue":row.drpFilterValue,"CreditAcAdjustedAmount":row.CreditAcAdjustedAmount,
                                         "Branch_name":row.Branch_name,"YearCodeDetail":row.YearCodeDetail,"ca":row.ca,"uc":row.uc,
                                         "tenderdetailid":row.tenderdetailid,"sbid":row.sbid,"da":row.da,"trandetailid":row.trandetailid,
                                         "drcr":row.drcr,"AcadjAccode":row.AcadjAccode,"AcadjAmt":row.AcadjAmt,"ac":row.ac,"TDS_Rate":row.TDS_Rate,
                                         "TDS_Amt":row.TDS_Amt,"GRN":row.GRN,"TReceipt":row.TReceipt} for row in additional_data_rows]

        response = {
            "last_head_data": last_head_data,
            "last_details_data": last_details_data
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Get previous record from the database
@app.route(API_URL + "/get-previousreceiptpayment-navigation", methods=["GET"])
def get_previousreceiptpayment_navigation():
    try:
        current_doc_no = request.args.get('currentDocNo')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if not all([ Company_Code, Year_Code,current_doc_no]):
            return jsonify({"error": "Missing required parameters"}), 400

        previous_receipt_payment_head = ReceiptPaymentHead.query.filter(ReceiptPaymentHead.doc_no < current_doc_no).filter_by(Company_Code=Company_Code,Year_Code=Year_Code).order_by(ReceiptPaymentHead.doc_no.desc()).first()
        if not previous_receipt_payment_head:
            return jsonify({"error": "No previous records found"}), 404

        tranid = previous_receipt_payment_head.tranid
        additional_data = db.session.execute(text(RECEIPT_PAYMENT_DETAILS_QUERY), {"tranid": tranid})
        additional_data_rows = additional_data.fetchall()

        row = additional_data_rows[0] if additional_data_rows else None
        cashbankname = row.cashbankname if row else None
        debitacname = row.debitacname if row else None
        creditacname = row.creditacname if row else None
        unitacname = row.unitacname if row else None
        adjustedacname = row.adjustedacname if row else None

        previous_head_data = {
            **{column.name: getattr(previous_receipt_payment_head, column.name) for column in previous_receipt_payment_head.__table__.columns},
            **format_dates(previous_receipt_payment_head),
            "cashbankname":cashbankname,
            "debitacname":debitacname,
            "creditacname":creditacname,
            "unitacname":unitacname,
            "adjustedacname":adjustedacname
        }

        previous_details_data = [{"Tran_Type": row.Tran_Type, "doc_no": row.doc_no, "doc_date": row.doc_date.strftime('%Y-%m-%d') if row.doc_date else None, "detail_id": row.detail_id, "debit_ac": row.debit_ac, "credit_ac": row.credit_ac, "amount": row.amount, "narration": row.narration,
                                         "Adjusted_Amount":row.Adjusted_Amount,"Tender_No":row.Tender_No,"TenderDetail_ID":row.TenderDetail_ID,
                                         "drpFilterValue":row.drpFilterValue,"CreditAcAdjustedAmount":row.CreditAcAdjustedAmount,
                                         "Branch_name":row.Branch_name,"YearCodeDetail":row.YearCodeDetail,"ca":row.ca,"uc":row.uc,
                                         "tenderdetailid":row.tenderdetailid,"sbid":row.sbid,"da":row.da,"trandetailid":row.trandetailid,
                                         "drcr":row.drcr,"AcadjAccode":row.AcadjAccode,"AcadjAmt":row.AcadjAmt,"ac":row.ac,"TDS_Rate":row.TDS_Rate,
                                         "TDS_Amt":row.TDS_Amt,"GRN":row.GRN,"TReceipt":row.TReceipt} for row in additional_data_rows]

        response = {
            "previous_head_data": previous_head_data,
            "previous_details_data": previous_details_data
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Get next record from the database
@app.route(API_URL + "/get-nextreceiptpayment-navigation", methods=["GET"])
def get_nextreceiptpayment_navigation():
    try:
        current_doc_no = request.args.get('currentDocNo')
        current_doc_no = request.args.get('currentDocNo')
        Company_Code = request.args.get('Company_Code')
        Year_Code = request.args.get('Year_Code')
        if not all([ Company_Code, Year_Code,current_doc_no]):
            return jsonify({"error": "Missing required parameters"}), 400

        next_receipt_payment_head = ReceiptPaymentHead.query.filter(ReceiptPaymentHead.doc_no > current_doc_no).filter_by(Company_Code=Company_Code,Year_Code=Year_Code).order_by(ReceiptPaymentHead.doc_no.asc()).first()
        if not next_receipt_payment_head:
            return jsonify({"error": "No next records found"}), 404

        tranid = next_receipt_payment_head.tranid
        additional_data = db.session.execute(text(RECEIPT_PAYMENT_DETAILS_QUERY), {"tranid": tranid})
        additional_data_rows = additional_data.fetchall()

        row = additional_data_rows[0] if additional_data_rows else None
        cashbankname = row.cashbankname if row else None
        debitacname = row.debitacname if row else None
        creditacname = row.creditacname if row else None
        unitacname = row.unitacname if row else None
        adjustedacname = row.adjustedacname if row else None

        next_head_data = {
            **{column.name: getattr(next_receipt_payment_head, column.name) for column in next_receipt_payment_head.__table__.columns},
            **format_dates(next_receipt_payment_head),
            "cashbankname":cashbankname,
            "debitacname":debitacname,
            "creditacname":creditacname,
            "unitacname":unitacname,
            "adjustedacname":adjustedacname
        }

        next_details_data = [{"Tran_Type": row.Tran_Type, "doc_no": row.doc_no, "doc_date": row.doc_date.strftime('%Y-%m-%d') if row.doc_date else None, "detail_id": row.detail_id, "debit_ac": row.debit_ac, "credit_ac": row.credit_ac, "amount": row.amount, "narration": row.narration,
                                         "Adjusted_Amount":row.Adjusted_Amount,"Tender_No":row.Tender_No,"TenderDetail_ID":row.TenderDetail_ID,
                                         "drpFilterValue":row.drpFilterValue,"CreditAcAdjustedAmount":row.CreditAcAdjustedAmount,
                                         "Branch_name":row.Branch_name,"YearCodeDetail":row.YearCodeDetail,"ca":row.ca,"uc":row.uc,
                                         "tenderdetailid":row.tenderdetailid,"sbid":row.sbid,"da":row.da,"trandetailid":row.trandetailid,
                                         "drcr":row.drcr,"AcadjAccode":row.AcadjAccode,"AcadjAmt":row.AcadjAmt,"ac":row.ac,"TDS_Rate":row.TDS_Rate,
                                         "TDS_Amt":row.TDS_Amt,"GRN":row.GRN,"TReceipt":row.TReceipt} for row in additional_data_rows]

        response = {
            "next_head_data": next_head_data,
            "next_details_data": next_details_data
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
