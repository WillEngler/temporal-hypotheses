import React, { useState, useEffect } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import supabase from '../services/supabase';
import CurrentOpenQuestions from './CurrentOpenQuestions';

interface SuperconductorData {
  material_composition: string;
  material_lattice_parameters_a: number;
  material_lattice_parameters_c: number;
  properties_critical_temperature: number;
  oxygen_percentage?: number;
  paper_id: string;
  title: string;
  published_date: string;
}

// Helper function to flatten JSON similar to the Export component
const flattenJson = (data: any, prefix: string = '', keepAsJson: string[] = []): Record<string, any> => {
  const flattened: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    const newKey = prefix ? `${prefix}_${key}` : key;
    
    // Check if this field should be kept as JSON
    if (keepAsJson.includes(newKey) || keepAsJson.includes(key)) {
      flattened[newKey] = JSON.stringify(value);
      continue;
    }
    
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(flattened, flattenJson(value, newKey, keepAsJson));
    } else if (Array.isArray(value)) {
      flattened[newKey] = JSON.stringify(value);
    } else {
      flattened[newKey] = value;
    }
  }
  
  return flattened;
};

// Helper function to extract year from published_date
const extractYear = (dateString: string): string => {
  if (!dateString) return 'Unknown';
  const match = dateString.match(/(\d{4})/);
  return match ? match[1] : 'Unknown';
};

// Helper function to get paper URL
const getPaperUrl = (paperId: string): string => {
  if (paperId.includes('arXiv') || paperId.includes('arxiv')) {
    const arxivId = paperId.replace(/^.*arXiv[:\.]?/i, '').replace(/v\d+$/, '');
    return `https://arxiv.org/abs/${arxivId}`;
  }
  return `https://doi.org/${paperId}`;
};

// Color scale function for temperature
const getTemperatureColor = (temp: number): string => {
  const minTemp = 0;
  const maxTemp = 150;
  const normalizedTemp = Math.min(Math.max((temp - minTemp) / (maxTemp - minTemp), 0), 1);
  const r = Math.floor(normalizedTemp * 255);
  const b = Math.floor((1 - normalizedTemp) * 255);
  const g = Math.floor(Math.min(normalizedTemp, 1-normalizedTemp) * 150);
  return `rgb(${r}, ${g}, ${b})`;
};

