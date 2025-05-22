import React, { useState } from 'react';
import LK99Chart from './LK99Chart';
import KPISummary from './KPISummary';
import SuperconductorAnalysis from './SuperconductorAnalysis';
import MultipleHypotheses from './MultipleHypotheses';
import './SuperconductorsDomain.css';

const SuperconductorsDomain: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', component: LK99Chart },
    { id: 'kpi', label: 'KPI Summaries', component: KPISummary },
    { id: 'analysis', label: 'Analysis', component: SuperconductorAnalysis },
    { id: 'hypotheses', label: 'Multiple Hypotheses', component: MultipleHypotheses },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || LK99Chart;

  return (
    <div className="superconductors-domain">
      <header className="domain-header">
        <h1>Superconductors Research</h1>
        <p>LK-99 Veracity & Market Probability Analysis</p>
      </header>
      
      <nav className="domain-nav">
        <div className="domain-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`domain-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
      
      <main className="domain-content">
        <ActiveComponent />
      </main>
    </div>
  );
};

export default SuperconductorsDomain; 