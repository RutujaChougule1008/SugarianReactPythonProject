import React from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import routes from './Pages/RouterConfig';
import Navbar from './Pages/Navbar/Navbar';
import ComponentUtility from "./Components/CompoentsConfig";

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

function App() {
  const location = useLocation();
  const { pathname } = location;

  // Define paths where the Navbar should not be shown
  const hideNavbarPaths = ['/', '/company-list'];

  return (
    <div className="App">
      {/* Conditionally render Navbar if not on certain paths */}
      {!hideNavbarPaths.includes(pathname) && <Navbar />}
      
      <Routes>
        {routes.map((route, index) => (
          <Route key={index} path={route.path} element={<route.element />} />
        ))}
        {ComponentUtility.map((route, index) => (
          <Route key={index} path={route.path} element={<route.element />} />
        ))}
      </Routes>
    </div>
  );
}

export default AppWrapper;
