# project_folder/app/routes/tender_routes.py
from flask import Flask, jsonify, request
from app import app, db
from app.models.BusinessReleted.TenderPurchase.TenderPurchaseModels import TenderHead, TenderDetails 
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError 
import os
API_URL = os.getenv('API_URL')
# Import schemas from the schemas module
from app.models.BusinessReleted.TenderPurchase.TenserPurchaseSchema import TenderHeadSchema, TenderDetailsSchema

# Global SQL Query
TASK_DETAILS_QUERY = '''
  SELECT        Mill.Ac_Name_E AS MillName, dbo.nt_1_tender.Mill_Code, dbo.nt_1_tender.mc, dbo.nt_1_tender.ic, dbo.nt_1_tender.itemcode, dbo.qrymstitem.System_Name_E AS ItemName, dbo.nt_1_tender.Bp_Account, dbo.nt_1_tender.bp, 
                         BPAccount.Ac_Name_E AS BPAcName, dbo.nt_1_tender.Payment_To, dbo.nt_1_tender.pt, PaymentTo.Ac_Name_E AS PaymentToAcName, dbo.nt_1_tender.Tender_From, dbo.nt_1_tender.tf, 
                         TenderFrom.Ac_Name_E AS TenderFromAcName, dbo.nt_1_tender.Tender_DO, dbo.nt_1_tender.td, TenderDo.Ac_Name_E AS TenderDoAcName, dbo.nt_1_tender.Voucher_By, dbo.nt_1_tender.vb, 
                         VoucherBy.Ac_Name_E AS VoucherByAcName, dbo.nt_1_tender.Broker, dbo.nt_1_tender.bk, Broker.Ac_Code AS BrokerAcName, dbo.nt_1_tender.gstratecode, dbo.nt_1_gstratemaster.GST_Name, 
                         dbo.nt_1_gstratemaster.Rate AS GSTRate, dbo.qrytenderdetail.*
FROM            dbo.nt_1_tender LEFT OUTER JOIN
                         dbo.qrytenderdetail ON dbo.nt_1_tender.tenderid = dbo.qrytenderdetail.tenderid LEFT OUTER JOIN
                         dbo.nt_1_gstratemaster ON dbo.nt_1_tender.Company_Code = dbo.nt_1_gstratemaster.Company_Code AND dbo.nt_1_tender.gstratecode = dbo.nt_1_gstratemaster.Doc_no LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS Broker ON dbo.nt_1_tender.bk = Broker.accoid LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS VoucherBy ON dbo.nt_1_tender.vb = VoucherBy.accoid LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS TenderDo ON dbo.nt_1_tender.td = TenderDo.accoid LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS TenderFrom ON dbo.nt_1_tender.tf = TenderFrom.accoid LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS PaymentTo ON dbo.nt_1_tender.pt = PaymentTo.accoid LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS BPAccount ON dbo.nt_1_tender.bp = BPAccount.accoid LEFT OUTER JOIN
                         dbo.qrymstitem ON dbo.nt_1_tender.ic = dbo.qrymstitem.systemid LEFT OUTER JOIN
                         dbo.qrymstaccountmaster AS Mill ON dbo.nt_1_tender.mc = Mill.accoid
						 where  dbo.nt_1_tender.tenderid=:tenderid
'''

#date Format Function
def format_dates(task):
    return {
        "Lifting_Date": task.Lifting_Date.strftime('%Y-%m-%d') if task.Lifting_Date else None,
         "Tender_Date": task.Tender_Date.strftime('%Y-%m-%d') if task.Tender_Date else None,
        #  "Sauda_Date": task.Sauda_Date.strftime('%Y-%m-%d') if task.Sauda_Date else None,
        #  "payment_date": task.payment_date.strftime('%Y-%m-%d') if task.payment_date else None,
    }

# Define schemas
tender_head_schema = TenderHeadSchema()
tender_head_schemas = TenderHeadSchema(many=True)

