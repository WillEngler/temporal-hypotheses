import React, { useState } from 'react';
import LK99Chart from './LK99Chart';
import KPISummary from './KPISummary';
import SuperconductorAnalysis from './SuperconductorAnalysis';
import MultipleHypotheses from './MultipleHypotheses';

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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-br from-primary-700 to-primary-500 text-white py-12 text-center shadow-md">
        <h1 className="text-4xl font-semibold mb-2">Superconductors Research</h1>
        <p className="text-lg opacity-90">LK-99 Veracity & Market Probability Analysis</p>
      </header>
      
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`px-6 py-4 text-sm font-medium border-b-3 transition-all duration-200 relative ${
                  activeTab === tab.id
                    ? 'text-primary-500 border-primary-500 bg-gray-50'
                    : 'text-gray-500 border-transparent hover:text-primary-500 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>
      
      <main className="max-w-6xl mx-auto px-4 py-8 bg-gray-50 min-h-[calc(100vh-200px)]">
        <ActiveComponent />
      </main>
    </div>
  );
};

export default SuperconductorsDomain; 