from flask import Flask, jsonify, request
from app import app, db
from app.models.Transactions.DebitCreditNote.DebitCreditNoteModels import DebitCreditNoteHead, DebitCreditNoteDetail 
from app.models.Reports.GLedeger.GLedgerModels import Gledger
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy import func,desc
import os
import requests
from app.utils.CommonGLedgerFunctions import fetch_company_parameters,get_accoid

# Get the base URL from environment variables
API_URL= os.getenv('API_URL')

# Import schemas from the schemas module
from app.models.Transactions.DebitCreditNote.DebitCreditNoteSchema import DebitCreditNoteHeadSchema, DebitCreditNoteDetailSchema

# Global SQL Query
TASK_DETAILS_QUERY = '''
    SELECT        dbo.debitnotehead.dcid, dbo.debitnotehead.ac_code, dbo.debitnotehead.gst_code, dbo.nt_1_gstratemaster.GST_Name, dbo.nt_1_systemmaster.System_Name_E, BillFrom.Ac_Name_E AS BillFromName, 
                         BillTo.Ac_Name_E AS BillToName, Mill.Ac_Name_E AS MillName, ShipTotbl.Ac_Name_E AS ShipToName, dbo.qrydebitnotedetail.expac_code, dbo.qrydebitnotedetail.value, dbo.qrydebitnotedetail.expac, 
                         dbo.qrydebitnotedetail.detail_Id, dbo.qrydebitnotedetail.expacaccountname, dbo.qrydebitnotedetail.Item_Code, dbo.qrydebitnotedetail.Quantal, dbo.qrydebitnotedetail.Item_Name, dbo.qrydebitnotedetail.HSN, 
                         dbo.qrydebitnotedetail.dcdetailid, dbo.debitnotehead.Unit_Code, Unit.Ac_Name_E AS UnitAcName,dbo.debitnotehead.tran_type
FROM            dbo.nt_1_accountmaster AS Unit RIGHT OUTER JOIN
                         dbo.debitnotehead ON Unit.accoid = dbo.debitnotehead.uc RIGHT OUTER JOIN
                         dbo.qrydebitnotedetail ON dbo.debitnotehead.dcid = dbo.qrydebitnotedetail.dcid LEFT OUTER JOIN
                         dbo.nt_1_systemmaster ON dbo.qrydebitnotedetail.ic = dbo.nt_1_systemmaster.systemid LEFT OUTER JOIN
                         dbo.nt_1_gstratemaster ON dbo.debitnotehead.Company_Code = dbo.nt_1_gstratemaster.Company_Code AND dbo.debitnotehead.gst_code = dbo.nt_1_gstratemaster.Doc_no LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS ShipTotbl ON dbo.debitnotehead.uc = ShipTotbl.accoid LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS Mill ON dbo.debitnotehead.mc = Mill.accoid LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS BillTo ON dbo.debitnotehead.st = BillTo.accoid LEFT OUTER JOIN
                         dbo.nt_1_accountmaster AS BillFrom ON dbo.debitnotehead.ac = BillFrom.accoid
				  where dbo.debitnotehead.dcid =:dcid
'''

def format_dates(task):
    return {
        "bill_date": task.bill_date.strftime('%Y-%m-%d') if task.bill_date else None,
        "doc_date": task.doc_date.strftime('%Y-%m-%d') if task.doc_date else None,
    }

# Define schemas
task_head_schema = DebitCreditNoteHeadSchema()
task_head_schemas = DebitCreditNoteHeadSchema(many=True)

task_detail_schema = DebitCreditNoteDetailSchema()
task_detail_schemas = DebitCreditNoteDetailSchema(many=True)

