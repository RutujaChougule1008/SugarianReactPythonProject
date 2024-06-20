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
    Grid,
    Paper
} from "@mui/material";
import Pagination from "../../../Common/UtilityCommon/Pagination";
import SearchBar from "../../../Common/UtilityCommon/SearchBar";
import PerPageSelect from "../../../Common/UtilityCommon/PerPageSelect";
import axios from "axios";

const API_URL = process.env.REACT_APP_API;
const companyCode = sessionStorage.getItem('Company_Code');
const Year_Code = sessionStorage.getItem('Year_Code');

function PurchaseBillUtility() {
    const [fetchedData, setFetchedData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [perPage, setPerPage] = useState(15);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [filterValue, setFilterValue] = useState("DN");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const apiUrl = `${API_URL}/getdata-sugarpurchase?Company_Code=${companyCode}&Year_Code=${Year_Code}`;
                const response = await axios.get(apiUrl);
                console.log("Fetched data:", response.data.SugarPurchase_Head); // Debug log
                if (response.data) {
                    setFetchedData(response.data.SugarPurchase_Head);
                    setFilteredData(response.data.SugarPurchase_Head); 
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const filtered = fetchedData.filter(post => {
            const searchTermLower = searchTerm.toLowerCase();
            const docNoLower = String(post.doc_no).toLowerCase();
            const supplierNameLower = (post.Supplier_Name || '').toLowerCase();
            const tranTypeLower = (post.Tran_Type || '').toLowerCase();

            return (
                (filterValue === "" || tranTypeLower === filterValue.toLowerCase()) &&
                (docNoLower.includes(searchTermLower) ||
                    supplierNameLower.includes(searchTermLower))
            );
        });

        console.log("Filtered data:", filtered); // Debug log
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
    console.log("Paginated posts:", paginatedPosts); // Debug log

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleClick = () => {
        const selectedFilter = filterValue;
        console.log("selectedRecord", selectedFilter);
        navigate("/sugarpurchasebill", { state: { selectedFilter } });
    };

    const handleRowClick = (doc_no) => {
        const selectedRecord = filteredData.find(record => record.doc_no === doc_no);
        console.log("Selected record:", selectedRecord); // Debug log
        navigate("/sugarpurchasebill", { state: { selectedRecord } });
    };

    const handleSearchClick = () => {
        setFilterValue("");
    };

    const handleBack = () => {
        navigate("/DashBoard");
    };

    return (
        <div className="container" style={{ padding: '20px', overflow: 'hidden' }}>
            <Grid container spacing={2} alignItems="center">
                <Grid item>
                    <Button variant="contained" color="primary" onClick={handleClick}>
                        Add
                    </Button>
                </Grid>
                <Grid item>
                    <Button variant="contained" color="secondary" onClick={handleBack}>
                        Back
                    </Button>
                </Grid>
                <Grid item>
                    <PerPageSelect value={perPage} onChange={handlePerPageChange} />
                </Grid>

                <Grid item xs={12} sm={4} sx={{ marginLeft: 2 }}>
                    <SearchBar
                        value={searchTerm}
                        onChange={handleSearchTermChange}
                        onSearchClick={handleSearchClick}
                    />
                </Grid>
             
                <Grid item xs={12}>
                    <Paper elevation={3}>
                        <TableContainer style={{ maxHeight: '400px' }}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Doc No</TableCell>
                                        <TableCell>Doc Date</TableCell>
                                        <TableCell>Supplier Name</TableCell>
                                        <TableCell>NETQNTL</TableCell>
                                        <TableCell>Bill Amount</TableCell>
                                        <TableCell>EWay Bill No</TableCell>
                                        <TableCell>Mill Inv Date</TableCell>
                                        <TableCell>Invoice No</TableCell>
                                        <TableCell>PurchID</TableCell>
                                        <TableCell>Do No</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedPosts.map((post) => (
                                        <TableRow
                                            key={post.doc_no}
                                            className="row-item"
                                            style={{ cursor: "pointer" }}
                                            onDoubleClick={() => handleRowClick(post.doc_no)}
                                        >
                                            <TableCell>{post.doc_no}</TableCell>
                                            <TableCell>{post.doc_date}</TableCell>
                                            <TableCell>{post.Supplier_Name}</TableCell>
                                            <TableCell>{post.NETQNTL}</TableCell>
                                            <TableCell>{post.Bill_Amount}</TableCell>
                                            <TableCell>{post.EWay_Bill_No}</TableCell>
                                            <TableCell>{post.mill_inv_date}</TableCell>
                                            <TableCell>{post.Invoice_No}</TableCell>
                                            <TableCell>{post.purchaseid}</TableCell>
                                            <TableCell>{post.Purcid}</TableCell>
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

export default PurchaseBillUtility;
