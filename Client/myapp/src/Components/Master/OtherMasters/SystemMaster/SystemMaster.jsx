import React, { useState, useEffect } from "react";
import NavigationButtons from "../../../../Common/CommonButtons/NavigationButtons";
import ActionButtonGroup from "../../../../Common/CommonButtons/ActionButtonGroup";
import { useNavigate, useLocation } from "react-router-dom";
// import "./FinicialGroups.css";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./SystemMaster.css";
import AccountMasterHelp from "../../../../Helper/AccountMasterHelp";
import GSTRateMasterHelp from "../../../../Helper/GSTRateMasterHelp";

const API_URL = process.env.REACT_APP_API;
const Year_Code = sessionStorage.getItem("Year_Code")
const companyCode = sessionStorage.getItem("Company_Code");

//Labels Global variables
var PurchName = ""
var PurchCode = ""
var SaleName = ""
var SaleCode = ""
var GStrateCode = ""
var GStrateName = ""
var selectedfilter =""

const SystemMaster = () => {
    const location = useLocation();
    selectedfilter = location.state?.selectedfilter;
    
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
    const [SystemType, setSystemType] = useState(selectedfilter)
    const [purchaseAccount, setPurchaseAccount] = useState('')
    const [saleaccount, setSaleAccount] = useState('')
    const [gstRateCode, setgstRateCode] = useState('')
    const [isHandleChange, setIsHandleChange] = useState(false);


    const navigate = useNavigate();
    //In utility page record doubleClicked that recod show for edit functionality
   
    const selectedRecord =  location.state?.selectedRecord;

    const initialFormData = {
        //SystemType:"",
        System_Code: "",
        System_Name_E: "",
        System_Name_R: "",
        System_Rate: null,
        Purchase_AC: "",
        Sale_AC: "",
        Vat_AC: "",
        Opening_Bal: null,
        KgPerKatta: null,
        minRate: null,
        maxRate: null,
        Company_Code: 1,
        Year_Code: 1,
        Branch_Code: "",
        HSN: "",
        Opening_Value: null,
        Gst_Code: "",
        MarkaSet: "",
        Supercost: "",
        Packing: "",
        LodingGst: "",
        MarkaPerc: null,
        SuperPerc: null,
        RatePer: "",
        IsService: "",
        Width: null,
        LENGTH: null,
        levi: null,
        Oldcompname: null,
        Insurance: null,
        weight: null,
        gstratecode: null,
        category: null

    };

    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
        if (isHandleChange) {
            handleCancel();
            setIsHandleChange(false); 
        }
        document.getElementById('System_Name_E').focus();
    }, [SystemType]);


    const handleChange = (event) => {
        const { name, value } = event.target;
        console.log("handleChange", { name, value });
        if (name === "System_Type") {
            console.log("Selected System_Type:", value);
            setSystemType(value); 
            setIsHandleChange(true);
          
        } else {
            setFormData((prevState) => ({
                ...prevState,
                [name]: value
            }));
           
        }
      
    };

    const fetchLastRecordSystemCode = () => {
        fetch(`${API_URL}/get-SystemMaster-lastRecord?Company_Code=${companyCode}&System_Type=${SystemType}`)
            .then((response) => {
                console.log("response", response);
                if (!response.ok) {
                    throw new Error("Failed to fetch last record");
                }
                return response.json();
            })
            .then((data) => {
                // Set the last company code as the default value for Company_Code
                console.log("data+++++++", data)
                setFormData((prevState) => ({
                    ...prevState,
                    System_Code: data.last_SystemMaster_data.System_Code + 1,
                }));
            })
            .catch((error) => {
                console.error("Error fetching last record:", error);
            });
    };

    const handleAddOne = () => {
        setAddOneButtonEnabled(false);
        setSaveButtonEnabled(true);
        setCancelButtonEnabled(true);
        setEditButtonEnabled(false);
        setDeleteButtonEnabled(false);
        setIsEditing(true);
        fetchLastRecordSystemCode();
        setFormData(initialFormData);
        PurchName = ""
        PurchCode = ""
        SaleName = ""
        SaleCode = ""
        GStrateCode = ""
        GStrateName = ""
    };

    const handleSaveOrUpdate = () => {
        if (isEditMode) {
            axios
                .put(
                    `${API_URL}/update-SystemMaster?System_Code=${formData.System_Code}&Company_Code=${companyCode}&System_Type=${SystemType}`,
                    formData
                )
                .then((response) => {
                    console.log("Data updated successfully:", response.data);
                    toast.success("Record update successfully!");
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
                    `${API_URL}/create-Record-SystemMaster?Company_Code=${companyCode}&System_Type=${SystemType}`,
                    formData
                )
                .then((response) => {
                    console.log("Data saved successfully:", response.data);
                    toast.success("Record Saved successfully!");
                    setIsEditMode(false);
                    setAddOneButtonEnabled(true);
                    setEditButtonEnabled(true);
                    setDeleteButtonEnabled(true);
                    setBackButtonEnabled(true);
                    setSaveButtonEnabled(false);
                    setCancelButtonEnabled(false);
                    setUpdateButtonClicked(true);
                    setIsEditing(false);
                    setTimeout(()=>{
                        window.location.reload();
                    },1000)
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
                `${API_URL}/get-SystemMaster-lastRecord?Company_Code=${companyCode}&System_Type=${SystemType}`
            )
            .then((response) => {
                const data = response.data;
                if (data && data.last_SystemMaster_data) {
                    PurchName = data.label_names[0].purcAcname;
                    PurchCode = data.last_SystemMaster_data.Purchase_AC;
                    SaleName = data.label_names[0].saleAcname;
                    SaleCode = data.last_SystemMaster_data.Sale_AC;
                    GStrateName = data.label_names[0].GST_Name;
                    GStrateCode = data.last_SystemMaster_data.Gst_Code;
                    setFormData({
                        ...formData,
                        ...data.last_SystemMaster_data,
                    });
                } else {
                    console.error("No data found for the specified SystemType");
                }
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
    

    const handleDelete = async () => {
        const isConfirmed = window.confirm(
            `Are you sure you want to delete this System Code ${formData.System_Code}?`
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
                const deleteApiUrl = `${API_URL}/delete-SystemMaster?System_Code=${formData.System_Code}&Company_Code=${companyCode}&System_Type=${formData.System_Type}`;
                const response = await axios.delete(deleteApiUrl);
                toast.success("Record deleted successfully!");
                handleCancel();
            } catch (error) {
                toast.error("Something wents Wrong!");
                console.error("Error during API call:", error);
            }
        } else {
            console.log("Deletion cancelled");
        }
    };

    const handleBack = () => {
        navigate("/syetem-masterutility");
    };
    //Handle Record DoubleCliked in Utility Page Show that record for Edit
    const handlerecordDoubleClicked = async () => {
        try {
            const response = await axios.get(
                `${API_URL}/get-SystemMaster-SelectedRecord?Company_Code=${companyCode}&system_code=${selectedRecord.System_Code}&System_Type=${selectedRecord.System_Type}`
            );
            const data = response.data;
            console.log("data double cliked", data)
            PurchName = data.label_names[0].purcAcname;
            PurchCode = data.Selected_SystemMaster_data.Purchase_AC;
            SaleName = data.label_names[0].saleAcname;
            SaleCode = data.Selected_SystemMaster_data.Sale_AC;
            GStrateName = data.label_names[0].GST_Name;
            GStrateCode = data.Selected_SystemMaster_data.Gst_Code;
            setFormData({
                ...formData,
                ...data.Selected_SystemMaster_data,
            });
            setSystemType(selectedRecord.System_Type)
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
                    `${API_URL}/get-SystemMaster-SelectedRecord?Company_Code=${companyCode}&system_code=${changeNoValue}&System_Type=${SystemType}`
                );
                const data = response.data
                PurchName = data.label_names[0].purcAcname;
                PurchCode = data.Selected_SystemMaster_data.Purchase_AC;
                SaleName = data.label_names[0].saleAcname;
                SaleCode = data.Selected_SystemMaster_data.Sale_AC;
                GStrateName = data.label_names[0].GST_Name;
                GStrateCode = data.Selected_SystemMaster_data.Gst_Code;
                setFormData({
                    ...formData,
                    ...data.Selected_SystemMaster_data,
                });
                setSystemType(selectedRecord.System_Type)
                setFormData(data);
                setIsEditing(false);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        }
    };

    //Navigation Buttons
    const handleFirstButtonClick = async () => {
        try {
            const response = await fetch(`${API_URL}/get-first-systemmaster?Company_Code=${companyCode}&System_Type=${SystemType}`);
            if (response.ok) {
                const data = await response.json();
                // Access the first element of the array
                PurchName = data.label_names[0].purcAcname;
                PurchCode = data.first_SystemMaster_data.Purchase_AC;
                SaleName = data.label_names[0].saleAcname;
                SaleCode = data.first_SystemMaster_data.Sale_AC;
                GStrateName = data.label_names[0].GST_Name;
                GStrateCode = data.first_SystemMaster_data.Gst_Code;
                setFormData({
                    ...formData,
                    ...data.first_SystemMaster_data,
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
            // Use formData.Company_Code as the current company code
            const response = await fetch(
                `${API_URL}/get-previous-Systemmaster?Company_Code=${companyCode}&System_Type=${SystemType}&System_Code=${formData.System_Code}`
            );

            if (response.ok) {
                const data = await response.json();
                PurchName = data.label_names[0].purcAcname;
                PurchCode = data.previous_Systemmaster_data.Purchase_AC;
                SaleName = data.label_names[0].saleAcname;
                SaleCode = data.previous_Systemmaster_data.Sale_AC;
                GStrateName = data.label_names[0].GST_Name;
                GStrateCode = data.previous_Systemmaster_data.Gst_Code;
                setFormData({
                    ...formData,
                    ...data.previous_Systemmaster_data,
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
                `${API_URL}/get-next-SystemMaster?Company_Code=${companyCode}&System_Type=${SystemType}&System_Code=${formData.System_Code}`
            );

            if (response.ok) {
                const data = await response.json();
                // Assuming setFormData is a function to update the form data
                PurchName = data.label_names[0].purcAcname;
                PurchCode = data.next_SystemMaster_data.Purchase_AC;
                SaleName = data.label_names[0].saleAcname;
                SaleCode = data.next_SystemMaster_data.Sale_AC;
                GStrateName = data.label_names[0].GST_Name;
                GStrateCode = data.next_SystemMaster_data.Gst_Code;
                setFormData({
                    ...formData,
                    ...data.next_SystemMaster_data,
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
            const response = await fetch(`${API_URL}/get-systemmaster-lastRecordNavigation?Company_Code=${companyCode}&System_Type=${SystemType}`);
            if (response.ok) {
                const data = await response.json();
                // Access the first element of the array
                PurchName = data.label_names[0].purcAcname;
                PurchCode = data.last_systemmaster_data.Purchase_AC;
                SaleName = data.label_names[0].saleAcname;
                SaleCode = data.last_systemmaster_data.Sale_AC;
                GStrateName = data.label_names[0].GST_Name;
                GStrateCode = data.last_systemmaster_data.Gst_Code;

                setFormData({
                    ...formData,
                    ...data.last_systemmaster_data,
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

    const handlePurchaseAccount = (code, accoid) => {
        setPurchaseAccount(code);
        setFormData({
            ...formData,
            Purchase_AC: code,
        });
    }

    const handleSaleAccount = (code, accoid) => {
        setSaleAccount(code);
        setFormData({
            ...formData,
            Sale_AC: code,
        });
    }

    const handleGstRateCode = (code) => {
        setgstRateCode(code);
        setFormData({
            ...formData,
            Gst_Code: code,
        });
    }


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
                        isFirstRecord={formData.Company_Code === 1}
                    />
                </div>
            </div>

            <div className="form-container-SystemMaster">
                <form>
                    <h2>System Master</h2>
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
                    <div>
                        <div className="form-group">
                            <label htmlFor="System_Type">System Type:</label>
                            <select id="System_Type" name="System_Type" class="custom-select" value={SystemType}
                                onChange={handleChange} >
                                <option value="G">Mobile Group</option>
                                <option value="N">Narration</option>
                                <option value="V">Vat</option>
                                <option value="I">Item</option>
                                <option value="S">Grade</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="System_Code">System Code:</label>
                        <input
                            type="text"
                            id="System_Code"
                            Name="System_Code"
                            value={formData.System_Code}
                            onChange={handleChange}
                            disabled
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="System_Name_E">System Name:</label>
                        <input
                            type="text"
                            id="System_Name_E"
                            Name="System_Name_E"
                            value={formData.System_Name_E}
                            onChange={handleChange}
                            disabled={!isEditing && addOneButtonEnabled}
                            tabIndex={1}
                        />
                    </div>

                    <div className="form-group-row">
                        <label htmlFor="Purchase_Account">Purchase_Account:</label>
                        <div className="form-group-item">

                            <AccountMasterHelp onAcCodeClick={handlePurchaseAccount} CategoryName={PurchName} CategoryCode={PurchCode}
                                name="Purchase_Account" tabIndexHelp={2} disabledFeild={!isEditing && addOneButtonEnabled} />
                        </div>
                        <label htmlFor="Sale_Account">Sale_Account:</label>
                        <div className="form-group-item">

                            <AccountMasterHelp onAcCodeClick={handleSaleAccount} CategoryName={SaleName} CategoryCode={SaleCode}
                                name="Sale_Account" tabIndexHelp={3} disabledFeild={!isEditing && addOneButtonEnabled} />
                        </div>

                    </div>

                    <div className="form-group-systemMaster">
                        <label htmlFor="Opening_Bal">Opening Balanace:</label>
                        <input
                            type="text"
                            id="Opening_Bal"
                            Name="Opening_Bal"
                            value={formData.Opening_Bal !== null ? formData.Opening_Bal : ""}
                            onChange={handleChange}
                            disabled={!isEditing && addOneButtonEnabled}
                            tabIndex={4}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="KgPerKatta">Katt/Kg:</label>
                        <input
                            type="text"
                            id="KgPerKatta"
                            Name="KgPerKatta"
                            value={formData.KgPerKatta !== null ? formData.KgPerKatta : ""}
                            onChange={handleChange}
                            disabled={!isEditing && addOneButtonEnabled}
                            tabIndex={5}
                        />
                        <label htmlFor="minRate">Min Rate:</label>
                        <input
                            type="text"
                            id="minRate"
                            Name="minRate"
                            value={formData.minRate !== null ? formData.minRate : ""}
                            onChange={handleChange}
                            disabled={!isEditing && addOneButtonEnabled}
                            tabIndex={6}
                        />
                    </div>

                    <div className="form-group">


                    </div>

                    <div className="form-group">
                        <label htmlFor="maxRate">Max rate</label>
                        <input
                            type="text"
                            id="maxRate"
                            Name="maxRate"
                            value={formData.maxRate !== null ? formData.maxRate : ""}
                            onChange={handleChange}
                            disabled={!isEditing && addOneButtonEnabled}
                            tabIndex={7}
                        />

                    </div>

                    <div className="form-group">
                        <label htmlFor="HSN">HSN no:</label>
                        <input
                            type="text"
                            id="HSN"
                            Name="HSN"
                            value={formData.HSN}
                            onChange={handleChange}
                            disabled={!isEditing && addOneButtonEnabled}
                            tabIndex={8}
                        />
                        <div className="form-group">
                            <label htmlFor="Opening_Value">Opening value:</label>
                            <input
                                type="text"
                                id="Opening_Value"
                                Name="Opening_Value"
                                value={formData.Opening_Value !== null ? formData.Opening_Value : ""}
                                onChange={handleChange}
                                disabled={!isEditing && addOneButtonEnabled}
                                tabIndex={9}
                            />
                        </div>
                    </div>

                    <div className="form-group-row">
                        <label htmlFor="Gst_Rate">GST Code:</label>
                        <div className="form-group-item">

                            <GSTRateMasterHelp onAcCodeClick={handleGstRateCode} GstRateName={GStrateName}
                                GstRateCode={GStrateCode} name="Gst_Rate" tabIndexHelp={10} disabledFeild={!isEditing && addOneButtonEnabled} />
                        </div>
                    </div>


                    <div className="form-group">
                        <label htmlFor="MarkaSet">Market Sale:</label>
                        <select id="MarkaSet" name="group_Type" class="custom-select" value={formData.MarkaSet}
                            onChange={handleChange} disabled={!isEditing && addOneButtonEnabled}  tabIndex={11} >
                            <option value="Y">Yes</option>
                            <option value="N">No</option>
                        </select>
                        <input
                            type="text"
                            id="MarkaPerc"
                            Name="MarkaPerc"
                            value={formData.MarkaPerc !== null ? formData.MarkaPerc : ""}
                            onChange={handleChange}
                            disabled={!isEditing && addOneButtonEnabled}
                            tabIndex={12}
                        />
                        <label htmlFor="Bill_Amount">%</label>
                    </div>
                    <div className="form-group">
                        <label htmlFor="Supercost">Suparcost:</label>
                        <select id="Supercost" name="Supercost" class="custom-select" value={formData.Supercost}
                            onChange={handleChange} disabled={!isEditing && addOneButtonEnabled}  tabIndex={13} >
                            <option value="Y">Yes</option>
                            <option value="N">No</option>

                        </select>
                        <input
                            type="text"
                            id="SuperPerc"
                            Name="SuperPerc"
                            value={formData.SuperPerc !== null ? formData.SuperPerc : ""}
                            onChange={handleChange}
                            disabled={!isEditing && addOneButtonEnabled}
                            tabIndex={14} 
                        />
                        <label htmlFor="Bill_Amount">%</label>
                    </div>
                    <div className="form-group">
                        <label htmlFor="Packing">Packing:</label>
                        <select id="Packing" name="Packing" class="custom-select" value={formData.Packing}
                            onChange={handleChange} disabled={!isEditing && addOneButtonEnabled} tabIndex={15}  >
                            <option value="Y">Yes</option>
                            <option value="N">No</option>

                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="LodingGst">Including GST:</label>
                        <select id="LodingGst" name="LodingGst" class="custom-select" value={formData.LodingGst}
                            onChange={handleChange} disabled={!isEditing && addOneButtonEnabled} tabIndex={16}  >
                            <option value="Y">Yes</option>
                            <option value="N">No</option>

                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="RatePer">Rate Per:</label>
                        <select id="RatePer" name="RatePer" class="custom-select" value={formData.RatePer}
                            onChange={handleChange} disabled={!isEditing && addOneButtonEnabled} tabIndex={17}  >
                            <option value="Q">Quantity</option>
                            <option value="K">Quintal</option>

                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="IsService">Is Service:</label>
                        <select id="IsService" name="IsService" class="custom-select" value={formData.IsService}
                            onChange={handleChange} disabled={!isEditing && addOneButtonEnabled} tabIndex={18}  >
                            <option value="Y">Yes</option>
                            <option value="N">No</option>

                        </select>
                    </div>
                </form>
            </div>
        </>
    );
};
export default SystemMaster;