tender_detail_schema = TenderDetailsSchema()
tender_detail_schemas = TenderDetailsSchema(many=True)

# Get data from both tables TenderHead and Tenderdetails
@app.route(API_URL+"/get-tenderdataall", methods=["GET"])
def get_Tenderdataall():
    try:
        # Query both tables and get the data
        tenderhead_data = TenderHead.query.all()
        tenderdetails_data = TenderDetails.query.all()
        # Serialize the data using schemas
        HeadData = tender_head_schema.dump(tenderhead_data)
        Detaildata = tender_detail_schemas.dump(tenderdetails_data)
        response = {
            "HeadData": HeadData,
            "Detaildata": Detaildata
        }
        return jsonify(response), 200
    except Exception as e:
        # Handle any potential exceptions and return an error response with a 500 Internal Server Error status code
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
#Get data for Utility
@app.route(API_URL+"/all_tender_data", methods=["GET"])
def all_tender_data():
    try:

        # Get the query parameters
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')

        # Validate the query parameters
        if not company_code or not year_code:
            return jsonify({"error": "Bad request", "message": "Missing company_code or year_code parameter"}), 400

        sql_query = """
            SELECT ROW_NUMBER() OVER (ORDER BY Tender_No DESC) AS RowNumber,
                   Tender_No,
                   Tender_DateConverted AS Tender_Date,
                   millshortname,
                   Quantal,
                   Grade,
                   Mill_Rate,
                   paymenttoname,
                   tenderdoname,
                   season,
                   brokershortname,
                   Lifting_DateConverted AS Lifting_Date,
                   tenderid,
                   Mill_Code
            FROM qrytenderhead
            WHERE Company_Code = :company_code AND Year_Code = :year_code
            ORDER BY Tender_No DESC
        """

        # Execute the SQL query with the provided parameters
        result = db.session.execute(text(sql_query), {'company_code': company_code, 'year_code': year_code})

        # Fetch all rows and convert each row to a dictionary
        columns = result.keys()
        response = [dict(zip(columns, row)) for row in result]

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
# # We have to get the data By the Particular Task No...
@app.route(API_URL+'/getTenderByTenderNo', methods=["GET"])
def get_task_by_task_no():
    try:
        # Extract taskNo from request query parameters
        Tender_No = request.args.get('Tender_No')
        if not Tender_No:
            return jsonify({"error": "Task number not provided"}), 400

        # Use SQLAlchemy to find the record by Task_No
        task_head = TenderHead.query.filter_by(Tender_No=Tender_No).first()
        newtenderid = task_head.tenderid
        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"tenderid": newtenderid})

        # Fetching additional data and converting to a list of dictionaries
        additional_data_rows = [row._asdict() for row in additional_data.fetchall()]
   
        response = {
            "last_tender_head_data": {
                **{column.name: getattr(task_head, column.name) for column in task_head.__table__.columns},
                  **format_dates(task_head), 
            },
            "last_tender_details_data": additional_data_rows
        }
        # If record found, return it
        return jsonify(response), 200
    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# #Insert the record in both the table also perform the oprtation add,update,delete..
