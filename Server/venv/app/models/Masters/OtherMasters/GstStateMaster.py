from app import db

class GSTStateMaster(db.Model):
    __tablename__ = 'gststatemaster'
    State_Code = db.Column(db.Integer,primary_key=True)
    State_Name = db.Column(db.String(200))

