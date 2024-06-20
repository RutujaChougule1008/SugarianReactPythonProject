from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from app.models.Outword.SaleBill.SaleBillModels import SaleBillHead,SaleBillDetail

class SaleBillHeadSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = SaleBillHead
        include_relationships = True

class SaleBillDetailSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = SaleBillDetail
        include_relationships = True