@app.route(API_URL+"/insert_tender_head_detail", methods=["POST"])
def insert_tender_head_detail():
    try:
        data = request.get_json()
        headData = data['headData']
        detailData = data['detailData']
        try:
            maxTender_No = db.session.query(db.func.max(TenderHead.Tender_No)).scalar() or 0
            newTenderNo = maxTender_No + 1
            # Update Task_No in headData
            headData['Tender_No'] = newTenderNo

            new_head = TenderHead(**headData)
            db.session.add(new_head)

            createdDetails = []
            updatedDetails = []
            deletedDetailIds = []

            max_detail_id = db.session.query(db.func.max(TenderDetails.ID)).filter_by(tenderid=newTenderNo).scalar() or 0

            for index, item in enumerate(detailData, start=1):
    
               if 'rowaction' in item:
                    if item['rowaction'] == "add":
                        item['ID'] = max_detail_id + index
                        item['Tender_No'] = newTenderNo
                        del item['rowaction']
                        new_detail = TenderDetails(**item)
                        new_head.details.append(new_detail)
                        createdDetails.append(new_detail)

                    elif item['rowaction'] == "update":
                        tenderdetailid = item['tenderdetailid']
                        update_values = {k: v for k, v in item.items() if k not in ('tenderdetailid', 'tenderid')}
                        del update_values['rowaction']  # Remove 'rowaction' field
                        db.session.query(TenderDetails).filter(TenderDetails.tenderdetailid == tenderdetailid).update(update_values)
                        updatedDetails.append(tenderdetailid)

                    elif item['rowaction'] == "delete":
                        tenderdetailid = item['tenderdetailid']
                        detail_to_delete = db.session.query(TenderDetails).filter(TenderDetails.tenderdetailid == tenderdetailid).one_or_none()
        
                        if detail_to_delete:
                            db.session.delete(detail_to_delete)
                            deletedDetailIds.append(tenderdetailid)

            db.session.commit()

            return jsonify({
                "message": "Data Inserted successfully",
                "head": tender_head_schema.dump(new_head),
                "addedDetails": [tender_detail_schema.dump(detail) for detail in createdDetails],
                "updatedDetails": updatedDetails,
                "deletedDetailIds": deletedDetailIds
            }), 201  # 201 Created

        except Exception as e:
            db.session.rollback()
            print(e)
            return jsonify({"error": "Internal server error", "message": str(e)}), 500  

    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500  
    

# #Update the record in both the table also perform the oprtation add,update,delete in detail section..
@app.route(API_URL+"/update_tender_purchase", methods=["PUT"])
def update_tender_purchase():
    try:
        # Retrieve 'tenderid' from URL parameters
        tenderid = request.args.get('tenderid')
        if tenderid is None:
            return jsonify({"error": "Missing 'tenderid' parameter"}), 400  
        data = request.get_json()
        headData = data['headData']
        detailData = data['detailData']

        try:
            transaction = db.session.begin_nested()
            # Update the head data
            updatedHeadCount = db.session.query(TenderHead).filter(TenderHead.tenderid == tenderid).update(headData)
            
            createdDetails = []
            updatedDetails = []
            deletedDetailIds = []

            updated_tender_head = db.session.query(TenderHead).filter(TenderHead.tenderid == tenderid).one()
            tender_no = updated_tender_head.Tender_No

            for item in detailData:
                if item['rowaction'] == "add":
                    item['Tender_No'] = tender_no
                    item['tenderid'] = tenderid
                    # Generate new ID if not provided
                    if 'ID' not in item:
                        max_detail_id = db.session.query(db.func.max(TenderDetails.ID)).filter_by(tenderid=tenderid).scalar() or 0
                        new_detail_id = max_detail_id + 1
                        item['ID'] = new_detail_id
                    del item['rowaction'] 
                    new_detail = TenderDetails(**item)
                    db.session.add(new_detail) 
                    createdDetails.append(item)

                elif item['rowaction'] == "update":
                    item['Tender_No'] = tender_no
                    item['tenderid'] = tenderid
                    tenderdetailid = item['tenderdetailid']
                    update_values = {k: v for k, v in item.items() if k not in ('tenderdetailid', 'tenderid')}
                    del update_values['rowaction'] 
                    db.session.query(TenderDetails).filter(TenderDetails.tenderdetailid == tenderdetailid).update(update_values)
                    updatedDetails.append(tenderdetailid)

                elif item['rowaction'] == "delete":
                    tenderdetailid = item['tenderdetailid']
                    detail_to_delete = db.session.query(TenderDetails).filter(TenderDetails.tenderdetailid == tenderdetailid).one_or_none()
    
                    if detail_to_delete:
                        db.session.delete(detail_to_delete)
                        deletedDetailIds.append(tenderdetailid)

            db.session.commit()

            # Serialize the createdDetails
            serialized_created_details = createdDetails 

            return jsonify({
                "message": "Data Updated successfully",
                "updatedHeadCount": updatedHeadCount,
                "addedDetails": serialized_created_details,
                "updatedDetails": updatedDetails,
                "deletedDetailIds": deletedDetailIds
            }), 200 

        except Exception as e:
            db.session.rollback()
            return jsonify({"error": "Internal server error", "message": str(e)}), 500 

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500  

