from flask import Flask, jsonify, request
from app import app, db
from sqlalchemy import text, func
from sqlalchemy.exc import SQLAlchemyError
import os

from app.models.Outward.SugarSaleReturnSale.SugarSaleReturnSaleModel import SugarSaleReturnSaleHead,SugarSaleReturnSaleDetail
from app.models.Outward.SugarSaleReturnSale.SugarSaleReturnSaleSchema import SugarSaleReturnSaleHeadSchema, SugarSaleReturnSaleDetailSchema

API_URL = os.getenv('API_URL')

from app.utils.CommonGLedgerFunctions import fetch_company_parameters,get_accoid,getSaleAc
import requests

SUGAR_SALE_RETURN_DETAILS_QUERY = '''
SELECT accode.Ac_Code AS partyaccode, accode.Ac_Name_E AS partyname, accode.accoid AS partyacid, mill.Ac_Code AS millaccode, mill.Ac_Name_E AS millname, mill.accoid AS millacid, unit.Ac_Code AS unitaccode, 
                  unit.Ac_Name_E AS unitname, broker.Ac_Code AS brokeraccode, broker.Ac_Name_E AS brokername, unit.accoid AS unitacid, broker.accoid AS brokeracid, item.systemid, item.System_Code, item.System_Name_E AS itemname, 
                  dbo.nt_1_gstratemaster.Doc_no AS gstdocno, dbo.nt_1_gstratemaster.Rate AS gstrate, dbo.nt_1_gstratemaster.gstid AS gstdocid, transport.Ac_Code AS transportaccode, transport.Ac_Name_E AS transportname, 
                  billto.Ac_Code AS billtoaccode, billto.Ac_Name_E AS billtoname, billto.accoid AS billtoacid, transport.accoid AS transportacid, dbo.nt_1_sugarsalereturn.Ac_Code, dbo.nt_1_sugarsalereturn.Unit_Code, dbo.nt_1_sugarsalereturn.mill_code, 
                  dbo.nt_1_sugarsalereturn.BROKER, dbo.nt_1_sugarsalereturn.Transport_Code, dbo.nt_1_sugarsalereturn.ac, dbo.nt_1_sugarsalereturn.uc, dbo.nt_1_sugarsalereturn.mc, dbo.nt_1_sugarsalereturn.bc, dbo.nt_1_sugarsalereturn.bill_to, 
                  dbo.nt_1_sugarsalereturn.bt, dbo.nt_1_sugarsalereturn.gc, dbo.nt_1_sugarsalereturn.tc, dbo.nt_1_sugarsalereturn.FromAc, dbo.nt_1_sugarsalereturn.fa, dbo.nt_1_sugarsalereturn.gstid, fromac.Ac_Code AS fromaccode, 
                  fromac.Ac_Name_E AS fromacname, fromac.accoid AS fromacid, dbo.nt_1_sugarsaledetailsreturn.*
FROM     dbo.nt_1_accountmaster AS accode RIGHT OUTER JOIN
                  dbo.nt_1_accountmaster AS unit RIGHT OUTER JOIN
                  dbo.nt_1_accountmaster AS fromac RIGHT OUTER JOIN
                  dbo.nt_1_accountmaster AS transport RIGHT OUTER JOIN
                  dbo.nt_1_sugarsalereturn ON transport.accoid = dbo.nt_1_sugarsalereturn.tc ON fromac.accoid = dbo.nt_1_sugarsalereturn.fa LEFT OUTER JOIN
                  dbo.nt_1_accountmaster AS billto ON dbo.nt_1_sugarsalereturn.bt = billto.accoid LEFT OUTER JOIN
                  dbo.nt_1_accountmaster AS broker ON dbo.nt_1_sugarsalereturn.bc = broker.accoid LEFT OUTER JOIN
                  dbo.nt_1_accountmaster AS mill ON dbo.nt_1_sugarsalereturn.mc = mill.accoid ON unit.accoid = dbo.nt_1_sugarsalereturn.uc ON accode.accoid = dbo.nt_1_sugarsalereturn.ac LEFT OUTER JOIN
                  dbo.nt_1_sugarsaledetailsreturn LEFT OUTER JOIN
                  dbo.nt_1_systemmaster AS item ON dbo.nt_1_sugarsaledetailsreturn.ic = item.systemid ON dbo.nt_1_sugarsalereturn.srid = dbo.nt_1_sugarsaledetailsreturn.srid LEFT OUTER JOIN
                  dbo.nt_1_gstratemaster ON dbo.nt_1_sugarsalereturn.gstid = dbo.nt_1_gstratemaster.gstid
WHERE  (item.System_Type = 'I') and dbo.nt_1_sugarsalereturn.srid = :srid


'''

