import React, { useState, useEffect } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import superconductorData from './SuperconductorData';
import './SuperconductorAnalysis.css';

interface SuperconductorData {
  material_composition: string;
  material_lattice_parameters_a: number;
  material_lattice_parameters_c: number;
  properties_critical_temperature: number;
  oxygen_percentage?: number;
}

const SuperconductorAnalysis: React.FC = () => {
  const [data, setData] = useState<SuperconductorData[]>([]);
  const [loading, setLoading] = useState(true);

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
          oxygen_percentage: oxygenPercentage
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

  return (
    <div className="superconductor-analysis">
      <h2>Superconductor Analysis</h2>
      <div className="chart-container">
        <h3>Oxygen Content vs Critical Temperature for Cuprates</h3>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid />
            <XAxis
              type="number"
              dataKey="oxygen_percentage"
              name="Oxygen Percentage"
              label={{ value: 'Oxygen Percentage', position: 'bottom' }}
            />
            <YAxis
              type="number"
              dataKey="properties_critical_temperature"
              name="Critical Temperature (K)"
              label={{ value: 'Critical Temperature (K)', angle: -90, position: 'left' }}
            />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Legend />
            <Scatter
              name="Cuprates"
              data={cuprateData}
              fill="#8884d8"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-container">
        <h3>Lattice Parameters vs Critical Temperature</h3>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid />
            <XAxis
              type="number"
              dataKey="material_lattice_parameters_a"
              name="Lattice Parameter a (Å)"
              label={{ value: 'Lattice Parameter a (Å)', position: 'bottom' }}
            />
            <YAxis
              type="number"
              dataKey="material_lattice_parameters_c"
              name="Lattice Parameter c (Å)"
              label={{ value: 'Lattice Parameter c (Å)', angle: -90, position: 'left' }}
            />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Legend />
            <Scatter
              name="All Materials"
              data={data}
              fill="#82ca9d"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SuperconductorAnalysis; 