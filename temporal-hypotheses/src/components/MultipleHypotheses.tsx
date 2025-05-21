import React, { useState, useEffect } from 'react';
// import supabase from '../services/supabase';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ZAxis
} from 'recharts';
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
  published_date: string;
}

// Prepare data for visualization
interface TimelineDataPoint {
  date: number; // timestamp for X-axis
  score: number; // combined score for Y-axis
  title: string; // paper title for tooltip
  journal: string; // journal for tooltip
  verdict: 'support' | 'reject' | 'neutral'; // for color
  reason: string | null; // for tooltip
  dateStr: string; // formatted date for tooltip
  paperScore: number | null; // for tooltip
  argumentScore: number | null; // for tooltip
  fill?: string; // color for the dot
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

// Mock data for hypothesis scores
const MOCK_SCORES: {[key: number]: HypothesisScore[]} = {
  1: [
    {
      id: 101,
      paper_doi: "10.1038/s41586-021-03622-z",
      paper_title: "Superconductivity in cuprate heterostructures",
      model: "claude-3",
      journal: "Nature",
      paper_credibility_score: 0.85,
      hypothesis_id: 1,
      verdict: "support",
      reason: "Demonstrates high-temperature superconductivity in engineered cuprate structures with transition at 95K.",
      argument_credibility_score: 0.92,
      created_at: "2023-10-15T14:32:10Z",
      published_date: "2021-05-12T00:00:00Z"
    },
    {
      id: 102,
      paper_doi: "10.1126/science.abc4245",
      paper_title: "Room-temperature superconductivity in hydrogen-rich materials",
      model: "claude-3",
      journal: "Science",
      paper_credibility_score: 0.78,
      hypothesis_id: 1,
      verdict: "reject",
      reason: "Shows evidence that hydrides are more likely to achieve room-temperature superconductivity before cuprates.",
      argument_credibility_score: 0.81,
      created_at: "2023-11-03T09:15:22Z",
      published_date: "2020-10-14T00:00:00Z"
    },
    {
      id: 103,
      paper_doi: "10.1103/PhysRevLett.127.117002",
      paper_title: "Electronic Structure of High-Tc Cuprate Superconductors",
      model: "gpt-4",
      journal: "Physical Review Letters",
      paper_credibility_score: 0.91,
      hypothesis_id: 1,
      verdict: "support",
      reason: "Detailed analysis of electronic structure suggests cuprates have optimal properties for room-temperature superconductivity.",
      argument_credibility_score: 0.88,
      created_at: "2023-09-21T11:42:56Z",
      published_date: "2021-09-07T00:00:00Z"
    },
    {
      id: 104,
      paper_doi: "10.1038/s41563-022-01358-3",
      paper_title: "Advances in iron-based superconductors",
      model: "claude-3",
      journal: "Nature Materials",
      paper_credibility_score: 0.82,
      hypothesis_id: 1,
      verdict: "neutral",
      reason: "Compares cuprates and iron-based superconductors, finding both have paths toward higher temperature superconductivity.",
      argument_credibility_score: 0.75,
      created_at: "2023-12-07T16:28:33Z",
      published_date: "2022-08-23T00:00:00Z"
    },
    {
      id: 105,
      paper_doi: "10.1073/pnas.2201112119",
      paper_title: "Theoretical limits of superconducting critical temperatures",
      model: "gpt-4",
      journal: "PNAS",
      paper_credibility_score: 0.76,
      hypothesis_id: 1,
      verdict: "support",
      reason: "Theoretical models place cuprates as the most promising class of materials for achieving room-temperature superconductivity.",
      argument_credibility_score: 0.79,
      created_at: "2024-01-12T08:45:19Z",
      published_date: "2022-05-17T00:00:00Z"
    },
    {
      id: 106,
      paper_doi: "10.1038/s41566-023-01245-6",
      paper_title: "Optical signatures of high-temperature superconductivity",
      model: "claude-3",
      journal: "Nature Photonics",
      paper_credibility_score: 0.88,
      hypothesis_id: 1,
      verdict: "support",
      reason: "Optical measurements of cuprates reveal properties consistent with potential room-temperature superconductivity.",
      argument_credibility_score: 0.84,
      created_at: "2024-02-03T13:20:41Z",
      published_date: "2023-06-29T00:00:00Z"
    },
    {
      id: 107,
      paper_doi: "10.1126/sciadv.abl9222",
      paper_title: "Critical analysis of reported room-temperature superconductors",
      model: "gpt-4",
      journal: "Science Advances",
      paper_credibility_score: 0.94,
      hypothesis_id: 1,
      verdict: "reject",
      reason: "Analysis suggests carbonaceous sulfur hydrides are more likely candidates than cuprates for the first room-temperature superconductor.",
      argument_credibility_score: 0.93,
      created_at: "2024-01-27T10:05:38Z",
      published_date: "2023-02-15T00:00:00Z"
    },
    {
      id: 108,
      paper_doi: "10.1103/PhysRevX.13.021001",
      paper_title: "Pressure-induced high-Tc superconductivity in La-based cuprates",
      model: "claude-3",
      journal: "Physical Review X",
      paper_credibility_score: 0.83,
      hypothesis_id: 1,
      verdict: "support",
      reason: "Demonstrates pressure can increase cuprate Tc to near-room-temperature values, supporting potential for cuprate room-temperature superconductivity.",
      argument_credibility_score: 0.86,
      created_at: "2023-08-14T15:52:29Z",
      published_date: "2023-01-10T00:00:00Z"
    },
    {
      id: 109,
      paper_doi: "10.1021/jacs.2c13243",
      paper_title: "Chemical approaches to superconducting materials",
      model: "gpt-4",
      journal: "Journal of the American Chemical Society",
      paper_credibility_score: 0.79,
      hypothesis_id: 1,
      verdict: "neutral",
      reason: "Review suggests multiple material classes have potential for room-temperature superconductivity.",
      argument_credibility_score: 0.80,
      created_at: "2023-11-29T09:37:14Z",
      published_date: "2022-12-05T00:00:00Z"
    },
    {
      id: 110,
      paper_doi: "10.1038/s41567-023-02092-6",
      paper_title: "Theoretical foundations of cuprate superconductivity",
      model: "claude-3",
      journal: "Nature Physics",
      paper_credibility_score: 0.89,
      hypothesis_id: 1,
      verdict: "support",
      reason: "Comprehensive theoretical analysis suggests cuprates remain the most promising path to room-temperature superconductivity.",
      argument_credibility_score: 0.90,
      created_at: "2024-03-05T11:18:47Z",
      published_date: "2023-11-21T00:00:00Z"
    },
  ],
  2: [
    {
      id: 201,
      paper_doi: "10.1038/s41567-022-01867-7",
      paper_title: "Observation of Majorana fermions in superconducting systems",
      model: "gpt-4",
      journal: "Nature Physics",
      paper_credibility_score: 0.87,
      hypothesis_id: 2,
      verdict: "support",
      reason: "Direct observation of Majorana fermions in modified superconductors with high transition temperatures.",
      argument_credibility_score: 0.84,
      created_at: "2023-08-22T16:45:30Z",
      published_date: "2022-07-18T00:00:00Z"
    },
    {
      id: 202,
      paper_doi: "10.1126/science.abf1077",
      paper_title: "Majorana zero modes in superconductor-semiconductor heterostructures",
      model: "claude-3",
      journal: "Science",
      paper_credibility_score: 0.92,
      hypothesis_id: 2,
      verdict: "support",
      reason: "Experimental evidence shows Majorana fermions contribute to enhanced superconducting properties.",
      argument_credibility_score: 0.89,
      created_at: "2023-10-11T13:22:18Z",
      published_date: "2021-03-05T00:00:00Z"
    },
    {
      id: 203,
      paper_doi: "10.1103/PhysRevLett.128.237001",
      paper_title: "Theory of Majorana-mediated superconductivity",
      model: "gpt-4",
      journal: "Physical Review Letters",
      paper_credibility_score: 0.93,
      hypothesis_id: 2,
      verdict: "support",
      reason: "Theoretical framework shows how Majorana fermions could facilitate high-temperature superconducting pairing.",
      argument_credibility_score: 0.91,
      created_at: "2023-09-05T08:17:42Z",
      published_date: "2022-06-15T00:00:00Z"
    },
    {
      id: 204,
      paper_doi: "10.1038/s41586-023-05987-9",
      paper_title: "Limitations of Majorana fermions in conventional superconductors",
      model: "claude-3",
      journal: "Nature",
      paper_credibility_score: 0.85,
      hypothesis_id: 2,
      verdict: "reject",
      reason: "Analysis shows Majorana fermions may not be essential for room-temperature superconductivity.",
      argument_credibility_score: 0.82,
      created_at: "2024-01-08T11:35:09Z",
      published_date: "2023-04-12T00:00:00Z"
    },
    {
      id: 205,
      paper_doi: "10.1073/pnas.2301542120",
      paper_title: "Emergent phenomena in topological superconductors",
      model: "gpt-4",
      journal: "PNAS",
      paper_credibility_score: 0.78,
      hypothesis_id: 2,
      verdict: "neutral",
      reason: "Discusses multiple mechanisms for high-temperature superconductivity, with Majorana fermions being just one possibility.",
      argument_credibility_score: 0.75,
      created_at: "2023-12-19T14:28:33Z",
      published_date: "2023-06-30T00:00:00Z"
    },
    {
      id: 206,
      paper_doi: "10.1038/s41563-023-01644-8",
      paper_title: "Electronic structure of Majorana-hosting superconductors",
      model: "claude-3",
      journal: "Nature Materials",
      paper_credibility_score: 0.89,
      hypothesis_id: 2,
      verdict: "support",
      reason: "Materials with Majorana fermions show enhanced superconducting transition temperatures approaching room temperature.",
      argument_credibility_score: 0.87,
      created_at: "2024-02-27T09:42:51Z",
      published_date: "2023-09-22T00:00:00Z"
    },
    {
      id: 207,
      paper_doi: "10.1126/sciadv.ade9142",
      paper_title: "Role of topology in unconventional superconductivity",
      model: "gpt-4",
      journal: "Science Advances",
      paper_credibility_score: 0.81,
      hypothesis_id: 2,
      verdict: "neutral",
      reason: "Suggests Majorana fermions may contribute to, but are not necessary for, room-temperature superconductivity.",
      argument_credibility_score: 0.83,
      created_at: "2023-11-14T15:55:27Z",
      published_date: "2023-05-19T00:00:00Z"
    },
    {
      id: 208,
      paper_doi: "10.1103/PhysRevB.107.174501",
      paper_title: "Majorana fermions in high-Tc superconductor candidates",
      model: "claude-3",
      journal: "Physical Review B",
      paper_credibility_score: 0.76,
      hypothesis_id: 2,
      verdict: "support",
      reason: "Experimental detection of Majorana modes in materials with high transition temperatures suggests a causal relationship.",
      argument_credibility_score: 0.78,
      created_at: "2023-07-30T12:19:36Z",
      published_date: "2021-11-08T00:00:00Z"
    },
    {
      id: 209,
      paper_doi: "10.1021/acs.nanolett.3c02145",
      paper_title: "Engineering Majorana states in 2D materials",
      model: "gpt-4",
      journal: "Nano Letters",
      paper_credibility_score: 0.83,
      hypothesis_id: 2,
      verdict: "support",
      reason: "Demonstrates engineered materials with Majorana fermions showing superconductivity above 200K.",
      argument_credibility_score: 0.85,
      created_at: "2024-01-19T10:28:43Z",
      published_date: "2023-08-14T00:00:00Z"
    },
    {
      id: 210,
      paper_doi: "10.1038/s41567-023-02098-0",
      paper_title: "Critical assessment of Majorana detection claims",
      model: "claude-3",
      journal: "Nature Physics",
      paper_credibility_score: 0.95,
      hypothesis_id: 2,
      verdict: "reject",
      reason: "Rigorous analysis finds insufficient evidence linking Majorana fermions to high-temperature superconductivity mechanisms.",
      argument_credibility_score: 0.94,
      created_at: "2024-03-12T08:35:16Z",
      published_date: "2023-12-05T00:00:00Z"
    },
  ]
};

const MultipleHypotheses: React.FC = () => {
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [selectedHypothesisId, setSelectedHypothesisId] = useState<number | null>(null);
  const [scores, setScores] = useState<HypothesisScore[]>([]);
  const [timelineData, setTimelineData] = useState<TimelineDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingScores, setLoadingScores] = useState(false);
  const [error, ] = useState<string | null>(null);
  const [scoresError, ] = useState<string | null>(null);

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

