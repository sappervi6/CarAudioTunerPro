import React, { useState, useMemo } from 'react';
import { SystemConfig, SpeakerSize, SpeakerZone, SubwooferZone, PortConfig } from '../types';
import { getSystemRecommendation } from '../services/geminiService';

const initialZone = (location: string): SpeakerZone => ({
  enabled: false,
  location,
  size: '6.5"',
  isComponent: false,
  count: 2,
  rmsPerSpeaker: 50,
  impedance: 4,
  sensitivity: 88
});

const initialSystem: SystemConfig = {
  frontDoor: initialZone('Front Door'),
  rearDoor: initialZone('Rear Door'),
  frontDash: initialZone('Front Dash'),
  frontPillars: initialZone('Front Pillars'),
  centerChannel: { ...initialZone('Center Channel'), count: 1 },
  rearDeck: initialZone('Rear Deck'),
  subwoofer: {
    enabled: false,
    location: 'Trunk',
    size: '12"',
    count: 1,
    enclosureType: 'Sealed',
    rmsPerSub: 500,
    impedance: 2,
    sensitivity: 86
  },
  enclosure: {
    boxVolume: 1.5,
    tuningFreq: 35,
    portType: 'Round',
    portDiameter: 4,
    numPorts: 1
  }
};

const sizes: SpeakerSize[] = ['3.5"', '4"', '5.25"', '6.5"', '5x7"', '6x8"', '6x9"', '8"'];
const subSizes: SpeakerSize[] = ['8"', '10"', '12"', '15"'];

