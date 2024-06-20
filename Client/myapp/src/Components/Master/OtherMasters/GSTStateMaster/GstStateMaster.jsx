import React, { useState, useEffect } from 'react';
import ActionButtonGroup from '../../../../Common/CommonButtons/ActionButtonGroup';
import NavigationButtons from "../../../../Common/CommonButtons/NavigationButtons";
import { useNavigate, useLocation } from 'react-router-dom';
import './GstStateMaster.css';
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = process.env.REACT_APP_API;
const companyCode = sessionStorage.getItem('Company_Code')

const GstStateMaster = () => {
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

  const navigate = useNavigate();

  //In utility page record doubleClicked that recod show for edit functionality
  const location = useLocation();
  const selectedRecord = location.state?.selectedRecord;

  console.log("selectedRecord", selectedRecord)

  const initialFormData = {
    State_Code: '',
    State_Name: '',

  };
  const [formData, setFormData] = useState(initialFormData);

  // Handle change for all inputs
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prevState => {
      // Create a new object based on existing state
      const updatedFormData = { ...prevState, [name]: value };
      return updatedFormData;
    });
  };

  const fetchLastStateCode = () => {
    fetch(`${API_URL}/get-last-state-data`)
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
          State_Code: data.State_Code + 1
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
    fetchLastStateCode()
    setFormData(initialFormData)
  }

  const handleSaveOrUpdate = () => {
    if (isEditMode) {
      axios
        .put(
          `${API_URL}/update-gststatemaster?State_Code=${formData.State_Code}`, formData
        )
        .then((response) => {
          console.log("Data updated successfully:", response.data);
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
        .post(`${API_URL}/create-gststatemaster`, formData)
        .then((response) => {
          console.log("Data saved successfully:", response.data);
          toast.success("Record successfully Created!");
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
    axios.get(`${API_URL}/get-last-state-data`)
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
    const isConfirmed = window.confirm(`Are you sure you want to delete this Accounting ${formData.State_Code}?`);

    if (isConfirmed) {
      setIsEditMode(false);
      setAddOneButtonEnabled(true);
      setEditButtonEnabled(true);
      setDeleteButtonEnabled(true);
      setBackButtonEnabled(true);
      setSaveButtonEnabled(false);
      setCancelButtonEnabled(false);

      try {
        const deleteApiUrl = `${API_URL}/delete-gststatemaster?State_Code=${formData.State_Code}`;
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
    navigate("/gst-state-master-utility")
  }

  const handleFirstButtonClick = async () => {

  };

  const handlePreviousButtonClick = async () => {

  };

  const handleNextButtonClick = async () => {

  };

  const handleLastButtonClick = async () => {

  }

  //Handle Record DoubleCliked in Utility Page Show that record for Edit
  const handlerecordDoubleClicked = async () => {
    try {
      const response = await axios.get(`${API_URL}/getdatabyStateCode?State_Code=${selectedRecord.State_Code}`);
      const data = response.data[0];
      console.log("Gst data", data)
      setFormData({
        ...formData, ...data
      });
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
        const response = await axios.get(`${API_URL}/getdatabyStateCode?State_Code=${changeNoValue}`);
        const data = response.data[0];
        setFormData(data);
        setIsEditing(false);

      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
  };

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
          <h2>State Master</h2>
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
            <label htmlFor="State_Code">State Code:</label>
            <input
              type="text"
              id="State_Code"
              name="State_Code"
              value={formData.State_Code}
              onChange={handleChange}
              disabled
            />
          </div>
          <div className="form-group">
            <label htmlFor="State_Name">State Name:</label>
            <input
              type="text"
              id="State_Name"
              name="State_Name"
              value={formData.State_Name}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
            />
          </div>
        </form>
      </div>

    </>
  );
};

export default GstStateMaster;
