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
import superconductorData from './SuperconductorData';

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

  // Handle dot click to open paper
  const handleDotClick = (data: any) => {
    if (data?.paper_id) {
      const url = getPaperUrl(data.paper_id);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  useEffect(() => {
    const processData = () => {
      const processedData = (superconductorData as any[]).map(item => {
        // Extract oxygen percentage by atoms
        let oxygenPercentage: number | undefined = undefined;
        if (item.material_composition) {
          try {
            const comp = JSON.parse(item.material_composition);
            if (comp && typeof comp === 'object' && comp['O']) {
              // Calculate oxygen percentage by atoms
              let totalAtoms = 0;
              for (const element in comp) {
                totalAtoms += parseFloat(comp[element]);
              }
              oxygenPercentage = parseFloat(((parseFloat(comp['O']) / totalAtoms) * 100).toFixed(1));
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
        return {
          material_composition: item.material_composition,
          material_lattice_parameters_a: Number(item.material_lattice_parameters_a),
          material_lattice_parameters_c: Number(item.material_lattice_parameters_c),
          properties_critical_temperature: Number(item.properties_critical_temperature),
          oxygen_percentage: oxygenPercentage,
          paper_id: item.paper_id,
          title: item.title,
          published_date: item.published_date
        };
      }).filter(item =>
        !isNaN(item.properties_critical_temperature) &&
        item.properties_critical_temperature > 0 &&
        !isNaN(item.material_lattice_parameters_a) &&
        !isNaN(item.material_lattice_parameters_c)
      );
      setData(processedData);
      setLoading(false);
    };
    processData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading superconductor data...</div>
      </div>
    );
  }

  // Filter data for cuprates (materials containing Cu and O)
  const cuprateData = data.filter(item =>
    item.material_composition?.includes('Cu') &&
    item.material_composition?.includes('O') &&
    item.oxygen_percentage !== undefined
  );

  // Create example temperature ranges for the legend
  const tempRanges = [0, 30, 60, 90, 120, 150];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Header */}
      <header className="bg-white border-b border-gray-200 py-3 pb-2">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-xl text-gray-700 font-normal">
            <span className="font-bold text-gray-900">662</span> Superconductor research papers and spec sheets analyzed
          </h1>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto px-4 py-5">
        {/* Key Recent Findings Section with inline link */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Key Recent Findings</h2>
            <button 
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors duration-200 cursor-pointer rounded"
              onClick={() => {
                // Potemkin link - doesn't go anywhere
                console.log('See more KPIs clicked - Potemkin link');
              }}
            >
              See more KPIs linked to experimental data
              <svg className="ml-1 w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {/* Chart 1: Oxygen Content vs Critical Temperature */}
            <div className="bg-white rounded border border-gray-200 p-4">
              <h3 className="text-base font-medium text-gray-900 mb-3">
                Oxygen Content vs Critical Temperature for Cuprates
              </h3>
              <div className="flex justify-start mb-3">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                  <span className="text-sm text-gray-600">Cuprates</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 45, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    type="number"
                    dataKey="oxygen_percentage"
                    name="Oxygen Percentage"
                    label={{ value: 'Oxygen Percentage', position: 'bottom', dy: 20 }}
                    fontSize={11}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="properties_critical_temperature"
                    name="Critical Temperature (K)"
                    label={{ value: 'Critical Temperature (K)', angle: -90, position: 'insideLeft' }}
                    fontSize={11}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-2 border border-gray-300 rounded shadow text-xs">
                            <p>{`O₂: ${data.oxygen_percentage?.toFixed(1)}%`}</p>
                            <p>{`Tc: ${data.properties_critical_temperature.toFixed(1)} K`}</p>
                            <p className="text-gray-500">{extractYear(data.published_date)}</p>
                            <p className="text-blue-600">Click to open paper</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter
                    name="Cuprates"
                    data={cuprateData}
                    fill="#3b82f6"
                    onClick={handleDotClick}
                    cursor="pointer"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Chart 2: Lattice Parameters vs Critical Temperature */}
            <div className="bg-white rounded border border-gray-200 p-4">
              <h3 className="text-base font-medium text-gray-900 mb-3">
                Lattice Parameters vs Critical Temperature
              </h3>
              <div className="mb-3">
                <div className="text-xs font-medium text-gray-700 mb-1">Critical Temperature (K)</div>
                <div className="flex items-center space-x-1">
                  {tempRanges.map((temp, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div 
                        className="w-2.5 h-2.5 border border-gray-300"
                        style={{ backgroundColor: getTemperatureColor(temp) }}
                      ></div>
                      <span className="text-xs text-gray-600 mt-0.5">{temp}</span>
                    </div>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 45, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    type="number"
                    dataKey="material_lattice_parameters_a"
                    name="Lattice Parameter a (Å)"
                    label={{ value: 'Lattice Parameter a (Å)', position: 'bottom', dy: 20 }}
                    fontSize={11}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="material_lattice_parameters_c"
                    name="Lattice Parameter c (Å)"
                    label={{ value: 'Lattice Parameter c (Å)', angle: -90, position: 'insideLeft' }}
                    fontSize={11}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-2 border border-gray-300 rounded shadow text-xs">
                            <p>{`a: ${data.material_lattice_parameters_a.toFixed(3)} Å`}</p>
                            <p>{`c: ${data.material_lattice_parameters_c.toFixed(3)} Å`}</p>
                            <p>{`Tc: ${data.properties_critical_temperature.toFixed(1)} K`}</p>
                            <p className="text-gray-500">{extractYear(data.published_date)}</p>
                            <p className="text-blue-600">Click to open paper</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter
                    name="Materials"
                    data={data}
                    onClick={handleDotClick}
                    cursor="pointer"
                  >
                    {data.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getTemperatureColor(entry.properties_critical_temperature)}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SuperconductorsDomain; 