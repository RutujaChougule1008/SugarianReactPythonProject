from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from app.models.Outward.SugarSaleReturnSale.SugarSaleReturnSaleModel import SugarSaleReturnSaleHead, SugarSaleReturnSaleDetail

class SugarSaleReturnSaleHeadSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = SugarSaleReturnSaleHead
        include_relationships = True

class SugarSaleReturnSaleDetailSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = SugarSaleReturnSaleDetail
        include_relationships = True
