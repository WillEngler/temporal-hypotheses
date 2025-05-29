import React, { useState } from 'react';
import supabase from '../services/supabase';

// Available domains
const AVAILABLE_DOMAINS = [
  { id: 'superconductors', label: 'Superconductors', description: 'High-temperature superconductivity research' },
  { id: 'semiconductors', label: 'Semiconductors', description: 'Semiconductor materials and devices' },
  { id: 'quantum', label: 'Quantum', description: 'Quantum materials and phenomena' },
  { id: 'magnets', label: 'Magnets', description: 'Magnetic materials and properties' },
  { id: 'energy_storage', label: 'Energy Storage', description: 'Battery and energy storage technologies' },
];

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

// Export progress tracking
interface ExportProgress {
  domain: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  message: string;
  count?: number;
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
  const [selectedDomains, setSelectedDomains] = useState<string[]>(['superconductors']);
  const [loading, setLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress[]>([]);

  // Handle domain selection
  const handleDomainToggle = (domainId: string) => {
    setSelectedDomains(prev => 
      prev.includes(domainId)
        ? prev.filter(id => id !== domainId)
        : [...prev, domainId]
    );
  };

  // Export data for a single domain
  const exportDomainCSV = async (domain: string): Promise<ExportProgress> => {
    try {
      // Update progress
    //   const progress: ExportProgress = {
    //     domain,
    //     status: 'processing',
    //     message: 'Querying database...'
    //   };

      // Query papers from specified domain that are processed and screened
      const { data: papers, error } = await supabase
        .from('papers')
        .select('paper_id, title, authors, published_date, output, domain, processed, screened, screen_passed')
        .eq('domain', domain)
        .eq('processed', true)
        .eq('screened', true)
        .eq('screen_passed', true)
        .not('output', 'is', null);

      if (error) {
        throw error;
      }

      if (!papers || papers.length === 0) {
        return {
          domain,
          status: 'complete',
          message: 'No data found',
          count: 0
        };
      }

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

      // Convert to CSV and download
      const csvContent = convertToCSV(csvData);
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${domain}_export_${timestamp}.csv`;
      
      downloadCSV(csvContent, filename);
      
      return {
        domain,
        status: 'complete',
        message: `Successfully exported ${csvData.length} entries`,
        count: csvData.length
      };
      
    } catch (error) {
      console.error(`Export error for ${domain}:`, error);
      return {
        domain,
        status: 'error',
        message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  };

  // Export selected domains
  const exportSelectedDomains = async () => {
    if (selectedDomains.length === 0) {
      alert('Please select at least one domain to export.');
      return;
    }

    setLoading(true);
    
    // Initialize progress for all selected domains
    const initialProgress: ExportProgress[] = selectedDomains.map(domain => ({
      domain,
      status: 'pending',
      message: 'Waiting...'
    }));
    setExportProgress(initialProgress);

    // Export each domain sequentially
    for (let i = 0; i < selectedDomains.length; i++) {
      const domain = selectedDomains[i];
      
      // Update progress to show current domain being processed
      setExportProgress(prev => prev.map(p => 
        p.domain === domain 
          ? { ...p, status: 'processing', message: 'Querying database...' }
          : p
      ));

      try {
        const result = await exportDomainCSV(domain);
        
        // Update progress with result
        setExportProgress(prev => prev.map(p => 
          p.domain === domain ? result : p
        ));
      } catch (error) {
        // Update progress with error
        setExportProgress(prev => prev.map(p => 
          p.domain === domain 
            ? { ...p, status: 'error', message: 'Export failed' }
            : p
        ));
      }
    }

    setLoading(false);
  };

  // Clear progress
  const clearProgress = () => {
    setExportProgress([]);
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
              <div className="text-white/90 leading-none"><span className="font-bold text-white">{selectedDomains.length}</span> domain{selectedDomains.length !== 1 ? 's' : ''} selected</div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-large border border-white/60 p-8">
          <h2 className="text-2xl font-semibold text-primary-900 mb-4">Domain Selection & Export</h2>
          <p className="text-primary-700 mb-6">
            Select one or more research domains to export. Each domain will generate a separate CSV file with processed and screened data.
          </p>
          
          {/* Domain Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-primary-900 mb-4">Select Domains</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {AVAILABLE_DOMAINS.map((domain) => (
                <label 
                  key={domain.id}
                  className="flex items-start space-x-3 p-4 border border-primary-200 rounded-lg hover:bg-primary-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedDomains.includes(domain.id)}
                    onChange={() => handleDomainToggle(domain.id)}
                    className="mt-1 w-4 h-4 text-accent-600 border-primary-300 rounded focus:ring-accent-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-primary-900">{domain.label}</div>
                    <div className="text-xs text-primary-600 mt-1">{domain.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Export Button */}
          <div className="mb-6">
            <button 
              className="px-6 py-3 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-lg font-medium"
              onClick={exportSelectedDomains}
              disabled={loading || selectedDomains.length === 0}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <span>Export Selected Domains</span>
                  <span className="text-sm">({selectedDomains.length})</span>
                </>
              )}
            </button>
          </div>
          
          {/* Progress Display */}
          {exportProgress.length > 0 && (
            <div className="mb-6 p-6 bg-primary-50 border border-primary-200 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-primary-900">Export Progress</h4>
                {!loading && (
                  <button 
                    onClick={clearProgress}
                    className="text-sm text-accent-600 hover:text-accent-700"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {exportProgress.map((progress) => (
                  <div key={progress.domain} className="flex items-center justify-between p-3 bg-white rounded border">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        progress.status === 'pending' ? 'bg-gray-300' :
                        progress.status === 'processing' ? 'bg-accent-500' :
                        progress.status === 'complete' ? 'bg-green-500' :
                        'bg-red-500'
                      }`}></div>
                      <div>
                        <div className="font-medium text-primary-900 capitalize">
                          {AVAILABLE_DOMAINS.find(d => d.id === progress.domain)?.label || progress.domain}
                        </div>
                        <div className="text-sm text-primary-600">{progress.message}</div>
                      </div>
                    </div>
                    {progress.status === 'processing' && (
                      <div className="w-4 h-4 border-2 border-accent-200 border-t-accent-500 rounded-full animate-spin"></div>
                    )}
                    {progress.status === 'complete' && progress.count !== undefined && (
                      <div className="text-sm font-medium text-green-600">{progress.count} entries</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Additional Information */}
          <div className="p-4 bg-accent-50 border border-accent-200 rounded-lg">
            <h4 className="text-sm font-semibold text-accent-900 mb-2">Export Details</h4>
            <ul className="text-xs text-accent-700 space-y-1">
              <li>• Only includes processed, screened, and approved papers</li>
              <li>• Each material from a paper's output becomes a separate row</li>
              <li>• Complex JSON fields are flattened with underscore notation</li>
              <li>• Material composition and atom sites are kept as JSON strings</li>
              <li>• Export includes paper metadata (ID, title, authors, publication date)</li>
              <li>• Each domain generates a separate timestamped CSV file</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Export; 