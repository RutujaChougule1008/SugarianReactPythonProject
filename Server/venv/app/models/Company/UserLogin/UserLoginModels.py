from app import db

class UserLogin(db.Model):
    __tablename__ = 'tbluser'
    
    User_Id = db.Column(db.Integer)
    User_Name = db.Column(db.String(50))
    User_Type = db.Column(db.String(1) )
    Password = db.Column(db.String(50))
    User_Password=db.Column(db.String(50))
    uid = db.Column(db.Integer,primary_key=True)



