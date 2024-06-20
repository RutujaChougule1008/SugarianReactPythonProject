import React from "react";
import TextField from "@mui/material/TextField";

function SearchBar({ value, onChange,onSearchClick }) {
  return (
    <div className="controls">
      <TextField
        id="search"
        label="Search By"
        variant="outlined"
        value={value}
        onChange={onChange}
        placeholder="Search by..."
        onClick={onSearchClick} 
        style={{"float":"right",  "borderRadius": "25px"}}
      />
    </div>
  );
}

export default SearchBar;