  // Fetch scores when selected hypothesis changes
  useEffect(() => {
    if (!selectedHypothesisId) return;

    // Using mock data instead of fetching from Supabase
    function loadMockScores() {
      setLoadingScores(true);
      // Simulate loading delay
      setTimeout(() => {
        // Using type assertion to avoid TypeScript error with null as index
        const hypothesisScores = selectedHypothesisId ? MOCK_SCORES[selectedHypothesisId] || [] : [];
        
        // Sort the scores by published_date, newest first
        const sortedScores = [...hypothesisScores].sort((a, b) => {
          return new Date(b.published_date).getTime() - new Date(a.published_date).getTime();
        });
        
        setScores(sortedScores);

        // Process data for timeline visualization
        const processedData = hypothesisScores.map(score => {
          let combinedScore = 0;
          
          // Calculate combined score (paper_credibility * argument_credibility)
          if (score.paper_credibility_score && score.argument_credibility_score) {
            combinedScore = score.paper_credibility_score * score.argument_credibility_score;
            
            // Negative scores for rejection
            if (score.verdict === 'reject') {
              combinedScore = -combinedScore;
            }
            
            // Neutral scores are always zero
            if (score.verdict === 'neutral') {
              combinedScore = 0;
            }
          }
          
          // Convert date string to timestamp for X-axis
          const date = new Date(score.published_date).getTime();
          
          // Get color based on verdict
          const color = getVerdictColor(score.verdict);
          
          return {
            date,
            score: combinedScore,
            title: score.paper_title,
            journal: score.journal,
            verdict: score.verdict,
            reason: score.reason,
            dateStr: formatDate(score.published_date),
            paperScore: score.paper_credibility_score,
            argumentScore: score.argument_credibility_score,
            fill: color // Add fill property with color
          };
        });
        
        // Sort timeline data by date (oldest to newest)
        const sortedTimelineData = processedData.sort((a, b) => a.date - b.date);
        setTimelineData(sortedTimelineData);
        
        setLoadingScores(false);
      }, 700);
    }

    loadMockScores();

    /* Commented out Supabase fetch - will be used when table is created
    async function fetchHypothesisScores() {
      try {
        setLoadingScores(true);
        setScoresError(null);
        
        const { data, error } = await supabase
          .from('hypothesis_scores')
          .select('*')
          .eq('hypothesis_id', selectedHypothesisId)
          .order('published_date', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        setScores(data || []);

        // Process data for timeline visualization
        const processedData = (data || []).map(score => {
          let combinedScore = 0;
          
          // Calculate combined score (paper_credibility * argument_credibility)
          if (score.paper_credibility_score && score.argument_credibility_score) {
            combinedScore = score.paper_credibility_score * score.argument_credibility_score;
            
            // Negative scores for rejection
            if (score.verdict === 'reject') {
              combinedScore = -combinedScore;
            }
            
            // Neutral scores are always zero
            if (score.verdict === 'neutral') {
              combinedScore = 0;
            }
          }
          
          // Convert date string to timestamp for X-axis
          const date = new Date(score.published_date).getTime();
          
          // Get color based on verdict
          const color = getVerdictColor(score.verdict);
          
          return {
            date,
            score: combinedScore,
            title: score.paper_title,
            journal: score.journal,
            verdict: score.verdict,
            reason: score.reason,
            dateStr: formatDate(score.published_date),
            paperScore: score.paper_credibility_score,
            argumentScore: score.argument_credibility_score,
            fill: color // Add fill property with color
          };
        });
        
        // Sort timeline data by date (oldest to newest)
        const sortedTimelineData = processedData.sort((a, b) => a.date - b.date);
        setTimelineData(sortedTimelineData);
        
      } catch (err) {
        setScoresError(err instanceof Error ? err.message : 'Failed to fetch hypothesis scores');
        console.error('Error fetching hypothesis scores:', err);
      } finally {
        setLoadingScores(false);
      }
    }
    
    fetchHypothesisScores();
    */
  }, [selectedHypothesisId]);

