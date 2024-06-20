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
import Pagination from "../../../../Common/UtilityCommon/Pagination";
import SearchBar from "../../../../Common/UtilityCommon/SearchBar";
import PerPageSelect from "../../../../Common/UtilityCommon/PerPageSelect";
import axios from "axios";

const API_URL = process.env.REACT_APP_API;


function SystemMasterUtility() {
    const [fetchedData, setFetchedData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [perPage, setPerPage] = useState(15);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [filterValue, setFilterValue] = useState("G");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            const companyCode = sessionStorage.getItem('Company_Code');
            try {
                const apiUrl = `${API_URL}/getall-SystemMaster?Company_Code=${companyCode}`;
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

            const groupNolower = String(post.Company_Code)
            const tenderDateLower = (post.group_Name_E || '').toLowerCase();

            return (
                (filterValue === "" || post.System_Type === filterValue) &&
                (groupNolower.includes(searchTermLower) ||
                    tenderDateLower.includes(searchTermLower)
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
        const selectedfilter = filterValue
        console.log("selectedRecord", selectedfilter)
        navigate("/syetem-master", { state: { selectedfilter } });
       
    };

    const handleRowClick = (System_Code) => {
        const selectedRecord = filteredData.find(record => record.System_Code === System_Code);
        console.log("selectedRecord", selectedRecord)
        navigate("/syetem-master", { state: { selectedRecord } });
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

                <FormControl sx={{ marginLeft: "80px", width: "20%", marginTop: "-55px" }}>
                    <InputLabel  >Filter by Type:</InputLabel>
                    <Select
                        labelId="filterSelect-label"
                        id="filterSelect"
                        value={filterValue}
                        onChange={(e) => setFilterValue(e.target.value)}
                    >
                        <MenuItem value="G">Mobile Group</MenuItem>
                        <MenuItem value="N">Narration</MenuItem>
                        <MenuItem value="V">Vat</MenuItem>
                        <MenuItem value="I">Item</MenuItem>
                        <MenuItem value="S">Grade</MenuItem>
                    </Select>
                </FormControl>

                <Grid item xs={12}>
                    <Paper elevation={3}>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>System Code</TableCell>
                                        <TableCell>System Type</TableCell>
                                        <TableCell>System Name</TableCell>
                                        <TableCell>System_Rate</TableCell>
                                        <TableCell>HSN</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedPosts.map((post) => (
                                        <TableRow
                                            key={post.System_Code}
                                            className="row-item"
                                            style={{ cursor: "pointer" }}
                                            onDoubleClick={() => handleRowClick(post.System_Code)}
                                        >
                                            <TableCell>{post.System_Code}</TableCell>
                                            <TableCell>{post.System_Type}</TableCell>
                                            <TableCell>{post.System_Name_E}</TableCell>
                                            <TableCell>{post.System_Rate}</TableCell>
                                            <TableCell>{post.HSN}</TableCell>
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

export default SystemMasterUtility;
