import React, { useState, useEffect } from 'react';
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

interface TimelineDataPoint {
  date: number;
  score: number;
  title: string;
  journal: string;
  verdict: 'support' | 'reject' | 'neutral';
  reason: string | null;
  dateStr: string;
  paperScore: number | null;
  argumentScore: number | null;
  fill?: string;
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

// Mock data for hypothesis scores (keeping the same data from MultipleHypotheses.tsx)
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

const CurrentOpenQuestions: React.FC = () => {
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [selectedHypothesisId, setSelectedHypothesisId] = useState<number | null>(null);
  const [scores, setScores] = useState<HypothesisScore[]>([]);
  const [timelineData, setTimelineData] = useState<TimelineDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingScores, setLoadingScores] = useState(false);

  useEffect(() => {
    function loadMockData() {
      setTimeout(() => {
        setHypotheses(MOCK_HYPOTHESES);
        setSelectedHypothesisId(MOCK_HYPOTHESES[0].id);
        setLoading(false);
      }, 500);
    }
    loadMockData();
  }, []);

  useEffect(() => {
    if (!selectedHypothesisId) return;

    function loadMockScores() {
      setLoadingScores(true);
      setTimeout(() => {
        const hypothesisScores = selectedHypothesisId ? MOCK_SCORES[selectedHypothesisId] || [] : [];
        
        const sortedScores = [...hypothesisScores].sort((a, b) => {
          return new Date(b.published_date).getTime() - new Date(a.published_date).getTime();
        });
        
        setScores(sortedScores);

        const processedData = hypothesisScores.map(score => {
          let combinedScore = 0;
          
          if (score.paper_credibility_score && score.argument_credibility_score) {
            combinedScore = score.paper_credibility_score * score.argument_credibility_score;
            
            if (score.verdict === 'reject') {
              combinedScore = -combinedScore;
            }
            
            if (score.verdict === 'neutral') {
              combinedScore = 0;
            }
          }
          
          const date = new Date(score.published_date).getTime();
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
            fill: color
          };
        });
        
        const sortedTimelineData = processedData.sort((a, b) => a.date - b.date);
        setTimelineData(sortedTimelineData);
        setLoadingScores(false);
      }, 700);
    }

    loadMockScores();
  }, [selectedHypothesisId]);

  const handleHypothesisChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedHypothesisId(Number(event.target.value));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getVerdictColor = (verdict: 'support' | 'reject' | 'neutral'): string => {
    switch (verdict) {
      case 'support':
        return '#10b981';
      case 'reject':
        return '#ef4444';
      case 'neutral':
        return '#6b7280';
      default:
        return '#9ca3af';
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 border border-accent-200 rounded-lg shadow-large text-sm max-w-sm">
          <div className="font-semibold text-primary-900 mb-2 line-clamp-2">{data.title}</div>
          <div className="text-primary-700 mb-2">{data.journal} ({data.dateStr})</div>
          <div className="space-y-1 mb-3">
            <div className="text-primary-600 text-xs">Paper Credibility: {(data.paperScore ?? 0).toFixed(2)}</div>
            <div className="text-primary-600 text-xs">Argument Credibility: {(data.argumentScore ?? 0).toFixed(2)}</div>
          </div>
          <div className="flex items-center space-x-2 mb-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: data.fill }}
            ></div>
            <span className={`font-medium text-sm capitalize ${
              data.verdict === 'support' ? 'text-success-600' : 
              data.verdict === 'reject' ? 'text-danger-600' : 
              'text-neutral-600'
            }`}>
              {data.verdict}
            </span>
          </div>
          {data.reason && (
            <div className="text-primary-600 text-xs mt-2 pt-2 border-t border-accent-200 line-clamp-3">
              {data.reason}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <section className="mt-6 animate-slide-up">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-primary-900">Current Open Questions</h2>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-accent-200 border-t-accent-500 rounded-full animate-spin"></div>
            <div className="text-sm text-primary-600 font-medium">Loading...</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6 animate-slide-up">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-primary-900">Current Open Questions</h2>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-primary-700">Hypothesis:</label>
          <select 
            value={selectedHypothesisId || ''} 
            onChange={handleHypothesisChange}
            className="text-sm border border-accent-300 rounded px-3 py-1.5 bg-white/80 backdrop-blur-sm text-primary-700 focus:outline-none focus:ring-1 focus:ring-accent-500 focus:border-accent-500 transition-all duration-200 hover:bg-white/90 min-w-[280px]"
            disabled={loading}
          >
            {hypotheses.length > 0 ? (
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
      </div>

      {/* Chart and analysis content */}
      {selectedHypothesisId && (
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-large border border-white/60 px-4 pt-4 pb-0 hover:shadow-glow transition-all duration-300 hover:bg-white/90">
          {loadingScores ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-accent-200 border-t-accent-500 rounded-full animate-spin mx-auto mb-3"></div>
              <div className="text-primary-600 font-medium text-sm">Loading hypothesis data...</div>
            </div>
          ) : scores.length > 0 ? (
            <div className="timeline-container">
              <div className="text-center mb-3">
                <h4 className="text-base font-semibold text-primary-900 mb-2">
                  {hypotheses.find(h => h.id === selectedHypothesisId)?.text}
                </h4>
              </div>
              
              {/* Compact Legend */}
              <div className="timeline-legend mb-3">
                <div className="flex justify-center space-x-6">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10b981' }}></div>
                    <span className="text-xs font-medium text-success-600">Support</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#ef4444' }}></div>
                    <span className="text-xs font-medium text-danger-600">Reject</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#6b7280' }}></div>
                    <span className="text-xs font-medium text-neutral-600">Neutral</span>
                  </div>
                </div>
              </div>
              <div className="timeline-chart" style={{ height: '220px' }}>
                                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                      margin={{ top: 15, right: 30, bottom: 25, left: 50 }}
                    >
                    <CartesianGrid strokeDasharray="2 2" stroke="#e2e8f0" strokeWidth={1} />
                    <XAxis
                      dataKey="date"
                      name="Date"
                      domain={['dataMin', 'dataMax']}
                      tickFormatter={(unixTime) => new Date(unixTime).toLocaleDateString('en-US', { year: 'numeric' })}
                      type="number"
                      label={{ 
                        value: 'Publication Date', 
                        position: 'insideBottom', 
                        offset: -15,
                        style: { fontSize: '12px', fill: '#64748b', fontWeight: 500 }
                      }}
                      fontSize={12}
                      tick={{ fontSize: 12, fill: '#475569' }}
                      axisLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                      tickLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                    />
                    <YAxis
                      dataKey="score"
                      name="Score"
                      domain={[-1, 1]}
                      ticks={[-1, -0.5, 0, 0.5, 1]}
                      tickFormatter={(value) => value === 0 ? '0' : value.toString()}
                      label={{ 
                        value: 'Confirmation Strength', 
                        angle: -90, 
                        position: 'outside', 
                        textAnchor: 'middle', 
                        dx: -35,
                        style: { fontSize: '12px', fill: '#64748b', fontWeight: 500 }
                      }}
                      fontSize={12}
                      tick={{ fontSize: 12, fill: '#475569' }}
                      axisLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                      tickLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="2 2" strokeWidth={1} />
                    <ZAxis range={[80, 80]} />
                    <Scatter
                      data={timelineData}
                      fillOpacity={0.8}
                      strokeWidth={1}
                      strokeOpacity={0.9}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-600">No scores available for this hypothesis.</div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default CurrentOpenQuestions; 