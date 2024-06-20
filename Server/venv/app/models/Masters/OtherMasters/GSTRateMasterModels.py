from app import db

class GSTRateMaster(db.Model):
    __tablename__ = 'nt_1_gstratemaster'
    Doc_no = db.Column(db.Integer)
    GST_Name = db.Column(db.String(255),nullable=True)
    Rate = db.Column(db.Numeric(18,2),nullable=True)
    IGST = db.Column(db.Numeric(18,2),nullable=True)
    SGST = db.Column(db.Numeric(18,2),nullable=True)
    CGST = db.Column(db.Numeric(18,2),nullable=True)
    Doc_Id = db.Column(db.Integer,nullable=True)
    Company_Code = db.Column(db.Integer,nullable=True)
    Year_Code = db.Column(db.Integer,nullable=True)
    Branch_Code = db.Column(db.Integer,nullable=True)
    Created_By = db.Column(db.String(255),nullable=True)
    Modified_By = db.Column(db.String(255),nullable=True)
    Remark = db.Column(db.String(255),nullable=True)
    gstid = db.Column(db.String(255),nullable=False,primary_key=True)

