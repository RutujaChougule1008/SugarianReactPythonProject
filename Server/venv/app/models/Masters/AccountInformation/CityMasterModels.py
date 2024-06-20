from app import db

class CityMaster(db.Model):
    __tablename__ = 'nt_1_citymaster'
    city_code = db.Column(db.Integer, primary_key=True)
    city_name_e = db.Column(db.String(50))
    pincode = db.Column(db.String(50))
    Sub_Area = db.Column(db.String(50))
    city_name_r = db.Column(db.String(50))
    company_code = db.Column(db.Integer,primary_key=True)
    state = db.Column(db.String(50))
    Modified_By = db.Column(db.String(255))
    Created_By = db.Column(db.String(255))
    Modified_By = db.Column(db.String(255))
    Distance = db.Column(db.Numeric(18,2))
    GstStateCode = db.Column(db.Integer)
    # cityid = db.Column(db.Integer)

  