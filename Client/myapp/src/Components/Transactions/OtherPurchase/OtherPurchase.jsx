import React, { useState, useEffect, useRef } from "react";
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import ActionButtonGroup from "../../../Common/CommonButtons/ActionButtonGroup";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./OtherPurchase.css";
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import GSTRateMasterHelp from "../../../Helper/GSTRateMasterHelp";
import { z } from "zod";

//Validation Part Using Zod Library
const stringToNumber = z
  .string()
  .refine(value => !isNaN(Number(value)), { message: "This field must be a number" })
  .transform(value => Number(value));

//Validation Schemas
const otherPurchaseSchema = z.object({
  Taxable_Amount: stringToNumber
    .refine(value => value !== undefined && value >= 0),
  CGST_Rate: stringToNumber
    .refine(value => value !== undefined && value >= 0),
  CGST_Amount: stringToNumber
    .refine(value => value !== undefined && value >= 0),
  SGST_Rate: stringToNumber
    .refine(value => value !== undefined && value >= 0),
  SGST_Amount: stringToNumber
    .refine(value => value !== undefined && value >= 0),
  IGST_Rate: stringToNumber
    .refine(value => value !== undefined && value >= 0),
  IGST_Amount: stringToNumber
    .refine(value => value !== undefined && value >= 0),
});

//API Credentials
const API_URL = process.env.REACT_APP_API;
const Year_Code = sessionStorage.getItem("Year_Code")
const companyCode = sessionStorage.getItem("Company_Code");

//Labels Global variables
var SupplierName = ""
var SupplierCode = ""
var Exp_Ac_Code = ""
var Exp_Ac_Name = ""
var TDSCutAcCode = ""
var TDSCutAcName = ""
var TDSAcCodeNew = ""
var TDSAcName = ""
var GStrateCode = ""
var GStrateName = ""

