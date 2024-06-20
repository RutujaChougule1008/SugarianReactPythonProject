import React from "react";
import Form from 'react-bootstrap/Form';

function PerPageSelect({ value, onChange }) {
  const options = [15, 25, 50, 100];

//1. const options = [15, 25, 50, 100];: Defines an array of available options for posts per page.

  return (
    <div className="controls">
      <Form.Group className="mb-3" style={{ float: "left", marginLeft: "150px" }}>
        <Form.Label id="perPage-label">Posts Per Page</Form.Label>
        <Form.Select
          aria-label="Postsm Per Page"
          value={value}
          onChange={onChange}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Form.Select>
      </Form.Group>
    </div>
  );
}

export default PerPageSelect;



