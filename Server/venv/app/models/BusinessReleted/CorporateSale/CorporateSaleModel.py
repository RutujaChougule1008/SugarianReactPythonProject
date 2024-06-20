from sqlalchemy import Column, Integer, String, Date, Numeric, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from app import db

Base = declarative_base()

class CorporateSaleHead(db.Model):
    __tablename__ = 'carporatehead'
    doc_no = Column(Integer, nullable=True)
    doc_date = Column(Date, nullable=True)
    ac_code = Column(Integer, nullable=True)
    unit_code = Column(Integer, nullable=True)
    broker = Column(Integer, nullable=True)
    pono = Column(Text, nullable=True)  
    quantal = Column(Numeric(18, 2), nullable=True)
    sell_rate = Column(Numeric(18, 2), nullable=True)
    remark = Column(Text, nullable=True) 
    company_code = Column(Integer, nullable=True)
    carpid = Column(Integer, primary_key=True, nullable=False)
    created_by = Column(String(50), nullable=True)
    modified_by = Column(String(50), nullable=True)
    ac = Column(Integer, nullable=True)
    uc = Column(Integer, nullable=True)
    br = Column(Integer, nullable=True)
    selling_type = Column(String(2), nullable=True)
    bill_to = Column(Integer, nullable=True)
    bt = Column(Integer, nullable=True)
    DeliveryType = Column(String(1), nullable=True)  
    CommissionRate = Column(Numeric(18, 2), nullable=True)

    details = db.relationship('CorporateSaleDetail', backref='CorporateHead', lazy=True)

class CorporateSaleDetail(db.Model):
    __tablename__ = 'carporatedetail'
    carpid = Column(Integer, ForeignKey('carporatehead.carpid'), nullable=False)
    schedule_date = Column(Date, nullable=True)
    scheduale_qntl = Column(Numeric(18, 2), nullable=True)
    transit_days = Column(Integer, nullable=True)
    carpdetailid = Column(Integer, primary_key=True, nullable=False)
    detail_Id = Column(Integer, nullable=True)
    doc_no = Column(Integer, nullable=True)
