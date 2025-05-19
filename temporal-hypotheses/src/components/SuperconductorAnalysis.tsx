import React, { useState, useEffect } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import superconductorData from './SuperconductorData';
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
        // Extract oxygen percentage from JSON string in material_composition
        let oxygenPercentage: number | undefined = undefined;
        if (item.material_composition) {
          try {
            const comp = JSON.parse(item.material_composition);
            if (comp && typeof comp === 'object' && comp['O']) {
              oxygenPercentage = parseFloat(comp['O']);
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
    return <div>Loading...</div>;
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
                      <p>{`Oxygen Percentage: ${data.oxygen_percentage}`}</p>
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