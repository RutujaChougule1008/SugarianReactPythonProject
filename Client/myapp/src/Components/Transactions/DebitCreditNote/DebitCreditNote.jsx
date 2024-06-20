import React, { useState, useRef, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import GSTRateMasterHelp from "../../../Helper/GSTRateMasterHelp";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import ActionButtonGroup from '../../../Common/CommonButtons/ActionButtonGroup';
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import SystemHelpMaster from "../../../Helper/SystemmasterHelp";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./DebitCreditNote.css"
import { HashLoader } from 'react-spinners';
import { z } from "zod";

//Validation Part Using Zod Library
const stringToNumber = z
.string()
.refine(value => !isNaN(Number(value)), { message: "This field must be a number" })
.transform(value => Number(value));

//Validation Schemas
const DebitCreditNoteSchema = z.object({
texable_amount: stringToNumber
.refine(value => value !== undefined && value >= 0),
// cgst_rate: stringToNumber
// .refine(value => value !== undefined && value >= 0),
// cgst_amount: stringToNumber
// .refine(value => value !== undefined && value >= 0),
// sgst_rate: stringToNumber
// .refine(value => value !== undefined && value >= 0),
// sgst_amount: stringToNumber
// .refine(value => value !== undefined && value >= 0),
// igst_rate: stringToNumber
// .refine(value => value !== undefined && value >= 0),
// igst_amount: stringToNumber
// .refine(value => value !== undefined && value >= 0),
bill_amount: stringToNumber
.refine(value => value !== undefined && value >= 0),
// TCS_Rate: stringToNumber
// .refine(value => value !== undefined && value >= 0),
// TCS_Amt: stringToNumber
// .refine(value => value !== undefined && value >= 0),
TCS_Net_Payable: stringToNumber
.refine(value => value !== undefined && value >= 0),
// TDS_Rate: stringToNumber
// .refine(value => value !== undefined && value >= 0),
// TDS_Amt: stringToNumber
// .refine(value => value !== undefined && value >= 0),
// misc_amount: stringToNumber
// .refine(value => value !== undefined && value >= 0),
});

//Global Variables
var newDcid = ""
var BillFromName = ""
var BillFormCode = ""
var BillToName = ""
var BillToCode = ""
var GSTName = ""
var GSTCode = ""
var MillName = ""
var MillCode = ""
var ShipToName = ""
var ShipToCode = ""
var ExpAcaccountName = ""
var ExpAcaccountCode = ""
var ItemCodeName = ""
var ItemCodeDetail = ""
var selectedfilter = ""
var HSN = ""

const API_URL = process.env.REACT_APP_API;
const companyCode = sessionStorage.getItem("Company_Code");
const Year_Code = sessionStorage.getItem("Year_Code");

const DebitCreditNote = () => {
    //Detail Help State Management
    const [users, setUsers] = useState([]);
    const [showPopup, setShowPopup] = useState(false);
    const [selectedUser, setSelectedUser] = useState({});
    const [deleteMode, setDeleteMode] = useState(false);
    const [expacCode, setExpacCode] = useState("");
    const [expacAccoid, setExpacAccoid] = useState("");
    const [itemCode, setItemCode] = useState("");
    const [itemCodeAccoid, setItemCodeAccoid] = useState("");
    const [hsnNo, setHSNNo] = useState("");
    const [formDataDetail, setFormDataDetail] = useState({
        value: 0.00,
        Quantal: ""
    });

    //Head Section State Managements
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
    const [lastTenderDetails, setLastTenderDetails] = useState([]);
    const [lastTenderData, setLastTenderData] = useState({});
    const [formErrors, setFormErrors] = useState({});

    //In utility page record doubleClicked that recod show for edit functionality
    const location = useLocation();
    const selectedRecord = location.state?.selectedRecord;
    const navigate = useNavigate();
    const setFocusTaskdate = useRef(null);
    selectedfilter = location.state?.selectedfilter;
    const [tranType, setTranType] = useState(selectedfilter)
    const [isHandleChange, setIsHandleChange] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const initialFormData = {
        doc_no: "",
        doc_date: new Date().toISOString().split('T')[0],
        ac_code: "",
        bill_no: "",
        bill_date: new Date().toISOString().split('T')[0],
        bill_id: "",
        bill_type: "",
        texable_amount: null,
        gst_code: "",
        cgst_rate: 0.00,
        cgst_amount: 0.00,
        sgst_rate: 0.00,
        sgst_amount: 0.00,
        igst_rate: 0.00,
        igst_amount: 0.00,
        bill_amount: 0.00,
        Company_Code: companyCode,
        Year_Code: Year_Code,
        Branch_Code: "",
        Created_By: "",
        Modified_By: "",
        misc_amount: 0.00,
        ac: "",
        ASNNO: "",
        Ewaybillno: "",
        Narration: "",
        Shit_To: "",
        Mill_Code: "",
        st: "",
        mc: "",
        ackno: "",
        Unit_Code: "",
        uc: "",
        TCS_Rate: 0.00,
        TCS_Amt: 0.00,
        TCS_Net_Payable: 0.00,
        TDS_Rate: 0.00,
        TDS_Amt: 0.00,
        IsDeleted: 1,
    }

    //Head data functionality code.
    const [formData, setFormData] = useState(initialFormData);
    const [billFrom, setBillFrom] = useState("");
    const [billTo, setBillTo] = useState("");
    const [mill, setMill] = useState("");
    const [shipTo, setShipTo] = useState("");
    const [gstCode, setGstCode] = useState("");

    const handleChange = (event) => {
        const { name, value } = event.target;
        console.log("handleChange", { name, value });
        // Call validateField to validate the field value
        validateField(name, value);
        if (name === "tran_type") {
            console.log("Selected tran_type:", value);
            setTranType(value);
            setIsHandleChange(true);

        } else {
            setFormData((prevState) => ({
                ...prevState,
                [name]: value

            }));
        }
    };

    useEffect(() => {
        if (isHandleChange) {
            handleCancel();
            setIsHandleChange(false);
        }
        setFocusTaskdate.current.focus();
    }, [tranType]);

    //Validation Part
    const validateField = (name, value) => {
        try {
            DebitCreditNoteSchema.pick({ [name]: true }).parse({ [name]: value });
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
            DebitCreditNoteSchema.parse(formData);
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

    //Fetch Last Record Doc No from database
    const fetchLastRecord = () => {
        fetch(`${API_URL}/get-lastdebitcreditnotedata?Company_Code=${companyCode}&Year_Code=${Year_Code}&tran_type=${tranType}`)
            .then((response) => {
                console.log("response", response);
                if (!response.ok) {
                    throw new Error("Failed to fetch last record");
                }
                return response.json();
            })
            .then((data) => {
                const newDocNo = data.last_head_data && data.last_head_data.doc_no ? data.last_head_data.doc_no + 1 : 1;
                setFormData((prevState) => ({
                    ...prevState,
                    doc_no: newDocNo,
                }));
                setTranType(data.last_head_data && data.last_head_data.tran_type ? data.last_head_data.tran_type : tranType);
            })
            .catch((error) => {
                console.error("Error fetching last record:", error);
            });
    };

    //handle Add button Functionality
    const handleAddOne = async () => {
        setAddOneButtonEnabled(false);
        setSaveButtonEnabled(true);
        setCancelButtonEnabled(true);
        setEditButtonEnabled(false);
        setDeleteButtonEnabled(false);
        setIsEditMode(false);
        setIsEditing(true);
        fetchLastRecord()
        setFormData(initialFormData)
        setTranType()
        BillFromName = ""
        BillFormCode = ""
        BillToName = ""
        BillToCode = ""
        GSTName = ""
        GSTCode = ""
        MillName = ""
        MillCode = ""
        ShipToName = ""
        ShipToCode = ""
        setLastTenderDetails([])
    };

    //handle Edit button Functionality
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

    //handle New record insert in datatbase and update the record Functionality
    const handleSaveOrUpdate = async () => {
        if (!validateForm()) return;
        setIsEditing(true);
        setIsLoading(true);

        const headData = {
            ...formData,
            tran_type: tranType
        };

        // Remove dcid from headData if in edit mode
        if (isEditMode) {
            delete headData.dcid;
        }
        const detailData = users.map((user) => ({
            rowaction: user.rowaction,
            dcdetailid: user.dcdetailid,
            expac_code: user.expac_code,
            tran_type: tranType,
            value: user.value,
            expac: user.expac,
            detail_Id: 1,
            company_code: companyCode,
            year_code: Year_Code,
            Item_Code: user.Item_Code,
            Quantal: user.Quantal,
            ic: user.ic
        }));

        const requestData = {
            headData,
            detailData,
        };

        try {
            if (isEditMode) {
                const updateApiUrl = `${API_URL}/update-debitCreditnote?dcid=${newDcid}`;
                const response = await axios.put(updateApiUrl, requestData);

                toast.success('Data updated successfully!');
                setTimeout(() => {
                    window.location.reload();
                }, 1000)

            } else {
                const response = await axios.post(
                    `${API_URL}/insert-debitcreditnote`,
                    requestData
                );
                toast.success('Data saved successfully!');
                setIsEditMode(false);
                setAddOneButtonEnabled(true);
                setEditButtonEnabled(true);
                setDeleteButtonEnabled(true);
                setBackButtonEnabled(true);
                setSaveButtonEnabled(false);
                setCancelButtonEnabled(false);
                setIsEditing(true);

                setTimeout(() => {
                    window.location.reload();
                }, 1000)

            }
        } catch (error) {
            console.error("Error during API call:", error);
            toast.error("Error occurred while saving data");
        } finally {
            setIsEditing(false);
            setIsLoading(false);
        }
    };

    //handle Delete the record from database functionality
    const handleDelete = async () => {
        const isConfirmed = window.confirm(
            `Are you sure you want to delete this record ${formData.doc_no}?`
        );
        if (isConfirmed) {
            setIsEditMode(false);
            setAddOneButtonEnabled(true);
            setEditButtonEnabled(true);
            setDeleteButtonEnabled(true);
            setBackButtonEnabled(true);
            setSaveButtonEnabled(false);
            setCancelButtonEnabled(false);
            setIsLoading(true);
            try {
                const deleteApiUrl = `${API_URL}/delete_data_by_dcid?dcid=${newDcid}&Company_Code=${companyCode}&doc_no=${formData.doc_no}&Year_Code=${Year_Code}&tran_type=${tranType}`;
                const response = await axios.delete(deleteApiUrl);

                if (response.status === 200) {
                    // console.log("Record deleted successfully");
                    if (response.data) {
                        toast.success('Data delete successfully!');
                        handleCancel();
                    }
                    else if (response.status === 404) {
                    }
                } else {
                    console.error(
                        "Failed to delete tender:",
                        response.status,
                        response.statusText
                    );
                }
            } catch (error) {
                console.error("Error during API call:", error);
            } finally {
                setIsLoading(false)
            }
        } else {
            console.log("Deletion cancelled");
        }
    };

    // handleCancel button cliked show the last record for edit functionality
    const handleCancel = async () => {
        setIsEditing(false);
        setIsEditMode(false);
        setAddOneButtonEnabled(true);
        setEditButtonEnabled(true);
        setDeleteButtonEnabled(true);
        setBackButtonEnabled(true);
        setSaveButtonEnabled(false);
        setCancelButtonEnabled(false);
        setCancelButtonClicked(true);
        try {
            const response = await axios.get(
                `${API_URL}/get-lastdebitcreditnotedata?Company_Code=${companyCode}&Year_Code=${Year_Code}&tran_type=${tranType}`
            );
            if (response.status === 200) {
                const data = response.data;
                newDcid = data.last_head_data.dcid
                BillFromName = data.last_details_data[0].BillFromName;
                BillFormCode = data.last_head_data.ac_code;
                ShipToName = data.last_details_data[0].UnitAcName;
                ShipToCode = data.last_head_data.Unit_Code;
                BillToName = data.last_details_data[0].ShipToName;
                BillToCode = data.last_head_data.Shit_To;
                GSTName = data.last_details_data[0].GST_Name;
                GSTCode = data.last_head_data.gst_code;
                MillName = data.last_details_data[0].MillName;
                MillCode = data.last_head_data.Mill_Code;
                ExpAcaccountName = data.last_details_data[0].expacaccountname;
                ExpAcaccountCode = data.last_details_data[0].expac_code;
                ItemCodeName = data.last_details_data[0].Item_Name;
                ItemCodeDetail = data.last_details_data[0].Item_Code;
                HSN = data.last_details_data[0].HSN
                // Ensure all fields are updated correctly
                setFormData((prevData) => ({
                    ...prevData,
                    ...data.last_head_data
                }));
                setLastTenderData(data.last_head_data || {});
                setLastTenderDetails(data.last_details_data || []);
            } else {
                console.error(
                    "Failed to fetch last data:",
                    response.status,
                    response.statusText
                );
            }
        } catch (error) {
            console.error("Error during API call:", error);
        }
    };

    //handle back to Utility page.
    const handleBack = () => {
        navigate("/debitcreditnote-utility")
    };

    //Navigation Functionality to show first,previous,next and last record functionality
    const handleFirstButtonClick = async () => {
        try {
            const response = await axios.get(`${API_URL}/get-firstdebitcredit-navigation?Company_Code=${companyCode}&Year_Code=${Year_Code}&tran_type=${tranType}`);
            if (response.status === 200) {
                const data = response.data;
                newDcid = data.last_head_data.dcid
                BillFromName = data.last_details_data[0].BillFromName;
                BillFormCode = data.last_head_data.ac_code;
                ShipToName = data.last_details_data[0].UnitAcName;
                ShipToCode = data.last_head_data.Unit_Code;
                BillToName = data.last_details_data[0].ShipToName;
                BillToCode = data.last_head_data.Shit_To;
                GSTName = data.last_details_data[0].GST_Name;
                GSTCode = data.last_head_data.gst_code;
                MillName = data.last_details_data[0].MillName;
                MillCode = data.last_head_data.Mill_Code;
                ExpAcaccountName = data.last_details_data[0].expacaccountname;
                ExpAcaccountCode = data.last_details_data[0].expac_code;
                ItemCodeName = data.last_details_data[0].Item_Name;
                ItemCodeDetail = data.last_details_data[0].Item_Code;
                // Ensure all fields are updated correctly
                setFormData((prevData) => ({
                    ...prevData,
                    ...data.last_head_data
                }));
                setLastTenderData(data.last_head_data || {});
                setLastTenderDetails(data.last_details_data || []);
            } else {
                console.error("Failed to fetch first tender data:", response.status, response.statusText);
            }
        } catch (error) {
            console.error("Error during API call:", error);
        }
    };

    // Function to fetch the last record
    const handleLastButtonClick = async () => {
        try {
            const response = await axios.get(`${API_URL}/get-lastdebitcredit-navigation?Company_Code=${companyCode}&Year_Code=${Year_Code}&tran_type=${tranType}`);
            if (response.status === 200) {
                const data = response.data;
                newDcid = data.last_head_data.dcid
                BillFromName = data.last_details_data[0].BillFromName;
                BillFormCode = data.last_head_data.ac_code;
                ShipToName = data.last_details_data[0].UnitAcName;
                ShipToCode = data.last_head_data.Unit_Code;
                BillToName = data.last_details_data[0].ShipToName;
                BillToCode = data.last_head_data.Shit_To;
                GSTName = data.last_details_data[0].GST_Name;
                GSTCode = data.last_head_data.gst_code;
                MillName = data.last_details_data[0].MillName;
                MillCode = data.last_head_data.Mill_Code;
                ExpAcaccountName = data.last_details_data[0].expacaccountname;
                ExpAcaccountCode = data.last_details_data[0].expac_code;
                ItemCodeName = data.last_details_data[0].Item_Name;
                ItemCodeDetail = data.last_details_data[0].Item_Code;
                // Ensure all fields are updated correctly
                setFormData((prevData) => ({
                    ...prevData,
                    ...data.last_head_data
                }));
                setLastTenderData(data.last_head_data || {});
                setLastTenderDetails(data.last_details_data || []);

            } else {
                console.error("Failed to fetch last tender data:", response.status, response.statusText);
            }
        } catch (error) {
            console.error("Error during API call:", error);
        }
    };

    // Function to fetch the next record
    const handleNextButtonClick = async () => {
        try {
            const response = await axios.get(`${API_URL}/get-nextdebitcreditnote-navigation?Company_Code=${companyCode}&Year_Code=${Year_Code}&tran_type=${tranType}&doc_no=${formData.doc_no}`);
            if (response.status === 200) {
                const data = response.data;
                newDcid = data.last_head_data.dcid
                BillFromName = data.last_details_data[0].BillFromName;
                BillFormCode = data.last_head_data.ac_code;
                ShipToName = data.last_details_data[0].UnitAcName;
                ShipToCode = data.last_head_data.Unit_Code;
                BillToName = data.last_details_data[0].ShipToName;
                BillToCode = data.last_head_data.Shit_To;
                GSTName = data.last_details_data[0].GST_Name;
                GSTCode = data.last_head_data.gst_code;
                MillName = data.last_details_data[0].MillName;
                MillCode = data.last_head_data.Mill_Code;
                ExpAcaccountName = data.last_details_data[0].expacaccountname;
                ExpAcaccountCode = data.last_details_data[0].expac_code;
                ItemCodeName = data.last_details_data[0].Item_Name;
                ItemCodeDetail = data.last_details_data[0].Item_Code;
                // Ensure all fields are updated correctly
                setFormData((prevData) => ({
                    ...prevData,
                    ...data.last_head_data
                }));
                setLastTenderData(data.last_head_data || {});
                setLastTenderDetails(data.last_details_data || []);
            } else {
                console.error("Failed to fetch next tender data:", response.status, response.statusText);
            }
        } catch (error) {
            console.error("Error during API call:", error);
        }
    };

    // Function to fetch the previous record
    const handlePreviousButtonClick = async () => {
        try {
            // Use formData.Tender_No as the current tender number
            const response = await axios.get(`${API_URL}/get-previousDebitcreditnote-navigation?Company_Code=${companyCode}&Year_Code=${Year_Code}&tran_type=${tranType}&doc_no=${formData.doc_no}`);

            if (response.status === 200) {
                const data = response.data;
                newDcid = data.last_head_data.dcid
                BillFromName = data.last_details_data[0].BillFromName;
                BillFormCode = data.last_head_data.ac_code;
                ShipToName = data.last_details_data[0].UnitAcName;
                ShipToCode = data.last_head_data.Unit_Code;
                BillToName = data.last_details_data[0].ShipToName;
                BillToCode = data.last_head_data.Shit_To;
                GSTName = data.last_details_data[0].GST_Name;
                GSTCode = data.last_head_data.gst_code;
                MillName = data.last_details_data[0].MillName;
                MillCode = data.last_head_data.Mill_Code;
                ExpAcaccountName = data.last_details_data[0].expacaccountname;
                ExpAcaccountCode = data.last_details_data[0].expac_code;
                ItemCodeName = data.last_details_data[0].Item_Name;
                ItemCodeDetail = data.last_details_data[0].Item_Code;
                // Ensure all fields are updated correctly
                setFormData((prevData) => ({
                    ...prevData,
                    ...data.last_head_data
                }));
                setLastTenderData(data.last_head_data || {});
                setLastTenderDetails(data.last_details_data || []);
            } else {
                console.error("Failed to fetch previous tender data:", response.status, response.statusText);
            }
        } catch (error) {
            console.error("Error during API call:", error);
        }
    };

    // Handle form submission (you can modify this based on your needs)
    const handleSubmit = (event) => {
        event.preventDefault();
    };

    useEffect(() => {
        if (selectedRecord) {
            handlerecordDoubleClicked();
        } else {
            handleAddOne();
        }
    }, [selectedRecord]);

    //After Record DoubleClicked on utility page show that record on User Creation for Edit Mode
    const handlerecordDoubleClicked = async () => {
        setIsEditing(false);
        setIsEditMode(false);
        setAddOneButtonEnabled(true);
        setEditButtonEnabled(true);
        setDeleteButtonEnabled(true);
        setBackButtonEnabled(true);
        setSaveButtonEnabled(false);
        setCancelButtonEnabled(false);
        setCancelButtonClicked(true);
        try {
            const response = await axios.get(`${API_URL}/getdebitcreditByid?doc_no=${selectedRecord.doc_no}&Company_Code=${companyCode}&Year_Code=${Year_Code}&tran_type=${selectedRecord.tran_type}`);
            if (response.status === 200) {
                const data = response.data;
                newDcid = data.last_head_data.dcid
                BillFromName = data.last_details_data[0].BillFromName;
                BillFormCode = data.last_head_data.ac_code;
                ShipToName = data.last_details_data[0].UnitAcName;
                ShipToCode = data.last_head_data.Unit_Code;
                BillToName = data.last_details_data[0].ShipToName;
                BillToCode = data.last_head_data.Shit_To;
                GSTName = data.last_details_data[0].GST_Name;
                GSTCode = data.last_head_data.gst_code;
                MillName = data.last_details_data[0].MillName;
                MillCode = data.last_head_data.Mill_Code;
                ExpAcaccountName = data.last_details_data[0].expacaccountname;
                ExpAcaccountCode = data.last_details_data[0].expac_code;
                ItemCodeName = data.last_details_data[0].Item_Name;
                ItemCodeDetail = data.last_details_data[0].Item_Code;
                // Update form data with the last tender data
                setFormData((prevData) => ({
                    ...prevData,
                    ...data.last_head_data
                }));
                setTranType(selectedRecord.tran_type)
                setLastTenderData(data.last_head_data || {});
                setLastTenderDetails(data.last_details_data || []);
            } else {
                console.error("Failed to fetch last tender data:", response.status, response.statusText);
            }
        } catch (error) {
            console.error("Error during API call:", error);
        }
    };

    //change No functionality to get that particular record
    const handleKeyDown = async (event) => {
        if (event.key === "Tab") {
            const changeNoValue = event.target.value;
            try {
                const response = await axios.get(
                    `${API_URL}/getdebitcreditByid?Company_Code=${companyCode}&doc_no=${changeNoValue}&tran_type=${tranType}&Year_Code=${Year_Code}`
                );
                const data = response.data
                BillFromName = data.last_details_data[0].BillFromName;
                BillFormCode = data.last_head_data.ac_code;
                ShipToName = data.last_details_data[0].UnitAcName;
                ShipToCode = data.last_head_data.Unit_Code;
                BillToName = data.last_details_data[0].ShipToName;
                BillToCode = data.last_head_data.Shit_To;
                GSTName = data.last_details_data[0].GST_Name;
                GSTCode = data.last_head_data.gst_code;
                MillName = data.last_details_data[0].MillName;
                MillCode = data.last_head_data.Mill_Code;
                ExpAcaccountName = data.last_details_data[0].expacaccountname;
                ExpAcaccountCode = data.last_details_data[0].expac_code;
                ItemCodeName = data.last_details_data[0].Item_Name;
                ItemCodeDetail = data.last_details_data[0].Item_Code;
                setFormData({
                    ...formData,
                    ...data.last_head_data,
                });
                setLastTenderData(data.last_head_data || {});
                setLastTenderDetails(data.last_details_data || []);
                // setTranType(selectedRecord.tran_type)
                //setFormData(data);
                setIsEditing(false);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        }
    };

    //detail Grid Functionality......
    useEffect(() => {
        if (selectedRecord) {
            setUsers(
                lastTenderDetails.map((detail) => ({
                    Item_Code: detail.Item_Code,
                    rowaction: "Normal",
                    expac_code: detail.expac_code,
                    expac: detail.expac,
                    ic: detail.ic,
                    id: detail.dcdetailid,
                    dcdetailid: detail.dcdetailid,
                    value: detail.value,
                    HSN: detail.HSN,
                    Quantal: detail.Quantal
                }))
            );
        }
    }, [selectedRecord, lastTenderDetails]);

    useEffect(() => {
        setUsers(
            lastTenderDetails.map((detail) => ({
                Item_Code: detail.Item_Code,
                rowaction: "Normal",
                expac_code: detail.expac_code,
                expac: detail.expac,
                ic: detail.ic,
                id: detail.dcdetailid,
                dcdetailid: detail.dcdetailid,
                value: detail.value,
                HSN: detail.HSN,
                Quantal: detail.Quantal
            }))
        );
    }, [lastTenderDetails]);

    // Function to handle changes in the form fields
    const handleChangeDetail = (event) => {
        const { name, value } = event.target;
        setFormDataDetail({
            ...formDataDetail,
            [name]: value
        });
    };

    //open popup function
    const openPopup = () => {
        setShowPopup(true);
    };

    //close popup function
    const closePopup = () => {
        setShowPopup(false);
        setSelectedUser({});
        clearForm();
    };

    const clearForm = () => {
        setFormDataDetail({
            value: "",
            HSN: "",
            Quantal: ""
        });

    };

    const editUser = (user) => {
        setSelectedUser(user);
        setExpacCode(user.expac_code);
        setItemCode(user.Item_Code);
        setFormDataDetail({
            value: user.value || "",
            HSN: user.HSN || "",
            Quantal: user.Quantal || ""
        });
        openPopup();
    };

    const addUser = () => {
        const newUser = {
            id: users.length > 0 ? Math.max(...users.map((user) => user.id)) + 1 : 1,
            expac_code: expacCode,
            expac: expacAccoid,
            ic: itemCodeAccoid,
            Item_Code: itemCode,
            ic: itemCodeAccoid,
            HSN: HSN,
            ...formDataDetail,
            rowaction: "add",
        };
        setUsers([...users, newUser]);
        closePopup();
    };

    //Update User On Grid
    const updateUser = () => {
        const updatedUsers = users.map((user) => {
            if (user.id === selectedUser.id) {
                const updatedRowaction =
                    user.rowaction === "Normal" ? "update" : user.rowaction;
                return {
                    ...user,
                    expac_code: expacCode,
                    Item_Code: itemCode,
                    expac: expacAccoid,
                    value: formDataDetail.value,
                    HSN: HSN,
                    Quantal: formDataDetail.Quantal,
                    rowaction: updatedRowaction,
                };
            } else {
                return user;
            }
        });

        setUsers(updatedUsers);
        closePopup();
    };

    //Delete User On Grid
    const deleteModeHandler = (user) => {
        if (isEditMode && user.rowaction === "add") {
            setDeleteMode(true);
            setSelectedUser(user);
            const updatedUsers = users.map((u) =>
                u.id === user.id ? { ...u, rowaction: "DNU" } : u
            );
            setUsers(updatedUsers);
            setSelectedUser({});
        } else if (isEditMode) {
            setDeleteMode(true);
            setSelectedUser(user);
            const updatedUsers = users.map((u) =>
                u.id === user.id ? { ...u, rowaction: "delete" } : u
            );
            setUsers(updatedUsers);
            setSelectedUser({});
        } else {
            setDeleteMode(true);
            setSelectedUser(user);
            const updatedUsers = users.map((u) =>
                u.id === user.id ? { ...u, rowaction: "DNU" } : u
            );
            setUsers(updatedUsers);
            setSelectedUser({});
        }
    };

    //Functionality After delete record undo deleted record.
    const openDelete = (user) => {
        setDeleteMode(true);
        setSelectedUser(user);
        if (isEditMode && user.rowaction === "delete") {
            const updatedUsers = users.map((u) =>
                u.id === user.id ? { ...u, rowaction: "Normal" } : u
            );
            setUsers(updatedUsers);
            setSelectedUser({});
        } else {
            setDeleteMode(false);
            const updatedUsers = users.map((u) =>
                u.id === user.id ? { ...u, rowaction: "add" } : u
            );
            setUsers(updatedUsers);
            setSelectedUser({});
        }
    };

    //Functionality to help section to set the record.
    const handleItemCode = (code, accoid, HSN) => {
        setItemCode(code);
        setItemCodeAccoid(accoid)
        setHSNNo(HSN)
    };

    // Handle changes in the Mill_Code input (assuming SystemMasterHelp handles its own state
    const handleExpAcCode = (code, accoid) => {
        setExpacCode(code);
        setExpacAccoid(accoid)

        // Update expacAccoid for all users with the same expac_code
        const updatedUsers = users.map((user) => {
            if (user.expac_code === code) {
                return {
                    ...user,
                    expac: accoid,
                };
            }
            return user;
        });
        setUsers(updatedUsers);
    };

    //Head Section help Functions to manage the Ac_Code and accoid
    const handleBillFrom = (code, accoid) => {
        setBillFrom(code);
        setFormData({
            ...formData,
            ac_code: code,
            ac: accoid
        });
    }

    const handleBillNo = () => { }

    const handleBillTo = (code, accoid) => {
        setBillTo(code);
        setFormData({
            ...formData,
            Shit_To: code,
            st: accoid
        });
    }

    const handleMillData = (code, accoid) => {
        setMill(code);
        setFormData({
            ...formData,
            Mill_Code: code,
            mc: accoid
        });
    }

    const handleShipTo = (code, accoid) => {
        setShipTo(code);
        setFormData({
            ...formData,
            Unit_Code: code,
            uc: accoid
        });
    }

    const handleGstCode = (code, accoid) => {
        setGstCode(code);
        setFormData({
            ...formData,
            gst_code: code,
        });
    }

    return (
        <>
            <ToastContainer />
            <h3 className="mt-4 mb-4 text-center custom-heading">
                Debit Credit Note
            </h3>
            {/* Action button  */}
            <div className="container">
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

            {/* Head Part Form and Validation part */}
            <form className="debitCreditNote-container" onSubmit={handleSubmit}>
                <div className="debitCreditNote-row">
                    <label className="debitCreditNote-form-label">Change No:</label>
                    <div className="debitCreditNote-col-Text">
                        <div className="debitCreditNote-form-group">
                            <input
                                type="text"
                                className="debitCreditNote-form-control"
                                name="changeNo"
                                autoComplete="off"
                                onKeyDown={handleKeyDown}
                                disabled={!addOneButtonEnabled}
                            />
                        </div>
                    </div>
                    <label className="debitCreditNote-form-label">Entry No:</label>
                    <div className="debitCreditNote-col-Text">
                        <div className="debitCreditNote-form-group">
                            <input
                                ref={setFocusTaskdate}
                                type="text"
                                className="debitCreditNote-form-control"
                                name="doc_no"
                                autoComplete="off"
                                value={formData.doc_no}
                                onChange={handleChange}
                                disabled
                            />
                        </div>
                    </div>
                    <label htmlFor="tran_type" className="debitCreditNote-form-label">Type:</label>
                    <div className="debitCreditNote-col">
                        <div className="debitCreditNote-form-group-type">
                            <select id="tran_type" name="tran_type" className="debitCreditNote-custom-select" value={formData.tran_type}
                                onChange={handleChange}  >
                                <option value="DN">Debit Note To Customer</option>
                                <option value="CN">Credit Note To Customer</option>
                                <option value="DS">Debit Note To Supplier</option>
                                <option value="CS">Credit Note To Supplier</option>
                            </select>
                        </div>
                    </div>
                    <label className="debitCreditNote-form-label">Entry Date:</label>
                    <div className="debitCreditNote-col">
                        <div className="debitCreditNote-form-group">
                            <input
                                tabIndex="1"
                                ref={setFocusTaskdate}
                                type="date"
                                className="debitCreditNote-form-control"
                                id="datePicker"
                                name="doc_date"
                                value={formData.doc_date}
                                onChange={handleChange}
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                        </div>
                    </div>
                    <label htmlFor="Bill_From" className="debitCreditNote-form-label">Bill From:</label>
                    <div className="debitCreditNote-col">
                        <div className="debitCreditNote-form-group">
                            <AccountMasterHelp
                                onAcCodeClick={handleBillFrom}
                                CategoryName={BillFromName}
                                CategoryCode={BillFormCode}
                                name="Bill_From"
                                tabIndexHelp={2}
                              disabledFeild={!isEditing && addOneButtonEnabled}
                            />
                        </div>
                    </div>
                </div>
                <div className="debitCreditNote-row">
                    <label htmlFor="Bill_No" className="debitCreditNote-form-label">Bill No:</label>
                    <div className="debitCreditNote-col">
                        <div className="debitCreditNote-form-group">
                            <AccountMasterHelp
                                onAcCodeClick={handleBillNo}
                                CategoryName=""
                                CategoryCode=""
                                name="Bill_No"
                                tabIndexHelp={3}
                                disabledFeild={!isEditing && addOneButtonEnabled}
                            />
                        </div>
                    </div>
                    <label className="debitCreditNote-form-label">Bill Date:</label>
                    <div className="debitCreditNote-col">
                        <div className="debitCreditNote-form-group">
                            <input
                                tabIndex="4"
                                type="date"
                                className="debitCreditNote-form-control"
                                id="datePicker"
                                name="bill_date"
                                value={formData.bill_date}
                                onChange={handleChange}
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                        </div>
                    </div>
                    <label htmlFor="Bill_To" className="debitCreditNote-form-label">Bill To:</label>
                    <div className="debitCreditNote-col">
                        <div className="debitCreditNote-form-group">
                            <AccountMasterHelp
                                onAcCodeClick={handleBillTo}
                                CategoryName={BillToName}
                                CategoryCode={BillToCode}
                                name="Bill_To"
                                tabIndexHelp={5}
                                disabledFeild={!isEditing && addOneButtonEnabled}
                            />
                        </div>
                    </div>
                    <label htmlFor="Mill" className="debitCreditNote-form-label">Mill:</label>
                    <div className="debitCreditNote-col">
                        <div className="debitCreditNote-form-group">
                            <AccountMasterHelp
                                onAcCodeClick={handleMillData}
                                CategoryName={MillName}
                                CategoryCode={MillCode}
                                name="Mill"
                                tabIndexHelp={6}
                                disabledFeild={!isEditing && addOneButtonEnabled}
                            />
                        </div>
                    </div>
                    <label htmlFor="Ship_To" className="debitCreditNote-form-label">Ship To:</label>
                    <div className="debitCreditNote-col">
                        <div className="debitCreditNote-form-group">
                            <AccountMasterHelp
                                onAcCodeClick={handleShipTo}
                                CategoryName={ShipToName}
                                CategoryCode={ShipToCode}
                                name="Ship_To"
                                tabIndexHelp={7}
                                disabledFeild={!isEditing && addOneButtonEnabled}
                            />
                        </div>
                    </div>
                </div>

                {isLoading && (
                    <div className="loading-overlay">
                        <div className="spinner-container">
                            <HashLoader color="#007bff" loading={isLoading} size={80} />
                        </div>
                    </div>
                )}

                {/*detail part popup functionality and Validation part Grid view */}
                <div className="container mt-4">
                    <button
                        className="btn btn-primary"
                        onClick={openPopup}
                        disabled={!isEditing}
                        tabIndex="16"
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                openPopup();
                            }
                        }}
                    >
                        Add
                    </button>
                    <button
                        className="btn btn-danger"
                        disabled={!isEditing}
                        style={{ marginLeft: "10px" }}
                        tabIndex="17"
                    >
                        Close
                    </button>
                    {showPopup && (
                        <div
                            className="modal"

                            role="dialog"
                            style={{ display: "block" }}
                        >
                            <div className="modal-dialog" role="document">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h5 className="modal-title">
                                            {selectedUser.id ? "Edit User" : "Add User"}
                                        </h5>
                                        <button
                                            type="button"
                                            onClick={closePopup}
                                            aria-label="Close"
                                            style={{ marginLeft: "80%", width: "60px", height: "30px" }}
                                        >
                                            <span aria-hidden="true">&times;</span>
                                        </button>
                                    </div>
                                    <div className="modal-body">
                                        <form>
                                            <label>Exp Ac Code:</label>
                                            <div className="form-element">

                                                <AccountMasterHelp
                                                    onAcCodeClick={handleExpAcCode}
                                                    CategoryName={ExpAcaccountName}
                                                    CategoryCode={ExpAcaccountCode}
                                                    name="Ship_To"
                                                    tabIndexHelp={1}
                                                    className="account-master-help"
                                                />
                                            </div>

                                            <label className="debitCreditNote-form-label">
                                                Value:
                                            </label>
                                            <div className="debitCreditNote-col-Ewaybillno">
                                                <div className="debitCreditNote-form-group">
                                                    <input
                                                        type="text"
                                                        tabIndex="2"
                                                        className="debitCreditNote-form-control"
                                                        name="value"
                                                        autoComplete="off"
                                                        value={formDataDetail.value}
                                                        onChange={handleChangeDetail}
                                                    />
                                                </div>
                                            </div>

                                            <label>Item Code:</label>
                                            <div className="form-element">
                                                <SystemHelpMaster
                                                    onAcCodeClick={handleItemCode}
                                                    CategoryName={ItemCodeName}
                                                    CategoryCode={ItemCodeDetail}
                                                    name="Ship_To"
                                                    tabIndexHelp={3}
                                                    SystemType="I"
                                                    className="account-master-help"
                                                />
                                            </div>

                                            <label className="debitCreditNote-form-label">
                                                HSN:
                                            </label>
                                            <div className="debitCreditNote-col-Ewaybillno">
                                                <div className="debitCreditNote-form-group">
                                                    <input
                                                        type="text"
                                                        tabIndex="4"
                                                        className="debitCreditNote-form-control"
                                                        name="HSN"
                                                        autoComplete="off"
                                                        value={hsnNo}
                                                    // onChange={handleChangeDetail}
                                                    />
                                                </div>
                                            </div>
                                            <label className="debitCreditNote-form-label">
                                                Quantal:
                                            </label>
                                            <div className="debitCreditNote-col-Ewaybillno">
                                                <div className="debitCreditNote-form-group">
                                                    <input
                                                        type="text"
                                                        tabIndex="5"
                                                        className="debitCreditNote-form-control"
                                                        name="Quantal"
                                                        autoComplete="off"
                                                        value={formDataDetail.Quantal}
                                                        onChange={handleChangeDetail}
                                                    />
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                    <div className="modal-footer">
                                        {selectedUser.id ? (
                                            <button className="btn btn-primary" onClick={updateUser} onKeyDown={(event) => {
                                                if (event.key === "Enter") {
                                                    updateUser();
                                                }
                                            }}>
                                                Update User
                                            </button>
                                        ) : (
                                            <button className="btn btn-primary" onClick={addUser} onKeyDown={(event) => {
                                                if (event.key === "Enter") {
                                                    addUser();
                                                }
                                            }}>
                                                Add User
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={closePopup}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <table className="table mt-4 table-bordered">
                        <thead>
                            <tr>
                                <th>Actions</th>
                                <th>ID</th>
                                <th>Expac Code</th>
                                <th>item Code</th>
                                <th>Value</th>
                                <th>HSN</th>
                                <th>Quantal</th>
                                <th>dcdetailid</th>
                                <th>Rowaction</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td>
                                        {user.rowaction === "add" ||
                                            user.rowaction === "update" ||
                                            user.rowaction === "Normal" ? (
                                            <>
                                                <button
                                                    className="btn btn-warning"
                                                    onClick={() => editUser(user)}
                                                    disabled={!isEditing}
                                                    onKeyDown={(event) => {
                                                        if (event.key === "Enter") {
                                                            editUser(user);
                                                        }
                                                    }}
                                                    tabIndex="18"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="btn btn-danger ms-2"
                                                    onClick={() => deleteModeHandler(user)}
                                                    onKeyDown={(event) => {
                                                        if (event.key === "Enter") {
                                                            deleteModeHandler(user)
                                                        }
                                                    }}
                                                    disabled={!isEditing}
                                                    tabIndex="19"
                                                >
                                                    Delete
                                                </button>
                                            </>
                                        ) : user.rowaction === "DNU" ||
                                            user.rowaction === "delete" ? (
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => openDelete(user)}
                                            >
                                                Open
                                            </button>
                                        ) : null}
                                    </td>
                                    <td>{user.id}</td>
                                    <td>{user.expac_code}</td>
                                    <td>{user.Item_Code}</td>
                                    <td>{user.value}</td>
                                    <td>{user.HSN}</td>
                                    <td>{user.Quantal}</td>
                                    <td>{user.dcdetailid}</td>
                                    <td>{user.rowaction}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <br></br>
                <br></br>
                <br></br>

                <div className="debitCreditNote-row">
                    <label htmlFor="gst_code" className="debitCreditNote-form-label">GST Rate Code:</label>
                    <div className="debitCreditNote-col">
                        <div className="debitCreditNote-form-group">
                            <GSTRateMasterHelp
                                onAcCodeClick={handleGstCode}
                                GstRateName={GSTName}
                                GstRateCode={GSTCode}
                                name="gst_code"
                                tabIndexHelp={8}
                                disabledFeild={!isEditing && addOneButtonEnabled}
                            />
                        </div>
                    </div>

                    <label className="debitCreditNote-form-label">ASN No:</label>
                    <div className="debitCreditNote-col-Text">
                        <div className="debitCreditNote-form-group">
                            <input
                                tabIndex="9"
                                type="text"
                                className="debitCreditNote-form-control"
                                name="ASNNO"
                                autoComplete="off"
                                value={formData.ASNNO}
                                onChange={handleChange}
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                        </div>
                    </div>
                    <label className="debitCreditNote-form-label">EInvoice No:</label>
                    <div className="debitCreditNote-col-Ewaybillno">
                        <div className="debitCreditNote-form-group">
                            <input
                                type="text"
                                className="debitCreditNote-form-control"
                                name="Ewaybillno"
                                autoComplete="off"
                                value={formData.Ewaybillno}
                                onChange={handleChange}
                                tabIndex="10"
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                        </div>
                    </div>

                    <label className="debitCreditNote-form-label">ACK No:</label>
                    <div className="debitCreditNote-col-Ewaybillno">
                        <div className="debitCreditNote-form-group">
                            <input
                                type="text"
                                className="debitCreditNote-form-control"
                                name="ackno"
                                autoComplete="off"
                                value={formData.ackno}
                                onChange={handleChange}
                                tabIndex="11"
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                        </div>
                    </div>

                    <label className="debitCreditNote-form-label" style={{ fontWeight: 'bold' }}>Narration:</label>
                    <div className="debitCreditNote-col">
                        <textarea
                            name="Narration"
                            value={formData.Narration}
                            onChange={handleChange}
                            autoComplete="off"
                            tabIndex="12"
                            disabled={!isEditing && addOneButtonEnabled}
                        />
                    </div>

                </div>
                <div className="debitCreditNote-row">
                    <label className="debitCreditNote-form-label">Taxeble Amount:</label>
                    <div className="debitCreditNote-col-Text">
                        <div className="debitCreditNote-form-group">
                            <input
                                tabIndex="13"
                                type="text"
                                className="debitCreditNote-form-control"
                                name="texable_amount"
                                autoComplete="off"
                                value={formData.texable_amount}
                                onChange={handleChange}
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                            {formErrors.texable_amount && <span className="error">{formErrors.texable_amount}</span>}
                        </div>
                    </div>

                    <label className="debitCreditNote-form-label">CGST:</label>
                    <div className="debitCreditNote-col-Text">
                        <div className="debitCreditNote-form-group">
                            <input
                                tabIndex="14"
                                type="text"
                                className="debitCreditNote-form-control"
                                name="cgst_rate"
                                autoComplete="off"
                                value={formData.cgst_rate}
                                onChange={handleChange}
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                            {formErrors.cgst_rate && <span className="error">{formErrors.cgst_rate}</span>}
                            <input
                                tabIndex="15"
                                type="text"
                                className="debitCreditNote-form-control"
                                name="cgst_amount"
                                autoComplete="off"
                                value={formData.cgst_amount}
                                onChange={handleChange}
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                            {formErrors.cgst_amount && <span className="error">{formErrors.cgst_amount}</span>}
                        </div>
                    </div>
                    <label className="debitCreditNote-form-label">SGST:</label>
                    <div className="debitCreditNote-col-Text">
                        <div className="debitCreditNote-form-group">
                            <input
                                tabIndex="16"
                                type="text"
                                className="debitCreditNote-form-control"
                                name="sgst_rate"
                                autoComplete="off"
                                value={formData.sgst_rate}
                                onChange={handleChange}
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                            {formErrors.sgst_rate && <span className="error">{formErrors.sgst_rate}</span>}
                            <input
                                tabIndex="17"
                                type="text"
                                className="debitCreditNote-form-control"
                                name="sgst_amount"
                                autoComplete="off"
                                value={formData.sgst_amount}
                                onChange={handleChange}
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                            {formErrors.sgst_amount && <span className="error">{formErrors.sgst_amount}</span>}
                        </div>
                    </div>

                    <label className="debitCreditNote-form-label">IGST:</label>
                    <div className="debitCreditNote-col-Text">
                        <div className="debitCreditNote-form-group">
                            <input
                                tabIndex="18"
                                type="text"
                                className="debitCreditNote-form-control"
                                name="igst_rate"
                                autoComplete="off"
                                value={formData.igst_rate}
                                onChange={handleChange}
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                            {formErrors.igst_rate && <span className="error">{formErrors.igst_rate}</span>}
                            <input
                                tabIndex="19"
                                type="text"
                                className="debitCreditNote-form-control"
                                name="igst_amount"
                                autoComplete="off"
                                value={formData.igst_amount}
                                onChange={handleChange}
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                            {formErrors.igst_amount && <span className="error">{formErrors.igst_amount}</span>}
                        </div>
                    </div>

                    <label className="debitCreditNote-form-label">MISC:</label>
                    <div className="debitCreditNote-col-Text">

                        <div className="debitCreditNote-form-group">
                            <input
                                tabIndex="20"
                                type="text"
                                className="debitCreditNote-form-control"
                                name="misc_amount"
                                autoComplete="off"
                                value={formData.misc_amount}
                                onChange={handleChange}
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                            {formErrors.misc_amount && <span className="error">{formErrors.misc_amount}</span>}
                        </div>
                    </div>

                    <label className="debitCreditNote-form-label">Final Amount:</label>
                    <div className="debitCreditNote-col-Text">

                        <div className="debitCreditNote-form-group">
                            <input
                                tabIndex="21"
                                type="text"
                                className="debitCreditNote-form-control"
                                name="bill_amount"
                                autoComplete="off"
                                value={formData.bill_amount}
                                onChange={handleChange}
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                            {formErrors.bill_amount && <span className="error">{formErrors.bill_amount}</span>}
                        </div>
                    </div>

                    <label className="debitCreditNote-form-label">TCS %:</label>
                    <div className="debitCreditNote-col-Text">
                        <div className="debitCreditNote-form-group">
                            <input
                                tabIndex="22"
                                type="text"
                                className="debitCreditNote-form-control"
                                name="TCS_Rate"
                                autoComplete="off"
                                value={formData.TCS_Rate}
                                onChange={handleChange}
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                            {formErrors.TCS_Rate && <span className="error">{formErrors.TCS_Rate}</span>}
                            <input
                                tabIndex="23"
                                type="text"
                                className="debitCreditNote-form-control"
                                name="TCS_Amt"
                                autoComplete="off"
                                value={formData.TCS_Amt}
                                onChange={handleChange}
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                            {formErrors.TCS_Amt && <span className="error">{formErrors.TCS_Amt}</span>}
                        </div>
                    </div>

                    <label className="debitCreditNote-form-label">Net Payable:</label>
                    <div className="debitCreditNote-col-Text">
                        <div className="debitCreditNote-form-group">
                            <input
                                tabIndex="24"
                                type="text"
                                className="debitCreditNote-form-control"
                                name="TCS_Net_Payable"
                                autoComplete="off"
                                value={formData.TCS_Net_Payable}
                                onChange={handleChange}
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                            {formErrors.TCS_Net_Payable && <span className="error">{formErrors.TCS_Net_Payable}</span>}
                        </div>
                    </div>
                </div>
                <div className="debitCreditNote-row">
                    <label className="debitCreditNote-form-label">TDS %:</label>
                    <div className="debitCreditNote-col-Text">
                        <div className="debitCreditNote-form-group">
                            <input
                                tabIndex="25"
                                type="text"
                                className="debitCreditNote-form-control"
                                name="TDS_Rate"
                                autoComplete="off"
                                value={formData.TDS_Rate}
                                onChange={handleChange}
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                            {formErrors.TDS_Rate && <span className="error">{formErrors.TDS_Rate}</span>}
                            <input
                                tabIndex="26"
                                type="text"
                                className="debitCreditNote-form-control"
                                name="TDS_Amt"
                                autoComplete="off"
                                value={formData.TDS_Amt !== null ? formData.TDS_Amt : ""}
                                // value={formData.TDS_Amt}
                                onChange={handleChange}
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                            {formErrors.TDS_Amt && <span className="error">{formErrors.TDS_Amt}</span>}
                        </div>
                    </div>
                </div>
            </form>
        </>
    );
};
export default DebitCreditNote;