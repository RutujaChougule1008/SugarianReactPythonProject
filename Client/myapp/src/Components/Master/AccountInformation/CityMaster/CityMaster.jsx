import React, { useState, useEffect } from 'react';
import ActionButtonGroup from '../../../../Common/CommonButtons/ActionButtonGroup';
import NavigationButtons from "../../../../Common/CommonButtons/NavigationButtons";
import { useNavigate, useLocation, Form } from 'react-router-dom';
import './Citymaster.css';
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import GSTStateMasterHelp from "../../../../Helper/GSTStateMasterHelp"

const API_URL = process.env.REACT_APP_API;

const CityMaster = () => {
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
    const companyCode = sessionStorage.getItem('Company_Code')
    const navigate = useNavigate();
    //In utility page record doubleClicked that recod show for edit functionality
    const location = useLocation();
    const selectedRecord = location.state?.selectedRecord;

    const initialFormData = {
        city_code: '',
        city_name_e: '',
        pincode: '',
        Sub_Area: '',
        city_name_r: '',
        company_code: '',
        state: '',
        Distance: '',
        GstStateCode: ''
    };

    const [formData, setFormData] = useState(initialFormData);
    const [GstStateCode, setGstStateCode] = useState('');
    const [states, setStates] = useState([]);

    useEffect(() => {
        // Fetch data from the API endpoint when the component mounts
        axios.get('http://localhost:8080/api/sugarian/getall-gststatemaster')
            .then(response => {
                // Assuming the API response contains an array of states
                setStates(response.data);
                setFormData(response.data)
            })
            .catch(error => {
                console.error('Error fetching states:', error);
            });
    }, []);


    // Handle change for all inputs
    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prevState => {
            // Create a new object based on existing state
            const updatedFormData = { ...prevState, [name]: value };
            return updatedFormData;
        });
    };

    const fetchLastCityCode = () => {
        fetch(`${API_URL}/getlast-city?company_code=${companyCode}`)
            .then(response => {
                console.log("response", response)
                if (!response.ok) {
                    throw new Error('Failed to fetch last company code');
                }
                return response.json();
            })
            .then(data => {
                // Set the last company code as the default value for Company_Code
                setFormData(prevState => ({
                    ...prevState,
                    city_code: data.city_code + 1
                }));
            })
            .catch(error => {
                console.error('Error fetching last company code:', error);
            });
    };

    const handleAddOne = () => {
        setAddOneButtonEnabled(false);
        setSaveButtonEnabled(true);
        setCancelButtonEnabled(true);
        setEditButtonEnabled(false);
        setDeleteButtonEnabled(false);
        setIsEditing(true);
        fetchLastCityCode()
        setFormData(initialFormData)
    }

    const handleSaveOrUpdate = () => {
        if (isEditMode) {
            axios
                .put(
                    `${API_URL}/update-city?company_code=${companyCode}&city_code=${formData.city_code}`, formData
                )
                .then((response) => {
                    console.log("Data updated successfully:", response.data);
                    toast.success("City update successfully!");
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
                .post(`${API_URL}/create-city?company_code=${companyCode}`, formData)
                .then((response) => {
                    console.log("Data saved successfully:", response.data);
                    toast.success("City Create successfully!");
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
        axios.get(`${API_URL}/getlast-city?company_code=${companyCode}`)
            .then((response) => {
                const data = response.data;
                setFormData({
                    ...formData, ...data
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

    const handleDelete = async () => {
        const isConfirmed = window.confirm(`Are you sure you want to delete this City ${formData.city_code}?`);

        if (isConfirmed) {
            setIsEditMode(false);
            setAddOneButtonEnabled(true);
            setEditButtonEnabled(true);
            setDeleteButtonEnabled(true);
            setBackButtonEnabled(true);
            setSaveButtonEnabled(false);
            setCancelButtonEnabled(false);

            try {
                const deleteApiUrl = `${API_URL}/delete-city?company_code=${companyCode}&city_code=${formData.city_code}`;
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
        navigate("/city-master-utility")
    }

    //Navigation Buttons 
    const handleFirstButtonClick = async () => {
        try {
            const response = await fetch(`${API_URL}/get_First_Record`);
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
            const response = await fetch(`${API_URL}/get_previous_record?city_code=${formData.city_code}`);

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
            const response = await fetch(`${API_URL}/get_next_record?city_code=${formData.city_code}`);

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
            const response = await fetch(`${API_URL}/get_last_record`);
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
    const handlerecordDoubleClicked = async () => {
        try {
            const response = await axios.get(`${API_URL}/get-citybycitycode?company_code=${companyCode}&city_code=${selectedRecord.city_code}`);
            const data = response.data;
            setFormData(data);
            setIsEditing(false);
        } catch (error) {
            console.error('Error fetching data:', error);
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
    }

    useEffect(() => {
        if (selectedRecord) {
            handlerecordDoubleClicked();
        } else {
            handleAddOne()
        }

    }, [selectedRecord]);

    //change No functionality to get that particular record
    const handleKeyDown = async (event) => {
        if (event.key === 'Tab') {
            const changeNoValue = event.target.value;
            try {
                const response = await axios.get(`${API_URL}/get-citybycitycode?company_code=${companyCode}&city_code=${changeNoValue}`);
                const data = response.data;
                setFormData(data);
                setIsEditing(false);

            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }
    };

    const handleGstStateCode = (code) => {
        setGstStateCode(code)
        setFormData({
            ...formData,
            GstStateCode: code
        })
    }
    console.log("GstStateCode", GstStateCode)

    return (
        <>

            <div class="created-by-container">
                <h2 class="created-by-heading">Created By: {formData.Created_By}</h2>
            </div>

            <div class="modified-by-container">
                <h2 class="modified-by-heading">Modified By: {formData.Modified_By}</h2>
            </div>
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
            <div className="form-container">
                <form>
                    <h2>City Master</h2>
                    <br />
                    <div className="form-group ">
                        <label htmlFor="changeNo">Change No:</label>
                        <input
                            type="text"
                            id="changeNo"
                            name="changeNo"
                            onKeyDown={handleKeyDown}
                            disabled={!addOneButtonEnabled}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="city_code">City Code:</label>
                        <input
                            type="text"
                            id="city_code"
                            name="city_code"
                            value={formData.city_code}
                            onChange={handleChange}
                            disabled={!isEditing && addOneButtonEnabled}

                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="city_name_e">City_Name:</label>
                        <input
                            type="text"
                            id="city_name_e"
                            name="city_name_e"
                            value={formData.city_name_e}
                            onChange={handleChange}
                            disabled={!isEditing && addOneButtonEnabled}

                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="city_name_r">City Name Regional:</label>
                        <input
                            type="text"
                            id="city_name_r"
                            name="city_name_r"
                            value={formData.city_name_r}
                            onChange={handleChange}
                            disabled={!isEditing && addOneButtonEnabled}

                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="pincode">PinCode :</label>
                        <input
                            type="text"
                            id="pincode"
                            name="pincode"
                            value={formData.pincode}
                            onChange={handleChange}
                            disabled={!isEditing && addOneButtonEnabled}

                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="pincode">SubArea:</label>
                        <input
                            type="text"
                            id="Sub_Area"
                            name="Sub_Area"
                            value={formData.Sub_Area}
                            onChange={handleChange}
                            disabled={!isEditing && addOneButtonEnabled}

                        />
                    </div>


                    <div className="form-group">
                        <label htmlFor="state">State:</label>
                        <select id="state" name="state" className="custom-select" value={formData.state}
                            onChange={handleChange} disabled={!isEditing && addOneButtonEnabled}>
                            {states.map(state => (
                                <option key={state.State_Code} value={state.value}>{state.State_Name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="Distance">Distance:</label>
                        <input
                            type="text"
                            id="Distance"
                            name="Distance"
                            value={formData.Distance}
                            onChange={handleChange}
                            disabled={!isEditing && addOneButtonEnabled}

                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="Distance">GST State Code:</label>
                        <GSTStateMasterHelp onAcCodeClick={handleGstStateCode} GstStateCode={formData.GstStateCode} />
                    </div>
                </form>
            </div>

        </>
    );
};

export default CityMaster;