  const handleHypothesisChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedHypothesisId(Number(event.target.value));
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Get color for scatter plot dots based on verdict
  const getVerdictColor = (verdict: 'support' | 'reject' | 'neutral'): string => {
    switch (verdict) {
      case 'support':
        return '#4caf50'; // green
      case 'reject':
        return '#f44336'; // red
      case 'neutral':
        return '#2196f3'; // blue
      default:
        return '#9e9e9e'; // grey
    }
  };

  // Custom tooltip component for the scatter plot
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="timeline-tooltip">
          <p className="tooltip-title">{data.title}</p>
          <p className="tooltip-journal">{data.journal} ({data.dateStr})</p>
          <p className="tooltip-scores">
            Paper credibility: {(data.paperScore ?? 0).toFixed(2)}<br />
            Argument credibility: {(data.argumentScore ?? 0).toFixed(2)}
          </p>
          <p className="tooltip-verdict">
            <span className={`verdict verdict-${data.verdict}`}>{data.verdict}</span>
          </p>
          {data.reason && <p className="tooltip-reason">{data.reason}</p>}
        </div>
      );
    }
    return null;
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
          <div className="hypothesis-analysis">
            <h3>Analysis for: {hypotheses.find(h => h.id === selectedHypothesisId)?.text}</h3>
            
            {loadingScores ? (
              <p>Loading score data...</p>
            ) : scoresError ? (
              <div className="error-message">Error loading scores: {scoresError}</div>
            ) : scores.length > 0 ? (
              <>
                <div className="timeline-container">
                  <h4>Hypothesis Confirmation Timeline</h4>
                  <div className="timeline-legend">
                    <div className="legend-item">
                      <span className="legend-color" style={{ backgroundColor: '#4caf50' }}></span>
                      <span>Support</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-color" style={{ backgroundColor: '#f44336' }}></span>
                      <span>Reject</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-color" style={{ backgroundColor: '#2196f3' }}></span>
                      <span>Neutral</span>
                    </div>
                  </div>
                  <div className="timeline-chart">
                    <ResponsiveContainer width="100%" height={300}>
                      <ScatterChart
                        margin={{ top: 20, right: 20, bottom: 20, left: 80 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          name="Date"
                          domain={['dataMin', 'dataMax']}
                          tickFormatter={(unixTime) => new Date(unixTime).toLocaleDateString('en-US', { year: 'numeric' })}
                          type="number"
                          label={{ value: 'Publication Date', position: 'bottom', offset: 0 }}
                        />
                        <YAxis
                          dataKey="score"
                          name="Score"
                          domain={[-1, 1]}
                          label={{ value: 'Confirmation Strength', angle: -90, position: 'center', dx: -40 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine y={0} stroke="#666" />
                        <ZAxis range={[60, 60]} />
                        <Scatter
                          data={timelineData}
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="scores-summary">
                  <h4>Paper Analysis Scores</h4>
                  <p>Found {scores.length} paper analysis scores for this hypothesis</p>
                  <div className="scores-table-container">
                    <table className="scores-table">
                      <thead>
                        <tr>
                          <th>Paper Title</th>
                          <th>Journal</th>
                          <th>Published</th>
                          <th>Verdict</th>
                          <th>Credibility</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scores.map(score => (
                          <tr key={score.id}>
                            <td>{score.paper_title}</td>
                            <td>{score.journal}</td>
                            <td>{formatDate(score.published_date)}</td>
                            <td className={`verdict verdict-${score.verdict}`}>{score.verdict}</td>
                            <td>{score.paper_credibility_score?.toFixed(2) || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <p>No scores available for this hypothesis.</p>
            )}
          </div>
        ) : (
          <p>Select a hypothesis to view its data visualization.</p>
        )}
      </div>
    </div>
  );
};

export default MultipleHypotheses; 