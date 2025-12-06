import React, { useEffect, useRef, useState } from 'react';

type WeightingType = 'A' | 'B' | 'C' | 'Z';

const RTA: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [weighting, setWeighting] = useState<WeightingType>('Z');
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  // Weighting calculations
  const calculateWeighting = (f: number, type: WeightingType): number => {
    if (f === 0) return -100;
    if (type === 'Z') return 0; // Flat

    const f2 = f * f;
    
    // A-Weighting
    if (type === 'A') {
      const c1 = 12194 ** 2;
      const c2 = 20.6 ** 2;
      const c3 = 107.7 ** 2;
      const c4 = 737.9 ** 2;
      const num = c1 * (f ** 4);
      const den = (f2 + c2) * Math.sqrt((f2 + c3) * (f2 + c4)) * (f2 + c1);
      const ra = num / den;
      return 20 * Math.log10(ra) + 2.0;
    }

    // C-Weighting
    if (type === 'C') {
      const c1 = 12194 ** 2;
      const c2 = 20.6 ** 2;
      const num = c1 * f2;
      const den = (f2 + c2) * (f2 + c1);
      const rc = num / den;
      return 20 * Math.log10(rc) + 0.06;
    }

    // B-Weighting (Approximate)
    if (type === 'B') {
      const c1 = 12194 ** 2;
      const c2 = 20.6 ** 2;
      const c3 = 158.5 ** 2;
      const num = c1 * (f ** 3);
      const den = (f2 + c2) * Math.sqrt(f2 + c3) * (f2 + c1);
      const rb = num / den;
      return 20 * Math.log10(rb) + 0.17;
    }

    return 0;
  };

  const startAnalyzer = async () => {
    try {
      setError(null);
      
      // Check for API support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser does not support microphone access.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0.85;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      setIsListening(true);
      draw();
    } catch (err: any) {
      console.error("RTA Start Error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Permission denied. Please allow microphone access in your browser settings to use the RTA.");
      } else if (err.name === 'NotFoundError') {
        setError("No microphone found on this device.");
      } else {
        setError(err.message || "Failed to access microphone.");
      }
      setIsListening(false);
    }
  };

  const stopAnalyzer = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setIsListening(false);
  };

  const draw = () => {
    if (!canvasRef.current || !analyserRef.current || !audioContextRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    analyserRef.current.getFloatFrequencyData(dataArray);

    const width = canvas.width;
    const height = canvas.height;
    const sampleRate = audioContextRef.current.sampleRate;

    // Clear
    ctx.fillStyle = '#0f1115';
    ctx.fillRect(0, 0, width, height);

    // Draw Grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    // Y-Axis Grid (dB)
    const dbRange = 100; // Display range: -100dB to 0dB
    for (let db = 0; db >= -100; db -= 20) {
      const yPos = (db / -100) * (height - 20) + 10;
      
      ctx.moveTo(0, yPos);
      ctx.lineTo(width, yPos);
      ctx.fillStyle = '#666';
      ctx.font = '10px monospace';
      ctx.fillText(`${db} dB`, 5, yPos - 2);
    }

    // X-Axis Log Grid
    const logMin = Math.log10(20);
    const logMax = Math.log10(20000);
    const scale = width / (logMax - logMin);

    const freqLabels = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
    freqLabels.forEach(f => {
      const logF = Math.log10(f);
      const x = (logF - logMin) * scale;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.fillStyle = '#666';
      ctx.fillText(f >= 1000 ? `${f/1000}k` : `${f}`, x + 2, height - 5);
    });
    ctx.stroke();

    // Draw Spectrum
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00f3ff';
    
    let started = false;

    for (let x = 0; x < width; x++) {
      // Inverse map x to frequency
      const logFreq = (x / scale) + logMin;
      const freq = Math.pow(10, logFreq);

      // Find index in FFT
      const index = Math.round(freq * bufferLength / (sampleRate / 2));
      
      if (index >= 0 && index < bufferLength) {
        let db = dataArray[index];
        
        // Apply Weighting
        db += calculateWeighting(freq, weighting);

        // Clamp visual range (-100 to 0)
        let y = (db / -100) * (height - 20) + 10;
        
        if (y < 0) y = 0;
        if (y > height) y = height;

        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
    }
    
    ctx.stroke();

    // Fill gradient
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(0, 243, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(188, 19, 254, 0.1)');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Stats
    ctx.fillStyle = '#fff';
    ctx.font = '12px Inter';
    ctx.fillText(`Weighting: ${weighting}-Weighted`, width - 150, 30);
    ctx.fillText(`Source: Microphone`, width - 150, 50);

    animationRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    return () => stopAnalyzer();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
           <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
             <span className="w-3 h-8 bg-gradient-to-b from-neon-blue to-neon-pink rounded-full"></span>
             Real-Time Analyzer
           </h2>
           <p className="text-gray-400 text-sm">Use Pink Noise in "Tone Gen" tab to tune your system.</p>
        </div>
        
        <div className="flex gap-2">
          {['A', 'B', 'C', 'Z'].map((w) => (
             <button
               key={w}
               onClick={() => setWeighting(w as WeightingType)}
               className={`w-10 h-10 rounded font-bold border ${weighting === w ? 'bg-neon-blue text-black border-neon-blue' : 'bg-dark-surface border-gray-700 text-gray-400'}`}
             >
               {w}
             </button>
          ))}
        </div>
      </div>

      <div className="bg-dark-card p-1 rounded-xl border border-gray-800 shadow-2xl relative">
        <canvas 
          ref={canvasRef}
          width={1024}
          height={400}
          className="w-full h-[300px] md:h-[400px] bg-[#0f1115] rounded-lg"
        />
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg z-10 backdrop-blur-sm">
             <div className="text-center p-6 max-w-md">
                <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-white font-bold text-lg mb-2">Access Denied</h3>
                <p className="text-gray-300 text-sm mb-6">{error}</p>
                <div className="flex justify-center gap-4">
                    <button 
                        onClick={() => setError(null)} 
                        className="px-4 py-2 rounded text-gray-400 hover:text-white border border-gray-700 hover:bg-gray-800 transition-colors"
                    >
                        Dismiss
                    </button>
                    <button 
                        onClick={startAnalyzer} 
                        className="px-4 py-2 bg-neon-blue text-black rounded font-bold hover:bg-neon-blue/90 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
             </div>
          </div>
        )}
      </div>

      <div className="flex justify-center">
        {!isListening ? (
          <button 
            onClick={startAnalyzer}
            className="px-8 py-4 bg-neon-blue/20 text-neon-blue border border-neon-blue rounded-full font-bold text-lg hover:bg-neon-blue hover:text-black transition-all shadow-[0_0_20px_rgba(0,243,255,0.3)]"
          >
            START MICROPHONE
          </button>
        ) : (
          <button 
            onClick={stopAnalyzer}
            className="px-8 py-4 bg-red-500/20 text-red-500 border border-red-500 rounded-full font-bold text-lg hover:bg-red-500 hover:text-white transition-all"
          >
            STOP ANALYZER
          </button>
        )}
      </div>
      
      <div className="bg-dark-surface p-4 rounded-lg border border-gray-800 text-xs text-gray-500">
         <strong className="text-gray-300 block mb-1">RTA Tuning Tips:</strong>
         <ul className="list-disc pl-4 space-y-1">
            <li>Select <strong>Pink Noise</strong> in the Tone Generator tab.</li>
            <li>Use <strong>C-Weighting</strong> for high volume / general response.</li>
            <li>Use <strong>A-Weighting</strong> for checking audible harshness or safety levels.</li>
            <li>Use <strong>Z-Weighting</strong> (Zero) for raw electrical measurement or sub-bass.</li>
            <li>Aim for a "House Curve" (slightly elevated bass, gently rolling off highs) rather than perfectly flat.</li>
         </ul>
      </div>
    </div>
  );
};

export default RTA;