const SystemBuilder: React.FC = () => {
  const [system, setSystem] = useState<SystemConfig>(initialSystem);
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'design' | 'enclosure' | 'electrical'>('design');
  const [calculatedPortLength, setCalculatedPortLength] = useState<number | null>(null);

  const updateZone = (key: keyof SystemConfig, updates: Partial<SpeakerZone>) => {
    setSystem(prev => ({
      ...prev,
      [key]: { ...prev[key as keyof SystemConfig], ...updates }
    }));
  };

  const calculatePort = () => {
    const { boxVolume, tuningFreq, portDiameter, numPorts } = system.enclosure;
    // Formula: Lv = ( (23562.5 * Area * Np) / (Vb * Fb^2) ) - (k * Dv)
    // Using k=0.732 (flush end)
    const r = portDiameter / 2;
    const area = Math.PI * (r * r);
    const length = ((23562.5 * area * numPorts) / (boxVolume * Math.pow(tuningFreq, 2))) - (0.732 * portDiameter);
    setCalculatedPortLength(parseFloat(length.toFixed(2)));
  };

  const handleGenerate = async () => {
     if (!process.env.API_KEY) {
        setRecommendation("Error: No API Key configured.");
        return;
    }
    setLoading(true);
    setRecommendation(null);
    const result = await getSystemRecommendation(system);
    setRecommendation(result);
    setLoading(false);
  };

  // --- Electrical Calculations ---
  const electricalStats = useMemo(() => {
    let totalRMS = 0;
    
    // Helper to calculate zone stats
    const getZoneStats = (zone: SpeakerZone) => {
      if (!zone.enabled) return null;
      const totalZoneRMS = zone.rmsPerSpeaker * zone.count;
      totalRMS += totalZoneRMS;
      const voltageTarget = Math.sqrt(zone.rmsPerSpeaker * zone.impedance).toFixed(1);
      const theoreticalSPL = (zone.sensitivity + 10 * Math.log10(totalZoneRMS)).toFixed(1);
      return { totalZoneRMS, voltageTarget, theoreticalSPL };
    };

    // Subwoofer stats
    const sub = system.subwoofer;
    let subStats = null;
    if (sub.enabled) {
      const totalSubRMS = sub.rmsPerSub * sub.count;
      totalRMS += totalSubRMS;
      const voltageTarget = Math.sqrt(sub.rmsPerSub * sub.impedance).toFixed(1); 
      const theoreticalSPL = (sub.sensitivity + 10 * Math.log10(totalSubRMS)).toFixed(1);
      subStats = { totalSubRMS, voltageTarget, theoreticalSPL };
    }

    // Current Draw (Amps) = Power / Voltage / Efficiency
    // Using 13.8V and 75% efficiency (Class D average)
    const currentDraw = Math.ceil(totalRMS / 13.8 / 0.75);

    // Wire Gauge Logic (Rough approximations for < 20ft run)
    let wireGauge = "8 AWG";
    if (currentDraw > 40) wireGauge = "4 AWG";
    if (currentDraw > 100) wireGauge = "1/0 AWG";
    if (currentDraw > 250) wireGauge = "2x 1/0 AWG";

    // Capacitor / Electrical Upgrade Logic
    const capacitorFarads = totalRMS > 1000 ? Math.ceil(totalRMS / 1000) : 0;
    let electricalUpgrade = "Stock Electrical System should be sufficient.";
    if (totalRMS > 1000) electricalUpgrade = "Recommend 'Big 3' Upgrade (Alternator/Battery/Ground wiring).";
    if (totalRMS > 2000) electricalUpgrade = "High Output Alternator Strongly Recommended + Big 3.";
    if (totalRMS > 3500) electricalUpgrade = "Dual Batteries + HO Alternator Required.";

    return {
      totalRMS,
      currentDraw,
      wireGauge,
      capacitorFarads,
      electricalUpgrade,
      zones: {
        frontDoor: getZoneStats(system.frontDoor),
        frontDash: getZoneStats(system.frontDash),
        frontPillars: getZoneStats(system.frontPillars),
        centerChannel: getZoneStats(system.centerChannel),
        rearDoor: getZoneStats(system.rearDoor),
        rearDeck: getZoneStats(system.rearDeck),
        subwoofer: subStats
      }
    };
  }, [system]);

  const renderZoneInput = (key: keyof SystemConfig, label: string, isSub = false) => {
    const zone = system[key as keyof SystemConfig] as SpeakerZone;
    if (isSub) return null; // Handled separately

    return (
      <div className={`p-4 rounded-lg border mb-4 transition-colors ${zone.enabled ? 'bg-dark-surface border-neon-blue' : 'bg-dark-bg border-gray-800'}`}>
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={zone.enabled}
              onChange={(e) => updateZone(key, { enabled: e.target.checked })}
              className="mr-3 w-5 h-5 accent-neon-blue"
            />
            <span className={`font-bold ${zone.enabled ? 'text-white' : 'text-gray-500'}`}>{label}</span>
          </label>
        </div>

        {zone.enabled && (
          <div className="grid grid-cols-2 gap-4 mt-3 ml-8 animate-fade-in">
             <div>
                <label className="text-xs text-gray-400">Size</label>
                <select 
                  value={zone.size}
                  onChange={(e) => updateZone(key, { size: e.target.value as SpeakerSize })}
                  className="w-full bg-dark-card border border-gray-700 text-white text-sm rounded p-2 mt-1"
                >
                  {sizes.map(s => <option key={s}>{s}</option>)}
                </select>
             </div>
             {key !== 'centerChannel' && (
               <div className="flex items-center pt-5">
                 <label className="flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={zone.isComponent}
                      onChange={(e) => updateZone(key, { isComponent: e.target.checked })}
                      className="mr-2 accent-neon-pink"
                    />
                    <span className="text-xs text-gray-300">Component (Tweeters)</span>
                 </label>
               </div>
             )}
          </div>
        )}
      </div>
    );
  };

  const renderElectricalInput = (key: keyof SystemConfig, label: string) => {
    const zone = system[key as keyof SystemConfig] as SpeakerZone;
    if (!zone.enabled) return null;
    
    // Safely access stats
    const stats = electricalStats.zones[key as keyof typeof electricalStats.zones] as any; 
    
    return (
      <div className="bg-dark-surface p-4 rounded-lg border border-gray-700 mb-4 animate-fade-in">
        <h4 className="text-neon-blue font-bold text-sm mb-3">{label}</h4>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] uppercase font-bold text-gray-400">RMS (Watts)</label>
            <input 
              type="number" 
              value={zone.rmsPerSpeaker}
              onChange={(e) => updateZone(key, { rmsPerSpeaker: parseFloat(e.target.value) || 0 })}
              className="w-full bg-dark-bg border border-gray-600 rounded p-1 text-white text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-gray-400">Imp (Ohms)</label>
            <input 
              type="number" 
              value={zone.impedance}
              onChange={(e) => updateZone(key, { impedance: parseFloat(e.target.value) || 0 })}
              className="w-full bg-dark-bg border border-gray-600 rounded p-1 text-white text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-gray-400">Sens (dB)</label>
            <input 
              type="number" 
              value={zone.sensitivity}
              onChange={(e) => updateZone(key, { sensitivity: parseFloat(e.target.value) || 0 })}
              className="w-full bg-dark-bg border border-gray-600 rounded p-1 text-white text-sm"
            />
          </div>
        </div>
        
        {/* Quick Calc Display */}
        <div className="flex justify-between mt-3 text-xs bg-dark-bg p-2 rounded">
           <div>
             <span className="text-gray-500 block">Gain Target</span>
             <span className="text-neon-green font-mono">{stats?.voltageTarget || '0.0'}V</span>
           </div>
           <div className="text-right">
             <span className="text-gray-500 block">Est. SPL</span>
             <span className="text-white font-mono">{stats?.theoreticalSPL || '0.0'}dB</span>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid lg:grid-cols-12 gap-6">
      {/* LEFT COLUMN: Inputs */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Tab Switcher */}
        <div className="flex rounded-lg bg-dark-card p-1 border border-gray-800">
           <button 
             onClick={() => setActiveTab('design')}
             className={`flex-1 py-2 text-sm font-bold rounded ${activeTab === 'design' ? 'bg-neon-blue text-black' : 'text-gray-400 hover:text-white'}`}
           >
             Design
           </button>
           <button 
             onClick={() => setActiveTab('enclosure')}
             className={`flex-1 py-2 text-sm font-bold rounded ${activeTab === 'enclosure' ? 'bg-neon-pink text-black' : 'text-gray-400 hover:text-white'}`}
           >
             Box Calc
           </button>
           <button 
             onClick={() => setActiveTab('electrical')}
             className={`flex-1 py-2 text-sm font-bold rounded ${activeTab === 'electrical' ? 'bg-neon-green text-black' : 'text-gray-400 hover:text-white'}`}
           >
             Power & Tuning
           </button>
        </div>

        {activeTab === 'design' && (
          <div className="bg-dark-card p-4 rounded-xl border border-gray-800 shadow-xl max-h-[70vh] overflow-y-auto">
             <h3 className="text-neon-blue font-bold uppercase text-xs mb-4">Front Stage</h3>
             {renderZoneInput('frontDoor', 'Front Door')}
             {renderZoneInput('frontDash', 'Front Dash')}
             {renderZoneInput('frontPillars', 'Front Pillars')}
             {renderZoneInput('centerChannel', 'Center Channel')}

             <h3 className="text-neon-blue font-bold uppercase text-xs mt-6 mb-4">Rear Stage</h3>
             {renderZoneInput('rearDoor', 'Rear Door')}
             {renderZoneInput('rearDeck', 'Rear Deck')}

             <h3 className="text-neon-blue font-bold uppercase text-xs mt-6 mb-4">Subwoofer</h3>
             <div className={`p-4 rounded-lg border mb-4 transition-colors ${system.subwoofer.enabled ? 'bg-dark-surface border-neon-blue' : 'bg-dark-bg border-gray-800'}`}>
                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={system.subwoofer.enabled}
                      onChange={(e) => setSystem(prev => ({...prev, subwoofer: {...prev.subwoofer, enabled: e.target.checked}}))}
                      className="mr-3 w-5 h-5 accent-neon-blue"
                    />
                    <span className={`font-bold ${system.subwoofer.enabled ? 'text-white' : 'text-gray-500'}`}>Subwoofer System</span>
                  </label>
                </div>
                {system.subwoofer.enabled && (
                    <div className="grid grid-cols-2 gap-4 mt-3 ml-8">
                        <div>
                             <label className="text-xs text-gray-400">Size</label>
                             <select 
                                value={system.subwoofer.size}
                                onChange={(e) => setSystem(prev => ({...prev, subwoofer: {...prev.subwoofer, size: e.target.value as SpeakerSize}}))}
                                className="w-full bg-dark-card border border-gray-700 text-white text-sm rounded p-2 mt-1"
                             >
                               {subSizes.map(s => <option key={s}>{s}</option>)}
                             </select>
                        </div>
                        <div>
                             <label className="text-xs text-gray-400">Count</label>
                             <input 
                                type="number" 
                                min="1" 
                                max="4"
                                value={system.subwoofer.count}
                                onChange={(e) => setSystem(prev => ({...prev, subwoofer: {...prev.subwoofer, count: parseInt(e.target.value)}}))}
                                className="w-full bg-dark-card border border-gray-700 text-white text-sm rounded p-2 mt-1"
                             />
                        </div>
                        <div>
                             <label className="text-xs text-gray-400">Location</label>
                             <select 
                                value={system.subwoofer.location}
                                onChange={(e) => setSystem(prev => ({...prev, subwoofer: {...prev.subwoofer, location: e.target.value as any}}))}
                                className="w-full bg-dark-card border border-gray-700 text-white text-sm rounded p-2 mt-1"
                             >
                                <option>Trunk</option>
                                <option>Underseat</option>
                                <option>Rear Deck</option>
                             </select>
                        </div>
                        <div>
                             <label className="text-xs text-gray-400">Type</label>
                             <select 
                                value={system.subwoofer.enclosureType}
                                onChange={(e) => setSystem(prev => ({...prev, subwoofer: {...prev.subwoofer, enclosureType: e.target.value as any}}))}
                                className="w-full bg-dark-card border border-gray-700 text-white text-sm rounded p-2 mt-1"
                             >
                                <option>Sealed</option>
                                <option>Ported</option>
                                <option>Bandpass</option>
                             </select>
                        </div>
                    </div>
                )}
             </div>

             <button 
                onClick={handleGenerate}
                disabled={loading}
                className="w-full mt-4 py-3 bg-gradient-to-r from-neon-blue to-neon-green text-black font-bold rounded-lg shadow-lg hover:brightness-110 transition-all flex justify-center items-center"
             >
                {loading ? 'ANALYZING SYSTEM...' : 'GENERATE AI ARCHITECTURE'}
             </button>
          </div>
        )}

        {activeTab === 'enclosure' && (
          <div className="bg-dark-card p-6 rounded-xl border border-gray-800 shadow-xl">
             <h3 className="text-white font-bold mb-4 flex items-center">
                 <span className="w-2 h-6 bg-neon-pink mr-3 rounded-full"></span>
                 Port Length Calculator
             </h3>
             <div className="space-y-4">
                 <div>
                    <label className="text-xs font-bold text-gray-400">Net Box Volume (Cu. Ft)</label>
                    <input 
                        type="number" 
                        value={system.enclosure.boxVolume}
                        onChange={(e) => setSystem(prev => ({...prev, enclosure: {...prev.enclosure, boxVolume: parseFloat(e.target.value)}}))}
                        className="w-full bg-dark-surface border border-gray-700 p-2 rounded text-white mt-1"
                    />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-400">Tuning Frequency (Hz)</label>
                    <input 
                        type="number" 
                        value={system.enclosure.tuningFreq}
                        onChange={(e) => setSystem(prev => ({...prev, enclosure: {...prev.enclosure, tuningFreq: parseFloat(e.target.value)}}))}
                        className="w-full bg-dark-surface border border-gray-700 p-2 rounded text-white mt-1"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-400">Port Diameter (In)</label>
                        <input 
                            type="number" 
                            value={system.enclosure.portDiameter}
                            onChange={(e) => setSystem(prev => ({...prev, enclosure: {...prev.enclosure, portDiameter: parseFloat(e.target.value)}}))}
                            className="w-full bg-dark-surface border border-gray-700 p-2 rounded text-white mt-1"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400">Number of Ports</label>
                        <input 
                            type="number" 
                            value={system.enclosure.numPorts}
                            onChange={(e) => setSystem(prev => ({...prev, enclosure: {...prev.enclosure, numPorts: parseInt(e.target.value)}}))}
                            className="w-full bg-dark-surface border border-gray-700 p-2 rounded text-white mt-1"
                        />
                    </div>
                 </div>

                 <button 
                    onClick={calculatePort}
                    className="w-full py-2 bg-neon-pink/20 text-neon-pink border border-neon-pink rounded font-bold hover:bg-neon-pink/30"
                 >
                     CALCULATE LENGTH
                 </button>

                 {calculatedPortLength !== null && (
                     <div className="mt-4 p-4 bg-dark-bg border border-gray-700 rounded text-center">
                         <span className="text-gray-400">Required Port Length</span>
                         <div className="text-3xl font-bold text-white mt-1">{calculatedPortLength}"</div>
                     </div>
                 )}

                 <div className="mt-6 pt-6 border-t border-gray-800">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Calculation Formula Used</p>
                    <div className="bg-dark-bg p-3 rounded border border-gray-800 font-mono text-xs text-gray-400 overflow-x-auto">
                        <p className="mb-2 text-neon-blue">L = [ (23562.5 × Area × N) / (Vb × Fb²) ] - (k × D)</p>
                        <div className="grid grid-cols-2 gap-2 opacity-75">
                            <span>Area = π × (D/2)²</span>
                            <span>N = Number of Ports</span>
                            <span>Vb = Net Volume (cu. ft)</span>
                            <span>Fb = Tuning Freq (Hz)</span>
                            <span>D = Port Diameter (in)</span>
                            <span>k = 0.732 (End Correction)</span>
                        </div>
                    </div>
                 </div>
             </div>
          </div>
        )}

        {activeTab === 'electrical' && (
          <div className="bg-dark-card p-6 rounded-xl border border-gray-800 shadow-xl max-h-[70vh] overflow-y-auto">
             <h3 className="text-white font-bold mb-4 flex items-center">
                 <span className="w-2 h-6 bg-neon-green mr-3 rounded-full"></span>
                 Power & Impedance Specs
             </h3>
             <p className="text-xs text-gray-500 mb-6">Enter specs for enabled speakers to calculate gain targets.</p>
             
             {renderElectricalInput('frontDoor', 'Front Door Speakers')}
             {renderElectricalInput('frontDash', 'Front Dash Speakers')}
             {renderElectricalInput('frontPillars', 'Front Pillar Tweeters')}
             {renderElectricalInput('centerChannel', 'Center Channel')}
             {renderElectricalInput('rearDoor', 'Rear Door Speakers')}
             {renderElectricalInput('rearDeck', 'Rear Deck Speakers')}
             
             {/* Subwoofer Electrical Input */}
             {system.subwoofer.enabled && (
                <div className="bg-dark-surface p-4 rounded-lg border border-gray-700 mb-4 animate-fade-in">
                  <h4 className="text-neon-pink font-bold text-sm mb-3">Subwoofer System</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-400">RMS (Ea)</label>
                      <input 
                        type="number" 
                        value={system.subwoofer.rmsPerSub}
                        onChange={(e) => setSystem(prev => ({...prev, subwoofer: {...prev.subwoofer, rmsPerSub: parseFloat(e.target.value) || 0}}))}
                        className="w-full bg-dark-bg border border-gray-600 rounded p-1 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-400">Imp (Ea)</label>
                      <input 
                        type="number" 
                        value={system.subwoofer.impedance}
                        onChange={(e) => setSystem(prev => ({...prev, subwoofer: {...prev.subwoofer, impedance: parseFloat(e.target.value) || 0}}))}
                        className="w-full bg-dark-bg border border-gray-600 rounded p-1 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-400">Sens (dB)</label>
                      <input 
                        type="number" 
                        value={system.subwoofer.sensitivity}
                        onChange={(e) => setSystem(prev => ({...prev, subwoofer: {...prev.subwoofer, sensitivity: parseFloat(e.target.value) || 0}}))}
                        className="w-full bg-dark-bg border border-gray-600 rounded p-1 text-white text-sm"
                      />
                    </div>
                  </div>
                   <div className="flex justify-between mt-3 text-xs bg-dark-bg p-2 rounded">
                      <div>
                        <span className="text-gray-500 block">Gain Target</span>
                        <span className="text-neon-green font-mono">{electricalStats.zones.subwoofer?.voltageTarget}V</span>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-500 block">Est. SPL</span>
                        <span className="text-white font-mono">{electricalStats.zones.subwoofer?.theoreticalSPL}dB</span>
                      </div>
                   </div>
                </div>
             )}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Visualizer / Results */}
      <div className="lg:col-span-7 space-y-6">
          
          {/* Dynamic Wiring Diagram Visualizer (Only visible on Design Tab) */}
          {activeTab === 'design' && (
            <div className="bg-dark-card p-6 rounded-xl border border-gray-800 shadow-xl min-h-[300px]">
                <h3 className="text-gray-400 font-bold text-sm mb-4 uppercase">System Topology Preview</h3>
                
                <div className="relative w-full h-64 bg-dark-surface rounded-lg border border-gray-700 flex items-center justify-center p-4 overflow-hidden">
                    <div className="flex w-full justify-between items-center relative z-10">
                        
                        {/* Front Speakers */}
                        <div className="flex flex-col gap-2">
                            {system.frontPillars.enabled && <div className="w-16 h-8 bg-gray-800 border border-neon-blue rounded flex items-center justify-center text-[10px] text-neon-blue">Pillars</div>}
                            {system.frontDash.enabled && <div className="w-16 h-8 bg-gray-800 border border-neon-blue rounded flex items-center justify-center text-[10px] text-neon-blue">Dash</div>}
                            {system.frontDoor.enabled && <div className="w-16 h-12 bg-gray-800 border-2 border-neon-blue rounded flex items-center justify-center text-[10px] text-white">Front Door</div>}
                        </div>

                        {/* Head Unit / DSP */}
                        <div className="flex flex-col items-center">
                          <div className="w-24 h-16 bg-gray-900 border-2 border-white rounded-lg flex items-center justify-center text-xs font-bold shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                              SOURCE
                          </div>
                          <div className="h-full w-0.5 bg-gradient-to-b from-white to-transparent my-2"></div>
                        </div>

                        {/* Rear/Sub Speakers */}
                        <div className="flex flex-col gap-2 items-end">
                            {system.rearDeck.enabled && <div className="w-16 h-8 bg-gray-800 border border-neon-green rounded flex items-center justify-center text-[10px] text-neon-green">Rear Deck</div>}
                            {system.rearDoor.enabled && <div className="w-16 h-12 bg-gray-800 border-2 border-neon-green rounded flex items-center justify-center text-[10px] text-white">Rear Door</div>}
                            {system.subwoofer.enabled && <div className="w-20 h-20 bg-gray-900 border-2 border-neon-pink rounded-xl flex items-center justify-center text-[10px] text-neon-pink font-bold shadow-[0_0_15px_rgba(188,19,254,0.3)] mt-2">SUB</div>}
                        </div>
                    </div>

                    {/* Connecting Lines Overlay (Simplified) */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
                        <line x1="50%" y1="50%" x2="10%" y2="50%" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                        <line x1="50%" y1="50%" x2="90%" y2="50%" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                    </svg>
                </div>
                <p className="text-center text-xs text-gray-500 mt-2">Visual representation of active components</p>
            </div>
          )}

          {/* Electrical Dashboard (Visible on Electrical Tab) */}
          {activeTab === 'electrical' && (
             <div className="bg-dark-card p-6 rounded-xl border border-gray-800 shadow-xl">
                <h3 className="text-white font-bold text-lg mb-6 border-b border-gray-700 pb-2">System Electrical Analysis</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                   <div className="bg-dark-bg p-4 rounded border border-gray-700">
                      <span className="text-gray-400 text-xs font-bold uppercase">Total System Power</span>
                      <div className="text-3xl font-bold text-white mt-1">{electricalStats.totalRMS} <span className="text-sm text-neon-blue">W RMS</span></div>
                   </div>
                   <div className="bg-dark-bg p-4 rounded border border-gray-700">
                      <span className="text-gray-400 text-xs font-bold uppercase">Est. Current Draw</span>
                      <div className="text-3xl font-bold text-white mt-1">{electricalStats.currentDraw} <span className="text-sm text-red-500">Amps</span></div>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center justify-between p-3 bg-dark-surface rounded border border-gray-700">
                      <span className="text-sm font-bold text-gray-300">Recommended Power Cable</span>
                      <span className="font-mono text-neon-blue font-bold">{electricalStats.wireGauge} OFC</span>
                   </div>

                   {electricalStats.capacitorFarads > 0 && (
                      <div className="flex items-center justify-between p-3 bg-dark-surface rounded border border-gray-700">
                        <span className="text-sm font-bold text-gray-300">Suggested Capacitor</span>
                        <span className="font-mono text-neon-pink font-bold">{electricalStats.capacitorFarads} Farad</span>
                      </div>
                   )}

                   <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                      <h4 className="text-blue-400 font-bold text-sm mb-2 uppercase">Electrical Upgrade Recommendation</h4>
                      <p className="text-white text-sm">{electricalStats.electricalUpgrade}</p>
                   </div>
                   
                   <div className="mt-2 text-xs text-gray-500">
                      *Calculations assume 13.8V system voltage and typical Class D amplifier efficiency (75%). Actual results may vary.
                   </div>
                </div>
             </div>
          )}

          {/* AI Recommendation Output (Visible on Design Tab) */}
          {recommendation && activeTab === 'design' && (
             <div className="bg-dark-card p-6 rounded-xl border border-gray-800 shadow-xl">
                <h3 className="text-xl font-bold text-neon-green mb-4">AI System Architect Report</h3>
                <div className="prose prose-invert max-w-none text-sm text-gray-300">
                    {recommendation.split('\n').map((line, i) => {
                       if (line.startsWith('##')) return <h3 key={i} className="text-white font-bold mt-4 mb-2 text-lg border-b border-gray-700 pb-1">{line.replace(/#/g, '')}</h3>
                       if (line.startsWith('#')) return <h3 key={i} className="text-white font-bold mt-4 mb-2">{line.replace(/#/g, '')}</h3>
                       if (line.startsWith('-') || line.startsWith('*')) return <li key={i} className="ml-4 mb-1">{line.replace(/^[-*]\s/, '')}</li>
                       return <p key={i} className="mb-2">{line}</p>
                   })}
                </div>
             </div>
          )}
      </div>
    </div>
  );
};

export default SystemBuilder;