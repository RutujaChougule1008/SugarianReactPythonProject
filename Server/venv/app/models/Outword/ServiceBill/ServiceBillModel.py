from sqlalchemy import Column, ForeignKey, Integer, String, Text, Date, Numeric
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from app import db

Base = declarative_base()

class ServiceBillHead(db.Model):
    __tablename__ = 'nt_1_rentbillhead'
    Doc_No = Column(Integer, nullable=True)
    Date = Column(Date, nullable=True)
    Customer_Code = Column(Integer, nullable=True)
    GstRateCode = Column(Integer, nullable=True)
    Subtotal = Column(Numeric(18, 2), nullable=True)
    CGSTRate = Column(Numeric(18, 2), nullable=True)
    CGSTAmount = Column(Numeric(18, 2), nullable=True)
    SGSTRate = Column(Numeric(18, 2), nullable=True)
    SGSTAmount = Column(Numeric(18, 2), nullable=True)
    IGSTRate = Column(Numeric(18, 2), nullable=True)
    IGSTAmount = Column(Numeric(18, 2), nullable=True)
    Total = Column(Numeric(18, 2), nullable=True)
    Round_Off = Column(Numeric(18, 2), nullable=True)
    Final_Amount = Column(Numeric(18, 2), nullable=True)
    IsTDS = Column(String(1), nullable=True)
    TDS_Ac = Column(Integer, nullable=True)
    TDS_Per = Column(Numeric(18, 2), nullable=True)
    TDSAmount = Column(Numeric(18, 2), nullable=True)
    TDS = Column(Numeric(18, 2), nullable=True)
    Company_Code = Column(Integer, nullable=True)
    Year_Code = Column(Integer, nullable=True)
    Branch_Code = Column(Integer, nullable=True)
    Created_By = Column(String(50), nullable=True)
    Modified_By = Column(String(50), nullable=True)
    billno = Column(String(50), nullable=True)
    cc = Column(Integer, nullable=True)
    ta = Column(Integer, nullable=True)
    rbid = Column(Integer, nullable=False, primary_key=True)
    TCS_Rate = Column(Numeric(18, 3), nullable=True)
    TCS_Amt = Column(Numeric(18, 2), nullable=True)
    TCS_Net_Payable = Column(Numeric(18, 2), nullable=True)
    einvoiceno = Column(String(500), nullable=True)
    ackno = Column(String(500), nullable=True)
    QRCode = Column(Text, nullable=True)
    IsDeleted = Column(Integer, nullable=True)
    gstid = Column(Integer,nullable=True)

    details = db.relationship('ServiceBillDetail', backref='servicebillhead', lazy=True)

class ServiceBillDetail(db.Model):
    __tablename__ = 'nt_1_rentbilldetails'
    Doc_No = Column(Integer, nullable=True)
    Detail_Id = Column(Integer, nullable=True)
    Item_Code = Column(Integer, nullable=True)
    Description = Column(String(1000), nullable=True)
    Amount = Column(Numeric(18, 2), nullable=True)
    Company_Code = Column(Integer, nullable=True)
    Year_Code = Column(Integer, nullable=True)
    ic = Column(Integer, nullable=True)
    rbdid = Column(Integer, nullable=False, primary_key=True)
    rbid = Column(Integer, ForeignKey('nt_1_rentbillhead.rbid'), nullable=False)
