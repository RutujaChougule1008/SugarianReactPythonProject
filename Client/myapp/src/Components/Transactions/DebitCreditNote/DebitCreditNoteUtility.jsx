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
    Paper,
    TextField
} from "@mui/material";
import Pagination from "../../../Common/UtilityCommon/Pagination";
import SearchBar from "../../../Common/UtilityCommon/SearchBar";
import PerPageSelect from "../../../Common/UtilityCommon/PerPageSelect";
import axios from "axios";

const API_URL = process.env.REACT_APP_API;
const companyCode = sessionStorage.getItem('Company_Code');
const Year_Code = sessionStorage.getItem('Year_Code');

function DebitCreditNoteUtility() {
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
                const apiUrl = `${API_URL}/getdata-debitcreditNote?Company_Code=${companyCode}&Year_Code=${Year_Code}`;
                const response = await axios.get(apiUrl);
                if (response.data && response.data.DebitCredit_Head) {
                    setFetchedData(response.data.DebitCredit_Head);
                    setFilteredData(response.data.DebitCredit_Head); 
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
            const companyCodeLower = String(post.doc_no).toLowerCase();
            const narrationLower = (post.Narration || '').toLowerCase();
            const tranTypeLower = (post.tran_type || '').toLowerCase();

            return (
                (filterValue === "" || tranTypeLower === filterValue.toLowerCase()) &&
                (companyCodeLower.includes(searchTermLower) ||
                    narrationLower.includes(searchTermLower))
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
        const selectedfilter = filterValue;
        console.log("selectedRecord", selectedfilter);
        navigate("/debitcreditnote", { state: { selectedfilter } });
    };

    const handleRowClick = (doc_no) => {
        const selectedRecord = filteredData.find(record => record.doc_no === doc_no);
        console.log("selectedRecord", selectedRecord);
        navigate("/debitcreditnote", { state: { selectedRecord } });
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
                <Grid item xs={12} sm={4} sx={{ marginLeft: 2 }}>
                    <SearchBar
                        value={searchTerm}
                        onChange={handleSearchTermChange}
                        onSearchClick={handleSearchClick}
                    />
                </Grid>
                <Grid item xs={12} sm={3}>
                    <FormControl fullWidth>
                        {/* <InputLabel>Filter by Type</InputLabel> */}
                        <Select
                            labelId="filterSelect-label"
                            id="filterSelect"
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                        >
                            <MenuItem value="DN">Debit Note To Customer</MenuItem>
                            <MenuItem value="CN">Credit Note To Customer</MenuItem>
                            <MenuItem value="DS">Debit Note To Supplier</MenuItem>
                            <MenuItem value="CS">Credit Note To Supplier</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid >
                    <PerPageSelect value={perPage} onChange={handlePerPageChange} />
                </Grid>
                <Grid item xs={12}>
                    <Paper elevation={3}>
                        <TableContainer style={{ maxHeight: '400px' }}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Doc No</TableCell>
                                        <TableCell>Tran Type</TableCell>
                                        <TableCell>Doc Date</TableCell>
                                        <TableCell>Account Name</TableCell>
                                        <TableCell>Bill Amount</TableCell>
                                        <TableCell>DcID</TableCell>
                                        <TableCell>Ship To Name</TableCell>
                                        <TableCell>Old Bill ID</TableCell>
                                        <TableCell>Ack No</TableCell>
                                        <TableCell>Is Deleted</TableCell>
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
                                            <TableCell>{post.tran_type}</TableCell>
                                            <TableCell>{post.doc_date}</TableCell>
                                            <TableCell>{post.Account_Name}</TableCell>
                                            <TableCell>{post.bill_amount}</TableCell>
                                            <TableCell>{post.dcid}</TableCell>
                                            <TableCell>{post.Ship_To}</TableCell>
                                            <TableCell>{post.bill_id}</TableCell>
                                            <TableCell>{post.ackno}</TableCell>
                                            <TableCell>{post.IsDeleted}</TableCell>
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

export default DebitCreditNoteUtility;
