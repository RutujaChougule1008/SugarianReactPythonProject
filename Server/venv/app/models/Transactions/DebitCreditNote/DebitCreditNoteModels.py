
from sqlalchemy import Column, Integer, String, Text, Date, Boolean, ForeignKey, Numeric
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from app import db 

Base = declarative_base()

class DebitCreditNoteHead(db.Model):
    __tablename__ = 'debitnotehead'
    tran_type = Column(String(2), nullable=False)
    doc_no = Column(Integer,nullable=False)
    doc_date = Column(Date, nullable=False)
    ac_code = Column(Integer, nullable=False)
    bill_no = Column(Integer, nullable=False)
    bill_date = Column(Date, nullable=False)
    bill_id = Column(Integer, nullable=False)
    bill_type = Column(String(2), nullable=False)
    texable_amount = Column(Numeric(18, 2), nullable=False)
    gst_code = Column(Integer, nullable=False)
    cgst_rate = Column(Numeric(18, 2), nullable=False)
    cgst_amount = Column(Numeric(18, 2), nullable=False)
    sgst_rate = Column(Numeric(18, 2), nullable=False)
    sgst_amount = Column(Numeric(18, 2), nullable=False)
    igst_rate = Column(Numeric(18, 2), nullable=False)
    igst_amount = Column(Numeric(18, 2), nullable=False)
    bill_amount = Column(Numeric(18, 2), nullable=False)
    Company_Code = Column(Integer, nullable=False)
    Year_Code = Column(Integer, nullable=False)
    Branch_Code = Column(Integer, nullable=False)
    Created_By = Column(String(50), nullable=False)
    Modified_By = Column(String(50), nullable=False)
    misc_amount = Column(Numeric(18, 2), nullable=False)
    ac = Column(Integer, nullable=False)
    dcid = Column(Integer,primary_key=True)
    ASNNO = Column(String(255), nullable=False)
    Ewaybillno = Column(String(255), nullable=False)
    Narration = Column(String(50), nullable=False)
    Shit_To = Column(Numeric(18, 0), nullable=False)
    Mill_Code = Column(Numeric(18, 0), nullable=False)
    st = Column(Numeric(18, 0), nullable=False)
    mc = Column(Numeric(18, 0), nullable=False)
    ackno = Column(String(500), nullable=False)
    Unit_Code = Column(Numeric(18, 0), nullable=False)
    uc = Column(Numeric(18, 0), nullable=False)
    TCS_Rate = Column(Numeric(18, 3), nullable=False)
    TCS_Amt = Column(Numeric(18, 2), nullable=False)
    TCS_Net_Payable = Column(Numeric(18, 2), nullable=False)
    TDS_Rate = Column(Numeric(18, 3), nullable=False)
    TDS_Amt = Column(Numeric(18, 2), nullable=False)
    IsDeleted = Column(Integer, nullable=False)

    details = db.relationship('DebitCreditNoteDetail', backref='Dcid', lazy=True)

class DebitCreditNoteDetail(db.Model):
    __tablename__ = 'debitnotedetail'
    tran_type = Column(String(2), nullable=False)
    doc_no = Column(Integer,nullable=False)
    expac_code = Column(Integer)
    value = Column(Numeric(18, 2), nullable=False)
    expac = Column(Integer)
    dcdetailid = Column(Integer,primary_key=True)
    detail_Id = Column(Integer, nullable=False)
    company_code = Column(Integer, nullable=False)
    year_code = Column(Integer, nullable=False)
    Item_Code = Column(Integer, nullable=False)
    Quantal = Column(Numeric(18, 2), nullable=False)
    ic = Column(Integer, nullable=False)
    dcid = Column(Integer, ForeignKey('debitnotehead.dcid'))