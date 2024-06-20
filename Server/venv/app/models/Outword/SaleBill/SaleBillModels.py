from sqlalchemy import Column, Integer, String, Text, Date, Boolean, ForeignKey, Numeric
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from app import db 

Base = declarative_base()

class SaleBillHead(db.Model):
    __tablename__ = 'nt_1_sugarsale'
  
    doc_no = Column(Integer,nullable=True)
    PURCNO=Column(Integer,nullable=True)
    doc_date=Column(Date,nullable=True)
    Ac_Code=Column(Integer,nullable=True)
    Unit_Code=Column(Integer,nullable=True)
    mill_code=Column(Integer,nullable=True)
    FROM_STATION=Column(String,nullable=True)
    TO_STATION=Column(String,nullable=True)
    LORRYNO=Column(String,nullable=True)
    BROKER=Column(Integer,nullable=True)
    wearhouse=Column(String,nullable=True)
    subTotal=Column(Numeric(18,2),nullable=True)
    LESS_FRT_RATE=Column(Numeric(18,2),nullable=True)
    freight=Column(Numeric(18,2),nullable=True)
    cash_advance=Column(Numeric(18,2),nullable=True)
    bank_commission=Column(Numeric(18,2),nullable=True)
    OTHER_AMT=Column(Numeric(18,2),nullable=True)
    Bill_Amount=Column(Numeric(18,2),nullable=True)
    Due_Days=Column(Integer,nullable=True)
    NETQNTL=Column(Numeric(18,2),nullable=True)
    Company_Code=Column(Integer,nullable=True)
    Year_Code=Column(Integer,nullable=True)
    Branch_Code=Column(Integer,nullable=True)
    Created_By=Column(String,nullable=True)
    Modified_By=Column(String,nullable=True)
    Tran_Type=Column(String(2),nullable=True)
    DO_No=Column(Integer,nullable=True)
    Transport_Code=Column(Integer,nullable=True)
    RateDiff=Column(Numeric(18,2),nullable=True)
    ASN_No=Column(String,nullable=True)
    GstRateCode=Column(Integer,nullable=True)
    CGSTRate=Column(Numeric(18,2),nullable=True)
    CGSTAmount=Column(Numeric(18,2),nullable=True)
    SGSTRate=Column(Numeric(18,2),nullable=True)
    SGSTAmount=Column(Numeric(18,2),nullable=True)
    IGSTRate=Column(Numeric(18,2),nullable=True)
    IGSTAmount=Column(Numeric(18,2),nullable=True)
    TaxableAmount=Column(Numeric(18,2),nullable=True)
    EWay_Bill_No=Column(String,nullable=True)
    EWayBill_Chk=Column(String(1),nullable=True)
    MillInvoiceNo=Column(String,nullable=True)
    RoundOff=Column(Numeric(18,2),nullable=True)
    saleid=Column(Integer,nullable=False,primary_key=True)
    ac=Column(Integer,nullable=True)
    uc=Column(Integer,nullable=True)
    mc=Column(Integer,nullable=True)
    bk=Column(Integer,nullable=True)
    tc=Column(Integer,nullable=True)
    Purcid=Column(Integer,nullable=True)
    DoNarrtion=Column(String,nullable=True)
    TCS_Rate=Column(Numeric(18,2),nullable=True)
    TCS_Amt=Column(Numeric(18,2),nullable=True)
    TCS_Net_Payable=Column(Numeric(18,2),nullable=True)
    saleidnew=Column(Integer,nullable=True)
    newsbno=Column(String,nullable=True)
    newsbdate=Column(Date,nullable=True)
    einvoiceno=Column(String,nullable=True)
    ackno=Column(String,nullable=True)
    Delivery_type=Column(String,nullable=True)
    Bill_To=Column(Integer,nullable=True)
    bt=Column(Integer,nullable=True)
    EwayBillValidDate=Column(Date,nullable=True)
    IsDeleted=Column(Integer,nullable=True)
    TDS_Amt=Column(Numeric(18,2),nullable=True)
    TDS_Rate=Column(Numeric(18,2),nullable=True)
    SBNarration=Column(String,nullable=True)
    QRCode=Column(String,nullable=True)
    Insured=Column(String(1),nullable=True)
    gstid=Column(Integer,nullable=True)
  
    details = db.relationship('SaleBillDetail', backref='Saleid', lazy=True)

class SaleBillDetail(db.Model):
     
     __tablename__ = 'nt_1_sugarsaledetails'
     
     doc_no= Column(Integer, nullable=True)
     detail_id= Column(Integer, nullable=True)
     Tran_Type= Column(String(2), nullable=True)
     item_code= Column(Integer, nullable=True)
     narration= Column(String(255), nullable=True)
     Quantal= Column(Numeric(18,2), nullable=True)
     packing= Column(Integer, nullable=True)
     bags= Column(Integer, nullable=True)
     rate= Column(Numeric(18,2), nullable=True)
     item_Amount= Column(Numeric(18,2), nullable=True)
     Company_Code= Column(Integer, nullable=True)
     Year_Code= Column(Integer, nullable=True)
     Branch_Code= Column(Integer, nullable=True)
     Created_By= Column(String, nullable=True)
     Modified_By= Column(String, nullable=True)
     saledetailid= Column(Integer, nullable=False,primary_key=True)
     ic= Column(Integer, nullable=True)
     Brand_Code= Column(Integer, nullable=True)

     saleid= Column(Integer,ForeignKey('nt_1_sugarsale.saleid'))






