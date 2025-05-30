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
import './SuperconductorAnalysis.css';

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

// Color scale function for temperature
const getTemperatureColor = (temp: number): string => {
  // Define color ranges from blue (cold/low Tc) to red (hot/high Tc)
  const minTemp = 0;
  const maxTemp = 150; // Adjust based on your data
  
  // Normalize temperature to 0-1 range
  const normalizedTemp = Math.min(Math.max((temp - minTemp) / (maxTemp - minTemp), 0), 1);
  
  // RGB interpolation from blue to red
  const r = Math.floor(normalizedTemp * 255);
  const b = Math.floor((1 - normalizedTemp) * 255);
  const g = Math.floor(Math.min(normalizedTemp, 1-normalizedTemp) * 150);
  
  return `rgb(${r}, ${g}, ${b})`;
};

// Function to get paper URL from paper_id
const getPaperUrl = (paperId: string): string => {
  // Check if it's an arXiv ID
  if (paperId.includes('v')) {
    const baseId = paperId.split('v')[0];
    return `https://arxiv.org/abs/${baseId}`;
  }
  // Check if it's a DOI
  if (paperId.includes('/')) {
    return `https://doi.org/${paperId}`;
  }
  // Default to searching by ID
  return `https://scholar.google.com/scholar?q=${paperId}`;
};

// Extract year from date string
const extractYear = (dateStr: string): string => {
  if (!dateStr) return 'Unknown';
  try {
    return dateStr.substring(0, 4);
  } catch (e) {
    return 'Unknown';
  }
};

const SuperconductorAnalysis: React.FC = () => {
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
              // Flatten the material data
              let flattened: Record<string, any> = {};
              if (material && typeof material === 'object') {
                flattened = flattenJson(material, '', keepAsJson);
              }

              // Create the data row by merging paper info and flattened material data
              const materialRow: any = { ...paperInfo, ...flattened };

              // Extract oxygen percentage by atoms
              let oxygenPercentage: number | undefined = undefined;
              if (materialRow.material_composition) {
                try {
                  const comp = typeof materialRow.material_composition === 'string' 
                    ? JSON.parse(materialRow.material_composition)
                    : materialRow.material_composition;
                  
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

              // Create the final data point
              const dataPoint: SuperconductorData = {
                material_composition: materialRow.material_composition || '',
                material_lattice_parameters_a: Number(materialRow.material_lattice_parameters_a) || NaN,
                material_lattice_parameters_c: Number(materialRow.material_lattice_parameters_c) || NaN,
                properties_critical_temperature: Number(materialRow.properties_critical_temperature) || NaN,
                oxygen_percentage: oxygenPercentage,
                paper_id: materialRow.paper_id,
                title: materialRow.title,
                published_date: materialRow.published_date
              };

              // Only include if we have valid critical temperature and lattice parameters
              if (!isNaN(dataPoint.properties_critical_temperature) &&
                  dataPoint.properties_critical_temperature > 0 &&
                  !isNaN(dataPoint.material_lattice_parameters_a) &&
                  !isNaN(dataPoint.material_lattice_parameters_c)) {
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
    return <div>Loading superconductor data from database...</div>;
  }

  if (error) {
    return <div>Error loading data: {error}</div>;
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
    <div className="superconductor-analysis">
      <h2>Superconductor Analysis</h2>
      <div className="chart-container">
        <h3>Oxygen Content vs Critical Temperature for Cuprates</h3>
        <div className="simple-legend">
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#8884d8' }}></div>
            <span>Cuprates</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 30, bottom: 60, left: 20 }}>
            <CartesianGrid />
            <XAxis
              type="number"
              dataKey="oxygen_percentage"
              name="Oxygen Percentage"
              label={{ value: 'Oxygen Percentage', position: 'bottom', dy: 30 }}
            />
            <YAxis
              type="number"
              dataKey="properties_critical_temperature"
              name="Critical Temperature (K)"
              label={{ value: 'Critical Temperature (K)', angle: -90, position: 'left' }}
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="custom-tooltip">
                      <p>{`Oxygen Percentage: ${data.oxygen_percentage?.toFixed(1)}%`}</p>
                      <p>{`Critical Temperature: ${data.properties_critical_temperature.toFixed(1)} K`}</p>
                      <p className="paper-info">{`Year: ${extractYear(data.published_date)}`}</p>
                      <p className="paper-title">{`Title: ${data.title?.substring(0, 60)}${data.title?.length > 60 ? '...' : ''}`}</p>
                      <p className="click-hint">Click to open paper</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter
              name="Cuprates"
              data={cuprateData}
              fill="#8884d8"
              onClick={handleDotClick}
              cursor="pointer"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-container">
        <h3>Lattice Parameters vs Critical Temperature</h3>
        <div className="temp-legend">
          <div className="legend-title">Critical Temperature (K)</div>
          <div className="color-scale">
            {tempRanges.map((temp, i) => (
              <div key={i} className="color-indicator">
                <div 
                  className="color-box" 
                  style={{ backgroundColor: getTemperatureColor(temp) }}
                ></div>
                <span>{temp}</span>
              </div>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 30, bottom: 60, left: 20 }}>
            <CartesianGrid />
            <XAxis
              type="number"
              dataKey="material_lattice_parameters_a"
              name="Lattice Parameter a (Å)"
              label={{ value: 'Lattice Parameter a (Å)', position: 'bottom', dy: 30 }}
            />
            <YAxis
              type="number"
              dataKey="material_lattice_parameters_c"
              name="Lattice Parameter c (Å)"
              label={{ value: 'Lattice Parameter c (Å)', angle: -90, position: 'left' }}
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="custom-tooltip">
                      <p>{`Lattice a: ${data.material_lattice_parameters_a.toFixed(3)} Å`}</p>
                      <p>{`Lattice c: ${data.material_lattice_parameters_c.toFixed(3)} Å`}</p>
                      <p>{`Critical Temperature: ${data.properties_critical_temperature.toFixed(1)} K`}</p>
                      <p className="paper-info">{`Year: ${extractYear(data.published_date)}`}</p>
                      <p className="paper-title">{`Title: ${data.title?.substring(0, 60)}${data.title?.length > 60 ? '...' : ''}`}</p>
                      <p className="click-hint">Click to open paper</p>
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
  );
};

export default SuperconductorAnalysis; 