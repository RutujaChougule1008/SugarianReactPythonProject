import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Paper
} from "@mui/material";
import Pagination from "../../../Common/UtilityCommon/Pagination";
import SearchBar from "../../../Common/UtilityCommon/SearchBar";
import PerPageSelect from "../../../Common/UtilityCommon/PerPageSelect";
import axios from "axios";

const API_URL = process.env.REACT_APP_API;

const Year_Code = sessionStorage.getItem("Year_Code")
const companyCode = sessionStorage.getItem("Company_Code");

function DeliveryOredrUtility() {
    const [fetchedData, setFetchedData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [perPage, setPerPage] = useState(15);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [filterValue, setFilterValue] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {

            try {
                const apiUrl = `${API_URL}/deliveryorder-all?Company_Code=${companyCode}&Year_Code=${Year_Code}`;
                const response = await axios.get(apiUrl);
                setFetchedData(response.data);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const filtered = fetchedData.filter(post => {
            const searchTermLower = searchTerm.toLowerCase();

            const billtoshortnameLower = (post.billtoshortname || '').toLowerCase();
            const docNoLower = String(post.doc_no || '').toLowerCase();
            const purcNoLower = String(post.purc_no || '').toLowerCase();
            const saleBillCityNameLower = (post.salebillcityname || '').toLowerCase();
            const shiptocitynameLower = (post.shiptocityname || '').toLowerCase();
            const despTypeLower = (post.desp_type || '').toLowerCase();
            const truckNoLower = String(post.truck_no || '').toLowerCase();
            const sbNoLower = String(post.SB_No || '').toLowerCase();
            const eWayBillNoLower = String(post.EWay_Bill_No || '').toLowerCase();
            const deliveryTypeLower = (post.Delivery_Type || '').toLowerCase();
            const shiptoshortnameLower = (post.shiptoshortname || '').toLowerCase();
            const transportshortnameLower = (post.transportshortname || '').toLowerCase();
            const millRateLower = String(post.mill_rate || '').toLowerCase();
            const mmRateLower = String(post.MM_Rate || '').toLowerCase();
            const vasuliRate1Lower = String(post.vasuli_rate1 || '').toLowerCase();
            const doidLower = String(post.doid || '').toLowerCase();
            const docDateLower = (post.doc_date || '').toLowerCase();
            const saleRateLower = String(post.sale_rate || '').toLowerCase();
            const tenderCommissionLower = String(post.Tender_Commission || '').toLowerCase();

            return (
                (filterValue === "" || post.group_Type === filterValue) &&
                (
                    billtoshortnameLower.includes(searchTermLower) ||
                    docNoLower.includes(searchTermLower) ||
                    purcNoLower.includes(searchTermLower) ||
                    saleBillCityNameLower.includes(searchTermLower) ||
                    shiptocitynameLower.includes(searchTermLower) ||
                    despTypeLower.includes(searchTermLower) ||
                    truckNoLower.includes(searchTermLower) ||
                    sbNoLower.includes(searchTermLower) ||
                    eWayBillNoLower.includes(searchTermLower) ||
                    deliveryTypeLower.includes(searchTermLower) ||
                    shiptoshortnameLower.includes(searchTermLower) ||
                    transportshortnameLower.includes(searchTermLower) ||
                    millRateLower.includes(searchTermLower) ||
                    mmRateLower.includes(searchTermLower) ||
                    vasuliRate1Lower.includes(searchTermLower) ||
                    doidLower.includes(searchTermLower) ||
                    docDateLower.includes(searchTermLower) ||
                    saleRateLower.includes(searchTermLower) ||
                    tenderCommissionLower.includes(searchTermLower)
                )
            );
        });

        setFilteredData(filtered);
        setCurrentPage(1);
    }, [searchTerm, filterValue, fetchedData]);

    const handlePerPageChange = (event) => {
        setPerPage(event.target.value);
        setCurrentPage(1);
    };

    const handleSearchTermChange = (event) => {
        const term = event.target.value;
        setSearchTerm(term);
    };

    const pageCount = Math.ceil(filteredData.length / perPage);

    const paginatedPosts = filteredData.slice((currentPage - 1) * perPage, currentPage * perPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleClick = () => {
        navigate("/financial-groups");
    };

    const handleRowClick = (doid) => {
        const selectedRecord = filteredData.find(record => record.doid === doid);
        console.log("selectedRecord", selectedRecord)
        navigate("/financial-groups", { state: { selectedRecord } });
    };

    const handleSearchClick = () => {
        setFilterValue("");
    };

    const handleBack = () => {
        navigate("/DashBoard")
    }

    return (
        <div className="App container">
            <Grid container spacing={3}>
                <Grid item xs={0}>
                    <Button variant="contained" style={{ marginTop: "20px" }} onClick={handleClick}>
                        Add
                    </Button>
                </Grid>
                <Grid item xs={0}>
                    <Button variant="contained" style={{ marginTop: "20px" }} onClick={handleBack}>
                        Back
                    </Button>
                </Grid>

                <Grid item xs={12} sm={12}>
                    <SearchBar
                        value={searchTerm}
                        onChange={handleSearchTermChange}
                        onSearchClick={handleSearchClick}
                    />
                </Grid>
                <Grid item xs={12} sm={8} style={{ marginTop: "-80px", marginLeft: "-150px" }}>
                    <PerPageSelect value={perPage} onChange={handlePerPageChange} />
                </Grid>




                <Grid item xs={12}>
                    <Paper elevation={3}>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Doc No</TableCell>
                                        <TableCell>Doc Date</TableCell>
                                        <TableCell>Purc No</TableCell>
                                        <TableCell>Bill To</TableCell>
                                        <TableCell>Sale Bill To</TableCell>
                                        <TableCell>Ship To City</TableCell>
                                        <TableCell>Sale Rate</TableCell>
                                        <TableCell>Tender Commission</TableCell>
                                        <TableCell>Desp Type</TableCell>
                                        <TableCell>Truck No</TableCell>
                                        <TableCell>SB No</TableCell>
                                        <TableCell>EWay Bill No</TableCell>
                                        <TableCell>Delivery Type</TableCell>
                                        <TableCell>Ship To Name</TableCell>
                                        <TableCell>Mill Rate</TableCell>
                                        <TableCell>MM Rate</TableCell>
                                        <TableCell>Vasuli Rate</TableCell>
                                        <TableCell>Doid</TableCell>

                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedPosts.map((post) => (
                                        <TableRow
                                            key={post.doid}
                                            className="row-item"
                                            style={{ cursor: "pointer" }}
                                            onDoubleClick={() => handleRowClick(post.doid)}
                                        >
                                            <TableCell>{post.doc_no}</TableCell>
                                            <TableCell>{post.doc_date}</TableCell>
                                            <TableCell>{post.purc_no}</TableCell>
                                            <TableCell>{post.billtoshortname}</TableCell>
                                            <TableCell>{post.salebillcityname}</TableCell>
                                            <TableCell>{post.shiptocityname}</TableCell>
                                            <TableCell>{post.sale_rate}</TableCell>
                                            <TableCell>{post.Tender_Commission}</TableCell>
                                            <TableCell>{post.desp_type}</TableCell>
                                            <TableCell>{post.truck_no}</TableCell>
                                            <TableCell>{post.SB_No}</TableCell>
                                            <TableCell>{post.EWay_Bill_No}</TableCell>
                                            <TableCell>{post.Delivery_Type}</TableCell>
                                            <TableCell>{post.shiptoshortname}</TableCell>
                                            <TableCell>{post.mill_rate}</TableCell>
                                            <TableCell>{post.MM_Rate}</TableCell>
                                            <TableCell>{post.vasuli_rate1}</TableCell>
                                            <TableCell>{post.doid}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
                <Grid item xs={12}>
                    <Pagination
                        pageCount={pageCount}
                        currentPage={currentPage}
                        onPageChange={handlePageChange}
                    />
                </Grid>
            </Grid>
        </div>
    );
}

export default DeliveryOredrUtility;
