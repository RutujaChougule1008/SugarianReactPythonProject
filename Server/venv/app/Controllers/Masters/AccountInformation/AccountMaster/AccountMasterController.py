from flask import Flask, jsonify, request
from app import app, db
from sqlalchemy import text, func
from sqlalchemy.exc import SQLAlchemyError
import os

from app.models.Masters.AccountInformation.AccountMaster.AccountMasterModel import AccountMaster, AccountContact
from app.models.Masters.AccountInformation.AccountMaster.AccountMasterSchema import AccountMasterSchema, AccountContactSchema

API_URL = os.getenv('API_URL')

account_master_schema = AccountMasterSchema()
account_master_schemas = AccountMasterSchema(many=True)

account_contact_schema = AccountContactSchema()
account_contact_schemas = AccountContactSchema(many=True)

ACCOUNT_CONTACT_DETAILS_QUERY = '''
SELECT dbo.nt_1_accountmaster.City_Code, dbo.nt_1_accountmaster.cityid, dbo.nt_1_accountmaster.Group_Code, dbo.nt_1_accountmaster.bsid, city.city_code AS citycode, city.city_name_e AS cityname, city.cityid AS city_id, 
                  dbo.nt_1_bsgroupmaster.group_Code AS groupcode, dbo.nt_1_bsgroupmaster.group_Name_E AS groupcodename, dbo.nt_1_bsgroupmaster.bsid AS groupid, dbo.nt_1_accountmaster.Commission, dbo.nt_1_accontacts.*
FROM     dbo.nt_1_accountmaster INNER JOIN
                  dbo.nt_1_accontacts ON dbo.nt_1_accountmaster.accoid = dbo.nt_1_accontacts.accoid AND dbo.nt_1_accountmaster.company_code = dbo.nt_1_accontacts.Company_Code AND 
                  dbo.nt_1_accountmaster.Ac_Code = dbo.nt_1_accontacts.Ac_Code LEFT OUTER JOIN
                  dbo.nt_1_bsgroupmaster ON dbo.nt_1_accountmaster.bsid = dbo.nt_1_bsgroupmaster.bsid LEFT OUTER JOIN
                  dbo.nt_1_citymaster AS city ON dbo.nt_1_accountmaster.cityid = city.cityid
WHERE dbo.nt_1_accountmaster.accoid = :accoid
'''

# Get data from both tables AccountMaster and AccountContact
@app.route(API_URL + "/getdata-accountmaster", methods=["GET"])
def getdata_accountmaster():
    try:
        master_data = AccountMaster.query.all()
        contact_data = AccountContact.query.all()
        # Serialize the data using schemas
        master_result = account_master_schemas.dump(master_data)
        contact_result = account_contact_schemas.dump(contact_data)
        response = {
            "AccountMaster": master_result,
            "AccountContact": contact_result
        }

        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Get data by the particular Ac_Code
@app.route(API_URL + "/getaccountmasterByid", methods=["GET"])
def getaccountmasterByid():
    try:
        # Extract Ac_Code from request query parameters
        ac_code = request.args.get('Ac_Code')
        company_code = request.args.get('Company_Code')
        if not all([company_code, ac_code]):
            return jsonify({"error": "Missing required parameters"}), 400

        account_master = AccountMaster.query.filter_by(Ac_Code=ac_code, company_code=company_code).first()
        if not account_master:
            return jsonify({"error": "No records found"}), 404
        
        newtaccoid = account_master.accoid

        additional_data = db.session.execute(text(ACCOUNT_CONTACT_DETAILS_QUERY), {"accoid": newtaccoid})
        additional_data_rows = additional_data.fetchall()

        row = additional_data_rows[0] if additional_data_rows else None
        cityname = row.cityname if row else None
        groupcodename = row.groupcodename if row else None


        response = {
            "AccountMaster": {
                **{column.name: getattr(account_master, column.name) for column in account_master.__table__.columns},
                "cityname" : cityname,
                "groupcodename" : groupcodename,
            },
            "AccountContacts": [{"PersonId": row.PersonId,"Ac_Code": row.Ac_Code, "Person_Name": row.Person_Name, "Person_Mobile": row.Person_Mobile, "Person_Email": row.Person_Email,"Person_Pan": row.Person_Pan,"Other":row.Other,"accoid":row.accoid,"id":row.id} for row in additional_data_rows]
        }

        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Insert record for AccountMaster and AccountContact
