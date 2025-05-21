import React, { useState, useEffect } from 'react';
import supabase from '../services/supabase';
import './MultipleHypotheses.css';

interface Hypothesis {
  id: number;
  text: string;
}

interface HypothesisScore {
  id: number;
  paper_doi: string;
  paper_title: string;
  model: string;
  journal: string;
  paper_credibility_score: number | null;
  hypothesis_id: number;
  verdict: 'support' | 'reject' | 'neutral';
  reason: string | null;
  argument_credibility_score: number | null;
  created_at: string;
}

// Mock data for hypotheses
const MOCK_HYPOTHESES: Hypothesis[] = [
  {
    id: 1,
    text: "The first room-temperature superconductor will be a cuprate."
  },
  {
    id: 2,
    text: "Majorana Fermions are building blocks for the first room-temperature superconductors"
  }
];

const MultipleHypotheses: React.FC = () => {
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [selectedHypothesisId, setSelectedHypothesisId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Using mock data instead of fetching from Supabase
    function loadMockData() {
      // Simulate loading delay
      setTimeout(() => {
        setHypotheses(MOCK_HYPOTHESES);
        // Automatically select the first hypothesis
        setSelectedHypothesisId(MOCK_HYPOTHESES[0].id);
        setLoading(false);
      }, 500);
    }

    loadMockData();

    /* Commented out Supabase fetch - will be used when table is created
    async function fetchHypotheses() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('hypotheses')
          .select('*');
          
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          setHypotheses(data);
          // Automatically select the first hypothesis
          setSelectedHypothesisId(data[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch hypotheses');
        console.error('Error fetching hypotheses:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchHypotheses();
    */
  }, []);

  const handleHypothesisChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedHypothesisId(Number(event.target.value));
  };

  return (
    <div className="multiple-hypotheses-container">
      <h2>Multiple Hypotheses Analysis</h2>
      
      <div className="hypothesis-selection">
        <label htmlFor="hypothesis-select">Select a hypothesis:</label>
        <select 
          id="hypothesis-select" 
          value={selectedHypothesisId || ''} 
          onChange={handleHypothesisChange}
          disabled={loading}
        >
          {loading ? (
            <option>Loading hypotheses...</option>
          ) : hypotheses.length > 0 ? (
            hypotheses.map(hypothesis => (
              <option key={hypothesis.id} value={hypothesis.id}>
                {hypothesis.text}
              </option>
            ))
          ) : (
            <option>No hypotheses available</option>
          )}
        </select>
      </div>

      {error && <div className="error-message">Error: {error}</div>}
      
      <div className="graphs-container">
        {loading ? (
          <p>Loading hypotheses data...</p>
        ) : selectedHypothesisId ? (
          <div>
            <h3>Visualization for Selected Hypothesis</h3>
            <p>Graphs for hypothesis ID: {selectedHypothesisId} will be displayed here.</p>
            <p>We will fetch scores from the hypothesis_scores table for this hypothesis.</p>
          </div>
        ) : (
          <p>Select a hypothesis to view its data visualization.</p>
        )}
      </div>
    </div>
  );
};

export default MultipleHypotheses; 