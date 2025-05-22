import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import SuperconductorsDomain from './components/SuperconductorsDomain';
import Navbar from './components/Navbar';
import './App.css';

const App = () => {
  return (
    <HashRouter>
      <div className="app-container">
        <Navbar />
        
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/superconductors" replace />} />
            <Route path="/superconductors" element={<SuperconductorsDomain />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