# #Delete record from datatabse based tenderid  
@app.route(API_URL+"/delete_TenderBytenderid", methods=["DELETE"])
def delete_TenderBytenderid():
    try:
        tenderid = request.args.get('tenderid')

        # Start a transaction
        with db.session.begin():
            # Delete records from User table
            deleted_user_rows = TenderDetails.query.filter_by(tenderid=tenderid).delete()

            # Delete record from Task table
            deleted_task_rows = TenderHead.query.filter_by(tenderid=tenderid).delete()

        # Commit the transaction
        db.session.commit()

        return jsonify({
            "message": f"Deleted {deleted_task_rows} Task row(s) and {deleted_user_rows} User row(s) successfully"
        }), 200

    except Exception as e:
        # Roll back the transaction if any error occurs
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


# #Fetch the last Record on database by Tender No
@app.route(API_URL+"/get_last_tender_no_data", methods=["GET"])
def get_last_tender_no_data():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')

        if not company_code:
            return jsonify({"error": "Company_Code and Year_Code query parameter is required"}), 400
        
        # Use SQLAlchemy to get the last record from the Task table
        last_tender_head = TenderHead.query.filter_by(Company_Code=company_code,Year_Code=year_code).order_by(TenderHead.tenderid.desc()).first()

        if not last_tender_head:
            return jsonify({"error": "No records found in last_tender_head table"}), 404

        # Get the last Taskid
        last_tenderid = last_tender_head.tenderid

        # Execute the additional SQL query
        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"tenderid": last_tenderid})
     
        # Fetching additional data and converting to a list of dictionaries
        additional_data_rows = [row._asdict() for row in additional_data.fetchall()]
    
        # Prepare the response data
        last_tender_head_data = {
            **{column.name: getattr(last_tender_head, column.name) for column in last_tender_head.__table__.columns},
            **format_dates(last_tender_head), 
        }

        last_tender_details_data = additional_data_rows
        response = {
            "last_tender_head_data": last_tender_head_data,
            "last_tender_details_data": last_tender_details_data
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
# #Get First record from database in navigation...
@app.route(API_URL+"/getfirsttender_record_navigation", methods=["GET"])
def get_first_record_navigation():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')

        if not company_code:
            return jsonify({"error": "Company_Code and Year_Code query parameter is required"}), 400
        
        # Use SQLAlchemy to get the first record from the Task table
        first_task = TenderHead.query.filter_by(Company_Code=company_code,Year_Code=year_code).order_by(TenderHead.tenderid.asc()).first()

        if not first_task:
            return jsonify({"error": "No records found in Task_Entry table"}), 404

        # Get the Taskid of the first record
        first_taskid = first_task.tenderid

        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"tenderid": first_taskid})

        # Fetching additional data and converting to a list of dictionaries
        additional_data_rows = [row._asdict() for row in additional_data.fetchall()]
       
        # Prepare response data
        response = {
            "first_tender_head_data": {
                **{column.name: getattr(first_task, column.name) for column in first_task.__table__.columns},
                **format_dates(first_task), 
            },
            "first_tender_details_data": additional_data_rows
        }

        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


