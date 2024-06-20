from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from app.models.Outward.ServiceBill.ServiceBillModel import ServiceBillHead, ServiceBillDetail

class ServiceBillHeadSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = ServiceBillHead
        include_relationships = True

class ServiceBillDetailSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = ServiceBillDetail
        include_relationships = True
