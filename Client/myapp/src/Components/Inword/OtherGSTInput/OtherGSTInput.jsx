import React from "react";
import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ActionButtonGroup from "../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AccountMasterHelp from "../../../Helper/AccountMasterHelp";
import "../OtherGSTInput/OtherGSTInput.css";
const API_URL = process.env.REACT_APP_API;

var Exps_Name = "";
var newExps_Ac = "";

const OtherGSTInput = () => {
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
  const [accountCode, setAccountCode] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const companyCode = sessionStorage.getItem("Company_Code");
  const yearCode = sessionStorage.getItem("Year_Code");
  const navigate = useNavigate();
  //In utility page record doubleClicked that recod show for edit functionality
  const location = useLocation();
  const selectedRecord = location.state?.editRecordData;
  console.log("Record", selectedRecord);
  const dateInputRef = useRef(null);
  const initialFormData = {
    Doc_No: "",
    TRAN_TYPE: "",
    Doc_Date: formatDate(new Date()),
    SGST_Amt: "",
    CGST_Amt: "",
    IGST_Amt: "",
    Exps_Ac: "",
    Narration: "",
    Company_Code: companyCode,
    Created_By: "",
    Modified_By: "",
    Year_Code: yearCode,
    Created_Date: formatDate(new Date()),
    ea: "",
    Modified_Date: formatDate(new Date()),
  };

  useEffect(() => {
    if (isEditing) {
      if (dateInputRef.current) {
        dateInputRef.current.focus();
      }
    }
  }, [isEditing]);
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

  const handleAccountMasterGroupCode = (code) => {
    setAccountCode(code);
    setFormData({
      ...formData,
      Exps_Ac: code,
    });
  };

  function handleDateChange(e) {
    const formattedDate = formatDate(e.target.value);
    // Assuming you have a state setter function for form data
    setFormData({ ...formData, Doc_Date: formattedDate });
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    let day = date.getDate();
    let month = date.getMonth() + 1; // getMonth() returns month from 0-11
    let year = date.getFullYear();

    // Ensuring day and month are two digits
    day = day < 10 ? "0" + day : day;
    month = month < 10 ? "0" + month : month;

    // Return in `yyyy-MM-dd` format
    return `${year}-${month}-${day}`;
  }

  const fetchLastRecord = () => {
    fetch(
      `http://localhost:8080/get_last_OtherGSTInput?Company_Code=${companyCode}&Year_Code=4`
    )
      .then((response) => {
        console.log("Response status:", response.status); // Check response status
        if (!response.ok) {
          throw new Error(
            `Failed to fetch last record, status: ${response.status}`
          );
        }
        return response.json();
      })
      .then((data) => {
        console.log("Received data for last record:", data); // Log the actual data received
        // Assuming 'Doc_No' is directly accessible and is a number
        const nextDocNo = Number(data.Doc_No) + 1;

        if (!isNaN(nextDocNo) && nextDocNo !== 1) {
          // Check if the calculation is correct and not defaulting
          setFormData((prevState) => ({
            ...prevState,
            Doc_No: nextDocNo,
          }));
        } else {
          console.error(
            "Received Doc_No is not a number or defaulted:",
            data.Doc_No
          );
          // Set to 1 only if the received number is not valid
          setFormData((prevState) => ({
            ...prevState,
            Doc_No: 1,
          }));
        }
      })
      .catch((error) => {
        console.error("Error fetching last record:", error);
        // Optionally handle error state in UI
      });
  };

  const handleAddOne = () => {
    setAddOneButtonEnabled(false);
    setSaveButtonEnabled(true);
    setCancelButtonEnabled(true);
    setEditButtonEnabled(false);
    setDeleteButtonEnabled(false);
    setIsEditing(true);
    fetchLastRecord();
    setFormData(initialFormData);
    setAccountCode("");
    Exps_Name = "";
    newExps_Ac = "";
    if (dateInputRef.current) {
      dateInputRef.current.focus();
    }
  };

  const handleSaveOrUpdate = () => {
    const preparedData = {
      ...formData,
      Exps_Ac: formData.Exps_Ac.Ac_Code, // Ensuring only Ac_Code is sent
      ea: formData.Exps_Ac.accoid,
      Company_Code: parseInt(formData.Company_Code, 10), // Assuming Company_Code should be an integer
      Year_Code: 4 ? parseInt(4, 10) : null, // Convert Year_Code to integer or handle null
      Doc_Date: formatDate(formData.Doc_Date),
      Created_Date: formatDate(formData.Created_Date),
      Modified_Date: formatDate(formData.Modified_Date),
    };
    if (isEditMode) {
      axios
        .put(
          `http://localhost:8080/update-OtherGSTInput?Doc_No=${formData.Doc_No}&Company_Code=${companyCode}&Year_Code=4`,
          preparedData
        )
        .then((response) => {
          console.log("Data updated successfully:", response.data);
          //   toast.success("_____ update successfully!");
          setIsEditMode(false);
          setAddOneButtonEnabled(true);
          setEditButtonEnabled(true);
          setDeleteButtonEnabled(true);
          setBackButtonEnabled(true);
          setSaveButtonEnabled(false);
          setCancelButtonEnabled(false);
          setUpdateButtonClicked(true);
          setIsEditing(false);
          window.location.reload();
        })
        .catch((error) => {
          handleCancel();
          console.error("Error updating data:", error);
        });
    } else {
      axios
        .post(
          `http://localhost:8080/create-OtherGSTInput?Company_Code=1&Year_Code=4`,
          preparedData
        )
        .then((response) => {
          console.log("Data saved successfully:", response.data);
          toast.success("_____ Create successfully!");
          setIsEditMode(false);
          setAddOneButtonEnabled(true);
          setEditButtonEnabled(true);
          setDeleteButtonEnabled(true);
          setBackButtonEnabled(true);
          setSaveButtonEnabled(false);
          setCancelButtonEnabled(false);
          setUpdateButtonClicked(true);
          setIsEditing(false);
          window.location.reload();
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
        `http://localhost:8080/get_last_OtherGSTInput?Company_Code=${companyCode}&Year_Code=4`
      )
      .then((response) => {
        const data = response.data;
        console.log("Fetched data on cancel:", data);
        console.log("Exps_Ac:", data.Exps_Ac);
        newExps_Ac = data.Exps_Ac;
        Exps_Name = data.Account_Name;

        setFormData({
          ...formData,
          ...data,
          Doc_Date: formatDate(data.Doc_Date),
          Exps_Ac: newExps_Ac,
        });
      })
      .catch((error) => {
        console.error("Error fetching latest data for edit:", error);
        toast.error("Failed to fetch latest data.");
      });
    setIsEditing(false);
    setIsEditMode(false);
    // Reset the state of buttons if needed
    setSaveButtonEnabled(false);
    setCancelButtonEnabled(false);
    setAddOneButtonEnabled(true);
    setEditButtonEnabled(true);
    setDeleteButtonEnabled(true);
    setBackButtonEnabled(true);
  };

  const handleDelete = async () => {
    const isConfirmed = window.confirm(
      `Are you sure you want to delete this _____ ${formData._____}?`
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
        const deleteApiUrl = `http://localhost:8080/delete-OtherGSTInput?Doc_No=${formData.Doc_No}&Company_Code=${companyCode}&Year_Code=4`;
        const response = await axios.delete(deleteApiUrl);
        // toast.success("Record deleted successfully!");
        handleCancel();
      } catch (error) {
        // toast.error("Deletion cancelled");
        console.error("Error during API call:", error);
      }
    } else {
      console.log("Deletion cancelled");
    }
  };

  const handleBack = () => {
    navigate("/OtherGSTInput-utility");
  };

  useEffect(() => {
    if (selectedRecord) {
      handlerecordDoubleClicked();
    } else {
      handleAddOne();
    }
  }, [selectedRecord]);
  //Handle Record DoubleCliked in Utility Page Show that record for Edit
  const handlerecordDoubleClicked = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/get-OtherGSTInput-by-DocNo?Company_Code=${companyCode}&Doc_No=${selectedRecord.Doc_No}&Year_Code=4`
      );
      const data = response.data;
      newExps_Ac = data.Exps_Ac;
      Exps_Name = data.Account_Name;
      setFormData({
        ...formData,
        ...data,
        Doc_Date: formatDate(data.Doc_Date),
        Exps_Ac: newExps_Ac,
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
          `${API_URL}/get-OtherPurchaseSelectedRecord?Company_Code=${companyCode}&______=${changeNoValue}`
        );
        const data = response.data;
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
      const response = await fetch(
        `http://localhost:8080/get-first-OtherGSTInput?Company_Code=${companyCode}&Year_Code=4`
      );
      if (response.ok) {
        const data = await response.json();
        // Access the first element of the array
        const firstUserCreation = data;
        Exps_Name = data.Account_Name;
        newExps_Ac = data.Exps_Ac;
        setFormData({
          ...formData,
          ...firstUserCreation,
          Exps_Ac: newExps_Ac,
          Doc_Date: formatDate(data.Doc_Date),
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
        `http://localhost:8080/get_previous_OtherGSTInput?Doc_No=${formData.Doc_No}&Company_Code=${companyCode}&Year_Code=4`
      );

      if (response.ok) {
        const data = await response.json();
        newExps_Ac = data.Exps_Ac;
        Exps_Name = data.Account_Name;
        // Assuming setFormData is a function to update the form data
        setFormData({
          ...formData,
          ...data,
          Doc_Date: formatDate(data.Doc_Date),
          Exps_Ac: newExps_Ac,
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
        `http://localhost:8080/get_next_OtherGSTInput?Doc_No=${formData.Doc_No}&Company_Code=${companyCode}&Year_Code=4`
      );

      if (response.ok) {
        const data = await response.json();
        // Assuming setFormData is a function to update the form data
        Exps_Name = data.Account_Name;
        newExps_Ac = data.Exps_Ac;
        setFormData({
          ...formData,
          ...data,
          Doc_Date: formatDate(data.Doc_Date),
          Exps_Ac: newExps_Ac,
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
        `http://localhost:8080/get_last_OtherGSTInput?Company_Code=${companyCode}&Year_Code=4`
      );
      if (response.ok) {
        const data = await response.json();
        // Access the first element of the array
        const last_Navigation = data;
        newExps_Ac = data.Exps_Ac;

        setFormData({
          ...formData,
          ...last_Navigation,
          Exps_Ac: newExps_Ac,
          Doc_Date: formatDate(data.Doc_Date),
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
          />
        </div>
      </div>

      <div className="other-form-container">
        <form className="other-form">
          <h4>Other GST Input</h4>
          <div className="form-group">
            <label htmlFor="Doc_No">Doc No:</label>
            <input
              type="text"
              id="Doc_No"
              name="Doc_No"
              value={formData.Doc_No || ""}
              onChange={handleChange}
              disabled={true}
              tabIndex={1}
            />
          </div>
          <div className="form-group">
            <label htmlFor="Doc_Date">Date:</label>
            <input
              type="date"
              id="Doc_Date"
              name="Doc_Date"
              ref={dateInputRef}
              value={formData.Doc_Date}
              onChange={handleDateChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={2}
            />
          </div>

          <div className="form-group">
            <label htmlFor="CGST_Amt">CGST Amount:</label>
            <input
              type="text"
              id="CGST_Amt"
              Name="CGST_Amt"
              value={formData.CGST_Amt}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="SGST_Amt">CGST Amount:</label>
            <input
              type="text"
              id="SGST_Amt"
              Name="SGST_Amt"
              value={formData.SGST_Amt}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={4}
            />
          </div>
          <div className="form-group">
            <label htmlFor="IGST_Amt">CGST Amount:</label>
            <input
              type="text"
              id="IGST_Amt"
              Name="IGST_Amt"
              value={formData.IGST_Amt}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              tabIndex={5}
            />
          </div>

          <div className="form-group">
            <label htmlFor="Exps_Ac">Expenses A/C</label>
            <AccountMasterHelp
              name="Exps_Ac"
              onAcCodeClick={handleAccountMasterGroupCode}
              CategoryName={Exps_Name}
              CategoryCode={newExps_Ac}
              tabIndex={6}
              disabledFeild={!isEditing && addOneButtonEnabled}
            />
          </div>
          <div className="form-group">
            <label htmlFor="Narration">Narration:</label>
            <textarea
              id="Narration"
              Name="Narration"
              value={formData.Narration}
              onChange={handleChange}
              disabled={!isEditing && addOneButtonEnabled}
              rows="2"
              tabIndex={7}
            ></textarea>
          </div>
        </form>
      </div>
    </>
  );
};
export default OtherGSTInput;
