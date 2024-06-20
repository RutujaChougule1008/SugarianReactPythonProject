from app import db

class GroupMaster(db.Model):
    __tablename__ = 'nt_1_bsgroupmaster'
    group_Code = db.Column(db.Integer, primary_key=True)
    group_Name_E = db.Column(db.String(255))
    group_Name_R = db.Column(db.String(255))
    group_Type = db.Column(db.String(1))
    group_Summary = db.Column(db.String(1))
    group_Order = db.Column(db.Integer)
    Company_Code = db.Column(db.Integer,primary_key=True)
    Created_By = db.Column(db.String(255))
    Modified_By = db.Column(db.String(255))
    # bsid = db.Column(db.Integer, autoincrement=True)