import React, { useState } from "react";

function DataTableSearch({ data, onSearch }) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    onSearch(event.target.value);
  };

  const inputStyle = {
    height: "60px", 
    fontSize: "14px" ,
    width:"30px",
   
  };

  return (
    <div className="container my-3">
      <div className="input-group">
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="Search..."
          style={inputStyle} 
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>
    </div>
  );
}

export default DataTableSearch;
