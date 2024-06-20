from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from app.models.Inword.PurchaseBill.PurchaseBillModels import SugarPurchase,SugarPurchaseDetail  

class SugarPurchaseHeadSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = SugarPurchase
        include_relationships = True

class SugarPurchaseDetailSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = SugarPurchaseDetail
        include_relationships = True
