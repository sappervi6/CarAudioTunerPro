// Singleton AudioContext
let audioCtx: AudioContext | null = null;
let activeOscillators: AudioNode[] = [];
let masterGain: GainNode | null = null;
let pannerNode: StereoPannerNode | null = null;
let analyserNode: AnalyserNode | null = null;
let frontGain: GainNode | null = null;
let rearGain: GainNode | null = null;

// EQ Nodes
let eqInputNode: GainNode | null = null;
let eqOutputNode: GainNode | null = null;
let eqFilters: BiquadFilterNode[] = [];

export const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create Nodes
    masterGain = audioCtx.createGain();
    frontGain = audioCtx.createGain();
    rearGain = audioCtx.createGain();
    pannerNode = audioCtx.createStereoPanner();
    analyserNode = audioCtx.createAnalyser();
    
    // EQ Nodes
    eqInputNode = audioCtx.createGain();
    eqOutputNode = audioCtx.createGain();
    
    analyserNode.fftSize = 2048;
    
    // -- Routing Chain --
    // Source -> eqInputNode -> [Filter Chain] -> eqOutputNode -> Panner -> Master -> [Front/Rear] -> Analyser -> Dest
    
    // Create 16 Bands
    // ISO Standard 1/3 Octave roughly: 20, 30, 50, 80, 125, 200, 315, 500, 800, 1.25k, 2k, 3.15k, 5k, 8k, 12.5k, 20k
    const defaultFreqs = [20, 30, 50, 80, 125, 200, 315, 500, 800, 1250, 2000, 3150, 5000, 8000, 12500, 20000];
    
    let previousNode: AudioNode = eqInputNode;
    
    eqFilters = defaultFreqs.map(freq => {
        if (!audioCtx) throw new Error("No Audio Context");
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1.4; // Default Q roughly 1.4 for 2/3 octave bandwidth
        filter.gain.value = 0;
        
        previousNode.connect(filter);
        previousNode = filter;
        return filter;
    });
    
    // Connect last filter to EQ Output
    previousNode.connect(eqOutputNode);
    
    // Connect EQ Output to Panner (Rest of the original chain)
    eqOutputNode.connect(pannerNode);
    pannerNode.connect(masterGain);
    
    masterGain.connect(frontGain);
    masterGain.connect(rearGain);
    
    frontGain.connect(analyserNode);
    rearGain.connect(analyserNode);
    
    analyserNode.connect(audioCtx.destination);
  }
  return { audioCtx, masterGain, frontGain, rearGain, pannerNode, analyserNode, eqFilters, eqInputNode };
};

export const setEQBand = (index: number, gain: number, freq?: number, q?: number) => {
    const { eqFilters, audioCtx } = initAudio();
    if (!eqFilters || !eqFilters[index] || !audioCtx) return;
    
    const now = audioCtx.currentTime;
    const filter = eqFilters[index];
    
    filter.gain.setTargetAtTime(gain, now, 0.1);
    
    if (freq !== undefined) {
        filter.frequency.setTargetAtTime(freq, now, 0.1);
    }
    
    if (q !== undefined) {
        filter.Q.setTargetAtTime(q, now, 0.1);
    }
};

export const resetEQ = () => {
    const { eqFilters, audioCtx } = initAudio();
    if (!eqFilters || !audioCtx) return;
    const now = audioCtx.currentTime;
    
    eqFilters.forEach(filter => {
        filter.gain.setTargetAtTime(0, now, 0.1);
        filter.Q.setTargetAtTime(1.4, now, 0.1);
    });
};

export const setFader = (value: number) => {
  // Value -1 (Rear) to 1 (Front)
  const { frontGain, rearGain } = initAudio();
  if (!frontGain || !rearGain) return;

  const now = audioCtx?.currentTime || 0;
  
  if (value > 0) {
    frontGain.gain.setTargetAtTime(1, now, 0.1);
    rearGain.gain.setTargetAtTime(1 - value, now, 0.1);
  } else {
    frontGain.gain.setTargetAtTime(1 + value, now, 0.1); 
    rearGain.gain.setTargetAtTime(1, now, 0.1);
  }
};

export const stopAllSounds = () => {
  activeOscillators.forEach(node => {
    try {
      if (node instanceof AudioBufferSourceNode) {
        node.stop();
      } else if (node instanceof OscillatorNode) {
        node.stop();
      }
      node.disconnect();
    } catch (e) {
      // Ignore errors if already stopped
    }
  });
  activeOscillators = [];
};

export const updateFrequency = (frequency: number) => {
  const now = audioCtx?.currentTime || 0;
  activeOscillators.forEach(node => {
    if (node instanceof OscillatorNode) {
      node.frequency.setTargetAtTime(frequency, now, 0.05);
    }
  });
};

export const decodeAudio = async (arrayBuffer: ArrayBuffer): Promise<AudioBuffer> => {
    const { audioCtx } = initAudio();
    if (!audioCtx) throw new Error("Audio Context not initialized");
    return await audioCtx.decodeAudioData(arrayBuffer);
};

export const playBuffer = (buffer: AudioBuffer, loop: boolean = false) => {
  const { audioCtx, eqInputNode } = initAudio();
  if (!audioCtx || !eqInputNode) return;

  // Resume context if suspended
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  stopAllSounds();

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.loop = loop;
  source.connect(eqInputNode);
  source.start(0);
  activeOscillators.push(source);
  
  return source;
};

const createPinkNoise = (ctx: AudioContext): AudioBuffer => {
  const bufferSize = ctx.sampleRate * 2; 
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168981;
    output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    output[i] *= 0.11;
    b6 = white * 0.115926;
  }
  return buffer;
};

const createWhiteNoise = (ctx: AudioContext): AudioBuffer => {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  return buffer;
};

export const playTone = (
  frequency: number, 
  type: 'sine' | 'sweep' | 'white_noise' | 'pink_noise', 
  duration: number,
  pan: number = 0,
  fader: number = 0
) => {
  const { audioCtx, pannerNode, eqInputNode } = initAudio();
  if (!audioCtx || !pannerNode || !eqInputNode) return;

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  stopAllSounds();
  pannerNode.pan.value = pan;
  setFader(fader);

  const now = audioCtx.currentTime;
  const destination = eqInputNode;

  if (type === 'white_noise' || type === 'pink_noise') {
    const buffer = type === 'pink_noise' ? createPinkNoise(audioCtx) : createWhiteNoise(audioCtx);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(destination);
    source.start(now);
    
    if (duration > 0) {
        source.stop(now + duration);
    }
    activeOscillators.push(source);

  } else {
    const osc = audioCtx.createOscillator();
    osc.type = type === 'sweep' ? 'sine' : 'sine';
    
    if (type === 'sweep') {
      osc.frequency.setValueAtTime(10, now);
      osc.frequency.exponentialRampToValueAtTime(20000, now + duration);
    } else {
      osc.frequency.setValueAtTime(frequency, now);
    }

    osc.connect(destination);
    osc.start(now);
    if (duration > 0) {
        osc.stop(now + duration);
    }
    activeOscillators.push(osc);
  }
};

export const getAnalyserData = (dataArray: Uint8Array) => {
  if (analyserNode) {
    analyserNode.getByteFrequencyData(dataArray);
  }
};