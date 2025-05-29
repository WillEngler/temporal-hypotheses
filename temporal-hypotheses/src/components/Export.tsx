import React, { useState } from 'react';
import supabase from '../services/supabase';

// Interface matching the database schema
interface PaperData {
  paper_id: string;
  title: string;
  authors?: string;
  published_date?: string;
  output?: any; // JSON field containing materials data
  domain: string;
  processed: boolean;
  screened: boolean;
  screen_passed: boolean;
}

// Helper function to flatten JSON similar to the Python script
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

// Function to convert data to CSV
const convertToCSV = (data: any[]): string => {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const cell = row[header];
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (cell === null || cell === undefined) return '';
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    )
  ].join('\n');
  
  return csvContent;
};

// Function to trigger download
const downloadCSV = (csvContent: string, filename: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    alert('CSV download not supported by your browser.');
  }
};

const Export: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [exportStatus, setExportStatus] = useState<string>('');

  const exportSuperconductorsCSV = async () => {
    try {
      setLoading(true);
      setExportStatus('Querying database...');

      // Query papers from superconductors domain that are processed and screened
      const { data: papers, error } = await supabase
        .from('papers')
        .select('paper_id, title, authors, published_date, output, domain, processed, screened, screen_passed')
        .eq('domain', 'superconductors')
        .eq('processed', true)
        .eq('screened', true)
        .eq('screen_passed', true)
        .not('output', 'is', null);

      if (error) {
        throw error;
      }

      if (!papers || papers.length === 0) {
        setExportStatus('No data found for superconductors domain.');
        return;
      }

      setExportStatus(`Processing ${papers.length} papers...`);

      // Fields to keep as JSON strings (similar to Python script)
      const keepAsJson = [
        'material_composition',
        'material_atom_sites',
      ];

      // Process papers and create rows for each material
      const csvData: any[] = [];

      papers.forEach((paper: PaperData) => {
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
            const materialRow = { ...paperInfo };
            
            // Flatten the material data
            if (material && typeof material === 'object') {
              const flattened = flattenJson(material, '', keepAsJson);
              Object.assign(materialRow, flattened);
            }
            
            csvData.push(materialRow);
          });
        } else {
          // If no materials array, include paper without material data
          csvData.push(paperInfo);
        }
      });

      setExportStatus(`Generating CSV for ${csvData.length} material entries...`);

      // Convert to CSV and download
      const csvContent = convertToCSV(csvData);
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `superconductors_export_${timestamp}.csv`;
      
      downloadCSV(csvContent, filename);
      
      setExportStatus(`Successfully exported ${csvData.length} entries to ${filename}`);
      
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header following the same pattern as SuperconductorsDomain */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900 to-primary-800"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-accent-400 rounded-full animate-glow"></div>
                <span className="text-accent-300 font-medium text-xs tracking-wide uppercase leading-none">Data Export</span>
              </div>
              <h1 className="text-xl font-semibold text-white leading-none">
                Export Research Data
              </h1>
            </div>
            <div className="flex items-center space-x-4 text-sm leading-none">
              <div className="text-white/90 leading-none"><span className="font-bold text-white">Multiple</span> formats available</div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-large border border-white/60 p-8">
          <h2 className="text-2xl font-semibold text-primary-900 mb-4">Export Options</h2>
          <p className="text-primary-700 mb-6">
            Export processed and screened research data from the superconductors domain in various formats.
          </p>
          
          {/* Status Display */}
          {exportStatus && (
            <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
              <div className="flex items-center space-x-2">
                {loading && (
                  <div className="w-4 h-4 border-2 border-accent-200 border-t-accent-500 rounded-full animate-spin"></div>
                )}
                <span className="text-primary-700 text-sm">{exportStatus}</span>
              </div>
            </div>
          )}
          
          {/* Export Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border border-primary-200 rounded-lg p-6 bg-primary-50/50">
              <h3 className="text-lg font-semibold text-primary-900 mb-2">Superconductors CSV Export</h3>
              <p className="text-primary-600 text-sm mb-4">Export flattened superconductors research data with one row per material</p>
              <button 
                className="px-4 py-2 bg-accent-500 text-white rounded hover:bg-accent-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                onClick={exportSuperconductorsCSV}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Exporting...</span>
                  </>
                ) : (
                  <span>Export CSV</span>
                )}
              </button>
            </div>
            
            <div className="border border-primary-200 rounded-lg p-6 bg-primary-50/50">
              <h3 className="text-lg font-semibold text-primary-900 mb-2">JSON Export</h3>
              <p className="text-primary-600 text-sm mb-4">Export structured data in JSON format</p>
              <button 
                className="px-4 py-2 bg-accent-500 text-white rounded hover:bg-accent-600 transition-colors disabled:opacity-50"
                disabled
              >
                Coming Soon
              </button>
            </div>
            
            <div className="border border-primary-200 rounded-lg p-6 bg-primary-50/50">
              <h3 className="text-lg font-semibold text-primary-900 mb-2">Report Export</h3>
              <p className="text-primary-600 text-sm mb-4">Generate comprehensive analysis reports</p>
              <button 
                className="px-4 py-2 bg-accent-500 text-white rounded hover:bg-accent-600 transition-colors disabled:opacity-50"
                disabled
              >
                Coming Soon
              </button>
            </div>
          </div>
          
          {/* Additional Information */}
          <div className="mt-8 p-4 bg-accent-50 border border-accent-200 rounded-lg">
            <h4 className="text-sm font-semibold text-accent-900 mb-2">Export Details</h4>
            <ul className="text-xs text-accent-700 space-y-1">
              <li>• Only includes processed, screened, and approved papers</li>
              <li>• Each material from a paper's output becomes a separate row</li>
              <li>• Complex JSON fields are flattened with underscore notation</li>
              <li>• Material composition and atom sites are kept as JSON strings</li>
              <li>• Export includes paper metadata (ID, title, authors, publication date)</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Export; 