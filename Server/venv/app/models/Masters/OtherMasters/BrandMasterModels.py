from app import db
from datetime import datetime

class BrandMaster(db.Model):
    __tablename__ = 'Brand_Master'
    Code = db.Column(db.Numeric(18, 0),nullable=False,primary_key=True)
    Marka = db.Column(db.String(500),nullable=True)
    English_Name = db.Column(db.String(500),nullable=True)
    Mal_Code = db.Column(db.Numeric(18,0),nullable=True)
    Aarambhi_Nag = db.Column(db.Numeric(18,0),nullable=True)
    Nagache_Vajan = db.Column(db.Numeric(18,2),nullable=True)
    Type = db.Column(db.String(500),nullable=True)
    Company_Code = db.Column(db.Integer,nullable=False)
    Created_By = db.Column(db.String(50),nullable=True)
    Modified_By = db.Column(db.String(50),nullable=True)
    Created_Date = db.Column(db.Date, nullable=True, default=datetime.now)
    Modified_Date = db.Column(db.Date,nullable=True)
    Wt_Per = db.Column(db.Numeric(18,2),nullable=True)

