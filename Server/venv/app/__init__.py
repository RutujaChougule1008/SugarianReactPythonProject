# app.py
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv
import os
from flask_jwt_extended import JWTManager

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# Set the database URI using environment variables
app.config['SQLALCHEMY_DATABASE_URI'] = f"mssql+pymssql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Initialize JWTManager with your app 
app.config['JWT_SECRET_KEY'] = 'ABCEFGHIJKLMNOPQRSTUVWXYZ'
jwt = JWTManager(app)

# The rest of your application configuration and routes

# Import controllers and helpers
from app.Controllers.Company.CompanyCreation.CompanyCreation import *
from app.Controllers.LoginAndCompanyList.Login.LoginController import *
from app.Controllers.LoginAndCompanyList.CompanyList.CompanyList import *
from app.Controllers.Company.AccountingYear.AccountingYear import *
from app.Controllers.LoginAndCompanyList.UserLogin.UserLoginController import *
from app.Controllers.Masters.AccountInformation.FinicialMastersController import *
from app.Controllers.Masters.OtherMasters.GstStateMasterController import *
from app.Controllers.Masters.AccountInformation.CityMasterController import *
from app.Controllers.Masters.OtherMasters.BrandMasterController import *
from app.Controllers.Masters.OtherMasters.GstRateMasterController import *
from app.Controllers.Transactions.OtherPurchaseController import *
from app.Controllers.BusinessRelated.DeliveryOrder.DeliveryOrderController import *
from app.Controllers.Masters.OtherMasters.SysytemMasterController import *
from app.Controllers.BusinessRelated.TenderPurchase.TenderPurchaseController import *
from app.Controllers.Transactions.DebitCreditNote.DebitCreditNoteController import *
from app.Controllers.Reports.GLedger.GLedgerController import *
from app.Controllers.Inword.PurchaseBill.PurchaseBillController import *

from app.Helpers.AccountMasterHelp import *
# from app.Helpers.CityMasterHelp import *
# from app.Helpers.GroupMasterHelp import *
from app.Helpers.GstRateMasterHelp import *
from app.Helpers.SystemMasterHelp import *
# from app.Helpers.GstStateMasterHelp import *
# from app.Helpers.BrandMasterHelp import *
# from app.Helpers.TenderUtilityHelp import *


# other routes
from app.Controllers.BusinessRelated.CorporateSale.CorporateSaleController import *
from app.Controllers.Masters.AccountInformation.AccountMaster.AccountMasterController import *


if __name__ == '__main__':
    app.run(debug=True)
