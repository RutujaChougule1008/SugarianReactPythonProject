from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from app.models.BusinessReleted.CorporateSale.CorporateSaleModel import CorporateSaleHead,CorporateSaleDetail

class CorporateSaleHeadSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = CorporateSaleHead
        include_relationships = True

class CorporateSaleDetailSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = CorporateSaleDetail
        include_relationships = True
