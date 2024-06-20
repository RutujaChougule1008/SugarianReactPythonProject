import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { AiOutlineUser, AiOutlineLock, AiFillEye, AiFillEyeInvisible } from 'react-icons/ai';
import './Login.css';
import { useNavigate } from 'react-router-dom';
import logo from "../../Assets/companylogo.jpg"
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const LoginForm = () => {
  const navigate = useNavigate();
  const UsernameRef = useRef(null);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const [loginData, setLoginData] = useState({
    Login_Name: '',
    Password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginData.Login_Name || !loginData.Password) {
      toast.error("Both Login Name and Password are required!");
      return;
    }
    try {
      const response = await axios.post('http://localhost:8080/api/login', loginData);
      const { user_data, access_token } = response.data;
      sessionStorage.setItem('user_type', user_data.UserType);
      sessionStorage.setItem('access_token', access_token);
      toast.success("Logged in successfully!");
      setTimeout(() => {
        navigate("/company-list");
      }, 1000);
    } catch (error) {
      if (error.response) {
        toast.error(error.response.data.error || "Login failed!");
        console.error('Login error:', error.response.data.error);
      } else if (error.request) {
        toast.error("The login request was made but no response was received");
      } else {
        toast.error("An error occurred: " + error.message);
      }
    }
  };

  // Focus the username input when the component mounts
  useEffect(() => {
    UsernameRef.current.focus();
  }, []);

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };



  return (
    <div className="login-container">
      <ToastContainer />
      <img src={logo} alt='' />
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <AiOutlineUser className="icon" size={30} />
          <label htmlFor="loginName" className="form-label">
            Username
          </label>
          <input
            type="text"
            className="form-control"
            id="loginName"
            name="Login_Name"
            value={loginData.Login_Name}
            onChange={handleChange}
     
            ref={UsernameRef}
          />
        </div>
        <div className="form-group">
          <AiOutlineLock className="icon" size={30} />
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <div className="password-input-container">
            <input
              type={passwordVisible ? "text" : "password"}
              className="form-control"
              id="password"
              name="Password"
              value={loginData.Password}
              onChange={handleChange}
         
            />
            {passwordVisible ? (
              <AiFillEyeInvisible className="icon eye-icon" onClick={togglePasswordVisibility} />
            ) : (
              <AiFillEye className="icon eye-icon" onClick={togglePasswordVisibility} />
            )}
          </div>
        </div>
        <button type="submit" className="loginButton">
          Login
        </button>
      </form>
      <div className="developed-by">
        Developed by | <a href="https://latasoftware.co.in/" target="_blank" rel="noopener noreferrer"><strong>Lata Software Consultancy</strong></a>
      </div>
    </div>
  );
};

export default LoginForm;