@app.route(API_URL + "/insert-accountmaster", methods=["POST"])
def insert_accountmaster():
    try:
        data = request.get_json()
        master_data = data['master_data']
        contact_data = data['contact_data']

        # Set Ac_Code to max + 1
        max_ac_code = db.session.query(func.max(AccountMaster.Ac_Code)).scalar() or 0
        master_data['Ac_Code'] = max_ac_code + 1

        new_master = AccountMaster(**master_data)
        db.session.add(new_master)

        createdDetails = []
        updatedDetails = []
        deletedDetailIds = []

        max_person_id = db.session.query(func.max(AccountContact.PersonId)).scalar() or 0
        for item in contact_data:
            item['Ac_Code'] = new_master.Ac_Code
            item['accoid'] = new_master.accoid  

            if 'rowaction' in item:
                if item['rowaction'] == "add":
                    del item['rowaction']
                    item['PersonId'] = max_person_id + 1
                    new_contact = AccountContact(**item)
                    new_master.contacts.append(new_contact)
                    createdDetails.append(new_contact)

                elif item['rowaction'] == "update":
                    id = item['id']
                    update_values = {k: v for k, v in item.items() if k not in ('id', 'rowaction', 'accoid')}
                    db.session.query(AccountContact).filter(AccountContact.id == id).update(update_values)
                    updatedDetails.append(id)

                elif item['rowaction'] == "delete":
                    id = item['id']
                    contact_to_delete = db.session.query(AccountContact).filter(AccountContact.id == id).one_or_none()
                    if contact_to_delete:
                        db.session.delete(contact_to_delete)
                        deletedDetailIds.append(id)

        db.session.commit()

        return jsonify({
            "message": "Data inserted successfully",
            "AccountMaster": account_master_schema.dump(new_master),
            "AccountContacts": account_contact_schemas.dump(contact_data),
            "updatedDetails": updatedDetails,
            "deletedDetailIds": deletedDetailIds
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Update record for AccountMaster and AccountContact
@app.route(API_URL + "/update-accountmaster", methods=["PUT"])
def update_accountmaster():
    try:
        accoid = request.args.get('accoid')
        if not accoid:
            return jsonify({"error": "Missing 'accoid' parameter"}), 400

        data = request.get_json()
        master_data = data['master_data']
        contact_data = data['contact_data']

        # Update the AccountMaster
        AccountMaster.query.filter_by(accoid=accoid).update(master_data)
        updatedHeadCount = db.session.query(AccountMaster).filter(AccountMaster.accoid == accoid).update(master_data)
        updated_account_master = db.session.query(AccountMaster).filter(AccountMaster.accoid == accoid).one()
        updatedAcCode = updated_account_master.Ac_Code

        # Process AccountContact updates
        created_contacts = []
        updated_contacts = []
        deleted_contact_ids = []

        for item in contact_data:
            if 'rowaction' in item:
                if item['rowaction'] == "add":
                    del item['rowaction']
                    item['Ac_Code'] = updatedAcCode
                    max_person_id = db.session.query(func.max(AccountContact.PersonId)).scalar() or 0
                    item['PersonId'] = max_person_id + 1
                    item['accoid'] = accoid
                    new_contact = AccountContact(**item)
                    db.session.add(new_contact)
                    created_contacts.append(new_contact)


                elif item['rowaction'] == "update":
                    id = item['id']
                    update_values = {k: v for k, v in item.items() if k not in ('id', 'rowaction', 'accoid')}
                    AccountContact.query.filter_by(id=id).update(update_values)
                    updated_contacts.append(id)


                elif item['rowaction'] == "delete":
                    id = item['id']
                    contact_to_delete = AccountContact.query.filter_by(id=id).one_or_none()
                    if contact_to_delete:
                        db.session.delete(contact_to_delete)
                        deleted_contact_ids.append(id)

        db.session.commit()

        return jsonify({
            "message": "Data updated successfully",
            "created_contacts": account_contact_schemas.dump(created_contacts),
            "updated_contacts": updated_contacts,
            "deleted_contact_ids": deleted_contact_ids
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Delete record from database based on Ac_Code
@app.route(API_URL + "/delete_accountmaster", methods=["DELETE"])
def delete_accountmaster():
    try:
        accoid = request.args.get('accoid')
        if not accoid:
            return jsonify({"error": "Missing 'accoid' parameter"}), 400

        with db.session.begin():
            deleted_contact_rows = AccountContact.query.filter_by(accoid=accoid).delete()
            deleted_master_rows = AccountMaster.query.filter_by(accoid=accoid).delete()

        db.session.commit()

        return jsonify({
            "message": f"Deleted {deleted_master_rows} master row(s) and {deleted_contact_rows} contact row(s) successfully"
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Fetch the last record from the database by Ac_Code
@app.route(API_URL + "/get-lastaccountmaster", methods=["GET"])
def get_lastaccountmaster():
    try:
        company_code = request.args.get('Company_Code')
        if company_code is None:
            return jsonify({"error": "Missing 'company_code' parameter"}), 400

        last_account_master = AccountMaster.query.filter_by(company_code=company_code).order_by(AccountMaster.accoid.desc()).first()
        if not last_account_master:
            return jsonify({"error": "No records found in AccountMaster table"}), 404

        last_accoid = last_account_master.accoid
        additional_data = db.session.execute(text(ACCOUNT_CONTACT_DETAILS_QUERY), {"accoid": last_accoid})
        additional_data_rows = additional_data.fetchall()

        row = additional_data_rows[0] if additional_data_rows else None
        cityname = row.cityname if row else None
        groupcodename = row.groupcodename if row else None

        response = {
            "AccountMaster": {
                **{column.name: getattr(last_account_master, column.name) for column in last_account_master.__table__.columns},
                "cityname" : cityname,
                "groupcodename" : groupcodename,
            },
            "AccountContacts": [{"PersonId": row.PersonId,"Ac_Code": row.Ac_Code, "Person_Name": row.Person_Name, "Person_Mobile": row.Person_Mobile, "Person_Email": row.Person_Email,"Person_Pan": row.Person_Pan,"Other":row.Other,"accoid":row.accoid,"id":row.id} for row in additional_data_rows]
        }

        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Get first record from the database
@app.route(API_URL + "/get-firstaccountmaster", methods=["GET"])
def get_firstaccountmaster():
    try:
        company_code = request.args.get('Company_Code')
        if company_code is None:
            return jsonify({"error": "Missing 'company_code' parameter"}), 400
        
        first_account_master = AccountMaster.query.filter_by(company_code=company_code).order_by(AccountMaster.accoid.asc()).first()
        if not first_account_master:
            return jsonify({"error": "No records found in AccountMaster table"}), 404

        first_accoid = first_account_master.accoid
        additional_data = db.session.execute(text(ACCOUNT_CONTACT_DETAILS_QUERY), {"accoid": first_accoid})
        additional_data_rows = additional_data.fetchall()

        row = additional_data_rows[0] if additional_data_rows else None
        cityname = row.cityname if row else None
        groupcodename = row.groupcodename if row else None

        response = {
            "AccountMaster": {
                **{column.name: getattr(first_account_master, column.name) for column in first_account_master.__table__.columns},
                "cityname" : cityname,
                "groupcodename" : groupcodename,
            },
            "AccountContacts": [{"PersonId": row.PersonId,"Ac_Code": row.Ac_Code, "Person_Name": row.Person_Name, "Person_Mobile": row.Person_Mobile, "Person_Email": row.Person_Email,"Person_Pan": row.Person_Pan,"Other":row.Other,"accoid":row.accoid,"id":row.id} for row in additional_data_rows]
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Get previous record from the database
@app.route(API_URL + "/get-previousaccountmaster", methods=["GET"])
def get_previousaccountmaster():
    try:
        current_ac_code = request.args.get('currentAcCode')
        company_code = request.args.get('Company_Code')
        if not all([company_code, current_ac_code]):
            return jsonify({"error": "Missing required parameters"}), 400

        previous_account_master = AccountMaster.query.filter(AccountMaster.Ac_Code < current_ac_code).filter_by(company_code=company_code).order_by(AccountMaster.Ac_Code.desc()).first()
        if not previous_account_master:
            return jsonify({"error": "No previous records found"}), 404

        previous_accoid = previous_account_master.accoid
        additional_data = db.session.execute(text(ACCOUNT_CONTACT_DETAILS_QUERY), {"accoid": previous_accoid})
        additional_data_rows = additional_data.fetchall()

        row = additional_data_rows[0] if additional_data_rows else None
        cityname = row.cityname if row else None
        groupcodename = row.groupcodename if row else None

        response = {
            "AccountMaster": {
                **{column.name: getattr(previous_account_master, column.name) for column in previous_account_master.__table__.columns},
                "cityname" : cityname,
                "groupcodename" : groupcodename,
            },
            "AccountContacts": [{"PersonId": row.PersonId,"Ac_Code": row.Ac_Code, "Person_Name": row.Person_Name, "Person_Mobile": row.Person_Mobile, "Person_Email": row.Person_Email,"Person_Pan": row.Person_Pan,"Other":row.Other,"accoid":row.accoid,"id":row.id} for row in additional_data_rows]
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

# Get next record from the database
@app.route(API_URL + "/get-nextaccountmaster", methods=["GET"])
def get_nextaccountmaster():
    try:
        current_ac_code = request.args.get('currentAcCode')
        company_code = request.args.get('Company_Code')
        if not all([company_code, current_ac_code]):
            return jsonify({"error": "Missing required parameters"}), 400

        next_account_master = AccountMaster.query.filter(AccountMaster.Ac_Code > current_ac_code).filter_by(company_code=company_code).order_by(AccountMaster.Ac_Code.asc()).first()
        if not next_account_master:
            return jsonify({"error": "No next records found"}), 404

        next_accoid = next_account_master.accoid
        additional_data = db.session.execute(text(ACCOUNT_CONTACT_DETAILS_QUERY), {"accoid": next_accoid})
        additional_data_rows = additional_data.fetchall()

        row = additional_data_rows[0] if additional_data_rows else None
        cityname = row.cityname if row else None
        groupcodename = row.groupcodename if row else None

        response = {
            "AccountMaster": {
                **{column.name: getattr(next_account_master, column.name) for column in next_account_master.__table__.columns},
                "cityname" : cityname,
                "groupcodename" : groupcodename,
            },
            "AccountContacts": [{"PersonId": row.PersonId,"Ac_Code": row.Ac_Code, "Person_Name": row.Person_Name, "Person_Mobile": row.Person_Mobile, "Person_Email": row.Person_Email,"Person_Pan": row.Person_Pan,"Other":row.Other,"accoid":row.accoid,"id":row.id} for row in additional_data_rows]
        }


        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
