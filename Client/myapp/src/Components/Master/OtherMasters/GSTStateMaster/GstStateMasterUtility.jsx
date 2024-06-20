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


function GstStateMasterUtility() {

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
                const apiUrl = `${API_URL}/getall-gststatemaster`;
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

            const groupNolower = String(post.State_Code)
            const tenderDateLower = (post.State_Name || '').toLowerCase();

            return (
                (filterValue === "" || post.group_Type === filterValue) &&
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
        navigate("/gst-state-master");
    };

    const handleRowClick = (State_Code) => {
        const selectedRecord = filteredData.find(record => record.State_Code === State_Code);
        console.log("selectedRecord", selectedRecord)
        navigate("/gst-state-master", { state: { selectedRecord } });
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

          
                <Grid item xs={6} justify="center" alignItems="center" >
                    <Paper elevation={3}>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>State Code</TableCell>
                                        <TableCell>State Name</TableCell>
                                      
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedPosts.map((post) => (
                                        <TableRow
                                            key={post.State_Code}
                                            className="row-item"
                                            style={{ cursor: "pointer" }}
                                            onDoubleClick={() => handleRowClick(post.State_Code)}
                                        >

                                            <TableCell>{post.State_Code}</TableCell>
                                            <TableCell>{post.State_Name}</TableCell>
                                         

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

export default GstStateMasterUtility;
