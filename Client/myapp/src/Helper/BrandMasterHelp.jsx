import React, { useState, useEffect } from "react";
import { Button, Modal } from "react-bootstrap";
import DataTableSearch from "../Common/HelpCommon/DataTableSearch";
import DataTablePagination from "../Common/HelpCommon/DataTablePagination";
import axios from "axios";
import "../App.css";

const CompanyCode = sessionStorage.getItem("Company_Code");

const BrandMasterHelp = ({ onAcCodeClick, name, brandName, brandCode, disabledField, tabIndexHelp }) => {
    const [showModal, setShowModal] = useState(false);
    const [popupContent, setPopupContent] = useState([]);
    const [enteredAcCode, setEnteredAcCode] = useState("");
    const [enteredAcName, setEnteredAcName] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [selectedRowIndex, setSelectedRowIndex] = useState(-1);
    const [apiDataFetched, setApiDataFetched] = useState(false);

    // Fetch data for the brand master
    const fetchAndOpenPopup = async () => {
        try {
            const response = await axios.get(`http://localhost:8080/api/sugarian/brand_master?Company_Code=${CompanyCode}`);
            setPopupContent(response.data);
            setShowModal(true);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                await fetchAndOpenPopup();
                setShowModal(false);
                setApiDataFetched(true);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        if (!apiDataFetched) {
            fetchData();
        }

    }, [apiDataFetched]);

    // Handle brand code button click
    const handleBrandCodeButtonClick = () => {
        fetchAndOpenPopup();
        if (onAcCodeClick) {
            onAcCodeClick({ enteredAcCode, enteredAcName });
        }
    };

    // Close popup modal
    const handleCloseModal = () => {
        setShowModal(false);
    };

    // Handle changes in the brand code input
    const handleAcCodeChange = async (event) => {
        const { value } = event.target;
        setEnteredAcCode(value);
        setEnteredAcName(""); // Reset brand name while data is being fetched
        try {
            const response = await axios.get(`http://localhost:8080/api/sugarian/brand_master?Company_Code=${CompanyCode}`);
            setPopupContent(response.data);
            const matchingItem = response.data.find(item => item.brand_Code === parseInt(value, 10));
            if (matchingItem) {
                setEnteredAcName(matchingItem.brand_Name);
                if (onAcCodeClick) {
                    onAcCodeClick(matchingItem.brand_Code, matchingItem.brand_Name, value);
                }
            } else {
                setEnteredAcName("");
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    // Select item from popup on double click
    const handleRecordDoubleClick = (item) => {
        setEnteredAcCode(item.brand_Code);
        setEnteredAcName(item.brand_Name);
        if (onAcCodeClick) {
            onAcCodeClick(item.brand_Code, item.brand_Name, enteredAcCode);
        }
        handleCloseModal();
    };

    // Handle pagination
    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    // Search functionality
    const handleSearch = (searchValue) => {
        setSearchTerm(searchValue);
    };

    const filteredData = popupContent.filter(item =>
        item.brand_Name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const itemsToDisplay = filteredData.slice(startIndex, endIndex);

    // Manage keyboard events
    useEffect(() => {
        const handleKeyEvents = (event) => {
            if (event.key === "F1" && event.target.id === name) {
                fetchAndOpenPopup();
                event.preventDefault();
            } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setSelectedRowIndex(prev => Math.max(prev - 1, 0));
            } else if (event.key === "ArrowDown") {
                event.preventDefault();
                setSelectedRowIndex(prev => Math.min(prev + 1, itemsToDisplay.length - 1));
            } else if (event.key === "Enter") {
                event.preventDefault();
                if (selectedRowIndex >= 0) {
                    handleRecordDoubleClick(itemsToDisplay[selectedRowIndex]);
                }
                setSelectedRowIndex(-1);
            }
        };

        window.addEventListener("keydown", handleKeyEvents);
        return () => {
            window.removeEventListener("keydown", handleKeyEvents);
        };
    }, [selectedRowIndex, itemsToDisplay, name, fetchAndOpenPopup, handleRecordDoubleClick]);

    return (
        <div className="d-flex flex-row ">
            <div className="d-flex">
                <input
                    type="text"
                    className="form-control ms-2"
                    id={name}
                    autoComplete="off"
                    value={enteredAcCode !== '' ? enteredAcCode : brandCode}
                    onChange={handleAcCodeChange}
                    style={{ width: "150px", height: "35px" }}
                    disabled={disabledField}
                    tabIndex={tabIndexHelp}
                />
                <Button
                    variant="primary"
                    onClick={handleBrandCodeButtonClick}
                    className="ms-1"
                    style={{ width: "30px", height: "35px" }}
                    disabled={disabledField}
                    tabIndex={tabIndexHelp}
                >
                    ...
                </Button>
                <label id="acNameLabel" className="form-labels ms-2">
                    {enteredAcName || brandName}
                </label>
            </div>
            <Modal
                show={showModal}
                onHide={handleCloseModal}
                dialogClassName="modal-dialog"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Brand Master Help</Modal.Title>
                </Modal.Header>
                <DataTableSearch data={popupContent} onSearch={handleSearch} />
                <Modal.Body>
                    {Array.isArray(popupContent) ? (
                        <div className="table-responsive">
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th>Brand Code</th>
                                        <th>Brand Name</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {itemsToDisplay.map((item, index) => (
                                        <tr
                                            key={index}
                                            className={selectedRowIndex === index ? "selected-row" : ""}
                                            onDoubleClick={() => handleRecordDoubleClick(item)}
                                        >
                                            <td>{item.brand_Code}</td>
                                            <td>{item.brand_Name}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : "Loading..."}
                </Modal.Body>
                <Modal.Footer>
                    <DataTablePagination
                        totalItems={filteredData.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={handlePageChange}
                    />
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default BrandMasterHelp;
