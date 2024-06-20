import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './SelectAccountingYear.css';

const API_URL = process.env.REACT_APP_API_URL;

const SelectAccoungYear = () => {
    const [accountingYears, setAccountingYears] = useState([]);
    const firstYearRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAccountingYears = async () => {
            const companyCode = sessionStorage.getItem('Company_Code');
            try {
                const response = await axios.get(`${API_URL}/get_accounting_years?Company_Code=${companyCode}`);
                setAccountingYears(response.data);
                if (firstYearRef.current) {
                    firstYearRef.current.focus();
                }
            } catch (error) {
                console.error('Failed to fetch accounting years', error);
            }
        };

        fetchAccountingYears();
    }, []);

    const handleAccountYear = (accountingyear) => {
        sessionStorage.setItem('Year_Code', accountingyear.yearCode);
        // Handle any additional logic here
        navigate('/dashboard'); // Example: Navigate to dashboard after selecting year
    };

    const handleKeyDown = (event, accountingyear) => {
        if (event.key === 'Enter') {
            handleAccountYear(accountingyear);
        }
    };

    return (
        <div className="companyListContainer">
            <div className="companyList">
                {accountingYears.map((accountingyear, index) => (
                    <div
                        key={accountingyear.yearCode}
                        className="companyItem"
                        onClick={() => handleAccountYear(accountingyear)}
                        onKeyDown={(event) => handleKeyDown(event, accountingyear)}
                        tabIndex={0}
                        ref={index === 0 ? firstYearRef : null}
                    >
                        <span>{accountingyear.yearCode}</span>
                        <span>{accountingyear.year}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SelectAccoungYear;
