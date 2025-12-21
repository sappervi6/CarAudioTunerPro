import React, { useState, useRef } from 'react';
import { setEQBand, resetEQ, decodeAudio, playBuffer, stopAllSounds } from '../utils/audioUtils';

interface BandData {
  id: number;
  freq: number;
  gain: number;
  q: number;
}

const defaultFreqs = [20, 30, 50, 80, 125, 200, 315, 500, 800, 1250, 2000, 3150, 5000, 8000, 12500, 20000];

const Equalizer: React.FC = () => {
  const [bands, setBands] = useState<BandData[]>(
    defaultFreqs.map((f, i) => ({ id: i, freq: f, gain: 0, q: 1.4 }))
  );
  const [selectedBandIndex, setSelectedBandIndex] = useState<number | null>(null);
  
  // Reference Player State
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingRef, setIsPlayingRef] = useState(false);
  const [refBuffer, setRefBuffer] = useState<AudioBuffer | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGainChange = (index: number, val: number) => {
    const newBands = [...bands];
    newBands[index].gain = val;
    setBands(newBands);
    
    const { freq, q } = newBands[index];
    setEQBand(index, val, freq, q);
    setSelectedBandIndex(index);
  };

  const handleParametricChange = (key: keyof BandData, val: number) => {
    if (selectedBandIndex === null) return;
    const newBands = [...bands];
    const index = selectedBandIndex;
    
    // Limits
    if (key === 'q' && val < 0.1) val = 0.1;
    if (key === 'q' && val > 10) val = 10;
    
    newBands[index] = { ...newBands[index], [key]: val };
    setBands(newBands);
    
    const { freq, gain, q } = newBands[index];
    setEQBand(index, gain, freq, q);
  };

  const handleReset = () => {
      resetEQ();
      setBands(defaultFreqs.map((f, i) => ({ id: i, freq: f, gain: 0, q: 1.4 })));
      setSelectedBandIndex(null);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAudioFile(file);
      setIsProcessing(true);
      
      try {
        const arrayBuffer = await file.arrayBuffer();
        const decodedBuffer = await decodeAudio(arrayBuffer);
        setRefBuffer(decodedBuffer);
      } catch (err) {
        console.error("Error decoding audio:", err);
        alert("Failed to decode audio file.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const togglePlayback = () => {
    if (isPlayingRef) {
      stopAllSounds();
      setIsPlayingRef(false);
    } else {
      if (refBuffer) {
        playBuffer(refBuffer, true); // Loop enabled by default for tuning
        setIsPlayingRef(true);
      }
    }
  };

  const formatFreq = (f: number) => {
      return f >= 1000 ? `${f/1000}k` : `${f}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-end mb-4 gap-4">
        <div>
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <span className="w-3 h-8 bg-gradient-to-b from-neon-green to-neon-blue rounded-full"></span>
                Graphic Equalizer
            </h2>
            <p className="text-gray-400 text-sm">16-Band Hybrid Parametric/Graphic EQ</p>
        </div>
        <button 
            onClick={handleReset}
            className="px-4 py-2 border border-gray-600 text-gray-400 rounded hover:text-white hover:border-white transition-colors text-sm font-bold"
        >
            RESET FLAT
        </button>
      </div>

      {/* Graphic EQ Sliders */}
      <div className="bg-dark-card p-6 rounded-xl border border-gray-800 shadow-xl overflow-x-auto">
         <div className="flex justify-between min-w-[700px] gap-2 h-64 items-end pb-8 relative">
             {/* 0dB Line */}
             <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-700 pointer-events-none border-t border-dashed border-gray-600"></div>

             {bands.map((band, i) => (
                 <div key={band.id} className="flex-1 flex flex-col items-center h-full group">
                     {/* Gain Value Label on Hover/Active */}
                     <div className={`text-[10px] mb-2 font-mono ${selectedBandIndex === i ? 'text-neon-blue font-bold' : 'text-transparent group-hover:text-gray-400'}`}>
                         {band.gain > 0 ? '+' : ''}{band.gain.toFixed(1)}
                     </div>

                     {/* Slider */}
                     <input 
                        type="range" 
                        min="-12" 
                        max="12" 
                        step="0.5" 
                        value={band.gain}
                        {...({ orient: "vertical" } as any)}
                        onChange={(e) => handleGainChange(i, parseFloat(e.target.value))}
                        className={`h-full w-3 rounded-lg appearance-none cursor-pointer transition-all ${
                            selectedBandIndex === i 
                             ? 'bg-gray-700 accent-neon-blue shadow-[0_0_10px_rgba(0,243,255,0.3)]' 
                             : 'bg-gray-800 accent-gray-500 hover:accent-gray-400'
                        }`}
                        style={{ writingMode: 'bt-lr', WebkitAppearance: 'slider-vertical' } as any}
                     />

                     {/* Frequency Label */}
                     <button 
                        onClick={() => setSelectedBandIndex(i)}
                        className={`mt-3 text-[10px] font-bold transform -rotate-45 origin-top-left transition-colors ${
                            selectedBandIndex === i ? 'text-neon-blue' : 'text-gray-500 hover:text-white'
                        }`}
                     >
                         {formatFreq(band.freq)}
                     </button>
                 </div>
             ))}
         </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
          {/* Reference Player */}
          <div className="bg-dark-card p-6 rounded-xl border border-gray-800 shadow-xl">
            <h3 className="text-white font-bold mb-4 flex items-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neon-pink mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                 Reference Audio Player
            </h3>
            <p className="text-xs text-gray-500 mb-4">
                <strong>Note:</strong> Browsers cannot EQ audio from other apps (Spotify, etc.). Upload a reference track here to tune with your music.
            </p>

            <div className="flex flex-col gap-4">
                <input 
                    type="file" 
                    accept="audio/*" 
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                />
                
                <div className="flex gap-2">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 py-3 bg-dark-surface border border-gray-700 text-gray-300 rounded hover:text-white hover:border-gray-500 transition-colors"
                    >
                        {audioFile ? (
                           <span className="flex items-center justify-center gap-2">
                               <span className="truncate max-w-[150px]">{audioFile.name}</span>
                               <span className="text-xs bg-gray-700 px-1 rounded text-gray-400">Change</span>
                           </span>
                        ) : 'Select Audio File'}
                    </button>
                    
                    <button 
                        onClick={togglePlayback}
                        disabled={!refBuffer || isProcessing}
                        className={`px-8 rounded font-bold transition-all ${
                            isPlayingRef 
                            ? 'bg-red-500/20 text-red-500 border border-red-500 hover:bg-red-500 hover:text-white' 
                            : 'bg-neon-green/20 text-neon-green border border-neon-green hover:bg-neon-green hover:text-black'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isProcessing ? 'Loading...' : isPlayingRef ? 'STOP' : 'PLAY'}
                    </button>
                </div>
            </div>
          </div>

          {/* Parametric Controls for Selected Band */}
          <div className={`transition-all duration-300 ${selectedBandIndex !== null ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4 pointer-events-none'}`}>
            <div className="bg-dark-surface p-6 rounded-xl border border-gray-700 h-full">
                <h3 className="text-neon-blue font-bold text-sm uppercase mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                    Parametric Fine Tuning 
                    {selectedBandIndex !== null && <span className="text-white ml-2 opacity-50"> // Band {selectedBandIndex + 1}</span>}
                </h3>
                
                <div className="grid grid-cols-1 gap-4">
                    {/* Frequency */}
                    <div>
                    <div className="flex justify-between mb-1">
                        <label className="text-xs font-bold text-gray-400 uppercase">Frequency</label>
                        <span className="text-xs font-mono text-white">{selectedBandIndex !== null ? bands[selectedBandIndex].freq : 0} Hz</span>
                    </div>
                    <input 
                        type="range"
                        min="20"
                        max="20000"
                        step="1"
                        disabled={selectedBandIndex === null}
                        value={selectedBandIndex !== null ? bands[selectedBandIndex].freq : 1000}
                        onChange={(e) => handleParametricChange('freq', parseFloat(e.target.value))}
                        className="w-full h-2 bg-dark-bg rounded-lg appearance-none cursor-pointer accent-neon-green"
                    />
                    </div>

                    {/* Q Factor */}
                    <div>
                    <div className="flex justify-between mb-1">
                        <label className="text-xs font-bold text-gray-400 uppercase">Q Factor</label>
                        <span className="text-xs font-mono text-white">{selectedBandIndex !== null ? bands[selectedBandIndex].q : 1.4}</span>
                    </div>
                    <input 
                        type="range"
                        min="0.1"
                        max="10"
                        step="0.1"
                        disabled={selectedBandIndex === null}
                        value={selectedBandIndex !== null ? bands[selectedBandIndex].q : 1.4}
                        onChange={(e) => handleParametricChange('q', parseFloat(e.target.value))}
                        className="w-full h-2 bg-dark-bg rounded-lg appearance-none cursor-pointer accent-neon-pink"
                    />
                    <p className="text-[10px] text-gray-500 mt-1 text-right">Lower Q = Wider Bandwidth</p>
                    </div>
                </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default Equalizer;