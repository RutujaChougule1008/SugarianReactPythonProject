import React, { useState, useEffect } from 'react';
import ActionButtonGroup from '../../../../Common/CommonButtons/ActionButtonGroup';
import NavigationButtons from "../../../../Common/CommonButtons/NavigationButtons";
import { useNavigate, useLocation } from 'react-router-dom';
import './GSTRateMaster.css';
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = process.env.REACT_APP_API;
const companyCode = sessionStorage.getItem('Company_Code')
const year_code = sessionStorage.getItem('Year_Code')

const GSTRateMaster = () => {
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
    CGST: '',
    Company_Code: companyCode,
    Doc_no: '',
    GST_Name: '',
    IGST: '',
    Rate: '',
    Remark: '',
    SGST: '',
    Year_Code: year_code
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

  const fetchLastGSTRateDocNo = () => {
    fetch(`${API_URL}/get-GSTRateMaster-lastRecord?Company_Code=${companyCode}`)
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
          Doc_no: data.Doc_no + 1
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
    fetchLastGSTRateDocNo()
    setFormData(initialFormData)
  }

  const handleSaveOrUpdate = () => {
    if (isEditMode) {
      axios
        .put(
          `${API_URL}/update_GSTRateMaster?Company_Code=${companyCode}&Doc_no=${formData.Doc_no}`, formData
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
        .post(`${API_URL}/create_GSTRateMaster`, formData)
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
    axios.get(`${API_URL}/get-GSTRateMaster-lastRecord?Company_Code=${companyCode}`)
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
    const isConfirmed = window.confirm(`Are you sure you want to delete this Accounting ${formData.Doc_no}?`);

    if (isConfirmed) {
      setIsEditMode(false);
      setAddOneButtonEnabled(true);
      setEditButtonEnabled(true);
      setDeleteButtonEnabled(true);
      setBackButtonEnabled(true);
      setSaveButtonEnabled(false);
      setCancelButtonEnabled(false);

      try {
        const deleteApiUrl = `${API_URL}/delete_GSTRateMaster?Company_Code=${companyCode}&Doc_no=${formData.Doc_no}`;
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
    navigate("/gst-rate-masterutility")
  }

  //Navigation Buttons 
  const handleFirstButtonClick = async () => {
    try {
      const response = await fetch(`${API_URL}/get-first-GSTRateMaster`);
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
      const response = await fetch(`${API_URL}/get-previous-GSTRateMaster?Doc_no=${formData.Doc_no}`);

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
      const response = await fetch(`${API_URL}/get-next-GSTRateMaster?Doc_no=${formData.Doc_no}`);

      if (response.ok) {
        const data = await response.json();
        console.log("nextCompanyCreation", data);
        // Assuming setFormData is a function to update the form data
        setFormData({
          ...formData, ...data.nextSelectedRecord

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
      const response = await fetch(`${API_URL}/get-last-GSTRateMaster`);
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
      const response = await axios.get(`${API_URL}/get-GSTRateMasterSelectedRecord?Company_Code=${companyCode}&Doc_no=${selectedRecord.Doc_no}`);
      const data = response.data;
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
        const response = await axios.get(`${API_URL}/get-GSTRateMasterSelectedRecord?Company_Code=${companyCode}&Doc_no=${changeNoValue}`);
        const data = response.data;
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

          />
        </div>
      </div>
      <div className="form-container">
        <form>
          <h2>GST Rate Master</h2>
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
            <label htmlFor="Doc_no">Doc No:</label>
            <input
              type="text"
              id="Doc_no"
              name="Doc_no"
              value={formData.Doc_no}
              onChange={handleChange}
              disabled
            />
          </div>
          <div className="form-group">
            <label htmlFor="GST_Name">GST Name:</label>
            <input
              type="text"
              id="GST_Name"
              name="GST_Name"
              value={formData.GST_Name}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
            />
          </div>

          <div className="form-group">
            <label htmlFor="Rate">Rate:</label>
            <input
              type="text"
              id="Rate"
              name="Rate"
              value={formData.Rate}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
            />
          </div>
          <div className="form-group">
            <label htmlFor="IGST">IGST:</label>
            <input
              type="text"
              id="IGST"
              name="IGST"
              value={formData.IGST}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
            />
          </div>
          <div className="form-group">
            <label htmlFor="SGST">SGST:</label>
            <input
              type="text"
              id="SGST"
              name="SGST"
              value={formData.SGST}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
            />
          </div>
          <div className="form-group">
            <label htmlFor="CGST">CGST:</label>
            <input
              type="text"
              id="CGST"
              name="CGST"
              value={formData.CGST}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
            />
          </div>

        </form>
      </div>

    </>
  );
};

export default GSTRateMaster;
