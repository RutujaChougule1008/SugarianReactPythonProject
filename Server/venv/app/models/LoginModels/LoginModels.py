from app import db

class GroupUser(db.Model):
    __tablename__ = 'groupuser'

    Group_Code = db.Column(db.Integer)
    Group_Name = db.Column(db.String(255))
    Login_Name = db.Column(db.String(255) )
    Password = db.Column(db.String(255))
    UserType = db.Column(db.String(1))
    Doc_No = db.Column(db.Integer,primary_key=True)







