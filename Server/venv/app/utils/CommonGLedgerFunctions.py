from sqlalchemy import text
from app import app, db

def fetch_company_parameters(company_code, year_code):
        query = """
       SELECT dbo.nt_1_companyparameters.IGSTAc, dbo.nt_1_companyparameters.SGSTAc, dbo.nt_1_companyparameters.CGSTAc, dbo.nt_1_companyparameters.PurchaseCGSTAc, dbo.nt_1_companyparameters.PurchaseSGSTAc, 
                  dbo.nt_1_companyparameters.PurchaseIGSTAc, dbo.nt_1_companyparameters.SaleTCSAc, dbo.nt_1_companyparameters.SaleTDSAc, saleigst.accoid AS saleigstaccoid, salesgst.accoid AS salesgstaccoid, 
                  salecgst.accoid AS salecgstaccoid, purchasecgst.accoid AS Purchasecgstaccoid, purchasesgst.accoid AS Purchasesgstaccoid, purchaseigst.accoid AS Purchaseigstaccoid, saletcs.accoid AS saletcsaccoid, 
                  saletds.accoid AS saletdsaccoid, PurchaseTCS.accoid AS PurchaseTCSAccoid, dbo.nt_1_companyparameters.PurchaseTCSAc, dbo.nt_1_companyparameters.PurchaseTDSAc, PurchaseTDS.accoid as PurchaseTDSAccoid
FROM     dbo.nt_1_companyparameters INNER JOIN
                  dbo.nt_1_accountmaster AS saleigst ON dbo.nt_1_companyparameters.IGSTAc = saleigst.Ac_Code AND dbo.nt_1_companyparameters.Company_Code = saleigst.company_code INNER JOIN
                  dbo.nt_1_accountmaster AS salesgst ON dbo.nt_1_companyparameters.SGSTAc = salesgst.Ac_Code AND dbo.nt_1_companyparameters.Company_Code = salesgst.company_code INNER JOIN
                  dbo.nt_1_accountmaster AS salecgst ON dbo.nt_1_companyparameters.CGSTAc = salecgst.Ac_Code AND dbo.nt_1_companyparameters.Company_Code = salecgst.company_code INNER JOIN
                  dbo.nt_1_accountmaster AS purchasecgst ON dbo.nt_1_companyparameters.PurchaseCGSTAc = purchasecgst.Ac_Code AND dbo.nt_1_companyparameters.Company_Code = purchasecgst.company_code INNER JOIN
                  dbo.nt_1_accountmaster AS purchasesgst ON dbo.nt_1_companyparameters.PurchaseSGSTAc = purchasesgst.Ac_Code AND dbo.nt_1_companyparameters.Company_Code = purchasesgst.company_code INNER JOIN
                  dbo.nt_1_accountmaster AS purchaseigst ON dbo.nt_1_companyparameters.PurchaseIGSTAc = purchaseigst.Ac_Code AND dbo.nt_1_companyparameters.Company_Code = purchaseigst.company_code INNER JOIN
                  dbo.nt_1_accountmaster AS saletcs ON dbo.nt_1_companyparameters.SaleTCSAc = saletcs.Ac_Code AND dbo.nt_1_companyparameters.Company_Code = saletcs.company_code INNER JOIN
                  dbo.nt_1_accountmaster AS saletds ON dbo.nt_1_companyparameters.SaleTDSAc = saletds.Ac_Code AND dbo.nt_1_companyparameters.Company_Code = saletds.company_code INNER JOIN
                  dbo.nt_1_accountmaster AS PurchaseTCS ON dbo.nt_1_companyparameters.PurchaseTCSAc = PurchaseTCS.Ac_Code AND dbo.nt_1_companyparameters.Company_Code = PurchaseTCS.company_code INNER JOIN
                  dbo.nt_1_accountmaster AS PurchaseTDS ON dbo.nt_1_companyparameters.PurchaseTDSAc = PurchaseTDS.Ac_Code AND dbo.nt_1_companyparameters.Company_Code = PurchaseTDS.company_code
        WHERE dbo.nt_1_companyparameters.Company_Code = :company_code AND dbo.nt_1_companyparameters.Year_Code = :year_code
        """
        result = db.session.execute(text(query), {'company_code': company_code, 'year_code': year_code}).fetchone()
        return result


def get_accoid(ac_code,company_code):
        result = db.session.execute(
            text("SELECT accoid FROM nt_1_accountmaster WHERE Ac_Code = :ac_code and company_code= :company_code ORDER BY accoid"),
            {'ac_code': ac_code , 'company_code': company_code}
        ).fetchone()
        return result.accoid if result else None


def getPurchaseAc(ic):
    print("ic", ic)
    result = db.session.execute(
        text("select Purchase_AC from nt_1_systemmaster where systemid =:ic"),
        {'ic': ic}
    ).fetchone()
    return result.Purchase_AC if result else None

def getSaleAc(ic):
    print("ic", ic)
    result = db.session.execute(
        text("select Sale_AC from nt_1_systemmaster where systemid =:ic"),
        {'ic': ic}
    ).fetchone()
    return result.Sale_AC if result else None

def get_acShort_Name(ac_code,company_code):
        print("company_code",company_code)
        result = db.session.execute(
            text("SELECT Short_Name FROM nt_1_accountmaster WHERE Ac_Code = :ac_code and company_code= :company_code ORDER BY accoid"),
            {'ac_code': ac_code , 'company_code': company_code}
        ).fetchone()
        return result.Short_Name if result else None
