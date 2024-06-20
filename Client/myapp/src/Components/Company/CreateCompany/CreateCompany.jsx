import React, { useState, useEffect, useRef } from 'react';
import "bootstrap/dist/css/bootstrap.min.css";
import ActionButtonGroup from '../../../Common/CommonButtons/ActionButtonGroup';
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "./CreateCompany.css"

const API_URL = process.env.REACT_APP_API_URL;

function CompanyCreation() {
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
    const [logoURL, setLogoURL] = useState(null);
    const [signature, setSignature] = useState(null);

    const navigate = useNavigate();
    // Define state variable to hold form data

    const initialFormData = {
        Company_Name_E: "",
        Address_E: "",
        Address_R: "",
        City_E: "",
        Company_Code: "",
        Company_Name_R: "",
        City_R: "",
        State_E: "",
        State_R: "",
        PIN: "",
        Mobile_No: "",
        Created_By: "",
        Modified_By: "",
        Pan_No: "",
        Group_Code: "",
        CST: "",
        TIN: "",
        PHONE: "",
        FSSAI_No: "",
        GST: "",
    };

    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
        // Fetch the last company code when the component mounts
        fetchLastCompany_Code();
        window.sessionStorage.setItem("username", "Pankaj");

    }, []);

    const fetchLastCompany_Code = () => {
        fetch(`${API_URL}/get_last_company_code`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch last company code');
                }
                return response.json();
            })
            .then(data => {
                // Set the last company code as the default value for Company_Code
                setFormData(prevState => ({
                    ...prevState,
                    Company_Code: data.last_company_code + 1
                }));
            })
            .catch(error => {
                console.error('Error fetching last company code:', error);
            });
    };

    // Function to handle form submission
    const addButtonRef = useRef(null);

    // Function to handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(formData);

        if (!isEditing) {
            addButtonRef.current.focus();
        }
    };

    // Function to handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });

        if (name === 'Address_E' && e.key === 'Enter' && value.trim() !== '') {
            const saveButton = document.getElementById('save');
            // Set focus on the save button
            if (saveButton) {
                saveButton.focus();
            }
        }
    };

    const handleLogoChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setLogoURL(URL.createObjectURL(file));
        }
    };

    const handleSignatureChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSignature(URL.createObjectURL(file));
        }
       
    };

    //set focus functionality
    const lastFocusableElementRef = useRef(null);

    useEffect(() => {
        // Focus the first input field when the component mounts
        document.getElementById('Company_Name_E').focus();
    }, []);

    const handleKeyDown = (e) => {
        // Handle Tab key press
        if (e.key === 'Tab' && lastFocusableElementRef.current && document.activeElement === lastFocusableElementRef.current) {
            e.preventDefault();
            document.getElementById('Company_Name_E').focus();
        }
    };

    const handleAddOne = () => {
        setAddOneButtonEnabled(false);
        setSaveButtonEnabled(true);
        setCancelButtonEnabled(true);
        setEditButtonEnabled(false);
        setDeleteButtonEnabled(false);
        setIsEditing(true);
        fetchLastCompany_Code();
        setFormData(initialFormData);
    }

    const handleSaveOrUpdate = () => {
        if (isEditMode) {
            axios
                .put(
                    `${API_URL}/update_company?company_code=${formData.Company_Code}`, formData
                )
                .then((response) => {
                    console.log("Data updated successfully:", response.data);
                    window.alert("Data updated successfully!");

                    // Update isLocked to false after successful update
                    axios.put(
                        `${API_URL}/lock_unlock_record?company_code=${formData.Company_Code}`,
                        {
                            isLocked: false,
                            LockedbyUser: "Ruturaj"
                        }
                    ).then(() => {
                        console.log("Record unlocked successfully");
                    }).catch((error) => {
                        console.error("Error unlocking record:", error);
                    });

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
                    window.alert("Record is already deleted!");
                    handleCancel();
                    console.error("Error updating data:", error);
                });
        } else {
            axios
                .post(`${API_URL}/create_company`, formData)
                .then((response) => {
                    console.log("Data saved successfully:", response.data);
                    window.alert("Data saved successfully!");
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
        // Fetch the latest data for the company being edited
        axios.get(`${API_URL}/get_company_by_code?company_code=${formData.Company_Code}`)
            .then((response) => {
                const data = response.data;
                const isLockedNew = data.isLocked
                const isLockedByUserNew = data.LockedbyUser
                if (isLockedNew === true) {
                    window.alert(`This record is Locked By ${isLockedByUserNew}`);
                    return;
                }
                else {
                    axios
                        .put(
                            `${API_URL}/lock_unlock_record?company_code=${formData.Company_Code}`,
                            {
                                isLocked: true,
                                LockedbyUser: "Pankaj"
                            }
                        )
                }

                setFormData({
                    ...formData, ...data
                });
                setIsEditMode(true);
                setAddOneButtonEnabled(false);
                setSaveButtonEnabled(true);
                setCancelButtonEnabled(true);
                setEditButtonEnabled(false);
                setDeleteButtonEnabled(false);
                setBackButtonEnabled(true);
                setIsEditing(true);
            })
            .catch((error) => {
                window.alert("This record is already deleted! Showing the previous record.");

                // Fetch the previous record
                const prevCompanyCode = parseInt(formData.Company_Code) - 1;
                axios.get(`${API_URL}/get_company_by_code?company_code=${prevCompanyCode}`)
                    .then((response) => {
                        const data = response.data;
                        setFormData({
                            ...formData, ...data
                        });
                        setIsEditMode(true);
                        setAddOneButtonEnabled(false);
                        setSaveButtonEnabled(true);
                        setCancelButtonEnabled(true);
                        setEditButtonEnabled(false);
                        setDeleteButtonEnabled(false);
                        setBackButtonEnabled(true);
                        setIsEditing(true);
                    })
                    .catch((error) => {
                        console.error("Error fetching previous record data after deletion:", error);
                    });
            });
    };

    const handleCancel = () => {
        axios.get(`${API_URL}/get_company_by_code?company_code=${formData.Company_Code}`)
            .then((response) => {
                const data = response.data;
                const isLockedNew = data.isLocked
                if (isLockedNew === true) {
                    axios
                        .put(
                            `${API_URL}/lock_unlock_record?company_code=${formData.Company_Code}`,
                            {
                                isLocked: false,
                                LockedbyUser: "Ruturaj"
                            }
                        )
                        .then(() => {
                            // Reset form data after unlocking record
                            setFormData({
                                ...formData, ...data
                            });
                        })
                        .catch(error => {
                            console.error('Error unlocking record:', error);
                        });
                } else {
                    // Reset form data without unlocking record
                    setFormData({
                        ...formData, ...data
                    });
                }
            })
            .catch((error) => {
                console.error("Error fetching latest data for edit:", error);
            });

        // Reset other state variables
        fetch(`${API_URL}/get_last_company_data`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch last company data');
                }
                return response.json();
            })
            .then(data => {
                // Populate form fields with the last company data
                setFormData({
                    ...formData, ...data,
                    isLocked: false, // Reset isLocked state
                    LockedbyUser: '' // Reset LockedbyUser state
                });
            })
            .catch(error => {
                console.error('Error fetching last company data:', error);
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
            `Are you sure you want to delete this Company Code ${formData.Company_Code}?`
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
                const deleteApiUrl = `${API_URL}/delete_company?company_code=${formData.Company_Code}`;
                const response = await axios.delete(deleteApiUrl);

                if (response.status === 200) {
                    console.log("Company deleted successfully");
                    window.alert("Record deleted successfully")

                    // Fetch the previous record after deletion
                    const prevRecordResponse = await axios.get(`${API_URL}/get_previous_company_data?company_code=${formData.Company_Code}`);

                    if (prevRecordResponse.status === 200) {
                        const prevRecordData = prevRecordResponse.data;
                        setFormData(prevRecordData);
                    } else {
                        console.error(
                            "Failed to fetch previous record data after deletion!",
                            prevRecordResponse.status,
                            prevRecordResponse.statusText
                        );
                    }
                } else if (response.status === 404) {
                    // If the record is already deleted
                    window.alert("Record is already deleted!");
                } else {
                    console.error(
                        "Company Not Found!",
                        response.status,
                        response.statusText
                    );
                }
            } catch (error) {
                window.location.reload();
                console.error("Error during API call:", error);
            }
        } else {
            console.log("Deletion cancelled");
        }
    };

    const handleBack = () => {
        navigate("/create-utility")
    }

    //Navigation Buttons 
    const handleFirstButtonClick = async () => {
        try {
            const response = await fetch(`${API_URL}/get_first_navigation`);
            if (response.ok) {
                const data = await response.json();
                // Access the first element of the array
                const firstUserCreation = data[0];

                setFormData({
                    ...formData, ...firstUserCreation,

                });

            } else {
                console.error("Failed to fetch first tender data:", response.status, response.statusText);
            }
        } catch (error) {
            console.error("Error during API call:", error);
        }
    };

    const handlePreviousButtonClick = async () => {
        try {
            // Use formData.Company_Code as the current company code
            const response = await fetch(`${API_URL}/get_previous_navigation?current_company_code=${formData.Company_Code}`);

            if (response.ok) {
                const data = await response.json();
                console.log("previousCompanyCreation", data);

                // Assuming setFormData is a function to update the form data
                setFormData({
                    ...formData, ...data,
                });

            } else {
                console.error("Failed to fetch previous tender data:", response.status, response.statusText);
            }
        } catch (error) {
            console.error("Error during API call:", error);
        }
    };

    const handleNextButtonClick = async () => {
        try {
            const response = await fetch(`${API_URL}/get_next_navigation?current_company_code=${formData.Company_Code}`);

            if (response.ok) {
                const data = await response.json();
                console.log("nextCompanyCreation", data);
                // Assuming setFormData is a function to update the form data
                setFormData({
                    ...formData, ...data.nextCompanyCreation,
                });
            } else {
                console.error("Failed to fetch next company creation data:", response.status, response.statusText);
            }
        } catch (error) {
            console.error("Error during API call:", error);
        }
    };

    const handleLastButtonClick = async () => {
        try {
            const response = await fetch(`${API_URL}/get_last_navigation`);
            if (response.ok) {
                const data = await response.json();
                // Access the first element of the array
                const last_Navigation = data[0];

                setFormData({
                    ...formData, ...last_Navigation,
                });
            } else {
                console.error("Failed to fetch first tender data:", response.status, response.statusText);
            }
        } catch (error) {
            console.error("Error during API call:", error);
        }
    }

    //Handle Record DoubleCliked in Utility Page Show that record for Edit
    const handlerecordDoubleClicked = () => {
        fetch(`${API_URL}/get_company_by_code?company_code=${selectedRecord.Company_Code}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch last company data');
                }
                return response.json();
            })
            .then(data => {
                // Populate form fields with the last company data
                setFormData({
                    ...formData, ...data,
                });
            })
            .catch(error => {
                console.error('Error fetching last company data:', error);
            });

        setIsEditMode(false);
        setAddOneButtonEnabled(true);
        setEditButtonEnabled(true);
        setDeleteButtonEnabled(true);
        setBackButtonEnabled(true);
        setSaveButtonEnabled(false);
        setCancelButtonEnabled(false);
        setUpdateButtonClicked(true);
        setIsEditing(false);
    }


    //In utility page record doubleClicked that recod show for edit functionality
    const location = useLocation();
    const selectedRecord = location.state?.selectedRecord;


    useEffect(() => {
        if (selectedRecord) {
            handlerecordDoubleClicked();

        } else {
            handleAddOne();
        }
    }, [selectedRecord]);


    return (
        <div className="container">
            {/* Action button */}
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
                    addButtonRef={addButtonRef}
                />
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
            <br />
            <div className="container" onKeyDown={handleKeyDown}>
                <div className="containerData">
                    <h2>Company Creation</h2>
                    <form onSubmit={handleSubmit} encType="multipart/form-data" >
                        <div className="upload-container">
                        {logoURL && (
                        <img src={logoURL} alt="Uploaded Logo" className="logo-preview" />
                    )}
                            <div className="form-group">
                                <label htmlFor="logo-upload">Logo:</label>
                                <input
                                    type="file"
                                    id="logo-upload"
                                    onChange={handleLogoChange}
                                    accept="image/*"
                                />
                            </div>

                            {signature && (
                        <img src={signature} alt="Uploaded Logo" className="logo-preview" />
                    )}

                            <div className="form-group">
                                <label htmlFor="signature-upload">Signature:</label>
                                <input
                                    type="file"
                                    id="signature-upload"
                                    onChange={handleSignatureChange}
                                    accept="image/*"
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="Company_Code" className="label">
                                Company Code:
                            </label>
                            <input
                                type="text"
                                id="Company_Code"
                                name="Company_Code"
                                className="input"
                                value={formData.Company_Code}
                                onChange={handleInputChange}
                                required
                                disabled
                                autoComplete="off"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="Company_Name_E" className="label">
                                Company Name:
                            </label>
                            <input
                                type="text"
                                id="Company_Name_E"
                                name="Company_Name_E"
                                className="input"
                                value={formData.Company_Name_E}
                                onChange={handleInputChange}
                                required
                                autoComplete="off"
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="Company_Name_R" className="label">
                                Regional Name:
                            </label>
                            <input
                                type="text"
                                id="Company_Name_R"
                                name="Company_Name_R"
                                className="input"
                                value={formData.Company_Name_R}
                                onChange={handleInputChange}
                                required
                                autoComplete="off"
                                disabled={!isEditing && addOneButtonEnabled}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="Address_E" className="label">
                                Company Address:
                            </label>
                            <textarea
                                id="Address_E"
                                name="Address_E"
                                className="input"
                                value={formData.Address_E}
                                onChange={handleInputChange}
                                rows="2"
                                required
                                autoComplete="off"
                                disabled={!isEditing && addOneButtonEnabled}
                            ></textarea>
                        </div>
                        <div className="form-group">
                            <label htmlFor="Address_R" className="label">
                                Regional Address:
                            </label>
                            <textarea
                                id="Address_R"
                                name="Address_R"
                                className="input"
                                value={formData.Address_R}
                                onChange={handleInputChange}
                                rows="2"
                                required
                                autoComplete="off"
                                disabled={!isEditing && addOneButtonEnabled}
                            ></textarea>
                        </div>
                        {/* City, State, and Pin fields in one row */}
                        <div className="form-group">
                            <div className="form-group-inline">
                                <label htmlFor="City_E" className="label">
                                    City:
                                </label>
                                <input
                                    type="text"
                                    id="City_E"
                                    name="City_E"
                                    className="input"
                                    value={formData.City_E}
                                    onChange={handleInputChange}
                                    required
                                    autoComplete="off"
                                    disabled={!isEditing && addOneButtonEnabled}
                                />
                            </div>
                            <div className="form-group-inline">
                                <label htmlFor="State_E" className="label">
                                    State:
                                </label>
                                <input
                                    type="text"
                                    id="State_E"
                                    name="State_E"
                                    className="input"
                                    value={formData.State_E}
                                    onChange={handleInputChange}
                                    required
                                    autoComplete="off"
                                    disabled={!isEditing && addOneButtonEnabled}
                                />
                            </div>
                            <div className="form-group-inline">
                                <label htmlFor="PIN" className="label">
                                    Pin:
                                </label>
                                <input
                                    type="text"
                                    id="PIN"
                                    name="PIN"
                                    className="input"
                                    value={formData.PIN}
                                    onChange={handleInputChange}
                                    required
                                    autoComplete="off"
                                    disabled={!isEditing && addOneButtonEnabled}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <div className="form-group-inline">
                                <label htmlFor="City_R" className="label">
                                    City(R):
                                </label>
                                <input
                                    type="text"
                                    id="City_R"
                                    name="City_R"
                                    className="input"
                                    value={formData.City_R}
                                    onChange={handleInputChange}
                                    required
                                    autoComplete="off"
                                    disabled={!isEditing && addOneButtonEnabled}
                                />
                            </div>
                            <div className="form-group-inline">
                                <label htmlFor="State_R" className="label">
                                    State_R:
                                </label>
                                <input
                                    type="text"
                                    id="State_R"
                                    name="State_R"
                                    className="input"
                                    value={formData.State_R}
                                    onChange={handleInputChange}
                                    required
                                    autoComplete="off"
                                    disabled={!isEditing && addOneButtonEnabled}
                                />
                            </div>
                            <div className="form-group-inline">
                                <label htmlFor="GST" className="label">
                                    GST:
                                </label>
                                <input
                                    type="text"
                                    id="GST"
                                    name="GST"
                                    className="input"
                                    value={formData.GST}
                                    onChange={handleInputChange}
                                    required
                                    autoComplete="off"
                                    disabled={!isEditing && addOneButtonEnabled}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <div className="form-group-inline">
                                <label htmlFor="City_E" className="label">
                                    Mobile:
                                </label>
                                <input
                                    type="Mobile_No"
                                    id="Mobile_No"
                                    name="Mobile_No"
                                    className="input"
                                    value={formData.Mobile_No}
                                    onChange={handleInputChange}
                                    required
                                    autoComplete="off"
                                    disabled={!isEditing && addOneButtonEnabled}
                                />
                            </div>
                            <div className="form-group-inline">
                                <label htmlFor="State_E" className="label">
                                    CST:
                                </label>
                                <input
                                    type="text"
                                    id="CST"
                                    name="CST"
                                    className="input"
                                    value={formData.CST}
                                    onChange={handleInputChange}
                                    required
                                    autoComplete="off"
                                    disabled={!isEditing && addOneButtonEnabled}
                                />
                            </div>
                            <div className="form-group-inline">
                                <label htmlFor="TIN" className="label">
                                    TIN:
                                </label>
                                <input
                                    type="text"
                                    id="TIN"
                                    name="TIN"
                                    className="input"
                                    value={formData.TIN}
                                    onChange={handleInputChange}
                                    required
                                    autoComplete="off"
                                    disabled={!isEditing && addOneButtonEnabled}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <div className="form-group-inline">
                                <label htmlFor="City_E" className="label">
                                    Phone:
                                </label>
                                <input
                                    type="text"
                                    id="PHONE"
                                    name="PHONE"
                                    className="input"
                                    value={formData.PHONE}
                                    onChange={handleInputChange}
                                    required
                                    autoComplete="off"
                                    disabled={!isEditing && addOneButtonEnabled}
                                />
                            </div>
                            <div className="form-group-inline">
                                <label htmlFor="Pan_No" className="label">
                                    PAN No:
                                </label>
                                <input
                                    type="text"
                                    id="Pan_No"
                                    name="Pan_No"
                                    className="input"
                                    value={formData.Pan_No}
                                    onChange={handleInputChange}
                                    required
                                    autoComplete="off"
                                    disabled={!isEditing && addOneButtonEnabled}
                                />
                            </div>
                            <div className="form-group-inline">
                                <label htmlFor="PIN" className="label">
                                    FSSAI No:
                                </label>
                                <input
                                    type="text"
                                    id="FSSAI_No"
                                    name="FSSAI_No"
                                    className="input"
                                    value={formData.FSSAI_No}
                                    onChange={handleInputChange}
                                    required
                                    autoComplete="off"
                                    disabled={!isEditing && addOneButtonEnabled}
                                
                                />
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default CompanyCreation;