# Get data from both tables DebitcreditNote and DebitcreditNoteDetail
@app.route(API_URL + "/getdata-debitcreditNote", methods=["GET"])
def getdata_debitcreditNote():
    try:
        # Extract company_code and year_code from the request arguments
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')

        # Validate that the parameters are present
        if not company_code or not year_code:
            return jsonify({"error": "Missing 'Company_Code' or 'Year_Code' parameter"}), 400

        # Query both tables with the given conditions
        task_data = DebitCreditNoteHead.query.filter_by(Company_Code=company_code, Year_Code=year_code).order_by(desc(DebitCreditNoteHead.doc_no)).all()
        # user_data = DebitCreditNoteDetail.query.filter_by(company_code=company_code, year_code=year_code).all()

        # Serialize the data using schemas
        task_result = task_head_schemas.dump(task_data)
        # user_result = task_detail_schemas.dump(user_data)
        response = {
            "DebitCredit_Head": task_result,
            # "DebitCredit_Detail": user_result
        }

        return jsonify(response), 200
    except Exception as e:
        # Handle any potential exceptions and return an error response with a 500 Internal Server Error status code
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

    
# # We have to get the data By the Particular doc_no AND tran_type
@app.route(API_URL+"/getdebitcreditByid", methods=["GET"])
def getdebitcreditByid():
    try:
        # Extract taskNo from request query parameters
        doc_no = request.args.get('doc_no')
        tran_type = request.args.get('tran_type')

        if not doc_no:
            return jsonify({"error": "Document number not provided"}), 400
    
        if not tran_type:
            return jsonify({"error": "Transaction Type not provided"}), 400
        
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
        task_head = DebitCreditNoteHead.query.filter_by(doc_no=doc_no, tran_type=tran_type,Company_Code=Company_Code,Year_Code=year_code).first()

        newtaskid = task_head.dcid
        print('task_head',newtaskid)

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"dcid": newtaskid})

        # Extracting category name from additional_data
        additional_data_rows = additional_data.fetchall()
      
        # Extracting category name from additional_data
        row = additional_data_rows[0] if additional_data_rows else None
        category = row.BillToName if row else None
    
        last_head_data = {column.name: getattr(task_head, column.name) for column in task_head.__table__.columns}
        last_head_data.update(format_dates(task_head))

        # Convert additional_data_rows to a list of dictionaries
        last_details_data = [dict(row._mapping) for row in additional_data_rows]

        # Prepare response data
        response = {
            "last_head_data": last_head_data,
            "last_details_data": last_details_data
        }
        # If record found, return it
        return jsonify(response), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

