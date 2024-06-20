// DashBoard.js
import React from 'react';
import { Button } from "react-bootstrap";
import "./DashBoard.css"; // Importing external CSS file
import { useNavigate } from 'react-router-dom';

const DashBoard = () => {

  const navigate = useNavigate()

  const handleRegister = () => { 
    navigate("/")
  }

  return (
    <>
    
    <div>
      <Button
        variant="primary"
        className="button"
        onClick={handleRegister}
        style={{ width: '150px', height: '80px' }}
      >
        Register
      </Button>


      <Button
        variant="primary"
        className="button"
        onClick={handleRegister}
        style={{ width: '150px', height: '80px' }}
      >
    
        Delivery Order
      </Button>

      <Button
        variant="primary"
        className="button"
        onClick={handleRegister}
        style={{ width: '150px', height: '80px' }}
      >
        UTR Entry
      </Button>

      <Button
        variant="primary"
        className="button"
        onClick={handleRegister}
        style={{ width: '150px', height: '80px' }}
      >
        Tender Purchase
      </Button>

      <Button
        variant="primary"
        className="button"
        onClick={handleRegister}
        style={{ width: '150px', height: '80px' }}
      >

        Database Backup
      </Button>
    </div>
    <div>
      <Button
        variant="primary"
        className="button"
        onClick={handleRegister}
        style={{ width: '150px', height: '80px' }}
      >
      
        Carporate Sale
      </Button>


      <Button
        variant="primary"
        className="button"
        onClick={handleRegister}
        style={{ width: '150px', height: '80px' }}
      >
      
       Multiple Receipt
      </Button>

      <Button
        variant="primary"
        className="button"
        onClick={handleRegister}
        style={{ width: '150px', height: '80px' }}
      >
      
        Receipt Payment
      </Button>

      <Button
        variant="primary"
        className="button"
        onClick={handleRegister}
        style={{ width: '150px', height: '80px' }}
      >
      
        Trial Balance screen
      </Button>

      <Button
        variant="primary"
        className="button"
        onClick={handleRegister}
        style={{ width: '150px', height: '80px' }}
      >
      
        Sugar Balance Stock
      </Button>
    </div>
    <div>
      <Button
        variant="primary"
        className="button"
        onClick={handleRegister}
        style={{ width: '150px', height: '80px' }}
      >
      
        Dispatch Summary
      </Button>


      <Button
        variant="primary"
        className="button"
        onClick={handleRegister}
        style={{ width: '150px', height: '80px' }}
      >
      
      Transport SMS
      </Button>

      <Button
        variant="primary"
        className="button"
        onClick={handleRegister}
        style={{ width: '150px', height: '80px' }}
      >
      
        Stock Book
      </Button>

      <Button
        variant="primary"
        className="button"
        onClick={handleRegister}
        style={{ width: '150px', height: '80px' }}
      >
      
       Stock Summary
      </Button>

      <Button
        variant="primary"
        className="button"
        onClick={handleRegister}
        style={{ width: '150px', height: '80px' }}
      >
      
       Grain Purchase Bill
      </Button>
    </div>
    <div>
      <Button
        variant="primary"
        className="button"
        onClick={handleRegister}
        style={{ width: '150px', height: '80px' }}
      >
      
       Daily Report
      </Button>


      <Button
        variant="primary"
        className="button"
        onClick={handleRegister}
        style={{ width: '150px', height: '80px' }}
      >
      
      Ledger
      </Button>

      <Button
        variant="primary"
        className="button"
        onClick={handleRegister}
        style={{ width: '150px', height: '80px' }}
      >
      
       Carporate Register
      </Button>

      <Button
        variant="primary"
        className="button"
        onClick={handleRegister}
        style={{ width: '150px', height: '80px' }}
      >
      
        Broker Report
      </Button>

      <Button
        variant="primary"
        className="button"
        onClick={handleRegister}
        style={{ width: '150px', height: '80px' }}
      >
      
        Grain Sale Bill
      </Button>
    </div>
    </>
    
  )
}

export default DashBoard;
