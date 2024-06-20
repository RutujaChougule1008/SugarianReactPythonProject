from flask import jsonify, request
from app import app
from app.models.Company.CompanyCreation.CompanyCreationModels import CompanyCreation
from app.models.Company.CompanyCreation.CompanyCreationSchemas import CompanyCreationSchema

# API route to get all data from the company table

@app.route("/get_company_data", methods=["GET"])
def get_all_companies():

    try:
        companies = CompanyCreation.query.all()
        serialized_companies = [CompanyCreationSchema.dump(company) for company in companies]
        return jsonify(serialized_companies), 200
    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
    