#Insert Record and Gldger Effects of DebitcreditNote and DebitcreditNoteDetail
@app.route(API_URL + "/insert-debitcreditnote", methods=["POST"])
def insert_debitcreditnote():
    
    def get_max_doc_no(tran_type, company_code, year_code):
        return db.session.query(func.max(DebitCreditNoteHead.doc_no)).filter(
        DebitCreditNoteHead.tran_type == tran_type,
        DebitCreditNoteHead.Company_Code == company_code,
        DebitCreditNoteHead.Year_Code == year_code
    ).scalar() or 0

    def create_gledger_entry(data, amount, drcr, ac_code, accoid):
        return {
            "TRAN_TYPE": bill_type,
            "DOC_NO": new_doc_no,
            "DOC_DATE": data['doc_date'],
            "AC_CODE": ac_code,
            "AMOUNT": amount,
            "COMPANY_CODE": data['Company_Code'],
            "YEAR_CODE": data['Year_Code'],
            "ORDER_CODE": 12,
            "DRCR": drcr,
            "UNIT_Code": 0,
            "NARRATION": data['Narration'],
            "TENDER_ID": 0,
            "TENDER_ID_DETAIL": 0,
            "VOUCHER_ID": 0,
            "DRCR_HEAD": 0,
            "ADJUSTED_AMOUNT": 0,
            "Branch_Code": 1,
            "SORT_TYPE": bill_type,
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

        tran_type = headData.get('tran_type')
        company_code = headData.get('Company_Code')
        year_code = headData.get('Year_Code')
        bill_type = headData.get('bill_type')
      

        max_doc_no = get_max_doc_no(tran_type,company_code,year_code)
        new_doc_no = max_doc_no + 1
        print("doc_no+++++++",new_doc_no)
        headData['doc_no'] = new_doc_no
       

        new_head = DebitCreditNoteHead(**headData)
        db.session.add(new_head)

        createdDetails = []
        updatedDetails = []
        deletedDetailIds = []

        for item in detailData:
            item['doc_no'] = new_doc_no
            item['dcid'] = new_head.dcid

            if 'rowaction' in item:
                if item['rowaction'] == "add":
                    del item['rowaction']
                    new_detail = DebitCreditNoteDetail(**item)
                    new_head.details.append(new_detail)
                    createdDetails.append(new_detail)

                elif item['rowaction'] == "update":
                    dcdetailid = item['dcdetailid']
                    update_values = {k: v for k, v in item.items() if k not in ('dcdetailid', 'rowaction', 'dcid')}
                    db.session.query(DebitCreditNoteDetail).filter(DebitCreditNoteDetail.dcdetailid == dcdetailid).update(update_values)
                    updatedDetails.append(dcdetailid)

                elif item['rowaction'] == "delete":
                    dcdetailid = item['dcdetailid']
                    detail_to_delete = db.session.query(DebitCreditNoteDetail).filter(DebitCreditNoteDetail.dcdetailid == dcdetailid).one_or_none()
                    if detail_to_delete:
                        db.session.delete(detail_to_delete)
                        deletedDetailIds.append(dcdetailid)

        db.session.commit()

        igst_amount = float(headData.get('igst_amount', 0) or 0)
        bill_amount = float(headData.get('bill_amount', 0) or 0)
        sgst_amount = float(headData.get('sgst_amount', 0) or 0)
        cgst_amount = float(headData.get('cgst_amount', 0) or 0)
        TCS_Amt = float(headData.get('TCS_Amt', 0) or 0)
        TDS_Amt = float(headData.get('TDS_Amt', 0) or 0)

        if tran_type in ["DN", "DS"]:
            DRCR_detail = "C"
            DRCR_head = "D"
        elif tran_type in ["CN", "CS"]:
            DRCR_detail = "D"
            DRCR_head = "C"

        company_parameters = fetch_company_parameters(headData['Company_Code'], headData['Year_Code'])

        gledger_entries = []

        if igst_amount > 0:
            if tran_type in ["DN", "CN"]:
                ac_code = company_parameters.IGSTAc
                accoid = get_accoid(company_parameters.IGSTAc,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, igst_amount, DRCR_detail, ac_code, accoid)
            else:
                ac_code = company_parameters.PurchaseIGSTAc
                accoid = get_accoid(company_parameters.PurchaseIGSTAc,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, igst_amount, DRCR_head, ac_code, accoid)

        if cgst_amount > 0:
            if tran_type in ["DN", "CN"]:
                ac_code = company_parameters.CGSTAc
                accoid = get_accoid(company_parameters.CGSTAc,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, cgst_amount, DRCR_detail, ac_code, accoid)
            else:
                ac_code = company_parameters.PurchaseCGSTAc
                accoid = get_accoid(company_parameters.PurchaseCGSTAc,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, cgst_amount, DRCR_head, ac_code, accoid)

        if sgst_amount > 0:
            if tran_type in ["DN", "CN"]:
                ac_code = company_parameters.SGSTAc
                accoid = get_accoid(company_parameters.SGSTAc,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, sgst_amount, DRCR_detail, ac_code, accoid)
            else:
                ac_code = company_parameters.PurchaseSGSTAc
                accoid = get_accoid(company_parameters.PurchaseSGSTAc,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, sgst_amount, DRCR_head, ac_code, accoid)
        
        if TCS_Amt > 0:
            ac_code = headData['ac_code']
            accoid = get_accoid(ac_code,headData['Company_Code'])
            add_gledger_entry(gledger_entries, headData, TCS_Amt, 'D', ac_code, accoid)
            ac_code = company_parameters.SaleTCSAc
            accoid = get_accoid(ac_code,headData['Company_Code'])
            add_gledger_entry(gledger_entries, headData, TCS_Amt, 'C', ac_code, accoid)

        if TDS_Amt > 0:
            ac_code = headData['ac_code']
            accoid = get_accoid(ac_code,headData['Company_Code'])
            add_gledger_entry(gledger_entries, headData, TDS_Amt, 'C', ac_code, accoid)
            ac_code = company_parameters.SaleTDSAc
            accoid = get_accoid(ac_code,headData['Company_Code'])
            add_gledger_entry(gledger_entries, headData, TDS_Amt, 'D', ac_code, accoid)


        add_gledger_entry(gledger_entries, headData, bill_amount, DRCR_head, headData['ac_code'], get_accoid(headData['ac_code'],headData['Company_Code']))
    

        for item in detailData:
            detailLedger_entry = create_gledger_entry({
                "tran_type": bill_type,
                "doc_date": headData['doc_date'],
                "ac_code": item['expac_code'],
                "Company_Code": headData['Company_Code'],
                "Year_Code": headData['Year_Code'],
                "Narration": headData['Narration']
            }, float(item['value']), DRCR_detail, item['expac_code'], get_accoid(item['expac_code'],headData['Company_Code']))
            gledger_entries.append(detailLedger_entry)

        query_params = {
            'Company_Code': headData['Company_Code'],
            'DOC_NO': new_doc_no,
            'Year_Code': headData['Year_Code'],
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
            "head": task_head_schema.dump(new_head),
            "addedDetails": task_detail_schemas.dump(createdDetails),
            "updatedDetails": updatedDetails,
            "deletedDetailIds": deletedDetailIds
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
#Update Record and Gldger Effects of DebitcreditNote and DebitcreditNoteDetail
@app.route(API_URL + "/update-debitCreditnote", methods=["PUT"])
def update_debitCreditnote():

    def create_gledger_entry(data, amount, drcr, ac_code, accoid):
        return {
            "TRAN_TYPE": bill_type,
            "DOC_NO": updateddoc_no,
            "DOC_DATE": data['doc_date'],
            "AC_CODE": ac_code,
            "AMOUNT": amount,
            "COMPANY_CODE": data['Company_Code'],
            "YEAR_CODE": data['Year_Code'],
            "ORDER_CODE": 12,
            "DRCR": drcr,
            "UNIT_Code": 0,
            "NARRATION": data['Narration'],
            "TENDER_ID": 0,
            "TENDER_ID_DETAIL": 0,
            "VOUCHER_ID": 0,
            "DRCR_HEAD": 0,
            "ADJUSTED_AMOUNT": 0,
            "Branch_Code": 1,
            "SORT_TYPE": bill_type,
            "SORT_NO": updateddoc_no,
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
        # Retrieve 'tenderid' from URL parameters
        dcid = request.args.get('dcid')

        if dcid is None:
            return jsonify({"error": "Missing 'dcid' parameter"}), 400  
        data = request.get_json()
        headData = data['headData']
        detailData = data['detailData']

        tran_type = headData.get('tran_type')
        bill_type = headData.get('bill_type')
        

        # Update the head data
        updatedHeadCount = db.session.query(DebitCreditNoteHead).filter(DebitCreditNoteHead.dcid == dcid).update(headData)
        updated_debit_head = db.session.query(DebitCreditNoteHead).filter(DebitCreditNoteHead.dcid == dcid).one()
        updateddoc_no = updated_debit_head.doc_no
        print("updateddoc_no",updateddoc_no)

        createdDetails = []
        updatedDetails = []
        deletedDetailIds = []

        for item in detailData:
            item['dcid'] = updated_debit_head.dcid

            if 'rowaction' in item:
                if item['rowaction'] == "add":
                    del item['rowaction']
                    item['doc_no'] = updateddoc_no
                    new_detail = DebitCreditNoteDetail(**item)
                    updated_debit_head.details.append(new_detail)
                    createdDetails.append(new_detail)

                elif item['rowaction'] == "update":
                    dcdetailid = item['dcdetailid']
                    update_values = {k: v for k, v in item.items() if k not in ('dcdetailid', 'rowaction', 'dcid')}
                    db.session.query(DebitCreditNoteDetail).filter(DebitCreditNoteDetail.dcdetailid == dcdetailid).update(update_values)
                    updatedDetails.append(dcdetailid)

                elif item['rowaction'] == "delete":
                    dcdetailid = item['dcdetailid']
                    detail_to_delete = db.session.query(DebitCreditNoteDetail).filter(DebitCreditNoteDetail.dcdetailid == dcdetailid).one_or_none()
                    if detail_to_delete:
                        db.session.delete(detail_to_delete)
                        deletedDetailIds.append(dcdetailid)
                        

        db.session.commit()

        igst_amount = float(headData.get('igst_amount', 0) or 0)
        bill_amount = float(headData.get('bill_amount', 0) or 0)
        sgst_amount = float(headData.get('sgst_amount', 0) or 0)
        cgst_amount = float(headData.get('cgst_amount', 0) or 0)
        TCS_Amt = float(headData.get('TCS_Amt', 0) or 0)
        TDS_Amt = float(headData.get('TDS_Amt', 0) or 0)

        if tran_type in ["DN", "DS"]:
            DRCR_detail = "C"
            DRCR_head = "D"
        elif tran_type in ["CN", "CS"]:
            DRCR_detail = "D"
            DRCR_head = "C"
        else:
             # Default values if tran_type does not match any expected value
            DRCR_detail = "C"
            DRCR_head = "D"  # Adjust this default based on your business logic

        company_parameters = fetch_company_parameters(headData['Company_Code'], headData['Year_Code'])

        gledger_entries = []

        if igst_amount > 0:
            if tran_type in ["DN", "CN"]:
                ac_code = company_parameters.IGSTAc
                accoid = get_accoid(company_parameters.IGSTAc,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, igst_amount, DRCR_detail, ac_code, accoid)
            else:
                ac_code = company_parameters.PurchaseIGSTAc
                accoid = get_accoid(company_parameters.PurchaseIGSTAc,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, igst_amount, DRCR_head, ac_code, accoid)

        if cgst_amount > 0:
            if tran_type in ["DN", "CN"]:
                ac_code = company_parameters.CGSTAc
                accoid = get_accoid(company_parameters.CGSTAc,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, cgst_amount, DRCR_detail, ac_code, accoid)
            else:
                ac_code = company_parameters.PurchaseCGSTAc
                accoid = get_accoid(company_parameters.PurchaseCGSTAc,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, cgst_amount, DRCR_head, ac_code, accoid)

        if sgst_amount > 0:
            if tran_type in ["DN", "CN"]:
                ac_code = company_parameters.SGSTAc
                accoid = get_accoid(company_parameters.SGSTAc,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, sgst_amount, DRCR_detail, ac_code, accoid)
        
            else:
                ac_code = company_parameters.PurchaseSGSTAc
                accoid = get_accoid(company_parameters.PurchaseSGSTAc,headData['Company_Code'])
                add_gledger_entry(gledger_entries, headData, sgst_amount, DRCR_head, ac_code, accoid)
        
        if TCS_Amt > 0:
            ac_code = headData['ac_code']
            accoid = get_accoid(ac_code,headData['Company_Code'])
            add_gledger_entry(gledger_entries, headData, TCS_Amt, 'D', ac_code, accoid)
            ac_code = company_parameters.SaleTCSAc
            accoid = get_accoid(ac_code,headData['Company_Code'])
            add_gledger_entry(gledger_entries, headData, TCS_Amt, 'C', ac_code, accoid)


        if TDS_Amt > 0:
            ac_code = headData['ac_code']
            accoid = get_accoid(ac_code,headData['Company_Code'])
            add_gledger_entry(gledger_entries, headData, TDS_Amt, 'C', ac_code, accoid)
            ac_code = company_parameters.SaleTDSAc
            accoid = get_accoid(ac_code,headData['Company_Code'])
            add_gledger_entry(gledger_entries, headData, TDS_Amt, 'D', ac_code, accoid)


        add_gledger_entry(gledger_entries, headData, bill_amount, DRCR_head, headData['ac_code'], get_accoid(headData['ac_code'],headData['Company_Code']))
    
        print("item",item)
        for item in detailData:
            if 'expac_code' in item:
                detailLedger_entry = create_gledger_entry({
                    "tran_type": bill_type,
                    "doc_date": headData['doc_date'],
                    "ac_code": item['expac_code'],
                    "Company_Code": headData['Company_Code'],
                    "Year_Code": headData['Year_Code'],
                    "Narration": headData['Narration']
                }, float(item['value']), DRCR_detail, item['expac_code'], get_accoid(item['expac_code'],headData['Company_Code']))
                gledger_entries.append(detailLedger_entry)

        query_params = {
            'Company_Code': headData['Company_Code'],
            'DOC_NO': updateddoc_no,
            'Year_Code': headData['Year_Code'],
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
            "head": updatedHeadCount,
            "addedDetails": task_detail_schemas.dump(createdDetails),
            "updatedDetails": updatedDetails,
            "deletedDetailIds": deletedDetailIds
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


#Delete record from datatabse based Dcid and also delete that record GLeder Effects.  
@app.route(API_URL + "/delete_data_by_dcid", methods=["DELETE"])
def delete_data_by_dcid():
    try:
        dcid = request.args.get('dcid')
        Company_Code = request.args.get('Company_Code')
        doc_no = request.args.get('doc_no')
        Year_Code = request.args.get('Year_Code')
        tran_type = request.args.get('tran_type')

        # Check if the required parameters are provided
        if not all([dcid, Company_Code, doc_no, Year_Code, tran_type]):
            return jsonify({"error": "Missing required parameters"}), 400

        # Start a transaction
        with db.session.begin():
            # Delete records from DebitCreditNoteDetail table
            deleted_user_rows = DebitCreditNoteDetail.query.filter_by(dcid=dcid).delete()

            # Delete record from DebitCreditNoteHead table
            deleted_task_rows = DebitCreditNoteHead.query.filter_by(dcid=dcid).delete()

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


#Fetch the last Record on database by dcid
@app.route(API_URL + "/get-lastdebitcreditnotedata", methods=["GET"])
def get_lastdebitcreditnotedata():
    try:
        tran_type = request.args.get('tran_type')
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        if not tran_type:
            return jsonify({"error": "Transaction type is required"}), 400

        # Use SQLAlchemy to get the last record from the DebitCreditNoteHead table
        last_dcid_Head = DebitCreditNoteHead.query.filter_by(tran_type=tran_type,Company_Code=company_code,Year_Code=year_code).order_by(DebitCreditNoteHead.dcid.desc()).first()

        if not last_dcid_Head:
            return jsonify({"error": "No records found in dcid table"}), 404

        # Get the last dcid
        last_dcid = last_dcid_Head.dcid

        # Execute the additional SQL query
        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"dcid": last_dcid})
        additional_data_rows = additional_data.fetchall()

        # Extracting category name from additional_data
        row = additional_data_rows[0] if additional_data_rows else None
        category = row.BillToName if row else None

        # Convert last_dcid_Head to a dictionary
        last_head_data = {column.name: getattr(last_dcid_Head, column.name) for column in last_dcid_Head.__table__.columns}
        last_head_data.update(format_dates(last_dcid_Head))


        # Convert additional_data_rows to a list of dictionaries
        last_details_data = [dict(row._mapping) for row in additional_data_rows]

        # Prepare response data
        response = {
            "last_head_data": last_head_data,
            "last_details_data": last_details_data
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500



#Navigations API    
#Get First record from database 
@app.route(API_URL+"/get-firstdebitcredit-navigation", methods=["GET"])
def get_firstdebitcredit_navigation():
    try:
        tran_type = request.args.get('tran_type')
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        if not tran_type:
            return jsonify({"error": "Transaction type is required"}), 400
        # Use SQLAlchemy to get the first record from the Task table
        first_task = DebitCreditNoteHead.query.filter_by(tran_type=tran_type,Company_Code=company_code,Year_Code=year_code).order_by(DebitCreditNoteHead.dcid.asc()).first()

        if not first_task:
            return jsonify({"error": "No records found in Task_Entry table"}), 404

        # Get the Taskid of the first record
        first_taskid = first_task.dcid

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"dcid": first_taskid})

        # Extracting category name from additional_data
        additional_data_rows = additional_data.fetchall()
      
        # Extracting category name from additional_data
        row = additional_data_rows[0] if additional_data_rows else None
        category = row.BillToName if row else None

        # Convert last_dcid_Head to a dictionary
        last_head_data = {column.name: getattr(first_task, column.name) for column in first_task.__table__.columns}
        last_head_data.update(format_dates(first_task))


        # Convert additional_data_rows to a list of dictionaries
        last_details_data = [dict(row._mapping) for row in additional_data_rows]

        # Prepare response data
        response = {
            "last_head_data": last_head_data,
            "last_details_data": last_details_data
        }


        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


#Get last Record from Database
@app.route(API_URL+"/get-lastdebitcredit-navigation", methods=["GET"])
def get_lastdebitcredit_navigation():
    try:

        tran_type = request.args.get('tran_type')
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')

        if not tran_type:
            return jsonify({"error": "Transaction type is required"}), 400
    
        # Use SQLAlchemy to get the last record from the Task table
        last_task =  DebitCreditNoteHead.query.filter_by(tran_type=tran_type,Company_Code=company_code,Year_Code=year_code).order_by(DebitCreditNoteHead.doc_no.desc()).first()

        if not last_task:
            return jsonify({"error": "No records found in Task_Entry table"}), 404

        # Get the Taskid of the last record
        last_taskid = last_task.dcid

        # Additional SQL query execution
        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"dcid": last_taskid})

        # Extracting category name from additional_data
        additional_data_rows = additional_data.fetchall()
      
        # Extracting category name from additional_data
        row = additional_data_rows[0] if additional_data_rows else None
       

        # Convert last_dcid_Head to a dictionary
        last_head_data = {column.name: getattr(last_task, column.name) for column in last_task.__table__.columns}
        last_head_data.update(format_dates(last_task))


        # Convert additional_data_rows to a list of dictionaries
        last_details_data = [dict(row._mapping) for row in additional_data_rows]

        # Prepare response data
        response = {
            "last_head_data": last_head_data,
            "last_details_data": last_details_data
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
#Get Previous record by database 
@app.route(API_URL+"/get-previousDebitcreditnote-navigation", methods=["GET"])
def get_previousDebitcreditnote_navigation():
    try:
        tran_type = request.args.get('tran_type')
        current_task_no = request.args.get('doc_no')
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')

        if not tran_type:
            return jsonify({"error": "Transaction type is required"}), 400
        
        print("currentTaskNo", current_task_no)

        # Check if the Task_No is provided
        if not current_task_no:
            return jsonify({"error": "Current Task No is required"}), 400

        # Use SQLAlchemy to get the previous record from the Task table
        previous_task = DebitCreditNoteHead.query.filter_by(tran_type=tran_type,Company_Code=company_code,Year_Code=year_code).filter(DebitCreditNoteHead.doc_no < current_task_no).order_by(DebitCreditNoteHead.doc_no.desc()).first()
    
        
        if not previous_task:
            return jsonify({"error": "No previous records found"}), 404

        # Get the Task_No of the previous record
        previous_task_id = previous_task.dcid
        print("previous_task_id",previous_task_id)
        
        # Additional SQL query execution
        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"dcid": previous_task_id})
        
        # Fetch all rows from additional data
        additional_data_rows = additional_data.fetchall()
        
        # Extracting category name from additional_data
        row = additional_data_rows[0] if additional_data_rows else None
        # Convert last_dcid_Head to a dictionary
        last_head_data = {column.name: getattr(previous_task, column.name) for column in previous_task.__table__.columns}
        last_head_data.update(format_dates(previous_task))


        # Convert additional_data_rows to a list of dictionaries
        last_details_data = [dict(row._mapping) for row in additional_data_rows]

        # Prepare response data
        response = {
            "last_head_data": last_head_data,
            "last_details_data": last_details_data
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
#Get Next record by database 
@app.route(API_URL+"/get-nextdebitcreditnote-navigation", methods=["GET"])
def get_nextdebitcreditnote_navigation():
    try:
        tran_type = request.args.get('tran_type')
        current_task_no = request.args.get('doc_no')
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        
        # Check if the currentTaskNo is provided
        if not tran_type:
            return jsonify({"error": "Transaction Type is  required"}), 400

        # Use SQLAlchemy to get the next record from the Task table
        next_task = DebitCreditNoteHead.query.filter(DebitCreditNoteHead.doc_no > current_task_no).filter_by(tran_type=tran_type,Company_Code=company_code,Year_Code=year_code).order_by(DebitCreditNoteHead.doc_no.asc()).first()

        if not next_task:
            return jsonify({"error": "No next records found"}), 404

        # Get the Task_No of the next record
        next_task_id = next_task.dcid

        # Query to fetch System_Name_E from nt_1_systemmaster
        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"dcid": next_task_id})
        
        # Fetch all rows from additional data
        additional_data_rows = additional_data.fetchall()
        
        # Extracting category name from additional_data
        row = additional_data_rows[0] if additional_data_rows else None
        last_head_data = {column.name: getattr(next_task, column.name) for column in next_task.__table__.columns}
        last_head_data.update(format_dates(next_task))


        # Convert additional_data_rows to a list of dictionaries
        last_details_data = [dict(row._mapping) for row in additional_data_rows]

        # Prepare response data
        response = {
            "last_head_data": last_head_data,
            "last_details_data": last_details_data
        }
        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500