import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import LK99Chart from './components/LK99Chart';
import KPISummary from './components/KPISummary';
import Navbar from './components/Navbar';
import './App.css';

// Create a wrapper component to handle conditional rendering based on route
const AppContent = () => {
  const location = useLocation();
  const isHomePage = location.pathname === "/" || location.pathname === "";
  
  return (
    <div className="app-container">
      <Navbar />
      
      {isHomePage && (
        <header className="app-header">
          <h1>LK-99 Veracity & Market Probability Visualization</h1>
          <p>Interactive chart based on paper analysis and market data</p>
        </header>
      )}
      
      <main className="app-main">
        <Routes>
          <Route path="/" element={<LK99Chart />} />
          <Route path="/kpi-summaries" element={<KPISummary />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}

export default App;
