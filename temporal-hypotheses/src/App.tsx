import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import SuperconductorsDomain from './components/SuperconductorsDomain';
import Export from './components/Export';
import Navbar from './components/Navbar';
import './App.css';

const App = () => {
  return (
    <HashRouter>
      <div className="min-h-screen w-full">
        <Navbar />
        
        <main className="w-full p-0 text-left">
          <Routes>
            <Route path="/" element={<Navigate to="/superconductors" replace />} />
            <Route path="/superconductors" element={<SuperconductorsDomain />} />
            <Route path="/export" element={<Export />} />
            {/* Redirect old routes to superconductors */}
            <Route path="/kpi-summaries" element={<Navigate to="/superconductors" replace />} />
            <Route path="/multiple-hypotheses" element={<Navigate to="/superconductors" replace />} />
            <Route path="/superconductor-analysis" element={<Navigate to="/superconductors" replace />} />
            {/* Catch all other routes */}
            <Route path="*" element={<Navigate to="/superconductors" replace />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
