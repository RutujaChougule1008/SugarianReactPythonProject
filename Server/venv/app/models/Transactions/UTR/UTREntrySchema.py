from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from app.models.Transactions.UTR.UTREntryModels import UTRHead,UTRDetail

class UTRHeadSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = UTRHead
        include_relationships = True

class UTRDetailSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = UTRDetail
        include_relationships = True
