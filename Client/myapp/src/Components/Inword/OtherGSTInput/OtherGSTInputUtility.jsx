import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
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
  

function OtherGSTInputUtility() {
  const apiURL = process.env.REACT_APP_API_URL;
  const [fetchedData, setFetchedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [perPage, setPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterValue, setFilterValue] = useState("");
  const navigate = useNavigate();
  const companyCode = sessionStorage.getItem('Company_Code')

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    let day = date.getDate();
    let month = date.getMonth() + 1; // getMonth() returns month from 0-11
    let year = date.getFullYear();
  
    // Ensuring day and month are two digits
    day = day < 10 ? '0' + day : day;
    month = month < 10 ? '0' + month : month;
  
    // Return in `yyyy-MM-dd` format
    return `${day}/${month}/${year}`;
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = `http://localhost:8080/getall-OtherGSTInput?Company_Code=${companyCode}&Year_Code=4`;
        const response = await axios.get(apiUrl);
        setFetchedData(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const searchTermLower = searchTerm.toLowerCase();
  
    const filtered = fetchedData.filter((post) => {
      const purpose = (post.Narration || "").toLowerCase();
      // Convert Doc_No to string for partial matching or direct comparison for full match
      const docNoMatch = searchTermLower ? post.Doc_No.toString().includes(searchTermLower) : true;
  
      return (
        (filterValue === "" || post.Doc_No.toString() === filterValue) &&
        (docNoMatch || purpose.includes(searchTermLower))
      );
    });
  
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchTerm, filterValue, fetchedData]);
  

  const handleSearchTermChange = (event) => {
    const term = event.target.value;
    setSearchTerm(term);
  };

  

  const pageCount = Math.ceil(filteredData.length / perPage);

  const paginatedPosts = filteredData.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePerPageChange = (event) => {
    setPerPage(event.target.value);
    setCurrentPage(1);
  };
  const handleSearchClick = () => {
    setFilterValue("");
  };

  const handleClick = () => {
    navigate("/other-gst-input");
  };

  const handleRowClick = (Doc_No) => {
    const selectedRecord = fetchedData.find(
      (other_gst_input) => other_gst_input.Doc_No === Doc_No
    );
    navigate("/other-gst-input", {
      state: { editRecordData: selectedRecord },
    });
    console.log("selectedRecord",selectedRecord)
    console.log(Doc_No)
  
  };


  const handleBackButton = () => {
    navigate("/DashBoard");
  };

  return (
    <div className="App container">
      <Grid container spacing={3}>
        <Grid item xs={0}>
          <Button variant="contained" style={{ marginTop: "20px" }} onClick={handleClick}>
            Add
          </Button>
        </Grid>
        <Grid item xs={0}>
          <Button variant="contained" style={{ marginTop: "20px" }} onClick={handleBackButton}>
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
                    <TableCell>CGST Amount</TableCell>
                    <TableCell>SGST Amount</TableCell>
                    <TableCell>IGST Amount</TableCell>
                    <TableCell>Narration</TableCell>
                    <TableCell>OID</TableCell>

                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedPosts.map((post) => (
                    <TableRow
                      key={post.Doc_No}
                      className="row-item"
                      style={{ cursor: "pointer" }}
                      onDoubleClick={() => handleRowClick(post.Doc_No)}
                    >
                      <TableCell>{post.Doc_No}</TableCell>
                      <TableCell>{formatDate(post.Doc_Date)}</TableCell>
                      <TableCell>{post.CGST_Amt}</TableCell>
                      <TableCell>{post.SGST_Amt}</TableCell>
                      <TableCell>{post.IGST_Amt}</TableCell>
                      <TableCell>{post.Narration}</TableCell>
                      <TableCell>{post.Oid}</TableCell>




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

export default OtherGSTInputUtility;