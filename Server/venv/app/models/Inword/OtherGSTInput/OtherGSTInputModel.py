from app import db
from datetime import datetime

class OtherGSTInput(db.Model):
    __tablename__ = 'other_input_gst'  

    Doc_No = db.Column(db.Integer)
    TRAN_TYPE = db.Column(db.String(2), nullable=False)
    Doc_Date = db.Column(db.Date, nullable=False)
    SGST_Amt = db.Column(db.Numeric(18, 2), nullable=False)
    CGST_Amt = db.Column(db.Numeric(18, 2), nullable=False)
    IGST_Amt = db.Column(db.Numeric(18, 2), nullable=False)
    Exps_Ac = db.Column(db.Integer, nullable=False)
    Narration = db.Column(db.String(250), nullable=False)
    Company_Code = db.Column(db.Integer, nullable=False)
    Created_By = db.Column(db.String(45), nullable=False)
    Modified_By = db.Column(db.String(45), nullable=False)
    Year_Code = db.Column(db.Integer, nullable=False)
    Oid = db.Column(db.Integer,primary_key=True) 
    Created_Date = db.Column(db.Date, nullable=False, default=datetime.now)
    Modified_Date = db.Column(db.Date, nullable=False)
    ea = db.Column(db.Integer, nullable=False)
