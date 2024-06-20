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
import "./SugarPurchase.css"
import { HashLoader } from 'react-spinners';
import { z } from "zod";

//Validation Part Using Zod Library
const stringToNumber = z
    .string()
    .refine(value => !isNaN(Number(value)), { message: "This field must be a number" })
    .transform(value => Number(value));

//Validation Schemas
const SugarPurchaseSchema = z.object({
    //     texable_amount: stringToNumber
    //         .refine(value => value !== undefined && value >= 0),
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
    // bill_amount: stringToNumber
    //     .refine(value => value !== undefined && value >= 0),
    // TCS_Rate: stringToNumber
    // .refine(value => value !== undefined && value >= 0),
    // TCS_Amt: stringToNumber
    // .refine(value => value !== undefined && value >= 0),
    // TCS_Net_Payable: stringToNumber
    //     .refine(value => value !== undefined && value >= 0),
    // TDS_Rate: stringToNumber
    // .refine(value => value !== undefined && value >= 0),
    // TDS_Amt: stringToNumber
    // .refine(value => value !== undefined && value >= 0),
    // misc_amount: stringToNumber
    // .refine(value => value !== undefined && value >= 0),
});

//Global Variables
var purchaseidNew = ""
var FromName = ""
var FromCode = ""
var Unitname = ""
var UnitCode = ""
var MillName = ""
var MillCode = ""
var BrokerName = ""
var BrokerCode = ""
var GstRateName = ""
var GstRateCode = ""
var ItemName = ""
var ItemCodeNew = ""
var BrandName = ""
var BrandCode = ""
var subTotal = 0.00
var globalQuantalTotal = 0
var CGSTRate = 0.00 
var SGSTRate= 0.00
var IGSTRate = 0.00

var selectedfilter = ""
const API_URL = process.env.REACT_APP_API;
const companyCode = sessionStorage.getItem("Company_Code");
const Year_Code = sessionStorage.getItem("Year_Code");

