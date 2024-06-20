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
  TextField,
  Grid,
  Paper,
  Typography,
} from "@mui/material";
import Pagination from "../../../Common/UtilityCommon/Pagination";
import SearchBar from "../../../Common/UtilityCommon/SearchBar";
import PerPageSelect from "../../../Common/UtilityCommon/PerPageSelect";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;


function TenderPurchaseUtility() {
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
        const apiUrl = `${API_URL}/get_company_data_All`;
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

      const tenderNoLower = String(post.Company_Code)
      const tenderDateLower = (post.Company_Name_E || '').toLowerCase();

      return (
        (filterValue === "" || post.group_Type === filterValue) &&
        (tenderNoLower.includes(searchTermLower) ||
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
    navigate("/create-company");
  };

  const handleRowClick = (Company_Code) => {
    const selectedRecord = filteredData.find(record => record.Company_Code === Company_Code);
    console.log("selectedRecord", selectedRecord)
    navigate("/create-company", { state: { selectedRecord } });
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
                    <TableCell>Company_Code</TableCell>
                    <TableCell>Company_Name_E</TableCell>
                    <TableCell>Company_Name_R</TableCell>
                    <TableCell>Address_E</TableCell>

                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedPosts.map((post) => (
                    <TableRow
                      key={post.Company_Code}
                      className="row-item"
                      style={{ cursor: "pointer" }}
                      onDoubleClick={() => handleRowClick(post.Company_Code)}
                    >
                      <TableCell>{post.Company_Code}</TableCell>
                      <TableCell>{post.Company_Name_E}</TableCell>
                      <TableCell>{post.Company_Name_R}</TableCell>
                      <TableCell>{post.Address_E}</TableCell>

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

export default TenderPurchaseUtility;
