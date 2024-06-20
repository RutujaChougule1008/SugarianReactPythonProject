import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './SelectCompany.css';

const API_URL = process.env.REACT_APP_API_URL;
const SelectCompany = () => {
    const [companies, setCompanies] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const firstCompanyRef = useRef(null);
    const navigate = useNavigate()
  

    //The the all data from API
    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const response = await axios.get(`${API_URL}/get_company_data_All`);
                setCompanies(response.data);
                if (firstCompanyRef.current) {
                    firstCompanyRef.current.focus();
                }
            } catch (error) {
                console.error('Failed to fetch companies', error);
            }
        };

        fetchCompanies();

    }, []);

    //Handle show and hide the popup
    const handleCompanyClick = (company) => {
        setSelectedCompany(company);
        setShowModal(true);
    };

    //OnKeyBoard Button Functionality 
    const handleKeyDown = (event, company) => {
        if (event.key === 'Enter') {
            handleCompanyDoubleClick(company);
        }
    };

    const handleCompanyDoubleClick = (company) => {
        // Set the company code in session storage
        sessionStorage.setItem('Company_Code', company.Company_Code);
        // Optionally navigate or trigger any other side effects
        navigate('/dashboard'); 
    };
    

    return (
        <div className="companyListContainer">
            <div className="companyList">
                {companies.map((company, index) => (
                    <div
                        key={company.Company_Code}
                        className="companyItem"
                        onClick={() => handleCompanyClick(company)}
                        onDoubleClick={() => handleCompanyDoubleClick(company)} 
                        onKeyDown={(event) => handleKeyDown(event, company)}
                        ref={index === 0 ? firstCompanyRef : null}
                        tabIndex={0}
                    >
                        <span>{company.Company_Code}</span>
                        <span>{company.Company_Name_E}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SelectCompany;
