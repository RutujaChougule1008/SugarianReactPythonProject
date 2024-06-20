import React from "react";
import { Button } from "@mui/material";

function Pagination({ pageCount, currentPage, onPageChange }) {
  //1 . Props:-
    // pageCount: The total number of available pages.
    // currentPage: The currently active page.
    // onPageChange: A function to be called when a page button is clicked.

  const visiblePages = 5;
  const halfVisible = Math.floor(visiblePages / 2);

  //2. Visible Pages Calculation:-
      // visiblePages defines the number of visible page buttons in the pagination control.
      // halfVisible calculates half of the visible pages, which is used to center the active page among the visible pages.

  let startPage = Math.max(currentPage - halfVisible, 1);
  let endPage = Math.min(startPage + visiblePages - 1, pageCount);

  //3. Start and End Page Calculation:-
      // startPage is calculated as the maximum of currentPage - halfVisible and 1.
      // endPage is calculated as the minimum of startPage + visiblePages - 1 and pageCount.

  if (endPage - startPage + 1 < visiblePages) {
    startPage = Math.max(endPage - visiblePages + 1, 1);
  }

//If the calculated number of visible pages is less than visiblePages, startPage is adjusted to the number of visible pages is maintained.

  const pageButtons = Array.from(
    { length: endPage - startPage + 1 },
    (_, index) => (
      <Button
        key={startPage + index}
        onClick={() => onPageChange(startPage + index)}
        variant={currentPage === startPage + index ? "contained" : "outlined"}
        size="small"
        style={{ margin: "0.2rem" }}
      >
        {startPage + index}
      </Button>
    )
  );

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: "1rem" }}>
      {currentPage > 1 && (
        <Button onClick={() => onPageChange(currentPage - 1)}>Prev</Button>
      )}
      {pageButtons}
      {currentPage < pageCount && (
        <Button onClick={() => onPageChange(currentPage + 1)}>Next</Button>
      )}
    </div>

// If the current page is greater than 1, a "Prev" button is rendered with an onClick handler to navigate to the previous page.
// If the current page is less than pageCount, a "Next" button is rendered with an onClick handler to navigate to the next page
  );
}

export default Pagination;