sugar_sale_return_head_schema = SugarSaleReturnSaleHeadSchema()
sugar_sale_return_head_schemas = SugarSaleReturnSaleHeadSchema(many=True)

sugar_sale_return_detail_schema = SugarSaleReturnSaleDetailSchema()
sugar_sale_return_detail_schemas = SugarSaleReturnSaleDetailSchema(many=True)

def format_dates(task):
    return {
        "doc_date": task.doc_date.strftime('%Y-%m-%d') if task.doc_date else None,
    }

# Get data from both tables SugarSaleReturnHead and SugarSaleReturnDetail
@app.route(API_URL + "/getdata-sugarsalereturn", methods=["GET"])
def getdata_sugarsalereturn():
    try:
        head_data = SugarSaleReturnSaleHead.query.all()
        detail_data = SugarSaleReturnSaleDetail.query.all()
        # Serialize the data using schemas
        head_result = sugar_sale_return_head_schemas.dump(head_data)
        detail_result = sugar_sale_return_detail_schemas.dump(detail_data)
        response = {
            "SugarSaleReturn_Head": head_result,
            "SugarSaleReturn_Detail": detail_result
        }

        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Get data by the particular doc_no
@app.route(API_URL + "/getsugarsalereturnByid", methods=["GET"])
def getsugarsalereturnByid():
    try:
        # Extract doc_no from request query parameters
        doc_no = request.args.get('doc_no')
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        if not all([company_code, year_code, doc_no]):
            return jsonify({"error": "Missing required parameters"}), 400


        sugar_sale_return_head = SugarSaleReturnSaleHead.query.filter_by(doc_no=doc_no, Company_Code=company_code, Year_Code = year_code).first()
        if not sugar_sale_return_head:
            return jsonify({"error": "No records found"}), 404

        srid = sugar_sale_return_head.srid
        additional_data = db.session.execute(text(SUGAR_SALE_RETURN_DETAILS_QUERY), {"srid": srid})
        additional_data_rows = additional_data.fetchall()

        row = additional_data_rows[0] if additional_data_rows else None
        partyName = row.partyname if row else None
        millName = row.millname if row else None
        unitName = row.unitname if row else None
        brokerName = row.brokername if row else None
        itemName = row.itemname if row else None
        gstrateName = row.gstrate if row else None
        transportName = row.transportname if row else None
        billtoName = row.billtoname if row else None
        fromacName = row.fromacname if row else None





        response = {
            "sugar_sale_return_head": {
                **{column.name: getattr(sugar_sale_return_head, column.name) for column in sugar_sale_return_head.__table__.columns},
                **format_dates(sugar_sale_return_head),
                "partyName":partyName,
                "millName":millName,
                "unitName":unitName,
                "brokerName":brokerName,
                "itemName":itemName,
                "gstrateName":gstrateName,
                "transportName":transportName,
                "billtoName":billtoName,
                "fromacName":fromacName
                
            },
            "sugar_sale_return_details": [{
                "doc_no" : row.doc_no,
                "detail_id": row.detail_id,
                "Tran_Type": row.Tran_Type,
                "item_code": row.item_code,
                "narration": row.narration,
                "Quantal": row.Quantal,
                "packing": row.packing,
                "bags": row.bags,
                "rate": row.rate,
                "item_Amount": row.item_Amount,
                "Company_Code": row.Company_Code,
                "Year_Code": row.Year_Code,
                "Branch_Code": row.Branch_Code,
                "Created_By": row.Created_By,
                "Modified_By": row.Modified_By,
                "srid": row.srid,
                "srdtid": row.srdtid,
                "ic": row.ic
            } for row in additional_data_rows]
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Insert record for SugarSaleReturnHead and SugarSaleReturnDetail
@app.route(API_URL + "/insert-sugarsalereturn", methods=["POST"])
def insert_sugarsalereturn():
    def get_max_doc_no(tran_type):
        return db.session.query(func.max(SugarSaleReturnSaleHead.doc_no)).filter(SugarSaleReturnSaleHead.Tran_Type == tran_type).scalar() or 0
    

    def create_gledger_entry(data, amount, drcr, ac_code, accoid):
        return {
            "TRAN_TYPE": tran_type,
            "DOC_NO": new_doc_no,
            "DOC_DATE": data['doc_date'],
            "AC_CODE": ac_code,
            "AMOUNT": amount,
            "COMPANY_CODE": data['Company_Code'],
            "YEAR_CODE": data['Year_Code'],
            "ORDER_CODE": 12,
            "DRCR": drcr,
            "UNIT_Code": 0,
            "NARRATION": "As Per BillNo: " + str(data['doc_no']),
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

        tran_type = head_data.get('Tran_Type')
        if not tran_type:
            return jsonify({"error": "Bad Request", "message": "tran_type  is required"}), 400

        max_doc_no = get_max_doc_no(tran_type)

        # Increment the doc_no for the new entry
        new_doc_no = max_doc_no + 1
        head_data['doc_no'] = new_doc_no

        

        new_head = SugarSaleReturnSaleHead(**head_data)
        db.session.add(new_head)

        created_details = []
        updated_details = []
        deleted_detail_ids = []

        for item in detail_data:
            item['doc_no'] = new_doc_no
            item['Tran_Type'] = tran_type
            item['srid'] = new_head.srid
            if 'rowaction' in item and item['rowaction'] == "add":
                del item['rowaction']
                new_detail = SugarSaleReturnSaleDetail(**item)
                new_head.details.append(new_detail)
                created_details.append(new_detail)

            elif 'rowaction' in item and item['rowaction'] == "update":
                srdtid = item['srdtid']
                update_values = {k: v for k, v in item.items() if k not in ('srdtid', 'rowaction', 'srid')}
                db.session.query(SugarSaleReturnSaleDetail).filter(SugarSaleReturnSaleDetail.srdtid == srdtid).update(update_values)
                updated_details.append(srdtid)

            elif 'rowaction' in item and item['rowaction'] == "delete":
                srdtid = item['srdtid']
                detail_to_delete = db.session.query(SugarSaleReturnSaleDetail).filter(SugarSaleReturnSaleDetail.srdtid == srdtid).one_or_none()
                if detail_to_delete:
                    db.session.delete(detail_to_delete)
                    deleted_detail_ids.append(srdtid)

        db.session.commit()

        igst_amount = float(head_data.get('IGSTAmount', 0) or 0)
        bill_amount = float(head_data.get('Bill_Amount', 0) or 0)
        sgst_amount = float(head_data.get('SGSTAmount', 0) or 0)
        cgst_amount = float(head_data.get('CGSTAmount', 0) or 0)
        TCS_Amt = float(head_data.get('TCS_Amt', 0) or 0)
        TDS_Amt = float(head_data.get('TDS_Amt', 0) or 0)
        Other_Amt = float(head_data.get('OTHER_Amt',0) or 0)
    

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
            ac_code = head_data['FromAc']
            accoid = get_accoid(ac_code,head_data['Company_Code'])
            add_gledger_entry(gledger_entries, head_data, TCS_Amt, 'C', ac_code, accoid)
            ac_code = company_parameters.SaleTCSAc
            accoid = get_accoid(ac_code,head_data['Company_Code'])
            add_gledger_entry(gledger_entries, head_data, TCS_Amt, 'D', ac_code, accoid)

        if TDS_Amt > 0:
            ac_code = head_data['FromAc']
            accoid = get_accoid(ac_code,head_data['Company_Code'])
            add_gledger_entry(gledger_entries, head_data, TDS_Amt, 'D', ac_code, accoid)
            ac_code = company_parameters.SaleTDSAc
            accoid = get_accoid(ac_code,head_data['Company_Code'])
            add_gledger_entry(gledger_entries, head_data, TDS_Amt, 'C', ac_code, accoid)

        if Other_Amt > 0:
            ac_code = company_parameters.OtherAmountAc
            accoid = get_accoid(ac_code, head_data['Company_Code'])
            add_gledger_entry(gledger_entries, head_data, Other_Amt, 'C', ac_code, accoid)
        else:
            add_gledger_entry(gledger_entries, head_data, Other_Amt, 'D', ac_code, accoid) 



        add_gledger_entry(gledger_entries, head_data, bill_amount, "D", head_data['FromAc'], get_accoid(head_data['FromAc'],head_data['Company_Code']))

        for item in detail_data:
            Item_amount = float(item.get('item_Amount', 0) or 0)
            ic = item['ic']

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
            "head": sugar_sale_return_head_schema.dump(new_head),
            "addedDetails": sugar_sale_return_detail_schemas.dump(created_details),
            "updatedDetails": updated_details,
            "deletedDetailIds": deleted_detail_ids
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Update record for SugarSaleReturnHead and SugarSaleReturnDetail
@app.route(API_URL + "/update-sugarsalereturn", methods=["PUT"])
def update_sugarsalereturn():
    
    def create_gledger_entry(data, amount, drcr, ac_code, accoid):
        return {
            "TRAN_TYPE": tran_type,
            "DOC_NO": updated_head.doc_no,
            "DOC_DATE": data['doc_date'],
            "AC_CODE": ac_code,
            "AMOUNT": amount,
            "COMPANY_CODE": data['Company_Code'],
            "YEAR_CODE": data['Year_Code'],
            "ORDER_CODE": 12,
            "DRCR": drcr,
            "UNIT_Code": 0,
            "NARRATION": "As Per BillNo: " + str(data['doc_no']),
           "TENDER_ID": 0,
            "TENDER_ID_DETAIL": 0,
            "VOUCHER_ID": 0,
            "DRCR_HEAD": 0,
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

    def add_gledger_entry(entries, data, amount, drcr, ac_code, accoid):
        if amount > 0:
            entries.append(create_gledger_entry(data, amount, drcr, ac_code, accoid))
    try:
        srid = request.args.get('srid')
        if not srid :
            return jsonify({"error": "Missing 'srid' parameter"}), 400 

        data = request.get_json()
        head_data = data['head_data']
        detail_data = data['detail_data']

        tran_type = head_data.get('Tran_Type')
        if not tran_type :
            return jsonify({"error": "Bad Request", "message": "tran_type is required"}), 400

        # Update the head data
        updated_head_count = db.session.query(SugarSaleReturnSaleHead).filter(SugarSaleReturnSaleHead.srid == srid).update(head_data)
        updated_head = SugarSaleReturnSaleHead.query.filter_by(srid=srid).first()

        created_details = []
        updated_details = []
        deleted_detail_ids = []

        for item in detail_data:
            item['srid'] = updated_head.srid
            item['Tran_Type'] = tran_type

            if 'rowaction' in item:
                if item['rowaction'] == "add":
                    del item['rowaction']
                    item['doc_no'] = updated_head.doc_no
                    new_detail = SugarSaleReturnSaleDetail(**item)
                    db.session.add(new_detail)
                    created_details.append(new_detail)

                elif item['rowaction'] == "update":
                    srdtid = item['srdtid']
                    update_values = {k: v for k, v in item.items() if k not in ('srdtid', 'rowaction', 'srid')}
                    db.session.query(SugarSaleReturnSaleDetail).filter(SugarSaleReturnSaleDetail.srdtid == srdtid).update(update_values)
                    updated_details.append(srdtid)

                elif item['rowaction'] == "delete":
                    srdtid = item['srdtid']
                    detail_to_delete = db.session.query(SugarSaleReturnSaleDetail).filter(SugarSaleReturnSaleDetail.srdtid == srdtid).one_or_none()
                    if detail_to_delete:
                        db.session.delete(detail_to_delete)
                        deleted_detail_ids.append(srdtid)

        db.session.commit()

        igst_amount = float(head_data.get('IGSTAmount', 0) or 0)
        bill_amount = float(head_data.get('Bill_Amount', 0) or 0)
        sgst_amount = float(head_data.get('SGSTAmount', 0) or 0)
        cgst_amount = float(head_data.get('CGSTAmount', 0) or 0)
        TCS_Amt = float(head_data.get('TCS_Amt', 0) or 0)
        TDS_Amt = float(head_data.get('TDS_Amt', 0) or 0)
        Other_Amt = float(head_data.get('OTHER_Amt',0) or 0)
    

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
            ac_code = head_data['FromAc']
            accoid = get_accoid(ac_code,head_data['Company_Code'])
            add_gledger_entry(gledger_entries, head_data, TCS_Amt, 'C', ac_code, accoid)
            ac_code = company_parameters.SaleTCSAc
            accoid = get_accoid(ac_code,head_data['Company_Code'])
            add_gledger_entry(gledger_entries, head_data, TCS_Amt, 'D', ac_code, accoid)

        if TDS_Amt > 0:
            ac_code = head_data['FromAc']
            accoid = get_accoid(ac_code,head_data['Company_Code'])
            add_gledger_entry(gledger_entries, head_data, TDS_Amt, 'D', ac_code, accoid)
            ac_code = company_parameters.SaleTDSAc
            accoid = get_accoid(ac_code,head_data['Company_Code'])
            add_gledger_entry(gledger_entries, head_data, TDS_Amt, 'C', ac_code, accoid)

        if Other_Amt > 0:
            ac_code = company_parameters.OtherAmountAc
            accoid = get_accoid(ac_code, head_data['Company_Code'])
            add_gledger_entry(gledger_entries, head_data, Other_Amt, 'C', ac_code, accoid)
        else:
            add_gledger_entry(gledger_entries, head_data, Other_Amt, 'D', ac_code, accoid) 



        add_gledger_entry(gledger_entries, head_data, bill_amount, "D", head_data['FromAc'], get_accoid(head_data['FromAc'],head_data['Company_Code']))

        for item in detail_data:
            Item_amount = float(item.get('item_Amount', 0) or 0)
            ic = item.get('ic')

            if Item_amount>0:
                ac_code = getSaleAc(ic)
                add_gledger_entry(gledger_entries, head_data, Item_amount, 'C', ac_code, get_accoid(ac_code,head_data['Company_Code'])) 
                
        query_params = {
            'Company_Code': head_data['Company_Code'],
            'DOC_NO': updated_head.doc_no,
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
            "head": updated_head_count,
            "created_details": sugar_sale_return_detail_schemas.dump(created_details),
            "updated_details": updated_details,
            "deleted_detail_ids": deleted_detail_ids
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Delete record from database based on srid
@app.route(API_URL + "/delete_data_by_srid", methods=["DELETE"])
def delete_data_by_srid():
    try:
        srid = request.args.get('srid')
        Company_Code = request.args.get('Company_Code')
        doc_no = request.args.get('doc_no')
        Year_Code = request.args.get('Year_Code')
        tran_type = request.args.get('Tran_Type')

        # Check if the required parameters are provided
        if not all([srid, Company_Code, doc_no, Year_Code, tran_type]):
            return jsonify({"error": "Missing required parameters"}), 400
        

        # Start a transaction
        with db.session.begin():
            # Delete records from SugarSaleReturnDetail table
            deleted_detail_rows = SugarSaleReturnSaleDetail.query.filter_by(srid=srid).delete()

            # Delete record from SugarSaleReturnHead table
            deleted_head_rows = SugarSaleReturnSaleHead.query.filter_by(srid=srid).delete()

        if deleted_detail_rows > 0 and deleted_head_rows > 0:
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

        db.session.commit()

        return jsonify({
            "message": f"Deleted {deleted_head_rows} head row(s) and {deleted_detail_rows} detail row(s) successfully"
        }), 200

    except Exception as e:
        # Roll back the transaction if any error occurs
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Fetch the last record from the database by srid
@app.route(API_URL + "/get-last-sugarsalereturn", methods=["GET"])
def get_last_sugarsalereturn():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        if not all([company_code, year_code]):
            return jsonify({"error": "Missing required parameters"}), 400

        last_sugar_sale_return_head = SugarSaleReturnSaleHead.query.order_by(SugarSaleReturnSaleHead.srid.desc()).filter_by(Company_Code=company_code,Year_Code = year_code).first()
        if not last_sugar_sale_return_head:
            return jsonify({"error": "No records found in SugarSaleReturnHead table"}), 404

        srid = last_sugar_sale_return_head.srid
        additional_data = db.session.execute(text(SUGAR_SALE_RETURN_DETAILS_QUERY), {"srid": srid})
        additional_data_rows = additional_data.fetchall()

        row = additional_data_rows[0] if additional_data_rows else None
        partyName = row.partyname if row else None
        millName = row.millname if row else None
        unitName = row.unitname if row else None
        brokerName = row.brokername if row else None
        itemName = row.itemname if row else None
        gstrateName = row.gstrate if row else None
        transportName = row.transportname if row else None
        billtoName = row.billtoname if row else None
        fromacName = row.fromacname if row else None

        last_head_data = {
            **{column.name: getattr(last_sugar_sale_return_head, column.name) for column in last_sugar_sale_return_head.__table__.columns},
            **format_dates(last_sugar_sale_return_head),
            "partyName":partyName,
            "millName":millName,
            "unitName":unitName,
            "brokerName":brokerName,
            "itemName":itemName,
            "gstrateName":gstrateName,
            "transportName":transportName,
            "billtoName":billtoName,
            "fromacName":fromacName
        }

        last_details_data = [{"doc_no": row.doc_no, "detail_id": row.detail_id, "Tran_Type": row.Tran_Type, "item_code": row.item_code, "narration": row.narration, "Quantal": row.Quantal, "packing": row.packing, "bags": row.bags, "rate": row.rate, "item_Amount": row.item_Amount, "Company_Code": row.Company_Code, "Year_Code": row.Year_Code, "Branch_Code": row.Branch_Code, "Created_By": row.Created_By, "Modified_By": row.Modified_By, "srid": row.srid, "srdtid": row.srdtid, "ic": row.ic} for row in additional_data_rows]

        response = {
            "last_head_data": last_head_data,
            "last_details_data": last_details_data
        }

        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Get first record from the database
@app.route(API_URL + "/get-first-sugarsalereturn", methods=["GET"])
def get_first_sugarsalereturn():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        if not all([company_code, year_code]):
            return jsonify({"error": "Missing required parameters"}), 400

        first_sugar_sale_return_head = SugarSaleReturnSaleHead.query.order_by(SugarSaleReturnSaleHead.srid.asc()).filter_by(Company_Code=company_code,Year_Code=year_code).first()
        if not first_sugar_sale_return_head:
            return jsonify({"error": "No records found in SugarSaleReturnHead table"}), 404

        srid = first_sugar_sale_return_head.srid
        additional_data = db.session.execute(text(SUGAR_SALE_RETURN_DETAILS_QUERY), {"srid": srid})
        additional_data_rows = additional_data.fetchall()

        row = additional_data_rows[0] if additional_data_rows else None
        partyName = row.partyname if row else None
        millName = row.millname if row else None
        unitName = row.unitname if row else None
        brokerName = row.brokername if row else None
        itemName = row.itemname if row else None
        gstrateName = row.gstrate if row else None
        transportName = row.transportname if row else None
        billtoName = row.billtoname if row else None
        fromacName = row.fromacname if row else None

        first_head_data = {
            **{column.name: getattr(first_sugar_sale_return_head, column.name) for column in first_sugar_sale_return_head.__table__.columns},
            **format_dates(first_sugar_sale_return_head),
            "partyName":partyName,
            "millName":millName,
            "unitName":unitName,
            "brokerName":brokerName,
            "itemName":itemName,
            "gstrateName":gstrateName,
            "transportName":transportName,
            "billtoName":billtoName,
            "fromacName":fromacName
        }

        first_details_data = [{"doc_no": row.doc_no, "detail_id": row.detail_id, "Tran_Type": row.Tran_Type, "item_code": row.item_code, "narration": row.narration, "Quantal": row.Quantal, "packing": row.packing, "bags": row.bags, "rate": row.rate, "item_Amount": row.item_Amount, "Company_Code": row.Company_Code, "Year_Code": row.Year_Code, "Branch_Code": row.Branch_Code, "Created_By": row.Created_By, "Modified_By": row.Modified_By, "srid": row.srid, "srdtid": row.srdtid, "ic": row.ic} for row in additional_data_rows]

        response = {
            "first_head_data": first_head_data,
            "first_details_data": first_details_data
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Get previous record from the database
@app.route(API_URL + "/get-previous-sugarsalereturn", methods=["GET"])
def get_previous_sugarsalereturn():
    try:
        current_doc_no = request.args.get('currentDocNo')
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        if not all([company_code, year_code, current_doc_no]):
            return jsonify({"error": "Missing required parameters"}), 400

        previous_sugar_sale_return_head = SugarSaleReturnSaleHead.query.filter(SugarSaleReturnSaleHead.doc_no < current_doc_no).filter_by(Company_Code=company_code,Year_Code = year_code).order_by(SugarSaleReturnSaleHead.doc_no.desc()).first()
        if not previous_sugar_sale_return_head:
            return jsonify({"error": "No previous records found"}), 404

        srid = previous_sugar_sale_return_head.srid
        additional_data = db.session.execute(text(SUGAR_SALE_RETURN_DETAILS_QUERY), {"srid": srid})
        additional_data_rows = additional_data.fetchall()

        row = additional_data_rows[0] if additional_data_rows else None
        partyName = row.partyname if row else None
        millName = row.millname if row else None
        unitName = row.unitname if row else None
        brokerName = row.brokername if row else None
        itemName = row.itemname if row else None
        gstrateName = row.gstrate if row else None
        transportName = row.transportname if row else None
        billtoName = row.billtoname if row else None
        fromacName = row.fromacname if row else None

        previous_head_data = {
            **{column.name: getattr(previous_sugar_sale_return_head, column.name) for column in previous_sugar_sale_return_head.__table__.columns},
            **format_dates(previous_sugar_sale_return_head),
            "partyName":partyName,
            "millName":millName,
            "unitName":unitName,
            "brokerName":brokerName,
            "itemName":itemName,
            "gstrateName":gstrateName,
            "transportName":transportName,
            "billtoName":billtoName,
            "fromacName":fromacName
        }

        previous_details_data = [{"doc_no": row.doc_no, "detail_id": row.detail_id, "Tran_Type": row.Tran_Type, "item_code": row.item_code, "narration": row.narration, "Quantal": row.Quantal, "packing": row.packing, "bags": row.bags, "rate": row.rate, "item_Amount": row.item_Amount, "Company_Code": row.Company_Code, "Year_Code": row.Year_Code, "Branch_Code": row.Branch_Code, "Created_By": row.Created_By, "Modified_By": row.Modified_By, "srid": row.srid, "srdtid": row.srdtid, "ic": row.ic} for row in additional_data_rows]

        response = {
            "previous_head_data": previous_head_data,
            "previous_details_data": previous_details_data
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Get next record from the database
@app.route(API_URL + "/get-next-sugarsalereturn", methods=["GET"])
def get_next_sugarsalereturn():
    try:
        current_doc_no = request.args.get('currentDocNo')
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        if not all([company_code, year_code, current_doc_no]):
            return jsonify({"error": "Missing required parameters"}), 400

        next_sugar_sale_return_head = SugarSaleReturnSaleHead.query.filter(SugarSaleReturnSaleHead.doc_no > current_doc_no).filter_by(Company_Code=company_code, Year_Code = year_code).order_by(SugarSaleReturnSaleHead.doc_no.asc()).first()
        if not next_sugar_sale_return_head:
            return jsonify({"error": "No next records found"}), 404

        srid = next_sugar_sale_return_head.srid
        additional_data = db.session.execute(text(SUGAR_SALE_RETURN_DETAILS_QUERY), {"srid": srid})
        additional_data_rows = additional_data.fetchall()

        row = additional_data_rows[0] if additional_data_rows else None
        partyName = row.partyname if row else None
        millName = row.millname if row else None
        unitName = row.unitname if row else None
        brokerName = row.brokername if row else None
        itemName = row.itemname if row else None
        gstrateName = row.gstrate if row else None
        transportName = row.transportname if row else None
        billtoName = row.billtoname if row else None
        fromacName = row.fromacname if row else None

        next_head_data = {
            **{column.name: getattr(next_sugar_sale_return_head, column.name) for column in next_sugar_sale_return_head.__table__.columns},
            **format_dates(next_sugar_sale_return_head),
            "partyName":partyName,
            "millName":millName,
            "unitName":unitName,
            "brokerName":brokerName,
            "itemName":itemName,
            "gstrateName":gstrateName,
            "transportName":transportName,
            "billtoName":billtoName,
            "fromacName":fromacName
        }

        next_details_data = [{"doc_no": row.doc_no, "detail_id": row.detail_id, "Tran_Type": row.Tran_Type, "item_code": row.item_code, "narration": row.narration, "Quantal": row.Quantal, "packing": row.packing, "bags": row.bags, "rate": row.rate, "item_Amount": row.item_Amount, "Company_Code": row.Company_Code, "Year_Code": row.Year_Code, "Branch_Code": row.Branch_Code, "Created_By": row.Created_By, "Modified_By": row.Modified_By, "srid": row.srid, "srdtid": row.srdtid, "ic": row.ic} for row in additional_data_rows]

        response = {
            "next_head_data": next_head_data,
            "next_details_data": next_details_data
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
