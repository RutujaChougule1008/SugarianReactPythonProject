import React, { useRef, useEffect } from 'react';

const ActionButtonGroup = ({
  handleAddOne,
  addOneButtonEnabled,
  handleSaveOrUpdate,
  saveButtonEnabled,
  isEditMode,
  handleEdit,
  editButtonEnabled,
  handleDelete,
  deleteButtonEnabled,
  handleCancel,
  cancelButtonEnabled,
  handleBack,
  backButtonEnabled
}) => {
  const editButtonRef = useRef(null);
  const updateButtonRef = useRef(null);
  const resaleMillDropdownRef = useRef(null)

  useEffect(() => {
    if (editButtonEnabled && editButtonRef.current) {
      editButtonRef.current.focus();
    }
  }, [editButtonEnabled]);

  useEffect(() => {
    if (isEditMode && updateButtonRef.current) {
      updateButtonRef.current.focus();
    }
  }, [isEditMode]);

  const handleKeyDown = (event, handler) => {
    if (event.key === "Enter") {
      handler();
      if (handler === handleAddOne || handler === handleEdit) {
        if (resaleMillDropdownRef.current) {
          resaleMillDropdownRef.current.focus();
        }
      } else if (handler === handleCancel) {
        editButtonRef.current.focus();
      } else if (handler === handleEdit) {
        updateButtonRef.current.focus();
      }
    }
  };

  

  return (
    <div
      style={{
        marginTop: "10px",
        marginBottom: "10px",
        display: "flex",
        gap: "10px",
      }}
    >
      <button
        onClick={handleAddOne}
        disabled={!addOneButtonEnabled}
   
        onKeyDown={(event) => handleKeyDown(event, handleAddOne)}
        style={{
          backgroundColor: addOneButtonEnabled ? "blue" : "white",
          color: addOneButtonEnabled ? "white" : "black",
          border: "1px solid #ccc",
          cursor: "pointer",
          width: "4%",
          height: "35px",
          fontSize: "12px",
        }}
      >
        Add
      </button>
      {isEditMode ? (
        <button
          ref={updateButtonRef}
          onClick={handleSaveOrUpdate}
          onKeyDown={(event) => handleKeyDown(event, handleSaveOrUpdate)}
          id="update"
        
          style={{
            backgroundColor: "blue",
            color: "white",
            border: "1px solid #ccc",
            cursor: "pointer",
            width: "4%",
            height: "35px",
            fontSize: "12px",
          }}
        >
          Update
        </button>
      ) : (
        <button
          onClick={handleSaveOrUpdate}
          disabled={!saveButtonEnabled}
          onKeyDown={(event) => handleKeyDown(event, handleSaveOrUpdate)}
          id="save"
          style={{
            backgroundColor: saveButtonEnabled ? "blue" : "white",
            color: saveButtonEnabled ? "white" : "black",
            border: "1px solid #ccc=",
            cursor: saveButtonEnabled ? "pointer" : "not-allowed",
            width: "4%",
            height: "35px",
            fontSize: "12px",
          }}
        >
          Save
        </button>
      )}
      <button
        ref={editButtonRef}
        onClick={handleEdit}
        disabled={!editButtonEnabled}
        onKeyDown={(event) => handleKeyDown(event, handleEdit)}
        style={{
          backgroundColor: editButtonEnabled ? "blue" : "white",
          color: editButtonEnabled ? "white" : "black",
          border: "1px solid #ccc",
          cursor: editButtonEnabled ? "pointer" : "not-allowed",
          width: "4%",
          height: "35px",
          fontSize: "12px",
        }}
      >
        Edit
      </button>
      <button
        onClick={handleDelete}
        disabled={!deleteButtonEnabled}
        onKeyDown={(event) => handleKeyDown(event, handleDelete)}
        style={{
          backgroundColor: deleteButtonEnabled ? "blue" : "white",
          color: deleteButtonEnabled ? "white" : "black",
          border: "1px solid #ccc",
          cursor: deleteButtonEnabled ? "pointer" : "not-allowed",
          width: "4%",
          height: "35px",
          fontSize: "12px",
        }}
      >
        Delete
      </button>
      <button
        onClick={handleCancel}
        disabled={!cancelButtonEnabled}
        onKeyDown={(event) => handleKeyDown(event, handleCancel)}
       
        style={{
          backgroundColor: cancelButtonEnabled ? "blue" : "white",
          color: cancelButtonEnabled ? "white" : "black",
          border: "1px solid #ccc",
          cursor: cancelButtonEnabled ? "pointer" : "not-allowed",
          width: "4%",
          height: "35px",
          fontSize: "12px",
        }}
      >
        Cancel
      </button>
      <button
        onClick={handleBack}
        disabled={!backButtonEnabled}
        onKeyDown={(event) => handleKeyDown(event, handleBack)}
    
        style={{
          backgroundColor: backButtonEnabled ? "blue" : "white",
          color: backButtonEnabled ? "white" : "black",
          border: "1px solid #ccc",
          cursor: backButtonEnabled ? "pointer" : "not-allowed",
          width: "4%",
          height: "35px",
          fontSize: "12px",
        }}
      >
        Back
      </button>
    </div>
  );
};

export default ActionButtonGroup;
