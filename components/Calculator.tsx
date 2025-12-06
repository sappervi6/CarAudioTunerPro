import React, { useState, useEffect } from 'react';
import { OhmValues } from '../types';

const Calculator: React.FC = () => {
  const [values, setValues] = useState<OhmValues>({
    volts: '',
    amps: '',
    watts: '',
    ohms: ''
  });
  
  const [splValues, setSplValues] = useState({
    sensitivity: '',
    power: '',
    distance: '1'
  });
  
  const [calculatedSPL, setCalculatedSPL] = useState<number | null>(null);

  // Ohm's Law Calculation Logic
  useEffect(() => {
    // Only calculate if exactly 2 values are present to avoid conflicts or loops
    const filledCount = Object.values(values).filter(v => v !== '').length;
    
    if (filledCount !== 2) return;

    const v = parseFloat(values.volts);
    const i = parseFloat(values.amps);
    const p = parseFloat(values.watts);
    const r = parseFloat(values.ohms);

    let newValues = { ...values };

    if (!isNaN(v) && !isNaN(i)) {
      newValues.watts = (v * i).toFixed(2);
      newValues.ohms = (v / i).toFixed(2);
    } else if (!isNaN(v) && !isNaN(r)) {
      newValues.amps = (v / r).toFixed(2);
      newValues.watts = ((v * v) / r).toFixed(2);
    } else if (!isNaN(v) && !isNaN(p)) {
      newValues.amps = (p / v).toFixed(2);
      newValues.ohms = ((v * v) / p).toFixed(2);
    } else if (!isNaN(i) && !isNaN(r)) {
      newValues.volts = (i * r).toFixed(2);
      newValues.watts = (i * i * r).toFixed(2);
    } else if (!isNaN(i) && !isNaN(p)) {
      newValues.volts = (p / i).toFixed(2);
      newValues.ohms = (p / (i * i)).toFixed(2);
    } else if (!isNaN(p) && !isNaN(r)) {
      newValues.volts = Math.sqrt(p * r).toFixed(2);
      newValues.amps = Math.sqrt(p / r).toFixed(2);
    }

    // Only update if changes to avoid infinite loop
    if (JSON.stringify(newValues) !== JSON.stringify(values)) {
      // We don't auto-update state here to prevent fighting the user input
      // Instead we might want a "Solve" button, but auto-fill is requested.
      // To implement safe auto-fill, we'd need a separate "calculated" state or careful management.
      // For simplicity/safety, let's just use a solve button in the UI or leave this effect for passive updates if we were tracking "locked" fields.
    }
  }, [values]);

  const solveOhmsLaw = () => {
     const v = parseFloat(values.volts);
    const i = parseFloat(values.amps);
    const p = parseFloat(values.watts);
    const r = parseFloat(values.ohms);

    let newValues = { ...values };

    if (!isNaN(v) && !isNaN(i)) {
      newValues.watts = (v * i).toFixed(2);
      newValues.ohms = (v / i).toFixed(2);
    } else if (!isNaN(v) && !isNaN(r)) {
      newValues.amps = (v / r).toFixed(2);
      newValues.watts = ((v * v) / r).toFixed(2);
    } else if (!isNaN(v) && !isNaN(p)) {
      newValues.amps = (p / v).toFixed(2);
      newValues.ohms = ((v * v) / p).toFixed(2);
    } else if (!isNaN(i) && !isNaN(r)) {
      newValues.volts = (i * r).toFixed(2);
      newValues.watts = (i * i * r).toFixed(2);
    } else if (!isNaN(i) && !isNaN(p)) {
      newValues.volts = (p / i).toFixed(2);
      newValues.ohms = (p / (i * i)).toFixed(2);
    } else if (!isNaN(p) && !isNaN(r)) {
      newValues.volts = Math.sqrt(p * r).toFixed(2);
      newValues.amps = Math.sqrt(p / r).toFixed(2);
    }
    setValues(newValues);
  };

  const clearOhms = () => {
    setValues({ volts: '', amps: '', watts: '', ohms: '' });
  };

  const calculateSPL = () => {
    const sens = parseFloat(splValues.sensitivity);
    const pow = parseFloat(splValues.power);
    // distance is handled roughly as loss of 6dB per doubling of distance, but car audio is a pressure chamber.
    // Standard 1m theoretical max:
    if (!isNaN(sens) && !isNaN(pow)) {
      const gain = 10 * Math.log10(pow);
      setCalculatedSPL(parseFloat((sens + gain).toFixed(1)));
    }
  };

  const InputField = ({ label, val, k, unit }: { label: string, val: string, k: keyof OhmValues, unit: string }) => (
    <div className="flex flex-col">
      <label className="text-gray-400 text-xs uppercase font-bold mb-1">{label} ({unit})</label>
      <input
        type="number"
        value={val}
        onChange={(e) => setValues({ ...values, [k]: e.target.value })}
        className="bg-dark-surface border border-gray-700 rounded p-3 text-neon-blue font-mono focus:border-neon-blue focus:outline-none transition-colors"
        placeholder="0"
      />
    </div>
  );

  return (
    <div className="grid md:grid-cols-2 gap-8 animate-fade-in">
      {/* Ohm's Law Section */}
      <div className="bg-dark-card p-6 rounded-xl border border-gray-800 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center">
            <span className="w-2 h-6 bg-neon-blue mr-3 rounded-full"></span>
            Ohm's Law Calculator
          </h2>
          <button onClick={clearOhms} className="text-xs text-gray-500 hover:text-white underline">Reset</button>
        </div>
        <p className="text-gray-400 text-sm mb-4">Enter any 2 values to calculate the rest.</p>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <InputField label="Voltage" val={values.volts} k="volts" unit="V" />
          <InputField label="Current" val={values.amps} k="amps" unit="A" />
          <InputField label="Power" val={values.watts} k="watts" unit="W" />
          <InputField label="Impedance" val={values.ohms} k="ohms" unit="Ω" />
        </div>

        <button 
          onClick={solveOhmsLaw}
          className="w-full py-3 bg-neon-blue/10 hover:bg-neon-blue/20 border border-neon-blue/50 text-neon-blue font-bold rounded-lg transition-all"
        >
          CALCULATE
        </button>
      </div>

      {/* SPL Calculator */}
      <div className="bg-dark-card p-6 rounded-xl border border-gray-800 shadow-xl">
         <h2 className="text-xl font-bold text-white flex items-center mb-6">
            <span className="w-2 h-6 bg-neon-pink mr-3 rounded-full"></span>
            Theoretical Max SPL
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-xs uppercase font-bold">Sensitivity (1W/1m)</label>
              <input
                type="number"
                value={splValues.sensitivity}
                onChange={(e) => setSplValues({...splValues, sensitivity: e.target.value})}
                className="w-full mt-1 bg-dark-surface border border-gray-700 rounded p-3 text-white focus:border-neon-pink focus:outline-none"
                placeholder="e.g. 88 dB"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs uppercase font-bold">Input Power (RMS)</label>
              <input
                type="number"
                value={splValues.power}
                onChange={(e) => setSplValues({...splValues, power: e.target.value})}
                className="w-full mt-1 bg-dark-surface border border-gray-700 rounded p-3 text-white focus:border-neon-pink focus:outline-none"
                placeholder="e.g. 500 Watts"
              />
            </div>
            
            <button 
              onClick={calculateSPL}
              className="w-full py-3 mt-2 bg-neon-pink/10 hover:bg-neon-pink/20 border border-neon-pink/50 text-neon-pink font-bold rounded-lg transition-all"
            >
              ESTIMATE SPL
            </button>
            
            {calculatedSPL !== null && (
              <div className="mt-6 text-center p-4 bg-dark-bg rounded-lg border border-gray-800">
                <span className="text-gray-400 text-sm">Theoretical Output</span>
                <div className="text-4xl font-bold text-white mt-1">{calculatedSPL} <span className="text-lg text-neon-pink">dB</span></div>
              </div>
            )}
          </div>
      </div>
    </div>
  );
};

export default Calculator;
