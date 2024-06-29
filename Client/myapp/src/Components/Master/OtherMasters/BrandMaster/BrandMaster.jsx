import React, { useState, useEffect } from "react";
import ActionButtonGroup from "../../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../../Common/CommonButtons/NavigationButtons";
import { useNavigate, useLocation } from "react-router-dom";
import "./BrandMaster.css";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SystemHelpMaster from "../../../../Helper/SystemmasterHelp";
const API_URL = process.env.REACT_APP_API;


const companyCode = sessionStorage.getItem("Company_Code");
const username = sessionStorage.getItem("username");
//Empty variable Use Fore Item Help
var ItemName = "";
var ItemCodeNew = "";

const BrandMaster = () => {
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
  const [itemSelect, setItemSelect] = useState("");
  const [itemSelectAccoid, setItemSelectAccoid] = useState("");

  const navigate = useNavigate();
  //In utility page record doubleClicked that recod show for edit functionality
  const location = useLocation();
  const selectedRecord = location.state?.selectedRecord;

  const initialFormData = {
    Code: "",
    Marka: "",
    English_Name: "",
    Mal_Code: itemSelect,
    Aarambhi_Nag: 0.0,
    Nagache_Vajan: 0.0,
    Type: "G",
    Wt_Per: 0,
    Company_Code: companyCode,
    Created_By: "",
    Modified_By: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  // Handle change for all inputs
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => {
      // Create a new object based on existing state
      const updatedFormData = { ...prevState, [name]: value };
      return updatedFormData;
    });
  };

  const fetchLastBrandCode = () => {
    fetch(`${API_URL}/get-BrandMaster-lastRecord?Company_Code=${companyCode}`)
      .then((response) => {
        console.log("response", response);
        if (!response.ok) {
          throw new Error("Failed to fetch last company code");
        }
        return response.json();
      })
      .then((data) => {
        // Set the last company code as the default value for Company_Code
        const lastCode = parseInt(data.last_BrandMaster_data.Code, 10);
        setFormData((prevState) => ({
          ...prevState,
          Code: lastCode + 1,
        }));
      })
      .catch((error) => {
        console.error("Error fetching last company code:", error);
      });
  };

  const handleAddOne = () => {
    setAddOneButtonEnabled(false);
    setSaveButtonEnabled(true);
    setCancelButtonEnabled(true);
    setEditButtonEnabled(false);
    setDeleteButtonEnabled(false);
    setIsEditing(true);
    fetchLastBrandCode();
    setFormData(initialFormData);
    setItemSelect("")
    ItemName = "";
    ItemCodeNew = "";
  };

  const handleSaveOrUpdate = () => {
    if (isEditMode) {
        const responseData = {
            ...formData,
            Modified_By: username
        }
      axios
        .put(
          `${API_URL}/update-BrandMaster?Code=${formData.Code}&Company_Code=${companyCode}`,
          responseData
        )
        .then((response) => {
          console.log("Data updated successfully:", response.data);
          toast.success("BrandMaster update successfully!");
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
      const responseData = {
        ...formData,
        Created_By: username
    }
      axios
        .post(
          `${API_URL}/create-RecordBrandMaster?Company_Code=${companyCode}`,
          responseData
        )
        .then((response) => {
          console.log("Data saved successfully:", response.data);
          toast.success("BrandMaster Create successfully!");
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
      .get(`${API_URL}/get-BrandMaster-lastRecord?Company_Code=${companyCode}`)
      .then((response) => {
        const data = response.data;
        ItemName = data.label_names[0].System_Name_E;
        ItemCodeNew = data.label_names[0].Mal_Code;
        setFormData({
          ...formData,
          ...data.last_BrandMaster_data,
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
    const isConfirmed = window.confirm(
      `Are you sure you want to delete this Record ${formData.Code}?`
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
        const deleteApiUrl = `${API_URL}/delete-BrandMaster?Code=${formData.Code}&Company_Code=${companyCode}`;
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
    navigate("/brand-master-utility");
  };

  const handleFirstButtonClick = async () => {
    try {
      const response = await fetch(
        `${API_URL}/get-first-BrandMaster?Company_Code=${companyCode}`
      );
      if (response.ok) {
        const data = await response.json();

        ItemName = data.label_names[0].System_Name_E;
        ItemCodeNew = data.label_names[0].Mal_Code;
        setFormData({
          ...formData,
          ...data.first_BrandMaster_data,
        });
      } else {
        console.error(
          "Failed to fetch first brand data:",
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
        `${API_URL}/get_previous_BrandMaster?Code=${formData.Code}&Company_Code=${companyCode}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log("previousCompanyCreation", data);
        ItemName = data.label_names[0].System_Name_E;
        ItemCodeNew = data.label_names[0].Mal_Code;
        // Assuming setFormData is a function to update the form data
        setFormData({
          ...formData,
          ...data.previous_BrandMaster_data,
        });
      } else {
        console.error(
          "Failed to fetch previous tender data:",
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
        `${API_URL}/get_next_BrandMaster?Code=${formData.Code}&Company_Code=${companyCode}`
      );

      if (response.ok) {
        const data = await response.json(); 
        ItemName = data.label_names[0].System_Name_E;
        ItemCodeNew = data.label_names[0].Mal_Code; 
        setFormData({
          ...formData,
          ...data.next_BrandMaster_data,
        });
      } else {
        console.error(
          "Failed to fetch next company creation data:",
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
      const response = await fetch(`${API_URL}/get_last_BrandMaster?Company_Code=${companyCode}`);
      if (response.ok) {
        const data = await response.json(); 
        ItemName = data.label_names[0].System_Name_E;
        ItemCodeNew = data.label_names[0].Mal_Code; 
        setFormData({
          ...formData,
          ...data.last_BrandMaster_data,
        });
      } else {
        console.error(
          "Failed to fetch last BrandMaster data:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  //Handle Record DoubleCliked in Utility Page Show that record for Edit
  const handlerecordDoubleClicked = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/get-BrandMasterSelectedRecord?Company_Code=${companyCode}&Code=${selectedRecord.Code}`
      );
      const data = response.data;

      ItemCodeNew = data.label_names[0].Mal_Code;
      ItemName = data.label_names[0].System_Name_E;
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

  useEffect(() => {
    document.getElementById('Marka').focus();
  }, []);

  //change No functionality to get that particular record
  const handleKeyDown = async (event) => {
    if (event.key === "Tab") {
      const changeNoValue = event.target.value;
      try {
        const response = await axios.get(
          `${API_URL}/get-BrandMasterSelectedRecord?Company_Code=${companyCode}&Code=${changeNoValue}`
        );
        const data = response.data;
        
      ItemCodeNew = data.label_names[0].Mal_Code;
      ItemName = data.label_names[0].System_Name_E;
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

  //Help

  //Functionality to help section to set the record.
  const handleItemSelect = (code, accoid) => {
    setItemSelect(code);
    setFormData({
        ...formData,
        Mal_Code: code,
     
      }); 
    setItemSelectAccoid(accoid);
    // setHSNNo(HSN)
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
          <h2>Brand Master</h2>
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
            <label htmlFor="Code">Code:</label>
            <input
              type="text"
              id="Code"
              name="Code"
              value={formData.Code}
              onChange={handleChange}
              disabled
            />
          </div>

          <div className="form-group">
            <label htmlFor="Marka">Marka Name:</label>
            <input
              tabIndex={1}
              type="text"
              id="Marka"
              name="Marka"
              value={formData.Marka}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
            />
          </div>

          <div className="form-group">
            <label htmlFor="English_Name">English_Name:</label>
            <input
              tabIndex={2}
              type="text"
              id="English_Name"
              name="English_Name"
              value={formData.English_Name}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
            />
          </div>
          <div className="form-group">
            <label htmlFor="English_Name">Mal Code:</label>
            <SystemHelpMaster
              onAcCodeClick={handleItemSelect}
              CategoryName={ItemName}
              CategoryCode={ItemCodeNew}
              name="Item_Select"
              tabIndexHelp={3}
              SystemType="I"
              className="account-master-help"
              disabledField={!isEditing && addOneButtonEnabled}
            />
          </div>

          <div className="form-group">
            <label htmlFor="Aarambhi_Nag">Aarambhi_Nag:</label>
            <input
              tabIndex={5}
              type="text"
              id="Aarambhi_Nag"
              name="Aarambhi_Nag"
              value={formData.Aarambhi_Nag}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
            />
          </div>

          <div className="form-group">
            <label htmlFor="Nagache_Vajan">Nagache_Vajan:</label>
            <input
              tabIndex={6}
              type="text"
              id="Nagache_Vajan"
              name="Nagache_Vajan"
              value={formData.Nagache_Vajan}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
            />
          </div>

          <div className="form-group">
            <label htmlFor="Type">Type:</label>
            <select
              tabIndex={7}
              id="Type"
              name="Type"
              class="custom-select"
              value={formData.Type}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
            >
              <option value="G">Grain</option>
              <option value="P">Pulses</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="Wt_Per">Wt_Per:</label>
            <input
              tabIndex={8}
              type="text"
              id="Wt_Per"
              name="Wt_Per"
              value={formData.Wt_Per}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
            />
          </div>
        </form>
      </div>
    </>
  );
};

export default BrandMaster;
