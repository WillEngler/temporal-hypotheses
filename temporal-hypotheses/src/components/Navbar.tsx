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
            APTO-Synoptic
          </div>
          
          {/* Research Domains */}
          <div className="navbar-links">
            <div className="nav-link nav-link-disabled" title="Coming Soon">
              Energy Storage
            </div>
            <div className="nav-link nav-link-disabled" title="Coming Soon">
              Microchips
            </div>
            <NavLink 
              to="/superconductors" 
              className={({ isActive }) => 
                `nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`
              }
            >
              Superconductors
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 