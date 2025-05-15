import React, { useState, useEffect } from 'react';
import supabase from '../services/supabase';
import './KPISummary.css';

interface Paper {
  id: number;
  processed: boolean;
  analysis: string | null;
  domain: string;
  model_used: string | null;
  title: string;
  [key: string]: any;
}

interface SummaryStats {
  totalPapers: number;
  processedPapers: number;
  processingRate: number;
  primaryMaterials: string[];
  modelUsage: {[key: string]: number};
}

const KPISummary: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SummaryStats | null>(null);
  
  useEffect(() => {
    async function fetchPapers() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('papers')
          .select('*');
          
        if (error) {
          throw error;
        }
        
        // Calculate stats if data is available
        if (data && data.length > 0) {
          calculateStats(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch papers');
        console.error('Error fetching papers:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPapers();
  }, []);
  
  const calculateStats = (papers: Paper[]) => {
    const totalPapers = papers.length;
    const processedPapers = papers.filter(p => p.processed).length;
    const processingRate = (processedPapers / totalPapers) * 100;
    
    // Extract primary materials from processed papers
    const primaryMaterials: string[] = [];
    const modelUsage: {[key: string]: number} = {};
    
    papers.forEach(paper => {
      // Track model usage
      if (paper.model_used) {
        modelUsage[paper.model_used] = (modelUsage[paper.model_used] || 0) + 1;
      }
      
      // Extract material information from analysis if processed
      if (paper.processed && paper.analysis) {
        try {
          const analysis = JSON.parse(paper.analysis);
          const material = analysis.material_properties?.composition?.primary_material;
          if (material && !primaryMaterials.includes(material)) {
            primaryMaterials.push(material);
          }
        } catch (err) {
          console.error('Error parsing analysis JSON:', err);
        }
      }
    });
    
    setStats({
      totalPapers,
      processedPapers,
      processingRate,
      primaryMaterials,
      modelUsage
    });
  };
  
  return (
    <div className="kpi-container">
      <header className="kpi-header">
        <h1>KPI Summaries</h1>
        <p>Analytics and performance metrics from Supabase</p>
      </header>
      
      <div className="kpi-content">
        <div className="kpi-grid">
          <div className="kpi-card">
            <h2>Processing Statistics</h2>
            <div className="kpi-card-content">
              {loading ? (
                <p>Loading statistics...</p>
              ) : error ? (
                <p className="error-message">Error: {error}</p>
              ) : stats ? (
                <div className="stats-container">
                  <div className="stat-item">
                    <span className="stat-label">Total Papers:</span>
                    <span className="stat-value">{stats.totalPapers}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Processed Papers:</span>
                    <span className="stat-value">{stats.processedPapers}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Processing Rate:</span>
                    <span className="stat-value">{stats.processingRate.toFixed(1)}%</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Primary Materials:</span>
                    <ul className="stat-list">
                      {stats.primaryMaterials.length > 0 ? (
                        stats.primaryMaterials.map((material, index) => (
                          <li key={index}>{material}</li>
                        ))
                      ) : (
                        <li>No materials data available</li>
                      )}
                    </ul>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Models Used:</span>
                    <ul className="stat-list">
                      {Object.keys(stats.modelUsage).length > 0 ? (
                        Object.entries(stats.modelUsage).map(([model, count], index) => (
                          <li key={index}>{model}: {count} papers</li>
                        ))
                      ) : (
                        <li>No model data available</li>
                      )}
                    </ul>
                  </div>
                </div>
              ) : (
                <p>No statistics available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPISummary; 