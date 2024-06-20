from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from app.models.Transactions.DebitCreditNote.DebitCreditNoteModels import DebitCreditNoteHead, DebitCreditNoteDetail  

class DebitCreditNoteHeadSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = DebitCreditNoteHead
        include_relationships = True

class DebitCreditNoteDetailSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = DebitCreditNoteDetail
        include_relationships = True