const OtherPurchase = () => {
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
  const [Exp_Ac, setExp_Ac] = useState('');
  const [Supplier, setSupplier] = useState('');
  const [SupplierAccoid, setSupplierAccoid] = useState('');
  const [TDSCuttAcCode, setTDSCuttAcCode] = useState('')
  const [TDSAcCode, setTDSAcCode] = useState('')
  const [gstRateCode, setgstRateCode] = useState('')
  const [formErrors, setFormErrors] = useState({});

  const navigate = useNavigate();
  const location = useLocation();
  const selectedRecord = location.state?.selectedRecord;

  const initialFormData = {
    Doc_Date: new Date().toISOString().slice(0, 10),
    Supplier_Code: "",
    Exp_Ac: "",
    Narration: "",
    Taxable_Amount: null,
    GST_RateCode: null,
    CGST_Rate: null,
    CGST_Amount: null,
    SGST_Rate: null,
    SGST_Amount: null,
    IGST_Rate: null,
    IGST_Amount: null,
    Other_Amount: null,
    Bill_Amount: null,
    Company_Code: companyCode,
    Year_Code: Year_Code,
    TDS_Amt: null,
    TDS_Per: null,
    TDS: null,
    TDS_Cutt_AcCode: "",
    TDS_AcCode: "",
    sc: "",
    ea: "",
    tca: "",
    tac: "",
    billno: "",
    ASN_No: "",
    einvoiceno: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  // Manage the States of application
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => {
      const updatedFormData = { ...prevState, [name]: value };
      validateField(name, value);
      return updatedFormData;
    });
  };

  //Fetch last record
  const fetchLastRecord = () => {
    fetch(`${API_URL}/get-OtherPurchase-lastRecord?Company_Code=${companyCode}&Year_Code=${Year_Code}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch last record");
        }
        return response.json();
      })
      .then((data) => {
        setFormData((prevState) => ({
          ...prevState,
          Doc_No: data.last_OtherPurchase_data.Doc_No + 1,
        }));
      })
      .catch((error) => {
        console.error("Error fetching last record:", error);
      });
  };

  //API Integration and Button Functionality
  const handleAddOne = () => {
    setAddOneButtonEnabled(false);
    setSaveButtonEnabled(true);
    setCancelButtonEnabled(true);
    setEditButtonEnabled(false);
    setDeleteButtonEnabled(false);
    setIsEditing(true);
    fetchLastRecord();
    setFormData(initialFormData);
    SupplierName = ""
    SupplierCode = ""
    Exp_Ac_Code = ""
    Exp_Ac_Name = ""
    TDSCutAcCode = ""
    TDSCutAcName = ""
    TDSAcCodeNew = ""
    TDSAcName = ""
    GStrateCode = ""
    GStrateName = ""
  };

  //Validation Part
  const validateField = (name, value) => {
    try {
      otherPurchaseSchema.pick({ [name]: true }).parse({ [name]: value });
      setFormErrors((prevErrors) => {
        const updatedErrors = { ...prevErrors };
        delete updatedErrors[name];
        return updatedErrors;
      });
    } catch (err) {
      setFormErrors((prevErrors) => ({
        ...prevErrors,
        [name]: err.errors[0].message,
      }));
    }
  };

  const validateForm = () => {
    try {
      otherPurchaseSchema.parse(formData);
      setFormErrors({});
      return true;
    } catch (err) {
      const errors = {};
      err.errors.forEach(error => {
        errors[error.path[0]] = error.message;
      });
      setFormErrors(errors);
      return false;
    }
  };

  //Insert and Update record Functionality
  const handleSaveOrUpdate = () => {
    if (!validateForm()) return;
    if (isEditMode) {
      axios
        .put(
          `${API_URL}/update-OtherPurchase?Doc_No=${formData.Doc_No}&Company_Code=${companyCode}&Year_Code=${Year_Code}`,
          formData
        )
        .then((response) => {
          console.log("Data updated successfully:", response.data);
          toast.success("Record update successfully!");
          setTimeout(() => {
            window.location.reload();
          }, 1000); // Delay of 1 seconds

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
          `${API_URL}/create-Record-OtherPurchase?Company_Code=${companyCode}&Year_Code=${Year_Code}`,
          formData
        )
        .then((response) => {
          console.log("Data saved successfully:", response.data);
          toast.success("Record Create successfully!");
          setTimeout(() => {
            window.location.reload();
          }, 1000); // Delay of 1 seconds
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

  //Show last record on Screen
  const handleCancel = () => {
    axios
      .get(
        `${API_URL}/get-OtherPurchase-lastRecord?Company_Code=${companyCode}&Year_Code=${Year_Code}`
      )
      .then((response) => {
        const data = response.data;
        SupplierName = data.label_names[0].SupplierName;
        SupplierCode = data.last_OtherPurchase_data.Exp_Ac;
        Exp_Ac_Name = data.label_names[0].ExpAcName;
        Exp_Ac_Code = data.last_OtherPurchase_data.Supplier_Code;
        TDSCutAcName = data.label_names[0].TDSCutAcName;
        TDSCutAcCode = data.last_OtherPurchase_data.TDS_Cutt_AcCode;
        TDSAcName = data.label_names[0].tdsacname;
        TDSAcCodeNew = data.last_OtherPurchase_data.TDS_AcCode;
        GStrateName = data.label_names[0].GST_Name;
        GStrateCode = data.last_OtherPurchase_data.GST_RateCode;
        setFormData({
          ...formData,
          ...data.last_OtherPurchase_data,
        });

      })

      .catch((error) => {
        console.error("Error fetching latest data for edit:", error);
      });
    // Reset other state variables
    setIsEditing(false);
    setIsEditMode(false);
    setAddOneButtonEnabled(true);
    setEditButtonEnabled(true);
    setDeleteButtonEnabled(true);
    setBackButtonEnabled(true);
    setSaveButtonEnabled(false);
    setCancelButtonEnabled(false);
    setCancelButtonClicked(true);
  };

  //Record Delete Functionality
  const handleDelete = async () => {
    const isConfirmed = window.confirm(
      `Are you sure you want to delete this Doc_No ${formData.Doc_No}?`
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
        const deleteApiUrl = `${API_URL}/delete-OtherPurchase?Doc_No=${formData.Doc_No}&Company_Code=${companyCode}&Year_Code=${Year_Code}`;
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
    navigate("/other-purchaseutility");
  };

  //Handle Record DoubleCliked in Utility Page Show that record for Edit
  const handlerecordDoubleClicked = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/get-OtherPurchaseSelectedRecord?Company_Code=${companyCode}&Year_Code=${Year_Code}&Doc_No=${selectedRecord.Doc_No}`
      );
      const data = response.data;
      SupplierName = data.label_names[0].SupplierName;
      SupplierCode = data.selected_Record_data.Supplier_Code;
      Exp_Ac_Name = data.label_names[0].ExpAcName;
      Exp_Ac_Code = data.selected_Record_data.Exp_Ac;
      TDSCutAcName = data.label_names[0].TDSCutAcName;
      TDSCutAcCode = data.selected_Record_data.TDS_Cutt_AcCode;
      TDSAcName = data.label_names[0].tdsacname;
      TDSAcCodeNew = data.selected_Record_data.TDS_AcCode;
      GStrateName = data.label_names[0].GST_Name;
      GStrateCode = data.selected_Record_data.GST_RateCode;
      setFormData({
        ...formData,
        ...data.selected_Record_data,
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

  //change No functionality to get that particular record
  const handleKeyDown = async (event) => {
    if (event.key === "Tab") {
      const changeNoValue = event.target.value;
      try {
        const response = await axios.get(
          `${API_URL}/get-OtherPurchaseSelectedRecord?Company_Code=${companyCode}&Year_Code=${Year_Code}&Doc_No=${changeNoValue}`
        );
        const data = response.data;
        SupplierName = data.label_names[0].SupplierName;
        SupplierCode = data.selected_Record_data.Supplier_Code;
        Exp_Ac_Name = data.label_names[0].ExpAcName;
        Exp_Ac_Code = data.selected_Record_data.Exp_Ac;
        TDSCutAcName = data.label_names[0].TDSCutAcName;
        TDSCutAcCode = data.selected_Record_data.TDS_Cutt_AcCode;
        TDSAcName = data.label_names[0].tdsacname;
        TDSAcCodeNew = data.selected_Record_data.TDS_AcCode;
        GStrateName = data.label_names[0].GST_Name;
        GStrateCode = data.selected_Record_data.GST_RateCode;

        setFormData({
          ...formData,
          ...data.selected_Record_data,
        });
        setIsEditing(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
  };

  //Navigation Buttons
  const handleFirstButtonClick = async () => {
    try {
      const response = await fetch(`${API_URL}/get-first-OtherPurchase?Company_Code=${companyCode}&Year_Code=${Year_Code}`);
      if (response.ok) {
        const data = await response.json();
        SupplierName = data.label_names[0].SupplierName;
        SupplierCode = data.first_OtherPurchase_data.Supplier_Code;
        Exp_Ac_Name = data.label_names[0].ExpAcName;
        Exp_Ac_Code = data.first_OtherPurchase_data.Exp_Ac;
        TDSCutAcName = data.label_names[0].TDSCutAcName;
        TDSCutAcCode = data.first_OtherPurchase_data.TDS_Cutt_AcCode;
        TDSAcName = data.label_names[0].tdsacname;
        TDSAcCodeNew = data.first_OtherPurchase_data.TDS_AcCode;
        GStrateName = data.label_names[0].GST_Name;
        GStrateCode = data.first_OtherPurchase_data.GST_RateCode;
        setFormData({
          ...formData,
          ...data.first_OtherPurchase_data,
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
        `${API_URL}/get-previous-OtherPurchase?Company_Code=${companyCode}&Year_Code=${Year_Code}&Doc_No=${formData.Doc_No}`
      );
      if (response.ok) {
        const data = await response.json();
        SupplierName = data.label_names[0].SupplierName;
        SupplierCode = data.previous_OtherPurchase_data.Supplier_Code;
        Exp_Ac_Name = data.label_names[0].ExpAcName;
        Exp_Ac_Code = data.previous_OtherPurchase_data.Exp_Ac;
        TDSCutAcName = data.label_names[0].TDSCutAcName;
        TDSCutAcCode = data.previous_OtherPurchase_data.TDS_Cutt_AcCode;
        TDSAcName = data.label_names[0].tdsacname;
        TDSAcCodeNew = data.previous_OtherPurchase_data.TDS_AcCode;
        GStrateName = data.label_names[0].GST_Name;
        GStrateCode = data.previous_OtherPurchase_data.GST_RateCode;
        setFormData({
          ...formData,
          ...data.previous_OtherPurchase_data,
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
        `${API_URL}/get-next-OtherPurchase?Company_Code=${companyCode}&Year_Code=${Year_Code}&Doc_No=${formData.Doc_No}`
      );
      if (response.ok) {
        const data = await response.json();
        SupplierName = data.label_names[0].SupplierName;
        SupplierCode = data.next_OtherPurchase_data.Supplier_Code;
        Exp_Ac_Name = data.label_names[0].ExpAcName;
        Exp_Ac_Code = data.next_OtherPurchase_data.Exp_Ac;
        TDSCutAcName = data.label_names[0].TDSCutAcName;
        TDSCutAcCode = data.next_OtherPurchase_data.TDS_Cutt_AcCode;
        TDSAcName = data.label_names[0].tdsacname;
        TDSAcCodeNew = data.next_OtherPurchase_data.TDS_AcCode;
        GStrateName = data.label_names[0].GST_Name;
        GStrateCode = data.next_OtherPurchase_data.GST_RateCode;
        setFormData({
          ...formData,
          ...data.next_OtherPurchase_data,
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
      const response = await fetch(`${API_URL}/get-OtherPurchase-lastRecordNavigation?Company_Code=${companyCode}&Year_Code=${Year_Code}`);
      if (response.ok) {
        const data = await response.json();
        SupplierName = data.label_names[0].SupplierName;
        SupplierCode = data.last_OtherPurchase_data.Supplier_Code;
        Exp_Ac_Name = data.label_names[0].ExpAcName;
        Exp_Ac_Code = data.last_OtherPurchase_data.Exp_Ac;
        TDSCutAcName = data.label_names[0].TDSCutAcName;
        TDSCutAcCode = data.last_OtherPurchase_data.TDS_Cutt_AcCode;
        TDSAcName = data.label_names[0].tdsacname;
        TDSAcCodeNew = data.last_OtherPurchase_data.TDS_AcCode;
        GStrateName = data.label_names[0].GST_Name;
        GStrateCode = data.last_OtherPurchase_data.GST_RateCode;
        setFormData({
          ...formData,
          ...data.last_OtherPurchase_data,
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

  //Helper Compoents Function For manage the labels 
  const handleSupplier = (code, accoid) => {
    setSupplier(code);
    console.log("Code,accoid", code, accoid)
    setFormData({
      ...formData,
      Supplier_Code: code,
      sc: accoid
    });
  }

  const handleExpAc = (code, accoid) => {
    setExp_Ac(code);
    console.log("Code,accoid", code, accoid)
    setFormData({
      ...formData,
      Exp_Ac: code,
      ea: accoid
    });
  }
  const handleTDSCutting = (code, accoid) => {
    setTDSCuttAcCode(code);
    console.log("Code,accoid", code, accoid)
    setFormData({
      ...formData,
      TDS_Cutt_AcCode: code,
      tca: accoid
    });
  }
  const handleTDSAc = (code, accoid) => {
    setTDSAcCode(code);
    console.log("Code,accoid", code, accoid)
    setFormData({
      ...formData,
      TDS_AcCode: code,
      tac: accoid
    });
  }

  const handleGstRateCode = (code) => {
    setgstRateCode(code);
    setFormData({
      ...formData,
      GST_RateCode: code,
    });
  }


  //Set focus functionality After First Time Page Load
  const lastFocusableElementRef = useRef(null);
  useEffect(() => {
    // Focus the first input field when the component mounts
    document.getElementById('Doc_Date').focus();
  }, []);

  const handleKeyDownNew = (e) => {
    // Handle Tab key press
    if (e.key === 'Tab' && lastFocusableElementRef.current && document.activeElement === lastFocusableElementRef.current) {
      e.preventDefault();
      document.getElementById('Doc_Date').focus();
    }
  };


  return (
    <>
      <div className="container" >
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
          />
        </div>
      </div>
      <div className="form-container-New" onKeyDown={handleKeyDownNew}>
        <form>
          <h2>Other Purchase</h2>
          <br />
          <div className="form-group">
            <label htmlFor="changeNo">Change No:</label>
            <input
              type="text"
              id="changeNo"
              Name="changeNo"
              onKeyDown={handleKeyDown}
              disabled={!addOneButtonEnabled}
            />
          </div>
          <div className="form-group">
            <label htmlFor="Doc_No">Entry No:</label>
            <input
              type="text"
              id="Doc_No"
              Name="Doc_No"
              value={formData.Doc_No}
              onChange={handleChange}
              disabled
            />
          </div>
          <div className="form-group ">
            <label htmlFor="Doc_Date">Date:</label>
            <input
              type="date"
              id="Doc_Date"
              Name="Doc_Date"
              value={formData.Doc_Date}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={1}
            />
          </div>
          <div className="form-group-row">
            <label htmlFor="Supplier_Code">Supplier:</label>
            <div className="form-group-item">

              <AccountMasterHelp onAcCodeClick={handleSupplier}
                CategoryName={SupplierName} CategoryCode={SupplierCode}
                name="Supplier_Code"
                tabIndexHelp={2}
                disabledFeild={!isEditing && addOneButtonEnabled} />
            </div>
            <label htmlFor="Exp_Ac">Exp A/C:</label>
            <div className="form-group-item">

              <AccountMasterHelp onAcCodeClick={handleExpAc} CategoryName={Exp_Ac_Name}
                CategoryCode={Exp_Ac_Code} name="Exp_Ac" tabIndexHelp={4} disabledFeild={!isEditing && addOneButtonEnabled} />
            </div>
            <label htmlFor="Gst_Rate">GST Code:</label>
            <div className="form-group-item">

              <GSTRateMasterHelp onAcCodeClick={handleGstRateCode} GstRateName={GStrateName}
                GstRateCode={GStrateCode} name="Gst_Rate" tabIndexHelp={6} disabledFeild={!isEditing && addOneButtonEnabled} />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="Taxable_Amount">Taxable Amount:</label>
            <input
              type="text"
              id="Taxable_Amount"
              Name="Taxable_Amount"
              value={formData.Taxable_Amount !== null ? formData.Taxable_Amount : ""}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={8}
            />
            {formErrors.Taxable_Amount && <span className="error">{formErrors.Taxable_Amount}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="CGST_Rate">CGST %:</label>
            <input
              type="text"
              id="CGST_Rate"
              Name="CGST_Rate"
              value={formData.CGST_Rate !== null ? formData.CGST_Rate : ""}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={9}
            />
            {formErrors.CGST_Rate && <span className="error">{formErrors.CGST_Rate}</span>}
            <input
              type="text"
              id="CGST_Amount"
              Name="CGST_Amount"
              value={formData.CGST_Amount !== null ? formData.CGST_Amount : ""}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={10}
            />
            {formErrors.CGST_Amount && <span className="error">{formErrors.CGST_Amount}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="SGST_Rate">SGST %:</label>
            <input
              type="text"
              id="SGST_Rate"
              Name="SGST_Rate"
              value={formData.SGST_Rate !== null ? formData.SGST_Rate : ""}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={11}
            />
            {formErrors.SGST_Rate && <span className="error">{formErrors.SGST_Rate}</span>}
            <input
              type="text"
              id="SGST_Amount"
              Name="SGST_Amount"
              value={formData.SGST_Amount !== null ? formData.SGST_Amount : ""}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={12}
            />
            {formErrors.SGST_Amount && <span className="error">{formErrors.SGST_Amount}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="IGST_Rate">IGST %:</label>
            <input
              type="text"
              id="IGST_Rate"
              Name="IGST_Rate"
              value={formData.IGST_Rate !== null ? formData.IGST_Rate : ""}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={13}
            />
            {formErrors.IGST_Rate && <span className="error">{formErrors.IGST_Rate}</span>}
            <input
              type="text"
              id="IGST_Amount"
              Name="IGST_Amount"
              value={formData.IGST_Amount !== null ? formData.IGST_Amount : ""}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={14}
            />
            {formErrors.IGST_Amount && <span className="error">{formErrors.IGST_Amount}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="Other_Amount">Other Amount:</label>
            <input
              type="text"
              id="Other_Amount"
              Name="Other_Amount"
              value={formData.Other_Amount !== null ? formData.Other_Amount : ""}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={15}
            />

            <div className="form-group">
              <label htmlFor="Bill_Amount">Bill Amount:</label>
              <input
                type="text"
                id="Bill_Amount"
                Name="Bill_Amount"
                value={formData.Bill_Amount !== null ? formData.Bill_Amount : ""}
                onChange={handleChange}
                disabled={!isEditing && addOneButtonEnabled}
                tabIndex={16}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="TDS_Amt">TDS Amount:</label>
            <input
              type="text"
              id="TDS_Amt"
              Name="TDS_Amt"
              value={formData.TDS_Amt !== null ? formData.TDS_Amt : ""}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={17}
            />
          </div>

          <div className="form-group">
            <label htmlFor="TDS_Per">TDS %:</label>
            <input
              type="text"
              id="TDS_Per"
              Name="TDS_Per"
              value={formData.TDS_Per !== null ? formData.TDS_Per : ""}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={18}
            />

            <div className="form-group">
              <label htmlFor="TDS">TDS:</label>
              <input
                type="text"
                id="TDS"
                Name="TDS"
                value={formData.TDS !== null ? formData.TDS : ""}
                onChange={handleChange}
                disabled={!isEditing && addOneButtonEnabled}
                tabIndex={19}
              />
            </div>
          </div>


          <div className="form-group-row">
            <label htmlFor="TDS_Ac_Cutt">TDS Cutting Ac:</label>
            <div className="form-group-item">

              <AccountMasterHelp onAcCodeClick={handleTDSCutting} CategoryName={TDSCutAcName} CategoryCode={TDSCutAcCode}
                name="TDS_Ac_Cutt" tabIndexHelp={20} disabledFeild={!isEditing && addOneButtonEnabled} />
            </div>
            <label htmlFor="TDS_Ac">TDS Ac:</label>
            <div className="form-group-item">

              <AccountMasterHelp onAcCodeClick={handleTDSAc} CategoryName={TDSAcName} CategoryCode={TDSAcCodeNew}
                name="TDS_Ac" tabIndexHelp={22} disabledFeild={!isEditing && addOneButtonEnabled} />
            </div>

          </div>


          <div className="form-group">
            <label htmlFor="billno">Bill No:</label>
            <input
              type="text"
              id="billno"
              Name="billno"
              value={formData.billno}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={23}
            />
          </div>
          <div className="form-group">
            <label htmlFor="ASN_No">ASN No:</label>
            <input
              type="text"
              id="ASN_No"
              Name="ASN_No"
              value={formData.ASN_No}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={24}
            />
          </div>
          <div className="form-group">
            <label htmlFor="einvoiceno">EInvoice No:</label>
            <input
              type="text"
              id="einvoiceno"
              Name="einvoiceno"
              value={formData.einvoiceno}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={25}
            />
          </div>

          <div className="form-group">
            <label htmlFor="einvoiceno">Narration:</label>
            <input
              type="text"
              id="Narration"
              Name="Narration"
              value={formData.Narration}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={26}
            />
          </div>
        </form>
      </div>
    </>
  );
};
export default OtherPurchase;
