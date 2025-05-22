import React from 'react';
import { NavLink } from 'react-router-dom';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-primary-700 shadow-md border-b-3 border-primary-500 py-2">
      <div className="max-w-6xl mx-auto px-4 flex justify-between">
        <div className="flex items-center">
          {/* Logo */}
          <div className="text-white font-semibold text-xl mr-8">
            APTO-Synoptic
          </div>
          
          {/* Research Domains */}
          <div className="flex gap-4">
            <div 
              className="px-4 py-2 rounded bg-gray-750 text-gray-400 cursor-pointer opacity-70 transition-all duration-200 hover:bg-gray-600 hover:opacity-80" 
              title="Coming Soon"
            >
              Energy Storage
            </div>
            <div 
              className="px-4 py-2 rounded bg-gray-750 text-gray-400 cursor-pointer opacity-70 transition-all duration-200 hover:bg-gray-600 hover:opacity-80" 
              title="Coming Soon"
            >
              Microchips
            </div>
            <NavLink 
              to="/superconductors" 
              className={({ isActive }) => 
                `px-4 py-2 rounded text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-gray-750 text-gray-100 hover:bg-primary-700'
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