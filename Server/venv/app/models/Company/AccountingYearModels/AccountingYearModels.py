from app import db 

class AccountingYear(db.Model):
    __tablename__ = 'accountingyear'
    yearCode = db.Column(db.Integer, primary_key=True)
    year = db.Column(db.String(50))
    Start_Date = db.Column(db.String(50))
    End_Date = db.Column(db.String(50))
    Company_Code = db.Column(db.Integer,primary_key=True)

    



    
