import React, { useState, useEffect } from 'react';
import { getVehicleSpecificRecommendations, getVehicleModels } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

const VEHICLE_MAKES = [
  "Acura", "Alfa Romeo", "Aston Martin", "Audi", "BMW", "Bentley", "Buick", "Cadillac", "Chevrolet", "Chrysler", 
  "Dodge", "Ferrari", "Fiat", "Ford", "GMC", "Genesis", "Honda", "Hyundai", "Infiniti", "Jaguar", "Jeep", "Kia", 
  "Lamborghini", "Land Rover", "Lexus", "Lincoln", "Lucid", "Maserati", "Mazda", "McLaren", "Mercedes-Benz", 
  "Mini", "Mitsubishi", "Nissan", "Polestar", "Porsche", "Ram", "Rivian", "Rolls-Royce", "Subaru", "Tesla", 
  "Toyota", "Volkswagen", "Volvo"
].sort();

const YEARS = Array.from({ length: 36 }, (_, i) => (2025 - i).toString());

const VehicleRecommendations: React.FC = () => {
  const [vehicle, setVehicle] = useState({ year: '', make: '', model: '' });
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [budget, setBudget] = useState('Performance ($1k - $3k)');
  const [loading, setLoading] = useState(false);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  const budgetTiers = [
    'Value (Under $750)',
    'Performance ($1k - $3k)',
    'Audiophile/Elite ($5k+)'
  ];

  // Fetch models when Year or Make changes
  useEffect(() => {
    const fetchModels = async () => {
      if (vehicle.year && vehicle.make) {
        setFetchingModels(true);
        setAvailableModels([]);
        try {
          const models = await getVehicleModels(vehicle.year, vehicle.make);
          setAvailableModels(models);
        } catch (err) {
          console.error("Failed to fetch models");
        } finally {
          setFetchingModels(false);
        }
      }
    };
    fetchModels();
  }, [vehicle.year, vehicle.make]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle.make || !vehicle.model || !vehicle.year) return;

    setLoading(true);
    setReport(null);
    try {
      const result = await getVehicleSpecificRecommendations(
        vehicle.year,
        vehicle.make,
        vehicle.model,
        budget
      );
      setReport(result);
    } catch (err) {
      setReport("## Error\nUnable to generate recommendations at this time.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="bg-dark-card p-6 md:p-8 rounded-2xl border border-gray-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-blue/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
        
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <span className="p-2 bg-neon-blue/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-neon-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </span>
            Vehicle AI Architect
          </h2>
          <p className="text-gray-400 mb-8">Select your vehicle details for precise factory spec analysis.</p>

          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Year Dropdown */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Year</label>
              <select 
                value={vehicle.year}
                onChange={(e) => setVehicle({...vehicle, year: e.target.value, model: ''})}
                className="w-full bg-dark-surface border border-gray-700 rounded-xl p-3 text-white focus:border-neon-blue outline-none transition-all appearance-none cursor-pointer"
                required
              >
                <option value="">Select Year</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {/* Make Dropdown */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Make</label>
              <select 
                value={vehicle.make}
                onChange={(e) => setVehicle({...vehicle, make: e.target.value, model: ''})}
                className="w-full bg-dark-surface border border-gray-700 rounded-xl p-3 text-white focus:border-neon-blue outline-none transition-all appearance-none cursor-pointer"
                required
              >
                <option value="">Select Make</option>
                {VEHICLE_MAKES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Model Dropdown (Dynamic) */}
            <div className="relative">
              <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Model</label>
              <select 
                value={vehicle.model}
                onChange={(e) => setVehicle({...vehicle, model: e.target.value})}
                disabled={!vehicle.make || !vehicle.year || fetchingModels}
                className={`w-full bg-dark-surface border border-gray-700 rounded-xl p-3 text-white focus:border-neon-blue outline-none transition-all appearance-none cursor-pointer ${
                  (!vehicle.make || !vehicle.year || fetchingModels) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                required
              >
                <option value="">{fetchingModels ? 'Loading Models...' : 'Select Model'}</option>
                {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              {fetchingModels && (
                <div className="absolute bottom-4 right-8">
                   <div className="w-4 h-4 border-2 border-neon-blue/20 border-t-neon-blue rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Budget Dropdown */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Budget Tier</label>
              <select 
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full bg-dark-surface border border-gray-700 rounded-xl p-3 text-white focus:border-neon-blue outline-none transition-all appearance-none cursor-pointer"
              >
                {budgetTiers.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            
            <div className="md:col-span-4 mt-2">
              <button 
                type="submit"
                disabled={loading || !vehicle.model}
                className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                  loading || !vehicle.model
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-neon-blue to-neon-pink text-white hover:shadow-[0_0_20px_rgba(0,243,255,0.4)]'
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    BUILDING CUSTOM REPORT...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                    </svg>
                    START DEEP-DIVE RESEARCH
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {report && (
        <div className="bg-dark-card rounded-2xl border border-gray-800 shadow-2xl overflow-hidden animate-slide-up">
          <div className="bg-gradient-to-r from-neon-blue/10 to-transparent p-6 border-b border-gray-800 flex justify-between items-center">
            <h3 className="text-xl font-bold text-white uppercase tracking-wider">
              {vehicle.year} {vehicle.make} {vehicle.model} // Blueprint
            </h3>
            <span className="px-3 py-1 bg-neon-blue/20 text-neon-blue text-[10px] font-bold rounded-full border border-neon-blue/30">AI GENERATED</span>
          </div>
          <div className="p-8 prose prose-invert max-w-none">
            <ReactMarkdown>{report}</ReactMarkdown>
          </div>
          <div className="bg-dark-surface p-4 text-center border-t border-gray-800">
            <button 
                onClick={() => window.print()}
                className="text-xs font-bold text-gray-500 hover:text-neon-blue flex items-center justify-center gap-2 mx-auto"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                PRINT FULL SYSTEM BLUEPRINT
            </button>
          </div>
        </div>
      )}

      {loading && !report && (
          <div className="py-20 text-center space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-neon-blue/20 border-t-neon-blue rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-neon-pink/20 border-t-neon-pink rounded-full animate-spin-reverse"></div>
                    </div>
                </div>
              </div>
              <p className="text-gray-400 font-medium animate-pulse">Consulting installation manuals and wiring diagrams for the {vehicle.year} {vehicle.make} {vehicle.model}...</p>
          </div>
      )}
    </div>
  );
};

export default VehicleRecommendations;
