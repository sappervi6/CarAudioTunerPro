import React, { useState, useEffect, useRef } from 'react';
import { playTone, stopAllSounds, initAudio, setFader, updateFrequency } from '../utils/audioUtils';

const ToneGenerator: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [pan, setPan] = useState(0); // -1 Left, 1 Right
  const [fader, setFaderVal] = useState(0); // -1 Rear, 1 Front
  const [manualFreq, setManualFreq] = useState(1000); // Slider Frequency
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  const frequencies = [40, 80, 125, 400, 1000, 3000];
  const noiseTypes = [
    { id: 'white_noise', label: 'White Noise' },
    { id: 'pink_noise', label: 'Pink Noise' },
    { id: 'sweep', label: '20s Sweep (10Hz-20kHz)' }
  ];

  // Logic to convert slider value (0-100) to Frequency (20-20000) Logarithmically
  const sliderToFreq = (val: number) => {
    // log10(20) ~ 1.301
    // log10(20000) ~ 4.301
    // range = 3
    const minLog = 1.30103;
    const range = 3;
    const logVal = minLog + (val / 100) * range;
    return Math.round(Math.pow(10, logVal));
  };

  const freqToSlider = (freq: number) => {
    const minLog = 1.30103;
    const range = 3;
    const logVal = Math.log10(freq);
    return ((logVal - minLog) / range) * 100;
  };

  const handleManualFreqChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const freq = sliderToFreq(val);
    setManualFreq(freq);
    
    if (isPlaying === 'manual_slider') {
        updateFrequency(freq);
    }
  };

  const toggleManualSlider = () => {
      if (isPlaying === 'manual_slider') {
          stopAllSounds();
          setIsPlaying(null);
      } else {
          stopAllSounds();
          setIsPlaying('manual_slider');
          playTone(manualFreq, 'sine', 0, pan, fader); // 0 duration = loop
      }
  };

  const handlePlay = (id: string, freq: number, type: any, duration: number) => {
    if (isPlaying === id) {
      stopAllSounds();
      setIsPlaying(null);
    } else {
      setIsPlaying(id);
      playTone(freq, type, duration, pan, fader);
      // Auto reset playing state after duration if it's a timed event
      if (duration > 0 && duration < 600) { 
        setTimeout(() => {
            setIsPlaying(prev => prev === id ? null : prev);
        }, duration * 1000);
      }
    }
  };

  const handleStop = () => {
    stopAllSounds();
    setIsPlaying(null);
  };

  const handlePanChange = (val: number) => {
      setPan(val);
      const { pannerNode } = initAudio();
      if(pannerNode) pannerNode.pan.value = val;
  };

  const handleFaderChange = (val: number) => {
      setFaderVal(val);
      setFader(val);
  };

  // Visualizer Loop
  useEffect(() => {
    const renderVisualizer = () => {
      const { analyserNode } = initAudio();
      if (!analyserNode || !canvasRef.current) {
        animationRef.current = requestAnimationFrame(renderVisualizer);
        return;
      }
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const bufferLength = analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserNode.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#00f3ff');
        gradient.addColorStop(1, '#bc13fe');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }

      animationRef.current = requestAnimationFrame(renderVisualizer);
    };

    renderVisualizer();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-dark-card p-4 rounded-xl border border-gray-800 shadow-xl">
        <canvas 
            ref={canvasRef} 
            width={800} 
            height={150} 
            className="w-full h-32 bg-black/40 rounded-lg"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Frequency Tones */}
        <div className="bg-dark-card p-6 rounded-xl border border-gray-800">
           <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-800 pb-2">Manual Frequency</h3>
           
           <div className="mb-8 p-4 bg-dark-surface rounded-lg border border-gray-700">
               <div className="flex justify-between items-center mb-4">
                   <span className="text-gray-400 font-bold text-xs uppercase">Sweep Generator</span>
                   <span className="text-neon-blue font-mono text-xl font-bold">{manualFreq} Hz</span>
               </div>
               
               <input 
                 type="range"
                 min="0"
                 max="100"
                 step="0.1"
                 value={freqToSlider(manualFreq)}
                 onChange={handleManualFreqChange}
                 className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-neon-blue mb-4"
               />
               
               <div className="flex justify-between text-xs text-gray-500 mb-4">
                   <span>20Hz</span>
                   <span>1kHz</span>
                   <span>20kHz</span>
               </div>

               <button
                  onClick={toggleManualSlider}
                  className={`w-full py-3 rounded-lg font-bold transition-all border ${
                     isPlaying === 'manual_slider'
                       ? 'bg-neon-green text-black border-neon-green shadow-[0_0_15px_rgba(10,255,10,0.4)]'
                       : 'bg-dark-bg text-gray-300 border-gray-600 hover:text-white hover:border-gray-500'
                  }`}
               >
                  {isPlaying === 'manual_slider' ? 'STOP TONE' : 'PLAY TONE'}
               </button>
           </div>

           <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-800 pb-2">Presets</h3>
           <div className="grid grid-cols-3 gap-3">
             {frequencies.map(freq => (
               <button
                 key={freq}
                 onClick={() => handlePlay(`freq-${freq}`, freq, 'sine', 60)}
                 className={`py-4 rounded-lg font-bold transition-all border ${
                   isPlaying === `freq-${freq}`
                     ? 'bg-neon-blue text-black border-neon-blue'
                     : 'bg-dark-surface text-gray-300 border-gray-700 hover:border-neon-blue hover:text-white'
                 }`}
               >
                 {freq} Hz
               </button>
             ))}
           </div>
           
           <h3 className="text-lg font-bold text-white mt-8 mb-4 border-b border-gray-800 pb-2">Signals</h3>
            <div className="space-y-3">
                {noiseTypes.map(noise => (
                    <button
                        key={noise.id}
                        onClick={() => handlePlay(noise.id, 0, noise.id === 'sweep' ? 'sweep' : noise.id, noise.id === 'sweep' ? 20 : 60)}
                        className={`w-full py-3 rounded-lg font-bold transition-all border flex items-center justify-between px-4 ${
                            isPlaying === noise.id
                              ? 'bg-neon-pink text-black border-neon-pink'
                              : 'bg-dark-surface text-gray-300 border-gray-700 hover:border-neon-pink hover:text-white'
                        }`}
                    >
                        <span>{noise.label}</span>
                        {isPlaying === noise.id && <span className="animate-pulse">● PLAYING</span>}
                    </button>
                ))}
            </div>
        </div>

        {/* Spatial Controls */}
        <div className="bg-dark-card p-6 rounded-xl border border-gray-800">
            <h3 className="text-lg font-bold text-white mb-6 border-b border-gray-800 pb-2">Soundstage Control</h3>
            
            <div className="flex gap-8 items-center justify-center">
                {/* Fader (Vertical Slider) */}
                <div className="flex flex-col items-center h-64">
                    <span className="text-xs font-bold text-gray-400 mb-2">FRONT</span>
                    <input 
                        type="range" 
                        min="-1" 
                        max="1" 
                        step="0.1" 
                        value={fader}
                        {...({ orient: "vertical" } as any)}
                        onChange={(e) => handleFaderChange(parseFloat(e.target.value))}
                        className="h-full w-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-green"
                        style={{ writingMode: 'bt-lr', WebkitAppearance: 'slider-vertical' } as any}
                    />
                    <span className="text-xs font-bold text-gray-400 mt-2">REAR</span>
                </div>

                {/* Car Visualizer */}
                <div className="relative w-48 h-64 border-2 border-gray-700 rounded-2xl bg-dark-surface flex items-center justify-center overflow-hidden">
                    {/* Car outline */}
                    <div className="absolute inset-4 border border-gray-600 rounded-xl opacity-50"></div>
                    <div className="absolute top-8 left-4 right-4 h-1 bg-gray-600 opacity-50"></div> {/* Dash */}
                    <div className="absolute bottom-8 left-4 right-4 h-1 bg-gray-600 opacity-50"></div> {/* Rear Deck */}
                    
                    {/* Sound Point */}
                    <div 
                        className="absolute w-4 h-4 bg-neon-blue rounded-full shadow-[0_0_15px_rgba(0,243,255,0.8)] transition-all duration-100"
                        style={{
                            left: `${(pan + 1) * 50}%`,
                            top: `${(fader * -1 + 1) * 50}%`,
                            transform: 'translate(-50%, -50%)'
                        }}
                    />
                </div>
            </div>

            {/* Balance (Horizontal Slider) */}
            <div className="mt-6 px-12">
                <div className="flex justify-between text-xs text-gray-400 font-bold uppercase mb-2">
                    <span>Left</span>
                    <span>Right</span>
                </div>
                <input 
                    type="range" 
                    min="-1" 
                    max="1" 
                    step="0.1" 
                    value={pan}
                    onChange={(e) => handlePanChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-green"
                />
            </div>

            <div className="flex justify-center mt-6">
                <button 
                onClick={() => {
                    handlePanChange(0);
                    handleFaderChange(0);
                }}
                className="text-xs px-4 py-2 bg-gray-800 rounded hover:bg-gray-700 text-neon-green border border-gray-700"
                >
                Reset to Center
                </button>
            </div>
        </div>
      </div>
      
      {isPlaying && (
          <button 
            onClick={handleStop}
            className="fixed bottom-6 right-6 bg-red-600 text-white px-8 py-4 rounded-full font-bold shadow-2xl hover:bg-red-500 hover:scale-105 transition-transform z-50 flex items-center"
          >
             <span className="mr-2">■</span> STOP AUDIO
          </button>
      )}
    </div>
  );
};

export default ToneGenerator;