# #Get last Record from Database in navigation 
@app.route(API_URL+"/getlasttender_record_navigation", methods=["GET"])
def get_last_record_navigation():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')

        if not company_code:
            return jsonify({"error": "Company_Code and Year_Code query parameter is required"}), 400
        
        # Use SQLAlchemy to get the last record from the Task table
        last_task = TenderHead.query.filter_by(Company_Code=company_code,Year_Code=year_code).order_by(TenderHead.tenderid.desc()).first()

        if not last_task:
            return jsonify({"error": "No records found in Task_Entry table"}), 404

        # Get the Taskid of the last record
        last_taskid = last_task.tenderid

        # Additional SQL query execution
        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"tenderid": last_taskid})

        # Extracting category name from additional_data
        additional_data_rows = [row._asdict() for row in additional_data.fetchall()]
      
        # Prepare response data
        response = {
            "last_tender_head_data": {
                **{column.name: getattr(last_task, column.name) for column in last_task.__table__.columns},
                **format_dates(last_task),
            },
            "last_tender_details_data": additional_data_rows
        }

        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
# #Get Previous record by database 
@app.route(API_URL+"/getprevioustender_navigation", methods=["GET"])
def get_previous_task_navigation():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        current_task_no = request.args.get('CurrenttenderNo')

        if not company_code:
            return jsonify({"error": "Company_Code and Year_Code query parameter is required"}), 400
        
        # Check if the Task_No is provided
        if not current_task_no:
            return jsonify({"error": "Current Task No is required"}), 400

        # Use SQLAlchemy to get the previous record from the Task table
        previous_task = TenderHead.query.filter(
            TenderHead.Tender_No < current_task_no,
            TenderHead.Company_Code == company_code,
            TenderHead.Year_Code == year_code
        ).order_by(TenderHead.Tender_No.desc()).first()
    
        if not previous_task:
            return jsonify({"error": "No previous records found"}), 404

        # Get the Task_No of the previous record
        previous_task_id = previous_task.tenderid
        # Additional SQL query execution
        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"tenderid": previous_task_id})
        # Fetch all rows from additional data
        additional_data_rows = [row._asdict() for row in additional_data.fetchall()]
        # Prepare response data
        response = {
            "previous_tender_head_data": {
                **{column.name: getattr(previous_task, column.name) for column in previous_task.__table__.columns},
                **format_dates(previous_task), 
            },
            "previous_tender_details_data":additional_data_rows
        }

        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    
# #Get Next record by database 
@app.route(API_URL+"/getnexttender_navigation", methods=["GET"])
def get_next_task_navigation():
    try:
        company_code = request.args.get('Company_Code')
        year_code = request.args.get('Year_Code')
        current_task_no = request.args.get('CurrenttenderNo')

        if not company_code:
            return jsonify({"error": "Company_Code and Year_Code query parameter is required"}), 400
        
        # Check if the currentTaskNo is provided
        if not current_task_no:
            return jsonify({"error": "Current Tender No required"}), 400

        # Use SQLAlchemy to get the next record from the Task table
        next_task = TenderHead.query.filter(TenderHead.Tender_No > current_task_no,TenderHead.Company_Code == company_code,
            TenderHead.Year_Code == year_code).order_by(TenderHead.Tender_No.asc()).first()

        if not next_task:
            return jsonify({"error": "No next records found"}), 404

        # Get the Task_No of the next record
        next_task_id = next_task.tenderid

        # Query to fetch System_Name_E from nt_1_systemmaster
        additional_data = db.session.execute(text(TASK_DETAILS_QUERY), {"tenderid": next_task_id})
        
        # Fetch all rows from additional data
        additional_data_rows = [row._asdict() for row in additional_data.fetchall()]
        
        # Prepare response data
        response = {
            "next_tender_head_data": {
                **{column.name: getattr(next_task, column.name) for column in next_task.__table__.columns},
                **format_dates(next_task)
            },
            "next_tender_details_data": additional_data_rows
        }
        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500