const SugarPurchase = () => {
    //Detail Help State Management
    const [users, setUsers] = useState([]);
    const [showPopup, setShowPopup] = useState(false);
    const [selectedUser, setSelectedUser] = useState({});
    const [deleteMode, setDeleteMode] = useState(false);
    const [brandCode, setBrandCode] = useState("");
    const [brandCodeAccoid, setBrandCodeAccoid] = useState("");
    const [itemSelect, setItemSelect] = useState("");
    const [itemSelectAccoid, setItemSelectAccoid] = useState("");
    const [hsnNo, setHSNNo] = useState("");
    const [formDataDetail, setFormDataDetail] = useState({
        Quantal: "",
        packing: "50",
        bags: "",
        rate: null,
        item_Amount: null,
        narration: "",
        detail_id: 1,

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
    const [isHandleChange, setIsHandleChange] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const initialFormData = {
        doc_no: "",
        Tran_Type: "PS",
        PURCNO: "",
        doc_date: new Date().toISOString().split('T')[0],
        Ac_Code: "",
        Unit_Code: "",
        mill_code: "",
        FROM_STATION: "",
        TO_STATION: "",
        LORRYNO: "",
        BROKER: "",
        wearhouse: "",
        subTotal: 0.00,
        LESS_FRT_RATE: 0.00,
        freight: 0.00,
        cash_advance: 0.00,
        bank_commission: 0.00,
        OTHER_AMT: 0.00,
        Bill_Amount: 0.00,
        Due_Days: "",
        NETQNTL: 0.00,
        Company_Code: companyCode,
        Year_Code: Year_Code,
        Branch_Code: "",
        Created_By: "",
        Modified_By: "",
        Bill_No: "",
        GstRateCode: "",
        CGSTRate: 0.00,
        CGSTAmount: 0.00,
        SGSTRate: 0.00,
        SGSTAmount: 0.00,
        IGSTRate: 0.00,
        IGSTAmount: 0.00,
        EWay_Bill_No: "",
        purchaseid: null,
        ac: "",
        uc: "",
        mc: "",
        bk: "",
        grade: "",
        mill_inv_date: new Date().toISOString().split('T')[0],
        Purcid: "",
        SelfBal: "",
        TCS_Rate: 0.00,
        TCS_Amt: 0.00,
        TCS_Net_Payable: 0.00,
        TDS_Rate: 0.00,
        TDS_Amt: 0.00,
        Retail_Stock: "Y",
        purchaseidnew: 1,
    };

    //Head data functionality code.
    const [formData, setFormData] = useState(initialFormData);
    const [DoNo, setDoNo] = useState("");
    const [from, setFrom] = useState("");
    const [unit, setUnit] = useState("");
    const [mill, setMill] = useState("");
    const [broker, setBroker] = useState("");
    const [gstCode, setGstCode] = useState("");
    const [gstRate, setGstRate] = useState("");

    const handleChange = (event) => {
        const { name, value } = event.target;
        console.log("handleChange", { name, value });
        // Call validateField to validate the field value
        validateField(name, value);
        setFormData((prevState) => ({
            ...prevState,
            [name]: value

        }));

    };

    useEffect(() => {
        if (isHandleChange) {
            handleCancel();
            setIsHandleChange(false);
        }
        setFocusTaskdate.current.focus();
    }, []);

    //Validation Part
    const validateField = (name, value) => {
        try {
            SugarPurchaseSchema.pick({ [name]: true }).parse({ [name]: value });
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
            SugarPurchaseSchema.parse(formData);
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

    //Fetch last record
    const fetchLastRecord = () => {
        fetch(`${API_URL}/get-lastrecordsugarpurchase?Company_Code=${companyCode}&Year_Code=${Year_Code}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to fetch last record");
                }
                return response.json();
            })
            .then((data) => {
                setFormData((prevState) => ({
                    ...prevState,
                    doc_no: data.last_SugarPurchasehead.doc_no + 1,
                }));
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
        FromName = ""
        FromCode = ""
        Unitname = ""
        UnitCode = ""
        MillName = ""
        MillCode = ""
        BrokerName = ""
        BrokerCode = ""
        GstRateName = ""
        GstRateCode = ""
        ItemName = ""
        ItemCodeNew = ""
        BrandName = ""
        BrandCode = ""
        subTotal = ""
        globalQuantalTotal = ""
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
            subTotal: subTotal,
            NETQNTL: globalQuantalTotal
        };

        // Remove dcid from headData if in edit mode
        if (isEditMode) {
            delete headData.purchaseid;
        }
        const detailData = users.map((user) => ({
            rowaction: user.rowaction,
            purchasedetailid: user.purchasedetailid,
            Tran_Type: "PS",
            item_code: user.item_code,
            ic: user.ic,
            Brand_Code: user.Brand_Code,
            Quantal: user.Quantal,
            packing: user.packing,
            bags: user.bags,
            rate: user.rate,
            item_Amount: user.item_Amount,
            narration: user.narration,
            Company_Code: companyCode,
            Year_Code: Year_Code,
            Branch_Code: 1,
            detail_id: 1
        }));
        const requestData = {
            headData,
            detailData,
        };
        try {
            if (isEditMode) {
                const updateApiUrl = `${API_URL}/update-SugarPurchase?purchaseid=${purchaseidNew}`;
                const response = await axios.put(updateApiUrl, requestData);
                toast.success('Data updated successfully!');
                setTimeout(() => {
                    window.location.reload();
                }, 1000)

            } else {
                const response = await axios.post(
                    `${API_URL}/insert_SugarPurchase`,
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
                const deleteApiUrl = `${API_URL}/delete_data_SugarPurchase?purchaseid=${purchaseidNew}&Company_Code=${companyCode}&doc_no=${formData.doc_no}&Year_Code=${Year_Code}&tran_type=${formData.Tran_Type}`;
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
                `${API_URL}/get-lastrecordsugarpurchase?Company_Code=${companyCode}&Year_Code=${Year_Code}`
            );
            if (response.status === 200) {
                const data = response.data;
                purchaseidNew = data.last_SugarPurchasehead.purchaseid
                FromName = data.last_SugarPurchasedetail[0].FromName
                FromCode = data.last_SugarPurchasehead.Ac_Code
                Unitname = data.last_SugarPurchasedetail[0].Unit_Name
                UnitCode = data.last_SugarPurchasehead.Unit_Code
                MillName = data.last_SugarPurchasedetail[0].Mill_Name
                MillCode = data.last_SugarPurchasehead.mill_code
                BrokerName = data.last_SugarPurchasedetail[0].Broker_Name
                BrokerCode = data.last_SugarPurchasehead.BROKER
                GstRateName = data.last_SugarPurchasedetail[0].GST_Name
                GstRateCode = data.last_SugarPurchasehead.GstRateCode
                ItemName = data.last_SugarPurchasedetail[0].ItemName
                ItemCodeNew = data.last_SugarPurchasedetail[0].item_code
                BrandName = data.last_SugarPurchasedetail[0].Brand_Name
                BrandCode = data.last_SugarPurchasedetail[0].Branch_Code
                subTotal = data.last_SugarPurchasehead.subTotal
                globalQuantalTotal = data.last_SugarPurchasehead.NETQNTL
                CGSTRate = data.last_SugarPurchasehead.CGSTRate
                SGSTRate = data.last_SugarPurchasehead.SGSTRate
                IGSTRate  = data.last_SugarPurchasehead.IGSTRate
                // Ensure all fields are updated correctly
                setFormData((prevData) => ({
                    ...prevData,
                    ...data.last_SugarPurchasehead
                }));
                setLastTenderData(data.last_SugarPurchasehead || {});
                setLastTenderDetails(data.last_SugarPurchasedetail || []);
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
        navigate("/sugarpurchasebill-utility")
    };

    //Navigation Functionality to show first,previous,next and last record functionality
    const handleFirstButtonClick = async () => {
        try {
            const response = await axios.get(`${API_URL}/get-firstsugarpurchase-navigation?Company_Code=${companyCode}&Year_Code=${Year_Code}`);
            if (response.status === 200) {
                const data = response.data;
                purchaseidNew = data.first_SugarPurchaseHead_data.purchaseid
                FromName = data.first_SugarPurchasedetail_data[0].FromName
                FromCode = data.first_SugarPurchaseHead_data.Ac_Code
                Unitname = data.first_SugarPurchasedetail_data[0].Unit_Name
                UnitCode = data.first_SugarPurchaseHead_data.Unit_Code
                MillName = data.first_SugarPurchasedetail_data[0].Mill_Name
                MillCode = data.first_SugarPurchaseHead_data.mill_code
                BrokerName = data.first_SugarPurchasedetail_data[0].Broker_Name
                BrokerCode = data.first_SugarPurchaseHead_data.BROKER
                GstRateName = data.first_SugarPurchasedetail_data[0].GST_Name
                GstRateCode = data.first_SugarPurchaseHead_data.GstRateCode
                ItemName = data.first_SugarPurchasedetail_data[0].ItemName
                ItemCodeNew = data.first_SugarPurchaseHead_data.item_code
                BrandName = data.first_SugarPurchasedetail_data[0].Brand_Name
                BrandCode = data.first_SugarPurchaseHead_data.Branch_Code
                subTotal = data.first_SugarPurchaseHead_data.subTotal
                globalQuantalTotal = data.first_SugarPurchaseHead_data.NETQNTL
                // Ensure all fields are updated correctly
                setFormData((prevData) => ({
                    ...prevData,
                    ...data.first_SugarPurchaseHead_data
                }));
                setLastTenderData(data.first_SugarPurchaseHead_data || {});
                setLastTenderDetails(data.first_SugarPurchasedetail_data || []);
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
            const response = await axios.get(`${API_URL}/getlastSugarPurchase-record-navigation?Company_Code=${companyCode}&Year_Code=${Year_Code}`);
            if (response.status === 200) {
                const data = response.data;
                purchaseidNew = data.last_SugarPurchaseHead_data.purchaseid
                FromName = data.last_SugarPurchasedetail_data[0].FromName
                FromCode = data.last_SugarPurchaseHead_data.Ac_Code
                Unitname = data.last_SugarPurchasedetail_data[0].Unit_Name
                UnitCode = data.last_SugarPurchaseHead_data.Unit_Code
                MillName = data.last_SugarPurchasedetail_data[0].Mill_Name
                MillCode = data.last_SugarPurchaseHead_data.mill_code
                BrokerName = data.last_SugarPurchasedetail_data[0].Broker_Name
                BrokerCode = data.last_SugarPurchaseHead_data.BROKER
                GstRateName = data.last_SugarPurchasedetail_data[0].GST_Name
                GstRateCode = data.last_SugarPurchaseHead_data.GstRateCode
                ItemName = data.last_SugarPurchasedetail_data[0].ItemName
                ItemCodeNew = data.last_SugarPurchaseHead_data.item_code
                BrandName = data.last_SugarPurchasedetail_data[0].Brand_Name
                BrandCode = data.last_SugarPurchaseHead_data.Branch_Code
                subTotal = data.last_SugarPurchaseHead_data.subTotal
                globalQuantalTotal = data.last_SugarPurchaseHead_data.NETQNTL

                // Ensure all fields are updated correctly
                setFormData((prevData) => ({
                    ...prevData,
                    ...data.last_SugarPurchaseHead_data
                }));
                setLastTenderData(data.last_SugarPurchaseHead_data || {});
                setLastTenderDetails(data.last_SugarPurchasedetail_data || []);

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
            const response = await axios.get(`${API_URL}/getnextsugarpurchase-navigation?Company_Code=${companyCode}&Year_Code=${Year_Code}&doc_no=${formData.doc_no}`);
            if (response.status === 200) {
                const data = response.data;
                purchaseidNew = data.next_SugarPurchasehead_data.purchaseid
                FromName = data.next_SugarPurchasedetails_data[0].FromName
                FromCode = data.next_SugarPurchasehead_data.Ac_Code
                Unitname = data.next_SugarPurchasedetails_data[0].Unit_Name
                UnitCode = data.next_SugarPurchasehead_data.Unit_Code
                MillName = data.next_SugarPurchasedetails_data[0].Mill_Name
                MillCode = data.next_SugarPurchasehead_data.mill_code
                BrokerName = data.next_SugarPurchasedetails_data[0].Broker_Name
                BrokerCode = data.next_SugarPurchasehead_data.BROKER
                GstRateName = data.next_SugarPurchasedetails_data[0].GST_Name
                GstRateCode = data.next_SugarPurchasehead_data.GstRateCode
                ItemName = data.next_SugarPurchasedetails_data[0].ItemName
                ItemCodeNew = data.next_SugarPurchasehead_data.item_code
                BrandName = data.next_SugarPurchasedetails_data[0].Brand_Name
                BrandCode = data.next_SugarPurchasehead_data.Branch_Code
                subTotal = data.next_SugarPurchasehead_data.subTotal
                globalQuantalTotal = data.next_SugarPurchasehead_data.NETQNTL

                // Ensure all fields are updated correctly
                setFormData((prevData) => ({
                    ...prevData,
                    ...data.next_SugarPurchasehead_data
                }));
                setLastTenderData(data.next_SugarPurchasehead_data || {});
                setLastTenderDetails(data.next_SugarPurchasedetails_data || []);
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
            const response = await axios.get(`${API_URL}/getprevioussugarpurchase-navigation?Company_Code=${companyCode}&Year_Code=${Year_Code}&doc_no=${formData.doc_no}`);

            if (response.status === 200) {
                const data = response.data;
                purchaseidNew = data.previous_SugarPurchaseHead_data.purchaseid
                FromName = data.previous_SugarPurchasedetail_data[0].FromName
                FromCode = data.previous_SugarPurchaseHead_data.Ac_Code
                Unitname = data.previous_SugarPurchasedetail_data[0].Unit_Name
                UnitCode = data.previous_SugarPurchaseHead_data.Unit_Code
                MillName = data.previous_SugarPurchasedetail_data[0].Mill_Name
                MillCode = data.previous_SugarPurchaseHead_data.mill_code
                BrokerName = data.previous_SugarPurchasedetail_data[0].Broker_Name
                BrokerCode = data.previous_SugarPurchaseHead_data.BROKER
                GstRateName = data.previous_SugarPurchasedetail_data[0].GST_Name
                GstRateCode = data.previous_SugarPurchaseHead_data.GstRateCode
                ItemName = data.previous_SugarPurchasedetail_data[0].ItemName
                ItemCodeNew = data.previous_SugarPurchaseHead_data.item_code
                BrandName = data.previous_SugarPurchasedetail_data[0].Brand_Name
                BrandCode = data.previous_SugarPurchaseHead_data.Branch_Code
                subTotal = data.previous_SugarPurchaseHead_data.subTotal
                globalQuantalTotal = data.previous_SugarPurchaseHead_data.NETQNTL

                // Ensure all fields are updated correctly
                setFormData((prevData) => ({
                    ...prevData,
                    ...data.previous_SugarPurchaseHead_data
                }));
                setLastTenderData(data.previous_SugarPurchaseHead_data || {});
                setLastTenderDetails(data.previous_SugarPurchasedetail_data || []);
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
            const response = await axios.get(`${API_URL}/getsugarpurchasebyid?doc_no=${selectedRecord.doc_no}&Company_Code=${companyCode}&Year_Code=${Year_Code}`);
            if (response.status === 200) {
                const data = response.data;
                purchaseidNew = data.getData_SugarPurchaseHead_data.purchaseid
                FromName = data.getData_SugarPurchaseDetail_data[0].FromName
                FromCode = data.getData_SugarPurchaseHead_data.Ac_Code
                Unitname = data.getData_SugarPurchaseDetail_data[0].Unit_Name
                UnitCode = data.getData_SugarPurchaseHead_data.Unit_Code
                MillName = data.getData_SugarPurchaseDetail_data[0].Mill_Name
                MillCode = data.getData_SugarPurchaseHead_data.mill_code
                BrokerName = data.getData_SugarPurchaseDetail_data[0].Broker_Name
                BrokerCode = data.getData_SugarPurchaseHead_data.BROKER
                GstRateName = data.getData_SugarPurchaseDetail_data[0].GST_Name
                GstRateCode = data.getData_SugarPurchaseHead_data.GstRateCode
                ItemName = data.getData_SugarPurchaseDetail_data[0].ItemName
                ItemCodeNew = data.getData_SugarPurchaseHead_data.item_code
                BrandName = data.getData_SugarPurchaseDetail_data[0].Brand_Name
                BrandCode = data.getData_SugarPurchaseHead_data.Branch_Code
                subTotal = data.getData_SugarPurchaseHead_data.subTotal
                globalQuantalTotal = data.getData_SugarPurchaseHead_data.NETQNTL


                // Ensure all fields are updated correctly
                setFormData((prevData) => ({
                    ...prevData,
                    ...data.getData_SugarPurchaseHead_data
                }));
                setLastTenderData(data.getData_SugarPurchaseHead_data || {});
                setLastTenderDetails(data.getData_SugarPurchaseDetail_data || []);
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
                    `${API_URL}/getsugarpurchasebyid?Company_Code=${companyCode}&doc_no=${changeNoValue}&Year_Code=${Year_Code}`
                );
                const data = response.data
                purchaseidNew = data.getData_SugarPurchaseHead_data.purchaseid
                FromName = data.getData_SugarPurchaseDetail_data[0].FromName
                FromCode = data.getData_SugarPurchaseHead_data.Ac_Code
                Unitname = data.getData_SugarPurchaseDetail_data[0].Unit_Name
                UnitCode = data.getData_SugarPurchaseHead_data.Unit_Code
                MillName = data.getData_SugarPurchaseDetail_data[0].Mill_Name
                MillCode = data.getData_SugarPurchaseHead_data.mill_code
                BrokerName = data.getData_SugarPurchaseDetail_data[0].Broker_Name
                BrokerCode = data.getData_SugarPurchaseHead_data.BROKER
                GstRateName = data.getData_SugarPurchaseDetail_data[0].GST_Name
                GstRateCode = data.getData_SugarPurchaseHead_data.GstRateCode
                ItemName = data.getData_SugarPurchaseDetail_data[0].ItemName
                ItemCodeNew = data.getData_SugarPurchaseHead_data.item_code
                BrandName = data.getData_SugarPurchaseDetail_data[0].Brand_Name
                BrandCode = data.getData_SugarPurchaseHead_data.Branch_Code
                subTotal = data.getData_SugarPurchaseHead_data.subTotal
                globalQuantalTotal = data.getData_SugarPurchaseHead_data.NETQNTL

                // Ensure all fields are updated correctly
                setFormData((prevData) => ({
                    ...prevData,
                    ...data.getData_SugarPurchaseHead_data
                }));
                setLastTenderData(data.getData_SugarPurchaseHead_data || {});
                setLastTenderDetails(data.getData_SugarPurchaseDetail_data || []);
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

                    rowaction: "Normal",
                    id: detail.purchasedetailid,
                    purchasedetailid: detail.purchasedetailid,
                    item_code: detail.item_code,
                    ic: detail.ic,
                    Brand_Code: detail.Brand_Code,
                    Quantal: detail.Quantal,
                    packing: detail.packing,
                    bags: detail.bags,
                    rate: detail.rate,
                    item_Amount: detail.item_Amount,
                    narration: detail.narration,
                    detail_id: detail.detail_id

                }))
            );
        }
    }, [selectedRecord, lastTenderDetails]);

    useEffect(() => {
        setUsers(
            lastTenderDetails.map((detail) => ({

                rowaction: "Normal",
                id: detail.purchasedetailid,
                purchasedetailid: detail.purchasedetailid,
                item_code: detail.item_code,
                ic: detail.ic,
                Brand_Code: detail.Brand_Code,
                Quantal: detail.Quantal,
                packing: detail.packing,
                bags: detail.bags,
                rate: detail.rate,
                item_Amount: detail.item_Amount,
                narration: detail.narration,
                detail_id: detail.detail_id
            }))
        );
    }, [lastTenderDetails]);

    // Function to handle changes in the form fields
    const handleChangeDetail = (event) => {
        const { name, value } = event.target;
        let updatedFormDataDetail = { ...formDataDetail, [name]: value };

        if (name === 'Quantal') {
            const quantal = parseFloat(value);
            const packing = parseFloat(formDataDetail.packing);

            updatedFormDataDetail = {
                ...updatedFormDataDetail,
                bags: !isNaN(quantal) && !isNaN(packing) && packing !== 0 ? Math.round((quantal * 100) / packing) : '',
            };
        }

        if (name === 'packing') {
            const packing = parseFloat(value);
            const quantal = parseFloat(formDataDetail.Quantal);

            updatedFormDataDetail = {
                ...updatedFormDataDetail,
                bags: !isNaN(quantal) && !isNaN(packing) && packing !== 0 ? Math.round((quantal * 100) / packing) : '',
            };
        }

        if (name === 'rate' || name === 'Quantal') {
            const quantal = parseFloat(updatedFormDataDetail.Quantal);
            const rate = parseFloat(updatedFormDataDetail.rate);

            updatedFormDataDetail = {
                ...updatedFormDataDetail,
                item_Amount: !isNaN(quantal) && !isNaN(rate) ? (quantal * rate).toFixed(2) : "0.00",
            };
        }

        setFormDataDetail(updatedFormDataDetail);
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
            Quantal: "",
            packing: "",
            bags: "",
            rate: 0.00,
            item_Amount: 0.00,
            narration: ""
        });

    };

    const editUser = (user) => {
        setSelectedUser(user);
        setItemSelect(user.item_code);
        setBrandCode(user.Branch_Code);
        setFormDataDetail({
            bags: user.bags || "",
            packing: user.packing || "",
            Quantal: user.Quantal || "",
            rate: user.rate || "",
            item_Amount: user.item_Amount || "",
            narration: user.narration || ""
        });
        openPopup();
    };

    const addUser = async () => {
        const newUser = {
            id: users.length > 0 ? Math.max(...users.map((user) => user.id)) + 1 : 1,
            item_code: itemSelect,
            ic: itemSelectAccoid,
            Brand_Code: brandCode,
            ...formDataDetail,
            rowaction: "add",
        };

        // Calculate subTotal based on all users including newUser
        const newUsers = [...users, newUser];
        const totalItemAmount = newUsers.reduce((total, user) => {
            return total + parseFloat(user.item_Amount);
        }, 0);
        subTotal = totalItemAmount.toFixed(2);


        // Calculate total Quantal based on all users including newUser
        const totalQuantal = newUsers.reduce((total, user) => {
            return total + parseFloat(user.Quantal);
        }, 0);
        globalQuantalTotal = totalQuantal; // Update the global variable


        setFormDataDetail({
            ...newUser,
            subTotal: subTotal
        });

        if (from != "" || FromCode !="") {
            // Make an API call to fetch match status
            const response = await axios.get(`http://localhost:8080/api/sugarian/get_match_status`, {
                params: {
                    Company_Code: companyCode, 
                    Year_Code: Year_Code,     
                    Ac_Code: cancelButtonClicked ? FromCode : from             
                }
            });

            const { match_status } = response.data;

            // Convert Rate to a float (assuming Rate is a percentage string like "5%")
            const gstRateDivide = parseFloat(gstRate);


            // Calculate CGST, SGST, and IGST rates based on the given GST rate
            const cgstRate = cancelButtonClicked ? parseFloat(CGSTRate) : gstRateDivide / 2;
            const sgstRate = cancelButtonClicked ? parseFloat(SGSTRate) : gstRateDivide / 2;
            const igstRate = cancelButtonClicked ? parseFloat(IGSTRate) : gstRateDivide;

            const cgstAmount = parseFloat(calculateGSTAmount(subTotal, cgstRate)).toFixed(2);
            const sgstAmount = parseFloat(calculateGSTAmount(subTotal, sgstRate)).toFixed(2);
            const igstAmount = parseFloat(calculateGSTAmount(subTotal, igstRate)).toFixed(2);

            let billAmount;
            let netPayable;

            console.log("subTotal", subTotal)

            // Update formData based on match_status
            if (match_status === "TRUE") {
                billAmount = billAmount = parseFloat(subTotal) + parseFloat(cgstAmount) + parseFloat(sgstAmount) + parseFloat(formData.OTHER_AMT);
                netPayable = billAmount.toFixed(2);
                setFormData({
                    ...formData,
                    CGSTRate: cgstRate.toFixed(2), // Convert rate to string with 2 decimal places
                    SGSTRate: sgstRate.toFixed(2),
                    IGSTRate: 0.00, // Reset IGST rate
                    CGSTAmount: cgstAmount,
                    SGSTAmount: sgstAmount,
                    IGSTAmount: 0.00, // Reset IGST amount
                    Bill_Amount: billAmount,
                    TCS_Net_Payable: netPayable
                });
            } else {
                billAmount = parseFloat(subTotal) + parseFloat(igstAmount) + parseFloat(formData.OTHER_AMT);
                netPayable = billAmount.toFixed(2);
                setFormData({
                    ...formData,
                    CGSTRate: 0.00, // Reset CGST rate
                    SGSTRate: 0.00, // Reset SGST rate
                    IGSTRate: igstRate.toFixed(2), // Convert rate to string with 2 decimal places
                    CGSTAmount: 0.00, // Reset CGST amount
                    SGSTAmount: 0.00, // Reset SGST amount
                    IGSTAmount: igstAmount,
                    Bill_Amount: billAmount,
                    TCS_Net_Payable: netPayable
                });
            }
        }

        setUsers([...users, newUser]);
        closePopup();
    };



    //Update User On Grid
    const updateUser = async () => {
        const updatedUsers = users.map((user) => {
            if (user.id === selectedUser.id) {
                const updatedRowaction = user.rowaction === "Normal" ? "update" : user.rowaction;
    
                // Calculate updated item_Amount
                const updatedItemAmount = (parseFloat(formDataDetail.Quantal) * parseFloat(formDataDetail.rate)).toFixed(2);
    
                return {
                    ...user,
                    item_code: itemSelect,
                    ic: itemSelectAccoid,
                    Brand_Code: brandCode,
                    ...formDataDetail,
                    item_Amount: updatedItemAmount,
                    rowaction: updatedRowaction,
                };
            } else {
                return user;
            }
        });
    
        // Calculate new subTotal
        const totalItemAmount = updatedUsers.reduce((total, user) => {
            return total + parseFloat(user.item_Amount);
        }, 0);
        subTotal = totalItemAmount.toFixed(2); 
    
        // Calculate total Quantal based on all users
        const totalQuantal = updatedUsers.reduce((total, user) => {
            return total + parseFloat(user.Quantal);
        }, 0);
        globalQuantalTotal = totalQuantal; 

        setFormDataDetail({
            ...updatedUsers,
            subTotal: subTotal
        });
    
        if (from != "" || FromCode != "") {
            // Make an API call to fetch match status
            const response = await axios.get(`http://localhost:8080/api/sugarian/get_match_status`, {
                params: {
                    Company_Code: companyCode,
                    Year_Code: Year_Code,
                    Ac_Code: cancelButtonClicked ? FromCode : from
                }
            });
    
            const { match_status } = response.data;
    
            // Convert Rate to a float (assuming Rate is a percentage string like "5%")
            const gstRateDivide = parseFloat(gstRate);
    
            // Calculate CGST, SGST, and IGST rates based on the given GST rate
            const cgstRate = cancelButtonClicked ? parseFloat(CGSTRate) : gstRateDivide / 2;
            const sgstRate = cancelButtonClicked ? parseFloat(SGSTRate) : gstRateDivide / 2;
            const igstRate = cancelButtonClicked ? parseFloat(IGSTRate) : gstRateDivide;
    
            const cgstAmount = parseFloat(calculateGSTAmount(subTotal, cgstRate)).toFixed(2);
            const sgstAmount = parseFloat(calculateGSTAmount(subTotal, sgstRate)).toFixed(2);
            const igstAmount = parseFloat(calculateGSTAmount(subTotal, igstRate)).toFixed(2);
    
            let billAmount;
            let netPayable;
    
            console.log("subTotal", subTotal)
    
            // Update formData based on match_status
            if (match_status === "TRUE") {
                billAmount = parseFloat(subTotal) + parseFloat(cgstAmount) + parseFloat(sgstAmount) + parseFloat(formData.OTHER_AMT);
                netPayable = billAmount.toFixed(2);
                setFormData({
                    ...formData,
                    CGSTRate: cgstRate.toFixed(2), // Convert rate to string with 2 decimal places
                    SGSTRate: sgstRate.toFixed(2),
                    IGSTRate: 0.00, // Reset IGST rate
                    CGSTAmount: cgstAmount,
                    SGSTAmount: sgstAmount,
                    IGSTAmount: 0.00, // Reset IGST amount
                    Bill_Amount: billAmount,
                    TCS_Net_Payable: netPayable
                });
            } else {
                billAmount = parseFloat(subTotal) + parseFloat(igstAmount) + parseFloat(formData.OTHER_AMT);
                netPayable = billAmount.toFixed(2);
                setFormData({
                    ...formData,
                    CGSTRate: 0.00, // Reset CGST rate
                    SGSTRate: 0.00, // Reset SGST rate
                    IGSTRate: igstRate.toFixed(2), // Convert rate to string with 2 decimal places
                    CGSTAmount: 0.00, // Reset CGST amount
                    SGSTAmount: 0.00, // Reset SGST amount
                    IGSTAmount: igstAmount,
                    Bill_Amount: billAmount,
                    TCS_Net_Payable: netPayable
                });
            }
        }
    
        setUsers(updatedUsers);
        closePopup();
    };


    const deleteModeHandler = async(userToDelete) => {
        let updatedUsers;

        if (isEditMode && userToDelete.rowaction === "add") {
            updatedUsers = users.map((u) =>
                u.id === userToDelete.id ? { ...u, rowaction: "DNU" } : u
            );
        } else if (isEditMode) {
            updatedUsers = users.map((u) =>
                u.id === userToDelete.id ? { ...u, rowaction: "delete" } : u
            );
        } else {
            updatedUsers = users.map((u) =>
                u.id === userToDelete.id ? { ...u, rowaction: "DNU" } : u
            );
        }

        // Calculate new subTotal
        const totalItemAmount = updatedUsers.reduce((total, u) => {
            if (u.rowaction !== "delete" && u.rowaction !== "DNU") {
                return total + parseFloat(u.item_Amount || 0);
            } else {
                return total; 
            }
        }, 0);

        // Update subTotal state
        subTotal = (totalItemAmount.toFixed(2));

         // Calculate total Quantal based on all users
         const totalQuantal = updatedUsers.reduce((total, u) => {
            if (u.rowaction !== "delete" && u.rowaction !== "DNU") {
            return total + parseFloat(u.Quantal);
        } else {
            return total; 
        }
        }, 0);

        globalQuantalTotal = totalQuantal; 

        setFormDataDetail({
            ...updatedUsers,
            subTotal: subTotal
            // updatedUsers: updatedUsers
        });


        if (from != "" || FromCode != "") {
            // Make an API call to fetch match status
            const response = await axios.get(`http://localhost:8080/api/sugarian/get_match_status`, {
                params: {
                    Company_Code: companyCode,
                    Year_Code: Year_Code,
                    Ac_Code: cancelButtonClicked ? FromCode : from
                }
            });
    
            const { match_status } = response.data;
    
            // Convert Rate to a float (assuming Rate is a percentage string like "5%")
            const gstRateDivide = parseFloat(gstRate);
    
            // Calculate CGST, SGST, and IGST rates based on the given GST rate
            const cgstRate = cancelButtonClicked ? parseFloat(CGSTRate) : gstRateDivide / 2;
            const sgstRate = cancelButtonClicked ? parseFloat(SGSTRate) : gstRateDivide / 2;
            const igstRate = cancelButtonClicked ? parseFloat(IGSTRate) : gstRateDivide;
    
            const cgstAmount = parseFloat(calculateGSTAmount(subTotal, cgstRate)).toFixed(2);
            const sgstAmount = parseFloat(calculateGSTAmount(subTotal, sgstRate)).toFixed(2);
            const igstAmount = parseFloat(calculateGSTAmount(subTotal, igstRate)).toFixed(2);
    
            let billAmount;
            let netPayable;
    
            console.log("subTotal", subTotal)
    
            // Update formData based on match_status
            if (match_status === "TRUE") {
                billAmount = parseFloat(subTotal) + parseFloat(cgstAmount) + parseFloat(sgstAmount) + parseFloat(formData.OTHER_AMT);
                netPayable = billAmount.toFixed(2);
                setFormData({
                    ...formData,
                    CGSTRate: cgstRate.toFixed(2), // Convert rate to string with 2 decimal places
                    SGSTRate: sgstRate.toFixed(2),
                    IGSTRate: 0.00, // Reset IGST rate
                    CGSTAmount: cgstAmount,
                    SGSTAmount: sgstAmount,
                    IGSTAmount: 0.00, // Reset IGST amount
                    Bill_Amount: billAmount,
                    TCS_Net_Payable: netPayable
                });
            } else {
                billAmount = parseFloat(subTotal) + parseFloat(igstAmount) + parseFloat(formData.OTHER_AMT);
                netPayable = billAmount.toFixed(2);
                setFormData({
                    ...formData,
                    CGSTRate: 0.00, // Reset CGST rate
                    SGSTRate: 0.00, // Reset SGST rate
                    IGSTRate: igstRate.toFixed(2), // Convert rate to string with 2 decimal places
                    CGSTAmount: 0.00, // Reset CGST amount
                    SGSTAmount: 0.00, // Reset SGST amount
                    IGSTAmount: igstAmount,
                    Bill_Amount: billAmount,
                    TCS_Net_Payable: netPayable
                });
            }
        }
    

        // Update users state, delete mode, and selected user
        setUsers(updatedUsers);
        setDeleteMode(true); // Assuming you need to set delete mode to true
        setSelectedUser(userToDelete);
    };


    //Functionality After delete record undo deleted record.
    const openDelete = async(user) => {
        let updatedUsers;

        // Set delete mode and selected user
        setDeleteMode(true);
        setSelectedUser(user);

        // Determine action based on edit mode and row action
        if (isEditMode && user.rowaction === "delete") {
            updatedUsers = users.map((u) =>
                u.id === user.id ? { ...u, rowaction: "Normal" } : u
            );
        } else {
            updatedUsers = users.map((u) =>
                u.id === user.id ? { ...u, rowaction: "add" } : u
            );
        }

        // Calculate new subTotal after updating users
        const totalItemAmount = updatedUsers.reduce((total, u) => {
            return total + parseFloat(u.item_Amount || 0);
        }, 0);

        // Update subTotal state
        const updatedSubTotal = totalItemAmount.toFixed(2);
        subTotal = updatedSubTotal

          // Calculate total Quantal based on all users
          const totalQuantal = updatedUsers.reduce((total, u) => {
          
            return total + parseFloat(u.Quantal || 0);
      
        }, 0);

        globalQuantalTotal = totalQuantal; 

        // Update formDataDetail with updatedUsers and subTotal
        setFormDataDetail({
            ...formDataDetail,
            subTotal: subTotal,
            updatedUsers: updatedUsers
        });



        if (from != "" || FromCode != "") {
            // Make an API call to fetch match status
            const response = await axios.get(`http://localhost:8080/api/sugarian/get_match_status`, {
                params: {
                    Company_Code: companyCode,
                    Year_Code: Year_Code,
                    Ac_Code: cancelButtonClicked ? FromCode : from
                }
            });
    
            const { match_status } = response.data;
    
            // Convert Rate to a float (assuming Rate is a percentage string like "5%")
            const gstRateDivide = parseFloat(gstRate);
    
            // Calculate CGST, SGST, and IGST rates based on the given GST rate
            const cgstRate = cancelButtonClicked ? parseFloat(CGSTRate) : gstRateDivide / 2;
            const sgstRate = cancelButtonClicked ? parseFloat(SGSTRate) : gstRateDivide / 2;
            const igstRate = cancelButtonClicked ? parseFloat(IGSTRate) : gstRateDivide;
    
            const cgstAmount = parseFloat(calculateGSTAmount(subTotal, cgstRate)).toFixed(2);
            const sgstAmount = parseFloat(calculateGSTAmount(subTotal, sgstRate)).toFixed(2);
            const igstAmount = parseFloat(calculateGSTAmount(subTotal, igstRate)).toFixed(2);
    
            let billAmount;
            let netPayable;
    
            console.log("subTotal", subTotal)
    
            // Update formData based on match_status
            if (match_status === "TRUE") {
                billAmount = parseFloat(subTotal) + parseFloat(cgstAmount) + parseFloat(sgstAmount) + parseFloat(formData.OTHER_AMT);
                netPayable = billAmount.toFixed(2);
                setFormData({
                    ...formData,
                    CGSTRate: cgstRate.toFixed(2), // Convert rate to string with 2 decimal places
                    SGSTRate: sgstRate.toFixed(2),
                    IGSTRate: 0.00, // Reset IGST rate
                    CGSTAmount: cgstAmount,
                    SGSTAmount: sgstAmount,
                    IGSTAmount: 0.00, // Reset IGST amount
                    Bill_Amount: billAmount,
                    TCS_Net_Payable: netPayable
                });
            } else {
                billAmount = parseFloat(subTotal) + parseFloat(igstAmount) + parseFloat(formData.OTHER_AMT);
                netPayable = billAmount.toFixed(2);
                setFormData({
                    ...formData,
                    CGSTRate: 0.00, // Reset CGST rate
                    SGSTRate: 0.00, // Reset SGST rate
                    IGSTRate: igstRate.toFixed(2), // Convert rate to string with 2 decimal places
                    CGSTAmount: 0.00, // Reset CGST amount
                    SGSTAmount: 0.00, // Reset SGST amount
                    IGSTAmount: igstAmount,
                    Bill_Amount: billAmount,
                    TCS_Net_Payable: netPayable
                });
            }
        }
    


        // Update users state
        setUsers(updatedUsers);

        // Clear selected user
        setSelectedUser({});
    };

    //Functionality to help section to set the record.
    const handleItemSelect = (code, accoid) => {
        setItemSelect(code);
        setItemSelectAccoid(accoid)
        // setHSNNo(HSN)
    };

    // Handle changes in the Mill_Code input (assuming SystemMasterHelp handles its own state
    const handleBrandCode = (code, accoid) => {
        setBrandCode(code);
        setBrandCodeAccoid(accoid)
    };

    //Head Section help Functions to manage the Ac_Code and accoid
    const handleDoNo = (code, accoid) => {
        setDoNo(code);
        setFormData({
            ...formData,
        });
    }

    const handleFrom = (code, accoid) => {
        setFrom(code)
        setFormData({
            ...formData,
            Ac_Code: code,
            ac: accoid
        });
    }

    const handleUnit = (code, accoid) => {
        setUnit(code);
        setFormData({
            ...formData,
            Unit_Code: code,
            uc: accoid
        });
    }

    const handleMill = (code, accoid) => {
        setMill(code);
        setFormData({
            ...formData,
            mill_code: code,
            mc: accoid
        });
    }

    const handleBroker = (code, accoid) => {
        setBroker(code);
        setFormData({
            ...formData,
            BROKER: code,
            bk: accoid
        });
    }

    const handleGstCode = async (code, Rate) => {

        setGstCode(code);
        setGstRate(Rate);

    }

    // Function to calculate GST amount based on rate and subtotal
    const calculateGSTAmount = (subTotal, rate) => {
        return (subTotal * (rate / 100)).toFixed(2);
    };

    return (
        <>
            <ToastContainer />
            <h3 className="mt-4 mb-4 text-center custom-heading">
                Sugar Purchase For GST
            </h3>
            <button style={{ marginBottom: "-80px" }} className="btn btn-primary">Print</button>
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
                    <label className="debitCreditNote-form-label">Bill No:</label>
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
                    <label htmlFor="DO_No" className="debitCreditNote-form-label">Do No:</label>
                    <div className="debitCreditNote-col">
                        <div className="debitCreditNote-form-group">
                            <AccountMasterHelp
                                onAcCodeClick={handleDoNo}
                                CategoryName={""}
                                CategoryCode={""}
                                name="DO_No"
                                tabIndexHelp={2}
                                disabledFeild={!isEditing && addOneButtonEnabled}
                            />
                        </div>
                    </div>
                    <label className="debitCreditNote-form-label">Date:</label>
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
                    <label htmlFor="Retail_Stock" className="debitCreditNote-form-label">Retail Stock:</label>
                    <div className="debitCreditNote-col">
                        <div className="debitCreditNote-form-group-type">
                            <select id="Retail_Stock" name="Retail_Stock" className="debitCreditNote-custom-select" value={formData.Retail_Stock}
                                onChange={handleChange} disabled={!isEditing && addOneButtonEnabled}  >
                                <option value="Y">Yes</option>
                                <option value="N">NO</option>

                            </select>
                        </div>
                    </div>
                    <label htmlFor="From" className="debitCreditNote-form-label">From:</label>
                    <div className="debitCreditNote-col">
                        <div className="debitCreditNote-form-group">
                            <AccountMasterHelp
                                onAcCodeClick={handleFrom}
                                CategoryName={FromName}
                                CategoryCode={FromCode}
                                name="From"
                                tabIndexHelp={2}
                                disabledFeild={!isEditing && addOneButtonEnabled}
                            />
                        </div>
                    </div>
                </div>
                <div className="debitCreditNote-row">
                    <label htmlFor="Unit" className="debitCreditNote-form-label">Unit:</label>
                    <div className="debitCreditNote-col">
                        <div className="debitCreditNote-form-group">
                            <AccountMasterHelp
                                onAcCodeClick={handleUnit}
                                CategoryName={Unitname}
                                CategoryCode={UnitCode}
                                name="Unit"
                                tabIndexHelp={3}
                                disabledFeild={!isEditing && addOneButtonEnabled}
                            />
                        </div>
                    </div>
                    <label htmlFor="Mill" className="debitCreditNote-form-label">Mill:</label>
                    <div className="debitCreditNote-col">
                        <div className="debitCreditNote-form-group">
                            <AccountMasterHelp
                                onAcCodeClick={handleMill}
                                CategoryName={MillName}
                                CategoryCode={MillCode}
                                name="Mill"
                                tabIndexHelp={5}
                                disabledFeild={!isEditing && addOneButtonEnabled}
                            />
                        </div>
                    </div>
                    <label className="debitCreditNote-form-label">From:</label>
                    <div className="debitCreditNote-col-Ewaybillno">
                        <div className="debitCreditNote-form-group">
                            <input
                                type="text"
                                className="debitCreditNote-form-control"
                                name="FROM_STATION"
                                autoComplete="off"
                                value={formData.FROM_STATION}
                                onChange={handleChange}
                                tabIndex="10"
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                        </div>
                    </div>
                    <label className="debitCreditNote-form-label">TO:</label>
                    <div className="debitCreditNote-col-Ewaybillno">
                        <div className="debitCreditNote-form-group">
                            <input
                                type="text"
                                className="debitCreditNote-form-control"
                                name="TO_STATION"
                                autoComplete="off"
                                value={formData.TO_STATION}
                                onChange={handleChange}
                                tabIndex="10"
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                        </div>
                    </div>
                    <label className="debitCreditNote-form-label">Grade:</label>
                    <div className="debitCreditNote-col-Ewaybillno">
                        <div className="debitCreditNote-form-group">
                            <input
                                type="text"
                                className="debitCreditNote-form-control"
                                name="grade"
                                autoComplete="off"
                                value={formData.grade}
                                onChange={handleChange}
                                tabIndex="10"
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                        </div>
                    </div>
                    <label className="debitCreditNote-form-label">Lorry No:</label>
                    <div className="debitCreditNote-col-Ewaybillno">
                        <div className="debitCreditNote-form-group">
                            <input
                                type="text"
                                className="debitCreditNote-form-control"
                                name="LORRYNO"
                                autoComplete="off"
                                value={formData.LORRYNO}
                                onChange={handleChange}
                                tabIndex="10"
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                        </div>
                    </div>
                    <label className="debitCreditNote-form-label">WareHouse:</label>
                    <div className="debitCreditNote-col-Ewaybillno">
                        <div className="debitCreditNote-form-group">
                            <input
                                type="text"
                                className="debitCreditNote-form-control"
                                name="wearhouse"
                                autoComplete="off"
                                value={formData.wearhouse}
                                onChange={handleChange}
                                tabIndex="10"
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                        </div>
                    </div>
                    <label htmlFor="Mill" className="debitCreditNote-form-label">broker:</label>
                    <div className="debitCreditNote-col">
                        <div className="debitCreditNote-form-group">
                            <AccountMasterHelp
                                onAcCodeClick={handleBroker}
                                CategoryName={BrokerName}
                                CategoryCode={BrokerCode}
                                name="Mill"
                                tabIndexHelp={6}
                                disabledFeild={!isEditing && addOneButtonEnabled}
                            />
                        </div>
                    </div>
                    <label htmlFor="gst_code" className="debitCreditNote-form-label">GST Rate Code:</label>
                    <div className="debitCreditNote-col">
                        <div className="debitCreditNote-form-group">
                            <GSTRateMasterHelp
                                onAcCodeClick={handleGstCode}
                                GstRateName={GstRateName}
                                GstRateCode={GstRateCode}
                                name="gst_code"
                                tabIndexHelp={8}
                                disabledFeild={!isEditing && addOneButtonEnabled}
                            />
                        </div>
                    </div>

                    <label className="debitCreditNote-form-label">Bill No:</label>
                    <div className="debitCreditNote-col-Ewaybillno">
                        <div className="debitCreditNote-form-group">
                            <input
                                type="text"
                                className="debitCreditNote-form-control"
                                name="Ewaybillno"
                                autoComplete="off"
                                value={formData.Bill_No}
                                onChange={handleChange}
                                tabIndex="10"
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                        </div>
                    </div>

                    <label className="debitCreditNote-form-label">Mill Invoice Date:</label>
                    <div className="debitCreditNote-col">
                        <div className="debitCreditNote-form-group">
                            <input
                                tabIndex="1"
                                ref={setFocusTaskdate}
                                type="date"
                                className="debitCreditNote-form-control"
                                id="datePicker"
                                name="mill_inv_date"
                                value={formData.mill_inv_date}
                                onChange={handleChange}
                                disabled={!isEditing && addOneButtonEnabled}
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
                                            <label>Item :</label>
                                            <div className="form-element">
                                                <SystemHelpMaster
                                                    onAcCodeClick={handleItemSelect}
                                                    CategoryName={ItemName}
                                                    CategoryCode={ItemCodeNew}
                                                    name="Item_Select"
                                                    tabIndexHelp={3}
                                                    SystemType="I"
                                                    className="account-master-help"
                                                />
                                            </div>


                                            <label>Brand Code:</label>
                                            <div className="form-element">
                                                <SystemHelpMaster
                                                    onAcCodeClick={handleBrandCode}
                                                    CategoryName={BrandName}
                                                    CategoryCode={BrandCode}
                                                    name="Brand_Code"
                                                    tabIndexHelp={3}
                                                    SystemType="I"
                                                    className="account-master-help"
                                                />
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
                                            <label className="debitCreditNote-form-label">
                                                Packing:
                                            </label>
                                            <div className="debitCreditNote-col-Ewaybillno">
                                                <div className="debitCreditNote-form-group">
                                                    <input
                                                        type="text"
                                                        tabIndex="5"
                                                        className="debitCreditNote-form-control"
                                                        name="packing"
                                                        autoComplete="off"
                                                        value={formDataDetail.packing}
                                                        onChange={handleChangeDetail}
                                                    />
                                                </div>
                                            </div>
                                            <label className="debitCreditNote-form-label">
                                                Bags:
                                            </label>
                                            <div className="debitCreditNote-col-Ewaybillno">
                                                <div className="debitCreditNote-form-group">
                                                    <input
                                                        type="text"
                                                        tabIndex="5"
                                                        className="debitCreditNote-form-control"
                                                        name="bags"
                                                        autoComplete="off"
                                                        value={formDataDetail.bags}
                                                        onChange={handleChangeDetail}
                                                    />
                                                </div>
                                            </div>
                                            <label className="debitCreditNote-form-label">
                                                Rate:
                                            </label>
                                            <div className="debitCreditNote-col-Ewaybillno">
                                                <div className="debitCreditNote-form-group">
                                                    <input
                                                        type="text"
                                                        tabIndex="5"
                                                        className="debitCreditNote-form-control"
                                                        name="rate"
                                                        autoComplete="off"
                                                        value={formDataDetail.rate !== null ? formDataDetail.rate : ""}
                                                        // value={formDataDetail.rate}
                                                        onChange={handleChangeDetail}
                                                    />
                                                </div>
                                            </div>

                                            <label className="debitCreditNote-form-label">
                                                Item Amount:
                                            </label>
                                            <div className="debitCreditNote-col-Ewaybillno">
                                                <div className="debitCreditNote-form-group">
                                                    <input
                                                        type="text"
                                                        tabIndex="2"
                                                        className="debitCreditNote-form-control"
                                                        name="item_Amount"
                                                        autoComplete="off"
                                                        value={formDataDetail.item_Amount}
                                                        onChange={handleChangeDetail}
                                                    />
                                                </div>
                                            </div>

                                            <label className="debitCreditNote-form-label" style={{ fontWeight: 'bold' }}>Narration:</label>
                                            <div className="debitCreditNote-col">
                                                <textarea
                                                    name="narration"
                                                    value={formDataDetail.narration}
                                                    onChange={handleChangeDetail}
                                                    autoComplete="off"
                                                    tabIndex="12"
                                                    disabled={!isEditing && addOneButtonEnabled}
                                                />
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
                                <th>Item Code</th>
                                <th>Brand Code</th>
                                <th>Quantal</th>
                                <th>packing</th>
                                <th>rate</th>
                                <th>bags</th>
                                <th>item_Amount</th>
                                <th>narration</th>
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
                                    <td>{user.item_code}</td>
                                    <td>{user.Brand_Code}</td>
                                    <td>{user.Quantal}</td>
                                    <td>{user.packing}</td>
                                    <td>{user.rate}</td>
                                    <td>{user.bags}</td>
                                    <td>{user.item_Amount}</td>
                                    <td>{user.narration}</td>
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


                    <label className="debitCreditNote-form-label">Net Quental:</label>
                    <div className="debitCreditNote-col-Text">
                        <div className="debitCreditNote-form-group">
                            <input
                                tabIndex="9"
                                type="text"
                                className="debitCreditNote-form-control"
                                name="NETQNTL"
                                autoComplete="off"
                                value={globalQuantalTotal}
                                onChange={handleChange}
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                        </div>
                    </div>
                    <label className="debitCreditNote-form-label">EWay Bill:</label>
                    <div className="debitCreditNote-col-Ewaybillno">
                        <div className="debitCreditNote-form-group">
                            <input
                                type="text"
                                className="debitCreditNote-form-control"
                                name="EWay_Bill_No"
                                autoComplete="off"
                                value={formData.EWay_Bill_No}
                                onChange={handleChange}
                                tabIndex="10"
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                        </div>
                    </div>

                    <label className="debitCreditNote-form-label">Due Days:</label>
                    <div className="debitCreditNote-col-Ewaybillno">
                        <div className="debitCreditNote-form-group">
                            <input
                                type="text"
                                className="debitCreditNote-form-control"
                                name="Due_Days"
                                autoComplete="off"
                                value={formData.Due_Days}
                                onChange={handleChange}
                                tabIndex="11"
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                        </div>
                    </div>


                </div>
                <div className="debitCreditNote-row">
                    <label className="debitCreditNote-form-label">Subtotal:</label>
                    <div className="debitCreditNote-col-Text">
                        <div className="debitCreditNote-form-group">
                            <input
                                tabIndex="13"
                                type="text"
                                className="debitCreditNote-form-control"
                                name="subTotal"
                                autoComplete="off"
                                value={subTotal}
                                // onChange={handleChange}
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                            {formErrors.subTotal && <span className="error">{formErrors.subTotal}</span>}
                        </div>
                    </div>

                    <label className="debitCreditNote-form-label">CGST:</label>
                    <div className="debitCreditNote-col-Text">
                        <div className="debitCreditNote-form-group">
                            <input
                                tabIndex="14"
                                type="text"
                                className="debitCreditNote-form-control"
                                name="CGSTRate"
                                autoComplete="off"
                                value={formData.CGSTRate}
                                onChange={handleChange}
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                            {formErrors.CGSTRate && <span className="error">{formErrors.CGSTRate}</span>}
                            <input
                                tabIndex="15"
                                type="text"
                                className="debitCreditNote-form-control"
                                name="CGSTAmount"
                                autoComplete="off"
                                value={formData.CGSTAmount}
                                onChange={handleChange}
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                            {formErrors.CGSTAmount && <span className="error">{formErrors.CGSTAmount}</span>}
                        </div>
                    </div>
                    <label className="debitCreditNote-form-label">SGST:</label>
                    <div className="debitCreditNote-col-Text">
                        <div className="debitCreditNote-form-group">
                            <input
                                tabIndex="16"
                                type="text"
                                className="debitCreditNote-form-control"
                                name="SGSTRate"
                                autoComplete="off"
                                value={formData.SGSTRate}
                                onChange={handleChange}
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                            {formErrors.SGSTRate && <span className="error">{formErrors.SGSTRate}</span>}
                            <input
                                tabIndex="17"
                                type="text"
                                className="debitCreditNote-form-control"
                                name="SGSTAmount"
                                autoComplete="off"
                                value={formData.SGSTAmount}
                                onChange={handleChange}
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                            {formErrors.SGSTAmount && <span className="error">{formErrors.SGSTAmount}</span>}
                        </div>
                    </div>

                    <label className="debitCreditNote-form-label">IGST:</label>
                    <div className="debitCreditNote-col-Text">
                        <div className="debitCreditNote-form-group">
                            <input
                                tabIndex="18"
                                type="text"
                                className="debitCreditNote-form-control"
                                name="IGSTRate"
                                autoComplete="off"
                                value={formData.IGSTRate}
                                onChange={handleChange}
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                            {formErrors.IGSTRate && <span className="error">{formErrors.IGSTRate}</span>}
                            <input
                                tabIndex="19"
                                type="text"
                                className="debitCreditNote-form-control"
                                name="IGSTAmount"
                                autoComplete="off"
                                value={formData.IGSTAmount}
                                onChange={handleChange}
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                            {formErrors.IGSTAmount && <span className="error">{formErrors.IGSTAmount}</span>}
                        </div>
                    </div>

                    <label className="debitCreditNote-form-label">Less Frt Rs:</label>
                    <div className="debitCreditNote-col-Text">
                        <div className="debitCreditNote-form-group">
                            <input
                                tabIndex="18"
                                type="text"
                                className="debitCreditNote-form-control"
                                name="LESS_FRT_RATE"
                                autoComplete="off"
                                value={formData.LESS_FRT_RATE}
                                onChange={handleChange}
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                            {formErrors.LESS_FRT_RATE && <span className="error">{formErrors.LESS_FRT_RATE}</span>}
                            <input
                                tabIndex="19"
                                type="text"
                                className="debitCreditNote-form-control"
                                name="freight"
                                autoComplete="off"
                                value={formData.freight}
                                onChange={handleChange}
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                            {formErrors.freight && <span className="error">{formErrors.freight}</span>}
                        </div>
                    </div>

                    <label className="debitCreditNote-form-label">Bank Commission:</label>
                    <div className="debitCreditNote-col-Text">

                        <div className="debitCreditNote-form-group">
                            <input
                                tabIndex="20"
                                type="text"
                                className="debitCreditNote-form-control"
                                name="bank_commission"
                                autoComplete="off"
                                value={formData.bank_commission}
                                onChange={handleChange}
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                            {formErrors.bank_commission && <span className="error">{formErrors.bank_commission}</span>}
                        </div>
                    </div>

                    <label className="debitCreditNote-form-label">Other +/-:</label>
                    <div className="debitCreditNote-col-Text">

                        <div className="debitCreditNote-form-group">
                            <input
                                tabIndex="20"
                                type="text"
                                className="debitCreditNote-form-control"
                                name="OTHER_AMT"
                                autoComplete="off"
                                value={formData.OTHER_AMT}
                                onChange={handleChange}
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                            {formErrors.OTHER_AMT && <span className="error">{formErrors.OTHER_AMT}</span>}
                        </div>
                    </div>

                    <label className="debitCreditNote-form-label">Cash Advance:</label>
                    <div className="debitCreditNote-col-Text">

                        <div className="debitCreditNote-form-group">
                            <input
                                tabIndex="21"
                                type="text"
                                className="debitCreditNote-form-control"
                                name="cash_advance"
                                autoComplete="off"
                                value={formData.cash_advance}
                                onChange={handleChange}
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                            {formErrors.cash_advance && <span className="error">{formErrors.cash_advance}</span>}
                        </div>
                    </div>

                    <label className="debitCreditNote-form-label">Bill Amount::</label>
                    <div className="debitCreditNote-col-Text">

                        <div className="debitCreditNote-form-group">
                            <input
                                tabIndex="21"
                                type="text"
                                className="debitCreditNote-form-control"
                                name="Bill_Amount"
                                autoComplete="off"
                                value={formData.Bill_Amount}
                                onChange={handleChange}
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                            {formErrors.Bill_Amount && <span className="error">{formErrors.Bill_Amount}</span>}
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


            </form>
        </>
    );
};
export default SugarPurchase;