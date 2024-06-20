from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from app.models.Transactions.ReceiptPayment.ReceiptPaymentModels import ReceiptPaymentHead, ReceiptPaymentDetail

class ReceiptPaymentHeadSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = ReceiptPaymentHead
        include_relationships = True

class ReceiptPaymentDetailSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = ReceiptPaymentDetail
        include_relationships = True
