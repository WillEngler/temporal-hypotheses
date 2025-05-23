import React from 'react';
import { NavLink } from 'react-router-dom';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-primary-900/95 backdrop-blur-sm border-b border-primary-700/50 py-3">
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center">
          {/* Enhanced Logo */}
          <div className="text-white font-bold text-xl mr-12 tracking-tight leading-none">
            APTO-Synoptic
          </div>
          
          {/* Research Domains with refined styling */}
          <div className="flex gap-2 items-center">
            <div 
              className="px-4 py-2.5 rounded-lg bg-primary-800/50 text-primary-300 cursor-not-allowed opacity-60 text-sm font-medium transition-all duration-200 leading-none flex items-center" 
              title="Coming Soon"
            >
              Energy Storage
            </div>
            <div 
              className="px-4 py-2.5 rounded-lg bg-primary-800/50 text-primary-300 cursor-not-allowed opacity-60 text-sm font-medium transition-all duration-200 leading-none flex items-center" 
              title="Coming Soon"
            >
              Microchips
            </div>
            <NavLink 
              to="/superconductors" 
              className={({ isActive }) => 
                `px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 leading-none flex items-center ${
                  isActive 
                    ? 'bg-accent-500 text-white shadow-glow' 
                    : 'bg-primary-800/70 text-primary-100 hover:bg-accent-600/80 hover:text-white'
                }`
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