const SuperconductorsDomain: React.FC = () => {
  const [data, setData] = useState<SuperconductorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle dot click to open paper
  const handleDotClick = (data: any) => {
    if (data?.paper_id) {
      const url = getPaperUrl(data.paper_id);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  useEffect(() => {
    const fetchSuperconductorData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Query papers from superconductors domain that are processed and screened
        const { data: papers, error: supabaseError } = await supabase
          .from('papers')
          .select('paper_id, title, authors, published_date, output, domain, processed, screened, screen_passed')
          .eq('domain', 'superconductors')
          .eq('processed', true)
          .eq('screened', true)
          .eq('screen_passed', true)
          .not('output', 'is', null);

        if (supabaseError) {
          throw supabaseError;
        }

        if (!papers || papers.length === 0) {
          setData([]);
          setLoading(false);
          return;
        }

        // Fields to keep as JSON strings (similar to Export component)
        const keepAsJson = [
          'material_composition',
          'material_atom_sites',
        ];

        // Process papers and create rows for each material
        const processedData: SuperconductorData[] = [];

        papers.forEach((paper: any) => {
          // Basic paper info
          const paperInfo = {
            paper_id: paper.paper_id,
            title: paper.title,
            authors: paper.authors || '',
            published_date: paper.published_date || '',
          };

          // Get materials from output
          const materials = paper.output?.materials || [];
          
          if (Array.isArray(materials) && materials.length > 0) {
            materials.forEach((material: any) => {
              // Extract composition and calculate oxygen percentage BEFORE flattening
              const originalComposition = material.composition;
              let oxygenPercentage: number | undefined = undefined;
              if (originalComposition && typeof originalComposition === 'object' && originalComposition['O']) {
                try {
                  // Calculate oxygen percentage by atoms
                  let totalAtoms = 0;
                  for (const element in originalComposition) {
                    totalAtoms += parseFloat(originalComposition[element]);
                  }
                  oxygenPercentage = parseFloat(((parseFloat(originalComposition['O']) / totalAtoms) * 100).toFixed(1));
                } catch (e) {
                  // Ignore parse errors
                }
              }
              
              // Flatten the material data
              let flattened: Record<string, any> = {};
              if (material && typeof material === 'object') {
                flattened = flattenJson(material, '', keepAsJson);
              }

              // Create the data row by merging paper info and flattened material data
              const materialRow: any = { ...paperInfo, ...flattened };

              // Create the final data point
              const dataPoint: SuperconductorData = {
                material_composition: originalComposition ? JSON.stringify(originalComposition) : '',
                material_lattice_parameters_a: Number(materialRow.lattice_parameters_a) || NaN,
                material_lattice_parameters_c: Number(materialRow.lattice_parameters_c) || NaN,
                properties_critical_temperature: Number(materialRow.properties_critical_temperature) || NaN,
                oxygen_percentage: oxygenPercentage,
                paper_id: materialRow.paper_id,
                title: materialRow.title,
                published_date: materialRow.published_date
              };

              // Include any material that has at least some useful data
              // Let individual charts filter for their specific needs
              const hasCriticalTemp = !isNaN(dataPoint.properties_critical_temperature) && dataPoint.properties_critical_temperature > 0;
              const hasLatticeParams = !isNaN(dataPoint.material_lattice_parameters_a) && !isNaN(dataPoint.material_lattice_parameters_c);
              const hasComposition = originalComposition && typeof originalComposition === 'object';

              if (hasCriticalTemp || hasLatticeParams || hasComposition) {
                processedData.push(dataPoint);
              }
            });
          }
        });

        setData(processedData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching superconductor data:', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        setLoading(false);
      }
    };

    fetchSuperconductorData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading superconductor data from database...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-red-600">Error loading data: {error}</div>
      </div>
    );
  }

  // Filter data for cuprates (materials containing Cu and O)
  const cuprateData = data.filter(item => {
    try {
      const comp = JSON.parse(item.material_composition);
      return comp && 
             comp['Cu'] && 
             comp['O'] &&
             item.oxygen_percentage !== undefined &&
             !isNaN(item.properties_critical_temperature) &&
             item.properties_critical_temperature > 0;
    } catch (e) {
      return false;
    }
  });

  // Filter data for lattice parameter chart (needs both a and c parameters)
  const latticeData = data.filter(item =>
    !isNaN(item.material_lattice_parameters_a) &&
    !isNaN(item.material_lattice_parameters_c) &&
    !isNaN(item.properties_critical_temperature) &&
    item.properties_critical_temperature > 0
  );

  // Create example temperature ranges for the legend
  const tempRanges = [0, 30, 60, 90, 120, 150];

  return (
    <div className="min-h-screen">
      {/* Compact Enhanced Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900 to-primary-800"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-accent-400 rounded-full animate-glow"></div>
                <span className="text-accent-300 font-medium text-xs tracking-wide uppercase leading-none">Research Analysis</span>
              </div>
              <h1 className="text-xl font-semibold text-white leading-none flex items-baseline">
                <span className="text-2xl font-bold leading-none">{data.length}</span>
                <span className="ml-1">superconductor research papers analyzed</span>
              </h1>
            </div>
            <div className="flex items-center space-x-4 text-sm leading-none">
              {/* <div className="text-white/90 leading-none"><span className="font-bold text-white">50+</span> KPIs tracked</div>
              <div className="text-white/90 leading-none"><span className="font-bold text-white">15+</span> material classes</div> */}
              <div className="text-white/90 leading-none"><span className="font-bold text-white">2020-2024</span> publication years</div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-6 py-4">
        {/* Key Recent Findings Section */}
        <section className="animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-primary-900">Key Recent Findings</h2>
            <a 
              href="#"
              className="group text-sm text-accent-600 hover:text-accent-700 flex items-center space-x-1 transition-all duration-200"
              onClick={(e) => {
                e.preventDefault();
                console.log('See more KPIs clicked - Potemkin link');
              }}
            >
              <span>See more KPIs linked to experimental data</span>
              <svg className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Chart 1: Oxygen Content vs Critical Temperature */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-large border border-white/60 p-4 hover:shadow-glow transition-all duration-300 hover:bg-white/90">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-primary-900">
                  Oxygen Content vs Critical Temperature
                </h3>
                <div className="flex items-center space-x-1 text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded">
                  <div className="w-1.5 h-1.5 bg-accent-500 rounded-full"></div>
                  <span>Cuprates</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart margin={{ top: 15, right: 50, bottom: 40, left: 35 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#e2e8f0" strokeWidth={1} />
                  <XAxis
                    type="number"
                    dataKey="oxygen_percentage"
                    name="Oxygen Percentage"
                    label={{ 
                      value: 'Oxygen Percentage (%)', 
                      position: 'bottom', 
                      dy: 15,
                      style: { fontSize: '12px', fill: '#64748b', fontWeight: 500 }
                    }}
                    fontSize={12}
                    tick={{ fontSize: 12, fill: '#475569' }}
                    axisLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                    tickLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="properties_critical_temperature"
                    name="Critical Temperature (K)"
                    label={{ 
                      value: 'Critical Temperature (K)', 
                      angle: -90, 
                      position: 'outside', 
                      textAnchor: 'middle', 
                      dx: -25,
                      style: { fontSize: '12px', fill: '#64748b', fontWeight: 500 }
                    }}
                    fontSize={12}
                    tick={{ fontSize: 12, fill: '#475569' }}
                    axisLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                    tickLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '2 2', stroke: '#94a3b8', strokeWidth: 1 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white/95 backdrop-blur-sm p-4 border border-accent-200 rounded-lg shadow-large text-sm">
                            <div className="font-semibold text-primary-900 mb-2">Material Properties</div>
                            <div className="space-y-1">
                              <p className="text-primary-700">{`Oxygen: ${data.oxygen_percentage?.toFixed(1)}%`}</p>
                              <p className="text-primary-700">{`Tc: ${data.properties_critical_temperature.toFixed(1)} K`}</p>
                              <p className="text-primary-500 text-xs">{extractYear(data.published_date)}</p>
                            </div>
                            <div className="mt-2 pt-2 border-t border-accent-200">
                              <p className="text-accent-600 text-xs font-medium">Click to open paper →</p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter
                    name="Cuprates"
                    data={cuprateData}
                    fill="#0ea5e9"
                    fillOpacity={0.7}
                    stroke="#0284c7"
                    strokeWidth={1}
                    onClick={handleDotClick}
                    cursor="pointer"
                    r={4}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Chart 2: Lattice Parameters vs Critical Temperature */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-large border border-white/60 p-4 hover:shadow-glow transition-all duration-300 hover:bg-white/90">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-primary-900">
                  Lattice Parameters vs Critical Temperature
                </h3>
                <div className="flex items-center space-x-1 text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded">
                  <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-red-500 rounded-full"></div>
                  <span>All Materials</span>
                </div>
              </div>
              
              {/* Compact Temperature Legend */}
              <div className="mb-3">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-xs text-primary-600 font-medium">Tc (K):</span>
                  {tempRanges.map((temp, i) => (
                    <div key={i} className="flex items-center space-x-1">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getTemperatureColor(temp) }}
                      ></div>
                      <span className="text-xs text-primary-600">{temp}</span>
                    </div>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <ScatterChart margin={{ top: 5, right: 50, bottom: 40, left: 35 }}>
                   <CartesianGrid strokeDasharray="2 2" stroke="#e2e8f0" strokeWidth={1} />
                   <XAxis
                     type="number"
                     dataKey="material_lattice_parameters_a"
                    name="Lattice Parameter a (Å)"
                    label={{ 
                      value: 'Lattice Parameter a (Å)', 
                      position: 'bottom', 
                      dy: 15,
                      style: { fontSize: '12px', fill: '#64748b', fontWeight: 500 }
                    }}
                    fontSize={12}
                    tick={{ fontSize: 12, fill: '#475569' }}
                    axisLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                    tickLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="material_lattice_parameters_c"
                    name="Lattice Parameter c (Å)"
                    label={{ 
                      value: 'Lattice Parameter c (Å)', 
                      angle: -90, 
                      position: 'outside', 
                      textAnchor: 'middle', 
                      dx: -25,
                      style: { fontSize: '12px', fill: '#64748b', fontWeight: 500 }
                    }}
                    fontSize={12}
                    tick={{ fontSize: 12, fill: '#475569' }}
                    axisLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                    tickLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '2 2', stroke: '#94a3b8', strokeWidth: 1 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white/95 backdrop-blur-sm p-4 border border-accent-200 rounded-lg shadow-large text-sm">
                            <div className="font-semibold text-primary-900 mb-2">Crystal Structure</div>
                            <div className="space-y-1">
                              <p className="text-primary-700">{`a-parameter: ${data.material_lattice_parameters_a.toFixed(3)} Å`}</p>
                              <p className="text-primary-700">{`c-parameter: ${data.material_lattice_parameters_c.toFixed(3)} Å`}</p>
                              <p className="text-primary-700">{`Tc: ${data.properties_critical_temperature.toFixed(1)} K`}</p>
                              <p className="text-primary-500 text-xs">{extractYear(data.published_date)}</p>
                            </div>
                            <div className="mt-2 pt-2 border-t border-accent-200">
                              <p className="text-accent-600 text-xs font-medium">Click to open paper →</p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter
                    name="Materials"
                    data={latticeData}
                    onClick={handleDotClick}
                    cursor="pointer"
                    strokeWidth={1}
                    strokeOpacity={0.8}
                  >
                    {latticeData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getTemperatureColor(entry.properties_critical_temperature)}
                        fillOpacity={0.7}
                        stroke="#ffffff"
                        strokeWidth={0.5}
                        r={4}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Current Open Questions Section */}
        <CurrentOpenQuestions />
      </main>
    </div>
  );
};

export default SuperconductorsDomain; 