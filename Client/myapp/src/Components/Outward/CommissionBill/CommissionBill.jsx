import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ActionButtonGroup from "../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import ItemMasterHelp from "../../../Helper/SystemmasterHelp";
import GSTRateMasterHelp from "../../../Helper/GSTRateMasterHelp";
import "../CommissionBill/CommissionBill.css";

const companyCode = sessionStorage.getItem("Company_Code");
const Year_Code = sessionStorage.getItem("Year_Code");
const API_URL = process.env.REACT_APP_API;

let SupplierName = "";
let newac_code = "";
let UnitName = "";
let newunit_code = "";
let BrokerName = "";
let newbroker_code = "";
let TransportName = "";
let newtransport_code = "";
let GstRateName = "";
let newgst_code = "";
let MillName = "";
let newmill_code = "";
let newnarration1 = "";
let newnarration2 = "";
let ItemName = "";
let newitem_code = "";
let TdsName = "";
let newTDS_Ac = "";

const CommissionBill = () => {
  const [updateButtonClicked, setUpdateButtonClicked] = useState(false);
  const [saveButtonClicked, setSaveButtonClicked] = useState(false);
  const [addOneButtonEnabled, setAddOneButtonEnabled] = useState(false);
  const [saveButtonEnabled, setSaveButtonEnabled] = useState(true);
  const [cancelButtonEnabled, setCancelButtonEnabled] = useState(true);
  const [editButtonEnabled, setEditButtonEnabled] = useState(false);
  const [deleteButtonEnabled, setDeleteButtonEnabled] = useState(false);
  const [backButtonEnabled, setBackButtonEnabled] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [highlightedButton, setHighlightedButton] = useState(null);
  const [cancelButtonClicked, setCancelButtonClicked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [accountCode, setAccountCode] = useState("");
  const [supplier, setSupplier] = useState();
  const [Unit, setUnit] = useState();
  const [broker, setBroker] = useState();
  const [mill, setMill] = useState();
  const [transport, setTransport] = useState();
  const [TDS, setTDS] = useState();
  const [GstRateCode, setGstRateCode] = useState();
  const [GstRate, setGstRate] = useState();
  const [item, setItem] = useState();
  const [supplierGSTStateCode, setSupplierGSTStateCode] = useState();
  const [matchStatus, setMatchStatus] = useState(null);
  const navigate = useNavigate();

  const location = useLocation();
  const selectedRecord = location.state?.selectedRecord;
  const tranType =
    location.state?.tranType || sessionStorage.getItem("Tran_Type") || "LV";

  const TranTypeInputRef = useRef(null);
  const isTDSRef = useRef(null);
  const changeNoInputRef = useRef(null);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date)) return null; // Handle invalid dates
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();

    day = day < 10 ? "0" + day : day;
    month = month < 10 ? "0" + month : month;

    return `${year}-${month}-${day}`;
  };

  const initialFormData = {
    doc_no: "",
    doc_date: formatDate(new Date()),
    link_no: 0,
    link_type: "",
    link_id: 0,
    ac_code: 0,
    unit_code: 0,
    broker_code: 2,
    qntl: 0,
    packing: 50,
    bags: 0,
    grade: "",
    transport_code: 0,
    mill_rate: 0.0,
    sale_rate: 0.0,
    purc_rate: 0.0,
    commission_amount: 0.0,
    resale_rate: 0.0,
    resale_commission: 0.0,
    misc_amount: 0.0,
    texable_amount: 0.0,
    gst_code: 1,
    cgst_rate: 0.0,
    cgst_amount: 0.0,
    sgst_rate: 0.0,
    sgst_amount: 0.0,
    igst_rate: 0.0,
    igst_amount: 0.0,
    bill_amount: 0.0,
    Company_Code: companyCode,
    Year_Code: Year_Code,
    Branch_Code: 0,
    Created_By: "",
    Modified_By: "",
    ac: 0,
    uc: 0,
    bc: 0,
    tc: 0,
    mill_code: 0,
    mc: 0,
    narration1: "",
    narration2: "",
    narration3: "",
    narration4: "",
    TCS_Rate: 0.0,
    TCS_Amt: 0.0,
    TCS_Net_Payable: 0.0,
    BANK_COMMISSION: 0.0,
    HSN: "",
    einvoiceno: "",
    ackno: 0,
    item_code: 1,
    ic: 0,
    Tran_Type: tranType,
    Frieght_Rate: 0.0,
    Frieght_amt: 0.0,
    subtotal: 0.0,
    IsTDS: "Y",
    TDS_Ac: 0,
    TDS_Per: 0.0,
    TDSAmount: 0.0,
    TDS: 0.0,
    ta: 0,
    QRCode: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (isEditing) {
      if (TranTypeInputRef.current) {
        TranTypeInputRef.current.focus();
      }
    } else if (cancelButtonClicked) {
      if (changeNoInputRef.current) {
        changeNoInputRef.current.focus();
      }
    }
    if (formData.Tran_Type && !addOneButtonEnabled && !isEditing) {
      fetchLastRecord(formData.Tran_Type);
    }
  }, [
    isEditing,
    cancelButtonClicked,
    formData.Tran_Type,
    !addOneButtonEnabled,
    !isEditing,
  ]);

  const handleSelectKeyDown = (event, field) => {
    const options = {
      IsTDS: ["Y", "N"],
      Tran_Type: ["LV", "CV"],
    };

    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const currentOptions = options[field];
      const currentIndex = currentOptions.indexOf(formData[field]);
      const nextIndex =
        event.key === "ArrowUp"
          ? (currentIndex - 1 + currentOptions.length) % currentOptions.length
          : (currentIndex + 1) % currentOptions.length;
      setFormData({ ...formData, [field]: currentOptions[nextIndex] });
    }
  };

  const handleDateChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const fetchGstStateCode = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/get-GSTStateCode?Company_Code=${companyCode}&Year_Code=${Year_Code}`
      );
      return response.data.GSTStateCode;
    } catch (error) {
      console.error("Error fetching GST State Code:", error);
      return null;
    }
  };

  const checkMatchStatus = async (ac_code, company_code, year_code) => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_API}/get_match_status`,
        {
          params: {
            Ac_Code: ac_code,
            Company_Code: company_code,
            Year_Code: year_code,
          },
        }
      );
      return data.match_status;
    } catch (error) {
      toast.error("Error checking GST State Code match.");
      console.error("Couldn't able to match GST State Code:", error);
      return error;
    }
  };

  const handleAcCode = async (code, accoid) => {
    setSupplier(code);
    try {
        // Fetch the match status from the API
        const matchStatus = await checkMatchStatus(code, companyCode, Year_Code);
        const match = matchStatus === "TRUE";

        // Log the match status and any change in the GST rate
        console.log("Match Status:", match, "Current GST Rate:", GstRate);

        // Calculate new GST rates based on the match status
        const rate = parseFloat(GstRate) || 0;
        let newFormData = {
            ...formData,
            ac_code: code,
            ac: accoid,
            gst_code: formData.gst_code, // Assuming gst_code is being managed separately
            cgst_rate: match ? rate / 2 : 0,
            sgst_rate: match ? rate / 2 : 0,
            igst_rate: match ? 0 : rate,
        };

        // Update match status and recalculate dependent GST amounts
        setMatchStatus(match);
        setFormData(newFormData);
        calculateAndSetGSTAmounts(newFormData);
    } catch (error) {
        console.error("Error in handleAcCode:", error);
        toast.error("Failed to update account code details.");
    }
};
const calculateAndSetGSTAmounts = async (formData) => {
  // Assuming `calculateGSTAmounts` needs to use the new rates to update other values
  const taxableAmount = parseFloat(formData.texable_amount) || 0;
  const cgstAmount = (taxableAmount * formData.cgst_rate) / 100;
  const sgstAmount = (taxableAmount * formData.sgst_rate) / 100;
  const igstAmount = (taxableAmount * formData.igst_rate) / 100;

  const updatedFormData = {
    ...formData,
    cgst_amount: cgstAmount,
    sgst_amount: sgstAmount,
    igst_amount: igstAmount
  };

  // Now updating the formData state with the new calculated values
  setFormData(updatedFormData);
};

  const handleUnitCode = (code, accoid) => {
    setUnit(code);
    setFormData((prevState) => ({
      ...prevState,
      unit_code: code,
      uc: accoid,
    }));
  };

  const handleBrokerCode = (code, accoid) => {
    setBroker(code);
    setFormData((prevState) => ({
      ...prevState,
      broker_code: code,
      bc: accoid,
    }));
  };

  const handleTransportCode = (code, accoid) => {
    setTransport(code);
    setFormData((prevState) => ({
      ...prevState,
      transport_code: code,
      tc: accoid,
    }));
  };

  const handleGSTCode = async (code, Rate) => {
    const rate = parseFloat(Rate) || 0;  // Simplified since both conditions were identical

    try {
        // Check if the GST state codes match and then calculate the tax rates accordingly
        const sameState = await checkMatchStatus(formData.ac_code, companyCode, Year_Code);
        console.log("GST State Match:", sameState);

        const newFormData = {
            ...formData,
            gst_code: code,
            cgst_rate: sameState ? rate / 2 : 0,
            sgst_rate: sameState ? rate / 2 : 0,
            igst_rate: sameState ? 0 : rate,
        };

        setGstRateCode(code);
        setGstRate(rate);
        setFormData(newFormData);

        // Re-calculate dependent GST amounts using the updated rates
        calculateAndSetGSTAmounts(newFormData);
    } catch (error) {
        // Log and display an error message
        console.error("Error handling GST Code change:", error);
        toast.error("Failed to update GST details. Please try again.");
    }
};


  const handleMillCode = (code, accoid) => {
    setFormData((prevState) => ({
      ...prevState,
      mill_code: code,
      mc: accoid,
    }));
  };

  const handleNarration1 = (code) => {
    setAccountCode(code);
    setFormData((prevState) => ({
      ...prevState,
      narration1: code,
    }));
  };

  const handleNarration2 = (code) => {
    setAccountCode(code);
    setFormData((prevState) => ({
      ...prevState,
      narration2: code,
    }));
  };

  const handleItemCode = (code, accoid, HSN) => {
    setItem(code);
    setFormData((prevState) => ({
      ...prevState,
      item_code: code,
      ic: accoid,
      HSN: HSN,
    }));
  };

  const handleTDSAc = (code, accoid) => {
    setTDS(code);
    setFormData((prevState) => ({
      ...prevState,
      TDS_Ac: code,
      ta: accoid,
    }));
  };

  const calculateBags = (qntl, packing) => {
    return (qntl / packing) * 100;
  };

  const calculateFreight = (freightRate, qntl) => {
    return freightRate * qntl;
  };

  const calculateRDiffTenderRate = (saleRate, millRate, purchaseRate) => {
    if (purchaseRate > 0) {
      return millRate - purchaseRate;
    }
    return saleRate - millRate;
  };

  const calculateTenderDiffRateAmount = (
    saleRate,
    millRate,
    purcRate,
    qntl
  ) => {
    return saleRate > 0
      ? (saleRate - millRate) * qntl
      : (millRate - purcRate) * qntl;
  };

  const tenderDiffRate = calculateTenderDiffRateAmount(
    formData.sale_rate,
    formData.mill_rate,
    formData.purc_rate,
    formData.qntl
  );

  const calculateResaleRate = (resale_commission, qntl) => {
    return resale_commission * qntl;
  };

  const calculateSubtotal = (rDiffTenderRate, qntl, resale_rate) => {
    return rDiffTenderRate * qntl + resale_rate;
  };

  const calculateTaxable = (subtotal, freight) => {
    return subtotal + freight;
  };

  const calculateCGSTAmount = (taxable, cgstRate) => {
    return (taxable * cgstRate) / 100;
  };

  const calculateSGSTAmount = (taxable, sgstRate) => {
    return (taxable * sgstRate) / 100;
  };

  const calculateIGSTAmount = (taxable, igstRate) => {
    return (taxable * igstRate) / 100;
  };

  const calculateBillAmount = (
    taxable,
    cgstAmount,
    sgstAmount,
    igstAmount,
    bankCommission,
    misc_Amount
  ) => {
    return (
      taxable +
      cgstAmount +
      sgstAmount +
      igstAmount +
      bankCommission +
      misc_Amount
    );
  };

  const calculateTCSAmount = (billAmount, tcsRate) => {
    return (billAmount * tcsRate) / 100;
  };

  const calculateTDSAmount = (billAmount, tdsRate) => {
    return (billAmount * tdsRate) / 100;
  };

  const calculateNetPayable = (
    billAmount,
    tcsAmount,
    tdsAmount,
    hasTCS,
    hasTDS
  ) => {
    if (hasTCS) {
      return billAmount + tcsAmount;
    }
    if (hasTDS) {
      return billAmount - tdsAmount;
    }
    return billAmount;
  };

  const handleChange = async (event) => {
    const { name, value } = event.target;
    let newFormData = { ...formData, [name]: value };

    // const isMaharashtra = isMaharashtraPincode(parseInt(supplierGSTStateCode, 10));
    const sameState = await checkMatchStatus(
      formData.ac_code,
      companyCode,
      Year_Code
    );;
    console.log(sameState);

    // Calculate other dependent values
    if (
      [
        "Frieght_Rate",
        "qntl",
        "sale_rate",
        "texable_amount",
        "mill_rate",
        "resale_commission",
        "BANK_COMMISSION",
        "misc_amount",
        "packing",
        "purc_rate",
      ].includes(name)
    ) {
      const freightRate =
        name === "Frieght_Rate"
          ? parseFloat(value)
          : parseFloat(formData.Frieght_Rate);
      const qntl =
        name === "qntl" ? parseFloat(value) : parseFloat(formData.qntl);
      const saleRate =
        name === "sale_rate"
          ? parseFloat(value)
          : parseFloat(formData.sale_rate);
      const millRate =
        name === "mill_rate"
          ? parseFloat(value)
          : parseFloat(formData.mill_rate);
      const resale_commission =
        name === "resale_commission"
          ? parseFloat(value)
          : parseFloat(formData.resale_commission);
      const bankCommission =
        name === "BANK_COMMISSION"
          ? parseFloat(value)
          : parseFloat(formData.BANK_COMMISSION);
      const misc_Amount =
        name === "misc_amount"
          ? parseFloat(value)
          : parseFloat(formData.misc_amount);
      const purc_rate =
        name === "purc_rate"
          ? parseFloat(value)
          : parseFloat(formData.purc_rate);

      const packing = parseInt(formData.packing) || 0;
      const bag = calculateBags(qntl, packing);
      const freightAmt = calculateFreight(freightRate, qntl);
      const rDiffTenderRate = calculateRDiffTenderRate(
        saleRate,
        millRate,
        purc_rate
      );
      const resale_rate = calculateResaleRate(resale_commission, qntl);
      const subtotal = calculateSubtotal(rDiffTenderRate, qntl, resale_rate);
      const taxable = calculateTaxable(subtotal, freightAmt);
      const cgstRate = parseFloat(formData.cgst_rate) || 0;
      const sgstRate = parseFloat(formData.sgst_rate) || 0;
      const igstRate = parseFloat(formData.igst_rate) || 0;
      const cgstAmount = sameState ? calculateCGSTAmount(taxable, cgstRate) : 0;
      const sgstAmount = sameState ? calculateSGSTAmount(taxable, sgstRate) : 0;
      const igstAmount = !sameState
        ? calculateIGSTAmount(taxable, igstRate)
        : 0;
      const billAmount = calculateBillAmount(
        taxable,
        cgstAmount,
        sgstAmount,
        igstAmount,
        bankCommission,
        misc_Amount
      );
      const tcsRate =
        formData.IsTDS === "N" ? parseFloat(formData.TCS_Rate) : 0;
      const tcsAmount =
        formData.IsTDS === "N" ? calculateTCSAmount(billAmount, tcsRate) : 0;
      const tdsRate = formData.IsTDS === "Y" ? parseFloat(formData.TDS_Per) : 0;
      const tdsAmount =
        formData.IsTDS === "Y" ? calculateTDSAmount(billAmount, tdsRate) : 0;

      const hasTCS = tcsAmount > 0;
      const hasTDS = tdsAmount > 0;
      const netPayable = calculateNetPayable(
        billAmount,
        tcsAmount,
        tdsAmount,
        hasTCS,
        hasTDS
      );

      newFormData = {
        ...newFormData,
        bags: bag,
        Frieght_amt: freightAmt,
        commission_amount: rDiffTenderRate,
        resale_rate: resale_rate,
        subtotal: subtotal,
        texable_amount: taxable,
        cgst_amount: cgstAmount,
        sgst_amount: sgstAmount,
        igst_amount: igstAmount,
        bill_amount: billAmount,
        TCS_Amt: tcsAmount,
        TDSAmount: tdsAmount,
        TCS_Net_Payable: netPayable,
        TDS: taxable,
        sale_rate: purc_rate > 0 ? 0 : saleRate,
        // purc_rate: saleRate > 0 ? 0 : purc_rate,
      };
    }

    if (
      [
        "cgst_rate",
        "sgst_rate",
        "texable_amount",
        "cgst_amount",
        "sgst_amount",
        "TCS_Rate",
        "bill_amount",
        "TDS_Per",
        "igst_rate",
        "BANK_COMMISSION",
        "misc_amount",
      ].includes(name)
    ) {
      const cgstRate =
        name === "cgst_rate"
          ? parseFloat(value)
          : parseFloat(formData.cgst_rate);
      const sgstRate =
        name === "sgst_rate"
          ? parseFloat(value)
          : parseFloat(formData.sgst_rate);
      const igstRate =
        name === "igst_rate"
          ? parseFloat(value)
          : parseFloat(formData.igst_rate);
      const taxable = parseFloat(formData.texable_amount) || 0;
      const cgstAmount = sameState ? calculateCGSTAmount(taxable, cgstRate) : 0;
      const sgstAmount = sameState ? calculateSGSTAmount(taxable, sgstRate) : 0;
      const igstAmount = sameState ? 0 : calculateIGSTAmount(taxable, igstRate);
      const bankCommission =
        name === "BANK_COMMISSION"
          ? parseFloat(value)
          : parseFloat(formData.BANK_COMMISSION);
      const misc_Amount =
        name === "misc_amount"
          ? parseFloat(value)
          : parseFloat(formData.misc_amount);
      const billAmount =
        name === "bill_amount"
          ? parseFloat(value)
          : calculateBillAmount(
              taxable,
              cgstAmount,
              sgstAmount,
              igstAmount,
              bankCommission,
              misc_Amount
            );
      const tcsRate =
        formData.IsTDS === "N" ? parseFloat(formData.TCS_Rate) : 0;
      const tcsAmount =
        formData.IsTDS === "N" ? calculateTCSAmount(billAmount, tcsRate) : 0;
      const tdsRate = formData.IsTDS === "Y" ? parseFloat(formData.TDS_Per) : 0;
      const tdsAmount =
        formData.IsTDS === "Y" ? calculateTDSAmount(billAmount, tdsRate) : 0;

      const hasTCS = tcsAmount > 0;
      const hasTDS = tdsAmount > 0;
      const netPayable = calculateNetPayable(
        billAmount,
        tcsAmount,
        tdsAmount,
        hasTCS,
        hasTDS
      );

      console.log(igstAmount);

      newFormData = {
        ...newFormData,
        cgst_rate: cgstRate,
        cgst_amount: cgstAmount,
        sgst_rate: sgstRate,
        sgst_amount: sgstAmount,
        igst_rate: igstRate,
        igst_amount: igstAmount,
        bill_amount: billAmount,
        TCS_Amt: tcsAmount,
        TCS_Net_Payable: netPayable,
        TDSAmount: tdsAmount,
        TDS: taxable,
      };

      await calculateAndSetGSTAmounts(newFormData);
    }

    setFormData(newFormData);
  };

  const fetchLastRecord = (tranType) => {
    fetch(
      `${API_URL}/get-CommissionBill-lastRecord?Company_Code=${companyCode}&Year_Code=${Year_Code}&Tran_Type=${tranType}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch last record");
        }
        return response.json();
      })
      .then((data) => {
        setFormData((prevState) => ({
          ...prevState,
          doc_no: data.doc_no + 1,
        }));
      })
      .catch((error) => {
        console.error("Error fetching last record:", error);
      });
  };

  const fetchItemCode = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/sugarian/system_master_help?CompanyCode=${companyCode}&SystemType=I`
      );
      const data = response.data;
      const item = data.find((item) => item.Category_Code === 1);
      return item
        ? {
            code: item.Category_Code,
            accoid: item.accoid,
            label: item.Category_Name,
            HSN: item.HSN,
          }
        : { code: null, accoid: null, label: null, HSN: null };
    } catch (error) {
      console.error("Error fetching item code:", error);
      return { code: null, accoid: null, label: null, HSN: null };
    }
  };

  const fetchBrokerCode = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/sugarian/account_master_all?Company_Code=${companyCode}`
      );
      const data = response.data;
      const item = data.find((item) => item.Ac_Code === 2);
      return item
        ? { code: item.Ac_Code, accoid: item.accoid, label: item.Ac_Name_E }
        : { code: null, accoid: null, label: null };
    } catch (error) {
      console.error("Error fetching broker code:", error);
      return { code: null, accoid: null, label: null };
    }
  };

  const fetchGSTRateCode = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/sugarian/gst_rate_master?Company_Code=${companyCode}`
      );
      const data = response.data;
      const item = data.find((item) => item.Doc_no === 1);
      return item
        ? {
            code: item.Doc_no,
            accoid: item.gstid,
            label: item.GST_Name,
          }
        : { code: null, accoid: null, label: null };
    } catch (error) {
      console.error("Error fetching item code:", error);
      return { code: null, accoid: null, label: null };
    }
  };


  const handleAddOne = async () => {
    setAddOneButtonEnabled(false);
    setSaveButtonEnabled(true);
    setCancelButtonEnabled(true);
    setEditButtonEnabled(false);
    setDeleteButtonEnabled(false);
    setIsEditing(true);
    fetchLastRecord(tranType);
    const itemCode = await fetchItemCode();
    const brokerCode = await fetchBrokerCode();
    const gstRateCode = await fetchGSTRateCode();
    setFormData((prevState) => ({
      ...initialFormData,
      doc_no: prevState.doc_no,
      item_code: itemCode.code,
      ic: itemCode.accoid,
      HSN: itemCode.HSN,
      broker_code: brokerCode.code,
      bc: brokerCode.accoid,
      gst_code: gstRateCode.code,
      Company_Code: companyCode,
      Year_Code: Year_Code,
    }));
    ItemName = itemCode.label;
    BrokerName = brokerCode.label;
    GstRateName = gstRateCode.label;
    sessionStorage.getItem("Tran_Type");
    setGstRate(gstRateCode.accoid);
    SupplierName = "";
    newac_code = "";
    UnitName = "";
    newunit_code = "";
    newbroker_code = "";
    TransportName = "";
    newtransport_code = "";
    newgst_code = "";
    MillName = "";
    newmill_code = "";
    newnarration1 = "";
    newnarration2 = "";
    newitem_code = "";
    TdsName = "";
    newTDS_Ac = "";
    if (TranTypeInputRef.current) {
      TranTypeInputRef.current.focus();
    }
  };

  const handleSaveOrUpdate = () => {
    const preparedData = {
      ...formData,
      Company_Code: companyCode,
      Year_Code: Year_Code,
      doc_date: formatDate(formData.doc_date),
    };

    if (isEditMode) {
      axios
        .put(
          `${API_URL}/update-CommissionBill?doc_no=${formData.doc_no}&Company_Code=${companyCode}&Year_Code=${Year_Code}&Tran_Type=${tranType}`,
          preparedData
        )
        .then((response) => {
          toast.success("Record updated successfully!");
          setIsEditMode(false);
          setAddOneButtonEnabled(true);
          setEditButtonEnabled(true);
          setDeleteButtonEnabled(true);
          setBackButtonEnabled(true);
          setSaveButtonEnabled(false);
          setCancelButtonEnabled(false);
          setUpdateButtonClicked(true);
          setIsEditing(false);
        })
        .catch((error) => {
          handleCancel();
          console.error("Error updating data:", error);
        });
    } else {
      axios
        .post(
          `${API_URL}/create-RecordCommissionBill?Company_Code=${companyCode}&Year_Code=${Year_Code}&Tran_Type=${tranType}`,
          preparedData
        )
        .then((response) => {
          toast.success("Record created successfully!");
          setIsEditMode(false);
          setAddOneButtonEnabled(true);
          setEditButtonEnabled(true);
          setDeleteButtonEnabled(true);
          setBackButtonEnabled(true);
          setSaveButtonEnabled(false);
          setCancelButtonEnabled(false);
          setUpdateButtonClicked(true);
          setIsEditing(false);
        })
        .catch((error) => {
          console.error("Error saving data:", error);
        });
    }
  };

  const handleEdit = () => {
    setIsEditMode(true);
    setAddOneButtonEnabled(false);
    setSaveButtonEnabled(true);
    setCancelButtonEnabled(true);
    setEditButtonEnabled(false);
    setDeleteButtonEnabled(false);
    setBackButtonEnabled(true);
    setIsEditing(true);
  };

  const handleCancel = () => {
    axios
      .get(
        `${API_URL}/get-CommissionBill-lastRecord?Company_Code=${companyCode}&Year_Code=${Year_Code}&Tran_Type=${tranType}`
      )
      .then((response) => {
        const data = response.data;
        newac_code = data.PartyCode;
        SupplierName = data.PartyName;
        newunit_code = data.Unitcode;
        UnitName = data.UnitName;
        BrokerName = data.brokername;
        newbroker_code = data.broker_code;
        TransportName = data.transportname;
        newtransport_code = data.transportcode;
        GstRateName = data.gstratename;
        newgst_code = data.gstratecode;
        MillName = data.millname;
        newmill_code = data.millcode;
        newnarration1 = data.narration1;
        newnarration2 = data.narration2;
        TdsName = data.tdsacname;
        newTDS_Ac = data.tdsac;
        ItemName = data.Itemname;
        newitem_code = data.Itemcode;

        setFormData((prevState) => ({
          ...formData,
          ...data,
          doc_date: formatDate(data.doc_date),
        }));
        setTimeout(() => {
          console.log("Form data after state update:", formData);
        }, 0);
      })
      .catch((error) => {
        console.error("Error fetching latest data for edit:", error);
      });

    setIsEditing(false);
    setIsEditMode(false);
    setAddOneButtonEnabled(true);
    setEditButtonEnabled(true);
    setDeleteButtonEnabled(true);
    setBackButtonEnabled(true);
    setSaveButtonEnabled(false);
    setCancelButtonEnabled(false);
    setCancelButtonClicked(true);
    if (changeNoInputRef.current) {
      changeNoInputRef.current.focus();
    }
    
  };

  const handleDelete = async () => {
    const isConfirmed = window.confirm(
      `Are you sure you want to delete this doc_no ${formData.doc_no}?`
    );

    if (isConfirmed) {
      setIsEditMode(false);
      setAddOneButtonEnabled(true);
      setEditButtonEnabled(true);
      setDeleteButtonEnabled(true);
      setBackButtonEnabled(true);
      setSaveButtonEnabled(false);
      setCancelButtonEnabled(false);

      try {
        const deleteApiUrl = `${API_URL}/delete-CommissionBill?doc_no=${formData.doc_no}&Company_Code=${companyCode}&Year_Code=${Year_Code}&Tran_Type=${tranType}`;
        const response = await axios.delete(deleteApiUrl);
        toast.success("Record deleted successfully!");
        handleCancel();
      } catch (error) {
        toast.error("Deletion cancelled");
        console.error("Error during API call:", error);
      }
    } else {
      console.log("Deletion cancelled");
    }
  };

  const handleBack = () => {
    navigate("/CommissionBill-utility");
  };

  const handlerecordDoubleClicked = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/get-CommissionBillSelectedRecord?Company_Code=${companyCode}&doc_no=${selectedRecord.doc_no}&Year_Code=${Year_Code}&Tran_Type=${tranType}`
      );
      const data = response.data;
      newac_code = data.PartyCode;
      SupplierName = data.PartyName;
      newunit_code = data.Unitcode;
      UnitName = data.UnitName;
      BrokerName = data.brokername;
      newbroker_code = data.broker_code;
      TransportName = data.transportname;
      newtransport_code = data.transportcode;
      GstRateName = data.gstratename;
      newgst_code = data.gstratecode;
      MillName = data.millname;
      newmill_code = data.millcode;
      newnarration1 = data.narration1;
      newnarration2 = data.narration2;
      TdsName = data.tdsacname;
      newTDS_Ac = data.tdsac;
      ItemName = data.Itemname;
      newitem_code = data.Itemcode;

      setFormData({
        ...formData,
        ...data,
        doc_date: formatDate(data.doc_date),
      });

      setIsEditing(false);
    } catch (error) {
      console.error("Error fetching data:", error);
    }

    setIsEditMode(false);
    setAddOneButtonEnabled(true);
    setEditButtonEnabled(true);
    setDeleteButtonEnabled(true);
    setBackButtonEnabled(true);
    setSaveButtonEnabled(false);
    setCancelButtonEnabled(false);
    setUpdateButtonClicked(true);
    setIsEditing(false);
  };

  useEffect(() => {
    if (selectedRecord) {
      handlerecordDoubleClicked();
    } else {
      handleAddOne();
    }
  }, [selectedRecord]);

  const handleKeyDown = async (event) => {
    if (event.key === "Tab") {
      const changeNoValue = event.target.value;
      try {
        const response = await axios.get(
          `${API_URL}/get-CommissionBillSelectedRecord?Company_Code=${companyCode}&doc_no=${changeNoValue}&Year_Code=${Year_Code}&Tran_Type=${tranType}`
        );
        const data = response.data;
        if (data.doc_date) {
          data.doc_date = formatDate(data.doc_date);
        }
        newac_code = data.PartyCode;
        SupplierName = data.PartyName;
        newunit_code = data.Unitcode;
        UnitName = data.UnitName;
        BrokerName = data.brokername;
        newbroker_code = data.broker_code;
        TransportName = data.transportname;
        newtransport_code = data.transportcode;
        GstRateName = data.gstratename;
        newgst_code = data.gstratecode;
        MillName = data.millname;
        newmill_code = data.millcode;
        newnarration1 = data.narration1;
        newnarration2 = data.narration2;
        TdsName = data.tdsacname;
        newTDS_Ac = data.tdsac;
        ItemName = data.Itemname;
        newitem_code = data.Itemcode;
        setFormData(data);
        setIsEditing(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
  };

  // Navigation Buttons
  const handleFirstButtonClick = async () => {
    try {
      const response = await fetch(
        `${API_URL}/get-first-CommissionBill?Company_Code=${companyCode}&Year_Code=${Year_Code}&Tran_Type=${tranType}`
      );
      if (response.ok) {
        const data = await response.json();
        const firstUserCreation = data[0];
        if (firstUserCreation.doc_date) {
          firstUserCreation.doc_date = formatDate(firstUserCreation.doc_date);
        }
        newac_code = firstUserCreation.PartyCode;
        SupplierName = firstUserCreation.PartyName;
        newunit_code = firstUserCreation.Unitcode;
        UnitName = firstUserCreation.UnitName;
        BrokerName = firstUserCreation.brokername;
        newbroker_code = firstUserCreation.broker_code;
        TransportName = firstUserCreation.transportname;
        newtransport_code = firstUserCreation.transportcode;
        GstRateName = firstUserCreation.gstratename;
        newgst_code = firstUserCreation.gstratecode;
        MillName = firstUserCreation.millname;
        newmill_code = firstUserCreation.millcode;
        newnarration1 = firstUserCreation.narration1;
        newnarration2 = firstUserCreation.narration2;
        TdsName = firstUserCreation.tdsacname;
        newTDS_Ac = firstUserCreation.tdsac;
        ItemName = firstUserCreation.Itemname;
        newitem_code = firstUserCreation.Itemcode;

        setFormData({
          ...formData,
          ...firstUserCreation,
        });
      } else {
        console.error(
          "Failed to fetch first record:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  const handlePreviousButtonClick = async () => {
    try {
      const response = await fetch(
        `${API_URL}/get-previous-CommissionBill?doc_no=${formData.doc_no}&Company_Code=${companyCode}&Year_Code=${Year_Code}&Tran_Type=${tranType}`
      );

      if (response.ok) {
        const data = await response.json();
        const previousRecord = data[0];
        if (previousRecord.doc_date) {
          previousRecord.doc_date = formatDate(previousRecord.doc_date);
        }
        newac_code = previousRecord.PartyCode;
        SupplierName = previousRecord.PartyName;
        newunit_code = previousRecord.Unitcode;
        UnitName = previousRecord.UnitName;
        BrokerName = previousRecord.brokername;
        newbroker_code = previousRecord.broker_code;
        TransportName = previousRecord.transportname;
        newtransport_code = previousRecord.transportcode;
        GstRateName = previousRecord.gstratename;
        newgst_code = previousRecord.gstratecode;
        MillName = previousRecord.millname;
        newmill_code = previousRecord.millcode;
        newnarration1 = previousRecord.narration1;
        newnarration2 = previousRecord.narration2;
        TdsName = previousRecord.tdsacname;
        newTDS_Ac = previousRecord.tdsac;
        ItemName = previousRecord.Itemname;
        newitem_code = previousRecord.Itemcode;

        setFormData({
          ...formData,
          ...previousRecord,
        });
      } else {
        console.error(
          "Failed to fetch previous record:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  const handleNextButtonClick = async () => {
    try {
      const response = await fetch(
        `${API_URL}/get-next-CommissionBill?doc_no=${formData.doc_no}&Company_Code=${companyCode}&Year_Code=${Year_Code}&Tran_Type=${tranType}`
      );

      if (response.ok) {
        const data = await response.json();
        const nextRecord = data[0];
        if (nextRecord.doc_date) {
          nextRecord.doc_date = formatDate(nextRecord.doc_date);
        }
        newac_code = nextRecord.PartyCode;
        SupplierName = nextRecord.PartyName;
        newunit_code = nextRecord.Unitcode;
        UnitName = nextRecord.UnitName;
        BrokerName = nextRecord.brokername;
        newbroker_code = nextRecord.broker_code;
        TransportName = nextRecord.transportname;
        newtransport_code = nextRecord.transportcode;
        GstRateName = nextRecord.gstratename;
        newgst_code = nextRecord.gstratecode;
        MillName = nextRecord.millname;
        newmill_code = nextRecord.millcode;
        newnarration1 = nextRecord.narration1;
        newnarration2 = nextRecord.narration2;
        TdsName = nextRecord.tdsacname;
        newTDS_Ac = nextRecord.tdsac;
        ItemName = nextRecord.Itemname;
        newitem_code = nextRecord.Itemcode;

        setFormData({
          ...formData,
          ...nextRecord,
        });
      } else {
        console.error(
          "Failed to fetch next record:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  const handleLastButtonClick = async () => {
    try {
      const response = await fetch(
        `${API_URL}/get-last-CommissionBill?Company_Code=${companyCode}&Year_Code=${Year_Code}&Tran_Type=${tranType}`
      );
      if (response.ok) {
        const data = await response.json();
        const lastRecord = data[0];
        if (lastRecord.doc_date) {
          lastRecord.doc_date = formatDate(lastRecord.doc_date);
        }
        newac_code = lastRecord.PartyCode;
        SupplierName = lastRecord.PartyName;
        newunit_code = lastRecord.Unitcode;
        UnitName = lastRecord.UnitName;
        BrokerName = lastRecord.brokername;
        newbroker_code = lastRecord.broker_code;
        TransportName = lastRecord.transportname;
        newtransport_code = lastRecord.transportcode;
        GstRateName = lastRecord.gstratename;
        newgst_code = lastRecord.gstratecode;
        MillName = lastRecord.millname;
        newmill_code = lastRecord.millcode;
        newnarration1 = lastRecord.narration1;
        newnarration2 = lastRecord.narration2;
        TdsName = lastRecord.tdsacname;
        newTDS_Ac = lastRecord.tdsac;
        ItemName = lastRecord.Itemname;
        newitem_code = lastRecord.Itemcode;

        setFormData({
          ...formData,
          ...lastRecord,
        });
      } else {
        console.error(
          "Failed to fetch last record:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  return (
    <>
      <div className="container">
        <ToastContainer />
        <ActionButtonGroup
          handleAddOne={handleAddOne}
          addOneButtonEnabled={addOneButtonEnabled}
          handleSaveOrUpdate={handleSaveOrUpdate}
          saveButtonEnabled={saveButtonEnabled}
          isEditMode={isEditMode}
          handleEdit={handleEdit}
          editButtonEnabled={editButtonEnabled}
          handleDelete={handleDelete}
          deleteButtonEnabled={deleteButtonEnabled}
          handleCancel={handleCancel}
          cancelButtonEnabled={cancelButtonEnabled}
          handleBack={handleBack}
          backButtonEnabled={backButtonEnabled}
        />
        <div>
          {/* Navigation Buttons */}
          <NavigationButtons
            handleFirstButtonClick={handleFirstButtonClick}
            handlePreviousButtonClick={handlePreviousButtonClick}
            handleNextButtonClick={handleNextButtonClick}
            handleLastButtonClick={handleLastButtonClick}
            highlightedButton={highlightedButton}
            isEditing={isEditing}
            isFirstRecord={formData.Company_Code === companyCode}
          />
        </div>
      </div>

      <div className="commission-form-container">
        <form>
          <h2>Commission Bill</h2>
          <br />
          <div className="form-group ">
            <label htmlFor="changeNo">Change No:</label>
            <input
              type="text"
              id="changeNo"
              Name="changeNo"
              ref={changeNoInputRef}
              onKeyDown={handleKeyDown}
              disabled={!addOneButtonEnabled}
              tabIndex={1}
            />
          </div>
          <div className="form-group">
            <label htmlFor="Tran_Type">Type:</label>
            <select
              id="Tran_Type"
              name="Tran_Type"
              class="custom-select"
              ref={TranTypeInputRef}
              value={formData.Tran_Type}
              onChange={handleChange}
              onKeyDown={(event) => handleSelectKeyDown(event, "Tran_Type")}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={2}
            >
              <option value="LV">LV</option>
              <option value="CV">CV</option>
            </select>
            <label htmlFor="doc_no">Note No.:</label>
            <input
              type="text"
              id="doc_no"
              Name="doc_no"
              value={formData.doc_no}
              onChange={handleChange}
              disabled={true}
              tabIndex={3}
            />
            <label htmlFor="link_no">DO No.:</label>
            <input
              type="text"
              id="link_no"
              Name="link_no"
              value={formData.link_no}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={4}
            />
            <label htmlFor="doc_date">Date:</label>
            <input
              type="date"
              id="doc_date"
              Name="doc_date"
              value={formData.doc_date}
              onChange={handleDateChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={5}
            />
          </div>

          <div className="form-group">
            <label htmlFor="ac_code">Party/Supplier</label>
            <AccountMasterHelp
              Name="ac_code"
              onAcCodeClick={handleAcCode}
              CategoryName={SupplierName}
              CategoryCode={newac_code}
              tabIndex={6}
              disabledFeild={!isEditing && addOneButtonEnabled}
            />
            <label htmlFor="unit_code">Unit</label>
            <AccountMasterHelp
              Name="unit_code"
              onAcCodeClick={handleUnitCode}
              CategoryName={UnitName}
              CategoryCode={newunit_code}
              tabIndex={7}
              disabledFeild={!isEditing && addOneButtonEnabled}
            />
            <label htmlFor="broker_code">Broker</label>
            <AccountMasterHelp
              Name="broker_code"
              onAcCodeClick={handleBrokerCode}
              CategoryName={BrokerName}
              CategoryCode={newbroker_code || formData.broker_code}
              tabIndex={8}
              disabledFeild={!isEditing && addOneButtonEnabled}
            />
          </div>
          <div className="form-group">
            <label htmlFor="item_code">Item Code</label>
            <ItemMasterHelp
              Name="item_code"
              onAcCodeClick={handleItemCode}
              CategoryName={ItemName}
              SystemType="I"
              CategoryCode={newitem_code || formData.item_code}
              tabIndex={9}
              disabledField={!isEditing && addOneButtonEnabled}
            />
            <label htmlFor="qntl">Quantal:</label>
            <input
              type="text"
              id="qntl"
              Name="qntl"
              value={formData.qntl}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={10}
            />
            <label htmlFor="packing">Packing:</label>
            <input
              type="text"
              id="packing"
              Name="packing"
              value={formData.packing }
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={11}
            />
            <label htmlFor="bags">Bags:</label>
            <input
              type="text"
              id="bags"
              Name="bags"
              value={formData.bags}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={12}
            />
            <label htmlFor="HSN">HSN:</label>
            <input
              type="text"
              id="HSN"
              Name="HSN"
              value={formData.HSN}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={13}
            />
          </div>

          <div className="form-group">
            <label htmlFor="grade">Grade:</label>
            <input
              type="text"
              id="grade"
              Name="grade"
              value={formData.grade}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={14}
            />
            <label htmlFor="transport_code">Transport</label>
            <AccountMasterHelp
              Name="transport_code"
              onAcCodeClick={handleTransportCode}
              CategoryName={TransportName}
              CategoryCode={newtransport_code}
              tabIndex={15}
              disabledFeild={!isEditing && addOneButtonEnabled}
            />
            <label htmlFor="mill_code">Mill Code</label>
            <AccountMasterHelp
              Name="mill_code"
              onAcCodeClick={handleMillCode}
              CategoryName={MillName}
              CategoryCode={newmill_code}
              tabIndex={16}
              disabledFeild={!isEditing && addOneButtonEnabled}
            />
          </div>

          <div className="form-group">
            <label htmlFor="mill_rate">M.R.:</label>
            <input
              type="text"
              id="mill_rate"
              Name="mill_rate"
              value={formData.mill_rate}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={17}
            />
            <label htmlFor="sale_rate">S.R.:</label>
            <input
              type="text"
              id="sale_rate"
              Name="sale_rate"
              value={formData.sale_rate}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={18}
            />
            <label htmlFor="purc_rate">P.R.:</label>
            <input
              type="text"
              id="purc_rate"
              Name="purc_rate"
              value={formData.purc_rate}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={19}
            />
            <label htmlFor="gst_code">Gst Rate Code</label>
            <GSTRateMasterHelp
              Name="gst_code"
              onAcCodeClick={handleGSTCode}
              GstRateName={GstRateName}
              GstRateCode={newgst_code || formData.gst_code}
              tabIndex={20}
              disabledFeild={!isEditing && addOneButtonEnabled}
            />
          </div>
          <div className="form-group">
            <label htmlFor="commission_amount">R.Diff.Tender</label>
            <input
              type="text"
              id="commission_amount"
              Name="commission_amount"
              value={formData.commission_amount}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={21}
            />
            <input
              type="text"
              id="TenderDiffRate"
              Name="TenderDiffRate"
              value={tenderDiffRate || 0}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={22}
            />
            <label htmlFor="narration1">Narration</label>
            <AccountMasterHelp
              Name="narration1"
              onAcCodeClick={handleNarration1}
              newnarration1={newnarration1}
              tabIndex={23}
              disabledFeild={!isEditing && addOneButtonEnabled}
            />
            <label htmlFor="narration2">Narration2</label>
            <AccountMasterHelp
              Name="narration2"
              onAcCodeClick={handleNarration2}
              newnarration2={newnarration2}
              tabIndex={24}
              disabledFeild={!isEditing && addOneButtonEnabled}
            />
          </div>
          <div className="form-group">
            <label htmlFor="resale_commission">Resale Commission:</label>
            <input
              type="text"
              id="resale_commission"
              Name="resale_commission"
              value={formData.resale_commission}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={25}
            />
            <input
              type="text"
              id="resale_rate"
              Name="resale_rate"
              value={formData.resale_rate}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={26}
            />
            <label htmlFor="BANK_COMMISSION">Bank Commission:</label>
            <input
              type="text"
              id="BANK_COMMISSION"
              Name="BANK_COMMISSION"
              value={formData.BANK_COMMISSION}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={27}
            />
            <label htmlFor="subtotal">Sub Total:</label>
            <input
              type="text"
              id="subtotal"
              Name="subtotal"
              value={formData.subtotal}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={28}
            />
            <label htmlFor="Frieght_Rate">Freight</label>
            <input
              type="text"
              id="Frieght_Rate"
              Name="Frieght_Rate"
              value={formData.Frieght_Rate}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={29}
            />
            <input
              type="text"
              id="Frieght_amt"
              Name="Frieght_amt"
              value={formData.Frieght_amt}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={30}
            />
          </div>
          <div className="form-group">
            <label htmlFor="texable_amount">Taxable Amount:</label>
            <input
              type="text"
              id="texable_amount"
              Name="texable_amount"
              value={formData.texable_amount}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={31}
            />
            <label htmlFor="cgst_rate">CGST%</label>
            <input
              type="text"
              id="cgst_rate"
              Name="cgst_rate"
              value={formData.cgst_rate}
              onChange={handleGSTCode}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={32}
            />
            <input
              type="text"
              id="cgst_amount"
              Name="cgst_amount"
              value={formData.cgst_amount}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={33}
            />
            <label htmlFor="sgst_rate">SGST%</label>
            <input
              type="text"
              id="sgst_rate"
              Name="sgst_rate"
              value={formData.sgst_rate}
              onChange={handleGSTCode}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={34}
            />
            <input
              type="text"
              id="sgst_amount"
              Name="sgst_amount"
              value={formData.sgst_amount}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={35}
            />
            <label htmlFor="igst_rate">IGST%</label>
            <input
              type="text"
              id="igst_rate"
              Name="igst_rate"
              value={formData.igst_rate}
              onChange={handleGSTCode}
              disabled={
          
                !isEditing && addOneButtonEnabled
              }
              tabIndex={36}
            />
            <input
              type="text"
              id="igst_amount"
              Name="igst_amount"
              value={formData.igst_amount}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={37}
            />
          </div>

          <div className="form-group">
            <label htmlFor="bill_amount">Bill Amount:</label>
            <input
              type="text"
              id="bill_amount"
              Name="bill_amount"
              value={formData.bill_amount}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={38}
            />
            <label htmlFor="TCS_Rate">TCS%</label>
            <input
              type="text"
              id="TCS_Rate"
              Name="TCS_Rate"
              value={formData.TCS_Rate}
              onChange={handleChange}
              disabled={
                formData.IsTDS === "Y" || (!isEditing && addOneButtonEnabled)
              }
              tabIndex={39}
            />
            <input
              type="text"
              id="TCS_Amt"
              Name="TCS_Amt"
              value={formData.TCS_Amt}
              onChange={handleChange}
              disabled={
                formData.IsTDS === "Y" || (!isEditing && addOneButtonEnabled)
              }
              tabIndex={40}
            />
            <label htmlFor="TCS_Net_Payable">Net Payable:</label>
            <input
              type="text"
              id="TCS_Net_Payable"
              Name="TCS_Net_Payable"
              value={formData.TCS_Net_Payable}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={41}
            />
            <label htmlFor="misc_amount">Other+-:</label>
            <input
              type="text"
              id="misc_amount"
              Name="misc_amount"
              value={formData.misc_amount}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={42}
            />
          </div>
          <div className="form-group">
            <label htmlFor="IsTDS">Is TDS:</label>
            <select
              id="IsTDS"
              name="IsTDS"
              class="custom-select"
              value={formData.IsTDS}
              onChange={handleChange}
              onKeyDown={(event) => handleSelectKeyDown(event, "IsTDS")}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={43}
            >
              <option value="Y">Yes</option>
              <option value="N">No</option>
            </select>
            <label htmlFor="TDS_Ac">Tds A/c</label>
            <AccountMasterHelp
              Name="TDS_Ac"
              onAcCodeClick={handleTDSAc}
              CategoryName={TdsName}
              CategoryCode={newTDS_Ac}
              tabIndex={44}
              disabledFeild={
                formData.IsTDS === "N" || (!isEditing && addOneButtonEnabled)
              }
            />
            <label htmlFor="TDS_Per">TDS %:</label>
            <input
              type="text"
              id="TDS_Per"
              Name="TDS_Per"
              value={formData.TDS_Per}
              onChange={handleChange}
              disabled={
                formData.IsTDS === "N" || (!isEditing && addOneButtonEnabled)
              }
              tabIndex={45}
            />
            <input
              type="text"
              id="TDSAmount"
              Name="TDSAmount"
              value={formData.TDSAmount}
              onChange={handleChange}
              disabled={
                formData.IsTDS === "N" || (!isEditing && addOneButtonEnabled)
              }
              tabIndex={46}
            />
            <label htmlFor="TDS">TDS Applicable Amount:</label>
            <input
              type="text"
              id="TDS"
              Name="TDS"
              value={formData.TDS}
              onChange={handleChange}
              disabled={
                formData.IsTDS === "N" || (!isEditing && addOneButtonEnabled)
              }
              tabIndex={47}
            />
          </div>
          <div className="form-group">
            <label htmlFor="einvoiceno">Einvoice No:</label>
            <input
              type="text"
              id="einvoiceno"
              Name="einvoiceno"
              value={formData.einvoiceno}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={48}
            />
            <label htmlFor="ackno">Ack No:</label>
            <input
              type="text"
              id="ackno"
              Name="ackno"
              value={formData.ackno}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={49}
            />
          </div>
        </form>
      </div>
    </>
  );
};
export default CommissionBill;
