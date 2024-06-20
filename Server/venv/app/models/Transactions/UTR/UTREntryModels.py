from sqlalchemy import Column, Integer, String, Text, Date, Boolean, ForeignKey, Numeric
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from app import db 

Base = declarative_base()

class UTRHead(db.Model):
    __tablename__ = 'nt_1_utr'
    doc_no = Column(Integer, nullable=True)
    doc_date = Column(Date, nullable=True)
    bank_ac = Column(Integer, nullable=True)
    mill_code = Column(Integer, nullable=True)
    amount = Column(Numeric(18, 2), nullable=True)
    utr_no = Column(String(500), nullable=True)
    narration_header = Column(Text, nullable=True)
    narration_footer = Column(Text, nullable=True)
    Company_Code = Column(Integer, nullable=True)
    Year_Code = Column(Integer, nullable=True)
    Branch_Code = Column(Integer, nullable=True)
    Created_By = Column(String(255), nullable=True)
    Modified_By = Column(String(255), nullable=True)
    IsSave = Column(Integer, nullable=True)
    Lott_No = Column(Integer, nullable=True)
    utrid = Column(Integer, primary_key=True, nullable=True)
    ba = Column(Integer, nullable=True)
    mc = Column(Integer, nullable=True)
    Processed = Column(String(1), nullable=True)
    SelectedBank = Column(String(2), nullable=True)
    messageId = Column(String(20), nullable=True)
    bankTransactionId = Column(Integer, nullable=True)
    isPaymentDone = Column(Integer, nullable=True)
    EntryType = Column(String(2), nullable=True)
    PaymentType = Column(String(4), nullable=True)
    paymentData = Column(Text, nullable=True)
    IsDeleted = Column(Integer, nullable=True)

    details = db.relationship('UTRDetail', backref='Utrid', lazy=True)

class UTRDetail(db.Model):
    __tablename__ = 'nt_1_utrdetail'
    Detail_Id = Column(Integer, nullable=True)
    doc_no = Column(Integer, nullable=True)
    lot_no = Column(Integer, nullable=True)
    grade_no = Column(String(50), nullable=True)
    amount = Column(Numeric(18, 2), nullable=True)
    Company_Code = Column(Integer, nullable=True)
    Year_Code = Column(Integer, nullable=True)
    lotCompany_Code = Column(Integer, nullable=True)
    lotYear_Code = Column(Integer, nullable=True)
    Adjusted_Amt = Column(Numeric(18, 2), nullable=True)
    LTNo = Column(Integer, nullable=True)
    utrdetailid = Column(Integer, primary_key=True, nullable=True)
    utrid = Column(Integer, ForeignKey('nt_1_utr.utrid'), nullable=True)
    ln = Column(Integer, nullable=True)
