from app import db 

class CompanyCreation(db.Model):
    __tablename__ = 'company'
    Company_Code = db.Column(db.Integer, primary_key=True)
    Company_Name_E = db.Column(db.String(255))
    Company_Name_R = db.Column(db.String(255))
    Address_E = db.Column(db.String(255))
    Address_R = db.Column(db.String(255))
    City_E = db.Column(db.String(255))
    City_R = db.Column(db.String(255))
    State_E = db.Column(db.String(255))
    State_R = db.Column(db.String(255))
    PIN = db.Column(db.String(255))
    Mobile_No = db.Column(db.String(255))
    Created_By = db.Column(db.String(255))
    Modified_By = db.Column(db.String(255))
    Pan_No = db.Column(db.String(255))
    Group_Code = db.Column(db.Integer)
    CST = db.Column(db.String(255))
    TIN = db.Column(db.String(255))
    PHONE = db.Column(db.String(255))
    FSSAI_No = db.Column(db.String(255))
    GST = db.Column(db.String(255))
  

    # isLocked = db.Column(db.Boolean, nullable=False, default=False)
    # LockedbyUser = db.Column(db.String(50),default='')

    
