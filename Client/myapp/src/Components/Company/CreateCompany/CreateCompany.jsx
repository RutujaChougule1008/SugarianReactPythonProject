import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import ActionButtonGroup from "../../../Common/CommonButtons/ActionButtonGroup";
import NavigationButtons from "../../../Common/CommonButtons/NavigationButtons";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "../CreateCompany/CreateCompany.css";

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
  const [signature, setSignature] = useState(null);
  const [logoFile, setLogoFile] = useState(null); // This will hold the actual file object
  const [logoURL, setLogoURL] = useState(null); // This will hold the data URL for preview

  const [signatureFile, setSignatureFile] = useState(null); // This will hold the actual file object
  const [signatureURL, setSignatureURL] = useState(null); // This will hold the data URL for preview
  const [logoFileName, setLogoFileName] = useState(""); // State for storing the logo file name
  const [signatureFileName, setSignatureFileName] = useState("");

  const navigate = useNavigate();
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
    Logo: null,
    Signature: null,
  };
  // Define state variable to hold form data
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    // Fetch the last company code when the component mounts
    fetchLastCompany_Code();
    window.sessionStorage.setItem("username", "Pankaj");
  }, []);

  const fetchLastCompany_Code = () => {
    fetch(`${API_URL}/get_last_company_code`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch last company code");
        }
        return response.json();
      })
      .then((data) => {
        // Set the last company code as the default value for Company_Code
        setFormData((prevState) => ({
          ...prevState,
          Company_Code: data.last_company_code + 1,
        }));
      })
      .catch((error) => {
        console.error("Error fetching last company code:", error);
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

    if (name === "Address_E" && e.key === "Enter" && value.trim() !== "") {
      const saveButton = document.getElementById("save");
      // Set focus on the save button
      if (saveButton) {
        saveButton.focus();
      }
    }
  };

  //set focus functionality
  const lastFocusableElementRef = useRef(null);

  useEffect(() => {
    // Focus the first input field when the component mounts
    document.getElementById("Company_Name_E").focus();
  }, []);

  const handleKeyDown = (e) => {
    // Handle Tab key press
    if (
      e.key === "Tab" &&
      lastFocusableElementRef.current &&
      document.activeElement === lastFocusableElementRef.current
    ) {
      e.preventDefault();
      document.getElementById("Company_Name_E").focus();
    }
  };

  const handleLogoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoFileName(file.name); // Store the file name
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoURL(reader.result);
      };
      reader.onerror = () => {
        setLogoURL(null);
        setLogoFileName(""); // Reset file name on error
      };
      reader.readAsDataURL(file);
    } else {
      setLogoFile(null);
      setLogoURL(null);
      setLogoFileName(""); // Reset file name if no file is selected
    }
  };

  const handleSignatureChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSignatureFile(file);
      setSignatureFileName(file.name); // Store the file name
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignatureURL(reader.result);
      };
      reader.onerror = () => {
        setSignatureURL(null);
        setSignatureFileName(""); // Reset file name on error
      };
      reader.readAsDataURL(file);
    } else {
      setSignatureFile(null);
      setSignatureURL(null);
      setSignatureFileName(""); // Reset file name if no file is selected
    }
  };
  const handleAddOne = () => {
    // Reset UI controls
    setAddOneButtonEnabled(false);
    setSaveButtonEnabled(true);
    setCancelButtonEnabled(true);
    setEditButtonEnabled(false);
    setDeleteButtonEnabled(false);
    setIsEditing(true);

    // Fetch the next available company code
    fetchLastCompany_Code();

    // // Clear logo and signature previews
    setLogoURL(null); // Reset to empty string if your component renders image based on URL presence
    setSignatureURL(null);
    setLogoFileName(null); // Clear filename
    setSignatureFileName(null);

    // Reset form data to initial state
    setFormData({
      ...initialFormData,
      Logo: null, // Ensure this is cleared if you manage URLs in the form state
      Signature: null,
    });
  };

  const handleSaveOrUpdate = () => {
    // Create a new FormData object to handle files and JSON data
    const formData1 = new FormData();

    // Append all text fields from state to formData
    Object.keys(formData).forEach((key) => {
      // Append only if it's not the Logo or Signature fields
      if (key !== "Logo" && key !== "Signature") {
        formData1.append(key, formData[key]);
      }
    });

    // Append files, if available
    // Note: The file objects should be directly taken from file input state (not URLs)
    if (logoFile) formData1.append("logo", logoFile);
    if (signatureFile) formData1.append("signature", signatureFile);
    // Define API endpoint and method based on edit mode
    const apiUrl = isEditMode
      ? `${API_URL}/update_company?company_code=${formData1.get(
          "Company_Code"
        )}`
      : `${API_URL}/create_company`;
    const method = isEditMode ? "put" : "post";

    // Make the API request
    axios({
      method: method,
      url: apiUrl,
      data: formData1,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
      .then((response) => {
        console.log(
          `${isEditMode ? "Updated" : "Saved"} successfully:`,
          response.data
        );
        window.alert(
          `${isEditMode ? "Data updated" : "Data saved"} successfully!`
        );
        // Reset editing state and other controls here
        setIsEditMode(false);
        setAddOneButtonEnabled(true);
        setEditButtonEnabled(true);
        setDeleteButtonEnabled(true);
        setBackButtonEnabled(true);
        setSaveButtonEnabled(false);
        setCancelButtonEnabled(false);
        setIsEditing(false);
      })
      .catch((error) => {
        console.error("Error saving/updating data:", error);
        window.alert(
          `Error: ${
            error.response?.data?.message || "Could not save/update data"
          }`
        );
      });
  };

  const handleEdit = () => {
    // Fetch the latest data for the company being edited
    axios
      .get(
        `${API_URL}/get_company_by_code?company_code=${formData.Company_Code}`
      )
      .then((response) => {
        const data = response.data;
        const isLockedNew = data.isLocked;
        const isLockedByUserNew = data.LockedbyUser;

        if (isLockedNew) {
          window.alert(`This record is locked by ${isLockedByUserNew}`);
          return;
        } else {
          axios.put(
            `${API_URL}/lock_unlock_record?company_code=${formData.Company_Code}`,
            {
              isLocked: true,
              LockedbyUser: "Pankaj", // Ensure "Pankaj" is dynamically set or correctly represents the current user
            }
          );
        }

        // Update formData state including logo and signature, converting base64 to a suitable format if necessary
        setFormData({
          ...formData,
          ...data,
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
        window.alert(
          "This record is already deleted! Showing the previous record."
        );

        // Fetch the previous record if the current one is not available
        const prevCompanyCode = parseInt(formData.Company_Code) - 1;
        axios
          .get(`${API_URL}/get_company_by_code?company_code=${prevCompanyCode}`)
          .then((response) => {
            const data = response.data;
            setFormData({
              ...formData,
              ...data,
            });
            // Set URLs for logos and signatures if available
            if (data.Logo) {
              setLogoURL(`data:image/jpeg;base64,${data.Logo}`);
            } else {
              setLogoURL(null); // Ensure the logo is cleared if none is found
            }

            if (data.Signature) {
              setSignatureURL(`data:image/jpeg;base64,${data.Signature}`);
            } else {
              setSignatureURL(null); // Ensure the signature is cleared if none is found
            }
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
            console.error(
              "Error fetching previous record data after deletion:",
              error
            );
          });
      });
  };

  // const handleCancel = () => {
  //   // axios.get(`${API_URL}/get_company_by_code?company_code=${formData.Company_Code}`)
  //   //   .then(response => {
  //   //     const data = response.data;
  //   //     if (data.isLocked) {
  //   //       axios.put(`${API_URL}/lock_unlock_record?company_code=${formData.Company_Code}`, {
  //   //         isLocked: false,
  //   //         LockedbyUser: "Ruturaj", // Adjust as per your application's user handling
  //   //       })
  //   //       .then(() => {
  //   //         // Prepare logo and signature for rendering
  //   //         setFormData({
  //   //           ...formData,
  //   //           ...data,
  //   //           Logo: data.Logo ? `data:image/jpeg;base64,${data.Logo}` : null,
  //   //           Signature: data.Signature ? `data:image/jpeg;base64,${data.Signature}` : null
  //   //         });
  //   //       })
  //   //       .catch(error => {
  //   //         console.error("Error unlocking record:", error);
  //   //       });
  //   //     } else {
  //   //       setFormData({
  //   //         ...formData,
  //   //         ...data,
  //   //         Logo: data.Logo ? `data:image/jpeg;base64,${data.Logo}` : null,
  //   //         Signature: data.Signature ? `data:image/jpeg;base64,${data.Signature}` : null
  //   //       });
  //   //     }
  //   //   })
  //   //   .catch(error => {
  //   //     console.error("Error fetching latest data for edit:", error);
  //   //   });

  //   // Also reset state assuming the function fetches the last company data as a fallback
  //   axios.get(`${API_URL}/get_last_company_data`)
  //     .then(response => {
  //       const data = response.data;
  //       setFormData({
  //         ...formData,
  //         ...data,
  //         isLocked: false,
  //         LockedbyUser: "",
  //         Logo: data.Logo ? `data:image/jpeg;base64,${data.Logo}` : null,
  //         Signature: data.Signature ? `data:image/jpeg;base64,${data.Signature}` : null
  //       });
  //     })
  //     .catch(error => {
  //       console.error("Error fetching last company data:", error);
  //     });

  //   // Reset UI state controls
  //   setIsEditing(false);
  //   setIsEditMode(false);
  //   setAddOneButtonEnabled(true);
  //   setEditButtonEnabled(true);
  //   setDeleteButtonEnabled(true);
  //   setBackButtonEnabled(true);
  //   setSaveButtonEnabled(false);
  //   setCancelButtonEnabled(false);
  //   setCancelButtonClicked(true);
  // };

  const handleCancel = () => {
    axios
      .get(`${API_URL}/get_last_company_data`)
      .then((response) => {
        const data = response.data;

        // Update form data with the latest company data from the server
        setFormData((prevFormData) => ({
          ...prevFormData,
          ...data,
          Logo: data.Logo ? `data:image/jpeg;base64,${data.Logo}` : null,
          Signature: data.Signature
            ? `data:image/jpeg;base64,${data.Signature}`
            : null,
          isLocked: false, // Ensure locking logic is reset
          LockedbyUser: "", // Ensure locking user is reset
        }));

        // Set URLs for logos and signatures if available
        if (data.Logo) {
          setLogoURL(`data:image/jpeg;base64,${data.Logo}`);
          setLogoFileName(data.name);
        } else {
          setLogoURL(null); // Ensure the logo is cleared if none is found
        }

        if (data.Signature) {
          setSignatureURL(`data:image/jpeg;base64,${data.Signature}`);
        } else {
          setSignatureURL(null); // Ensure the signature is cleared if none is found
        }

        // Reset UI state controls
        setIsEditing(false);
        setIsEditMode(false);
        setAddOneButtonEnabled(true);
        setEditButtonEnabled(true);
        setDeleteButtonEnabled(true);
        setBackButtonEnabled(true);
        setSaveButtonEnabled(false);
        setCancelButtonEnabled(false);
        setCancelButtonClicked(true); // Consider if you need this state; if not used elsewhere, consider removing
      })
      .catch((error) => {
        console.error("Error fetching last company data:", error);
        window.alert("Failed to fetch the latest company data."); // Provide feedback to the user
      });
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
          window.alert("Record deleted successfully");

          // Immediately clear the current logo and signature previews
          setLogoURL(null);
          setSignatureURL(null);

          // Fetch the previous record after deletion
          const prevRecordResponse = await axios.get(
            `${API_URL}/get_previous_company_data?company_code=${formData.Company_Code}`
          );

          if (prevRecordResponse.status === 200) {
            const prevRecordData = prevRecordResponse.data;
            setFormData(prevRecordData);

            // Update logo and signature previews if available
            if (prevRecordData.Logo) {
              setLogoURL(`data:image/jpeg;base64,${prevRecordData.Logo}`);
            }
            if (prevRecordData.Signature) {
              setSignatureURL(
                `data:image/jpeg;base64,${prevRecordData.Signature}`
              );
            }
          } else {
            console.error(
              "Failed to fetch previous record data after deletion!",
              prevRecordResponse.status,
              prevRecordResponse.statusText
            );
          }
        } else if (response.status === 404) {
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
    navigate("/create-utility");
  };

  const handleFirstButtonClick = async () => {
    try {
      const response = await fetch(`${API_URL}/get_first_navigation`);
      if (response.ok) {
        const data = await response.json();
        // Since the API now directly returns the object, not an array
        const firstCompanyData = data;
        setFormData({
          ...formData,
          ...data,
        });
        // Update logo and signature URLs for preview
        setLogoURL(
          firstCompanyData.Logo
            ? `data:image/jpeg;base64,${firstCompanyData.Logo}`
            : null
        );
        setSignatureURL(
          firstCompanyData.Signature
            ? `data:image/jpeg;base64,${firstCompanyData.Signature}`
            : null
        );
      } else {
        console.error(
          "Failed to fetch first company data:",
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
        `${API_URL}/get_previous_navigation?current_company_code=${formData.Company_Code}`
      );

      if (response.ok) {
        const data = await response.json();
        const previousCompanyData = data;
        console.log("previousCompanyCreation", data);

        // Assuming setFormData is a function to update the form data
        setFormData({
          ...formData,
          ...data,
        });
        setLogoURL(
          previousCompanyData.Logo
            ? `data:image/jpeg;base64,${previousCompanyData.Logo}`
            : null
        );
        setSignatureURL(
          previousCompanyData.Signature
            ? `data:image/jpeg;base64,${previousCompanyData.Signature}`
            : null
        );
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
        `${API_URL}/get_next_navigation?current_company_code=${formData.Company_Code}`
      );

      if (response.ok) {
        const data = await response.json();
        const nextCompanyData = data;
        console.log("nextCompanyCreation", data);

        // Assuming setFormData is a function to update the form data
        setFormData({
          ...formData,
          ...data,
        });
        setLogoURL(
          nextCompanyData.Logo
            ? `data:image/jpeg;base64,${nextCompanyData.Logo}`
            : null
        );
        setSignatureURL(
          nextCompanyData.Signature
            ? `data:image/jpeg;base64,${nextCompanyData.Signature}`
            : null
        );
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
      const response = await fetch(`${API_URL}/get_last_navigation`);
      if (response.ok) {
        const data = await response.json();
        // Access the first element of the array
        const last_Navigation = data[0];
        setFormData({
          ...formData,
          ...data,
        });
        setLogoURL(
          last_Navigation.Logo
            ? `data:image/jpeg;base64,${last_Navigation.Logo}`
            : null
        );
        setSignatureURL(
          last_Navigation.Signature
            ? `data:image/jpeg;base64,${last_Navigation.Signature}`
            : null
        );
      } else {
        console.error(
          "Failed to fetch first tender data:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  const handlerecordDoubleClicked = () => {
    fetch(
      `${API_URL}/get_company_by_code?company_code=${selectedRecord.Company_Code}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch last company data");
        }
        return response.json();
      })
      .then((data) => {
        // Populate form fields with the last company data
        setFormData({
          ...formData,
          ...data,
        });
      })
      .catch((error) => {
        console.error("Error fetching last company data:", error);
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
  };

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
          isFirstRecord={formData.Company_Code === 4}
        />
      </div>
      <br />
      <div className="container" onKeyDown={handleKeyDown}>
        <div className="card-body">
          <h4>Company Creation</h4>
          <form onSubmit={handleSubmit}>
            <div className="upload-container" enctype="multipart/form-data">
              <div className="form-group">
                <label htmlFor="logo-upload">Upload Logo:</label>
                <input
                  type="file"
                  id="logo-upload"
                  onChange={handleLogoChange}
                  disabled={!isEditing && addOneButtonEnabled}
                  accept="image/*"
                  name={logoFileName}
                />

                {logoURL && (
                  <img
                    src={logoURL}
                    name={logoFileName}
                    alt="Uploaded Logo"
                    className="logo-preview"
                  />
                )}
              </div>
              <div className="form-group">
                <label htmlFor="signature-upload" enctype="multipart/form-data">
                  Upload Signature:
                </label>
                <input
                  type="file"
                  id="signature-upload"
                  onChange={handleSignatureChange}
                  disabled={!isEditing && addOneButtonEnabled}
                  accept="image/*"
                />

                {signatureURL && (
                  <img
                    src={signatureURL}
                    name={signatureFileName}
                    alt="Uploaded Signature"
                    className="logo-preview"
                  />
                )}
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
