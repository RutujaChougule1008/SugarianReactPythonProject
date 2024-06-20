# project_folder/app/schemas.py
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from app.models.Company.CompanyCreation.CompanyCreationModels import CompanyCreation


class CompanyCreationSchema(SQLAlchemyAutoSchema):
    
    class Meta:
        model = CompanyCreation
        


