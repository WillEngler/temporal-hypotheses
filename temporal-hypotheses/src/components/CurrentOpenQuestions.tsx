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
import { MOCK_HYPOTHESES, MOCK_SCORES } from './HypothesisData';
import type { Hypothesis, HypothesisScore } from './HypothesisData';
import './MultipleHypotheses.css';



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


const CurrentOpenQuestions: React.FC = () => {
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [selectedHypothesisId, setSelectedHypothesisId] = useState<number | null>(null);
  const [scores, setScores] = useState<HypothesisScore[]>([]);
  const [timelineData, setTimelineData] = useState<TimelineDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingScores, setLoadingScores] = useState(false);
  const [showNeutralPoints, setShowNeutralPoints] = useState(false);

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

  const truncateText = (text: string, maxLength: number = 45): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  const getDateTickFormatter = (data: TimelineDataPoint[]) => {
    if (data.length === 0) return (unixTime: number) => new Date(unixTime).toLocaleDateString('en-US', { year: 'numeric' });
    
    const dates = data.map(d => d.date);
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const rangeInDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);
    
    // If range is less than 2 years, show month-year format
    if (rangeInDays < 730) {
      return (unixTime: number) => new Date(unixTime).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    }
    
    // Otherwise, show just year
    return (unixTime: number) => new Date(unixTime).toLocaleDateString('en-US', { year: 'numeric' });
  };

  // Filter data based on neutral point visibility
  const filteredTimelineData = showNeutralPoints 
    ? timelineData 
    : timelineData.filter(point => point.verdict !== 'neutral');

  // Calculate stable domain boundaries from full dataset
  const getStableDomains = () => {
    if (timelineData.length === 0) return { dateRange: [0, 1], scoreRange: [-1, 1] };
    
    const dates = timelineData.map(d => d.date);
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    
    // Add padding to date range (5% on each side)
    const dateRange = maxDate - minDate;
    const datePadding = dateRange * 0.05;
    
    return {
      dateRange: [minDate - datePadding, maxDate + datePadding],
      scoreRange: [-1, 1] // Keep score range fixed
    };
  };

  const { dateRange, scoreRange } = getStableDomains();

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
                  {truncateText(hypothesis.text)}
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
              
              {/* Legend */}
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
              
              {/* Chart Controls */}
              <div className="flex justify-end mb-3 pb-2 border-b border-accent-200/50">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-primary-600">Filter:</span>
                  <label className="flex items-center space-x-1.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={showNeutralPoints}
                      onChange={(e) => setShowNeutralPoints(e.target.checked)}
                      className="w-3 h-3 text-accent-500 bg-white/80 border border-accent-300 rounded focus:ring-accent-500 focus:ring-1 transition-all duration-200"
                    />
                    <span className="text-xs font-medium text-primary-700 group-hover:text-primary-900 transition-colors duration-200">
                      Show neutral
                    </span>
                  </label>
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
                      domain={dateRange}
                      tickFormatter={getDateTickFormatter(timelineData)}
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
                      domain={scoreRange}
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
                      data={filteredTimelineData}
                      fillOpacity={0.8}
                      strokeWidth={1}
                      strokeOpacity={0.9}
                      isAnimationActive={false}
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