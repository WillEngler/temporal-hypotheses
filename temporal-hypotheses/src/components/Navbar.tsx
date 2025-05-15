import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

const Navbar: React.FC = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          {/* Logo */}
          <div className="navbar-brand">
            Temporal Hypotheses
          </div>
          
          {/* Primary Nav */}
          <div className="navbar-links">
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                `nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`
              }
            >
              Hypothesis Tracking
            </NavLink>
            <NavLink 
              to="/kpi-summaries" 
              className={({ isActive }) => 
                `nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`
              }
            >
              KPI Summaries
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 