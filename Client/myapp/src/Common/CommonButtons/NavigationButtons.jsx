import React, { useEffect } from 'react';
const NavigationButtons = ({
  handleFirstButtonClick,
  handlePreviousButtonClick,
  handleNextButtonClick,
  handleLastButtonClick,
  highlightedButton,
  isEditing
}) => {
  const handleKeyDown = (event, handler) => {
    if (event.key === "Enter") {
      handler();
    }
  };

  useEffect(() => {
    const handleKeyPress = (event) => {
      switch (highlightedButton) {
        case "first":
          handleKeyDown(event, handleFirstButtonClick);
          break;
        case "previous":
          handleKeyDown(event, handlePreviousButtonClick);
          break;
        case "next":
          handleKeyDown(event, handleNextButtonClick);
          break;
        case "last":
          handleKeyDown(event, handleLastButtonClick);
          break;
        default:
          break;
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [highlightedButton, handleFirstButtonClick, handlePreviousButtonClick, handleNextButtonClick, handleLastButtonClick]);
  

  return (
    <div style={{ float: "right", marginTop: "-40px" }}>
      <button
        style={{
          border: "1px solid #ccc",
          backgroundColor: highlightedButton === "first" ? "black" : "blue",
          color: "white",
          width: "100px",
          height: "35px",
          cursor: isEditing ? "not-allowed" : "pointer",
        }}
        onKeyDown={(event) => handleKeyDown(event, handleFirstButtonClick)}
        disabled={isEditing}
        onClick={handleFirstButtonClick}
      >
        &lt;&lt;
      </button>
      <button
        style={{
          border: "1px solid #ccc",
          backgroundColor: highlightedButton === "previous" ? "black" : "blue",
          color: "white",
          width: "100px",
          height: "35px",
          cursor: isEditing ? "not-allowed" : "pointer",
        }}
        onKeyDown={(event) => handleKeyDown(event, handlePreviousButtonClick)}
        disabled={isEditing}
        onClick={handlePreviousButtonClick}
      >
        &lt;
      </button>
      <button
        style={{
          border: "1px solid #ccc",
          backgroundColor: highlightedButton === "next" ? "black" : "blue",
          color: "white",
          width: "100px",
          height: "35px",
          cursor: isEditing ? "not-allowed" : "pointer",
        }}
        onKeyDown={(event) => handleKeyDown(event, handleNextButtonClick)}
        disabled={isEditing}
        onClick={handleNextButtonClick}
      >
        &gt;
      </button>
      <button
        style={{
          border: "1px solid #ccc",
          backgroundColor: highlightedButton === "last" ? "black" : "blue",
          color: "white",
          width: "100px",
          height: "35px",
          cursor: isEditing ? "not-allowed" : "pointer",
        }}
        onKeyDown={(event) => handleKeyDown(event, handleLastButtonClick)}
        onClick={handleLastButtonClick}
        disabled={isEditing}
      >
        &gt;&gt;
      </button>
    </div>
  );
};

export default NavigationButtons;
