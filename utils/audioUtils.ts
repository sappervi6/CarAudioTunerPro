// Singleton AudioContext
let audioCtx: AudioContext | null = null;
let activeOscillators: AudioNode[] = [];
let masterGain: GainNode | null = null;
let pannerNode: StereoPannerNode | null = null;
let analyserNode: AnalyserNode | null = null;
let frontGain: GainNode | null = null;
let rearGain: GainNode | null = null;

export const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create Nodes
    masterGain = audioCtx.createGain();
    frontGain = audioCtx.createGain();
    rearGain = audioCtx.createGain();
    pannerNode = audioCtx.createStereoPanner();
    analyserNode = audioCtx.createAnalyser();
    
    analyserNode.fftSize = 2048;
    
    // Routing: 
    // Source -> Panner -> MasterGain -> [FrontGain, RearGain] -> Analyser -> Destination
    // Note: Since standard Web Audio output is 2-channel, Front and Rear gains 
    // simply act as attenuators to simulate the level change before summing to destination
    // or to specific channel mergers if we had multi-channel output.
    // For this app, they are parallel paths to the analyser/destination.

    pannerNode.connect(masterGain);
    
    masterGain.connect(frontGain);
    masterGain.connect(rearGain);
    
    frontGain.connect(analyserNode);
    rearGain.connect(analyserNode);
    
    analyserNode.connect(audioCtx.destination);
  }
  return { audioCtx, masterGain, frontGain, rearGain, pannerNode, analyserNode };
};

export const setFader = (value: number) => {
  // Value -1 (Rear) to 1 (Front)
  const { frontGain, rearGain } = initAudio();
  if (!frontGain || !rearGain) return;

  const now = audioCtx?.currentTime || 0;
  
  // Equal power crossfade logic or linear
  // Simple Linear for Fader
  if (value > 0) {
    // Bias to Front
    frontGain.gain.setTargetAtTime(1, now, 0.1);
    rearGain.gain.setTargetAtTime(1 - value, now, 0.1);
  } else {
    // Bias to Rear
    frontGain.gain.setTargetAtTime(1 + value, now, 0.1); // value is negative
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

const createPinkNoise = (ctx: AudioContext): AudioBuffer => {
  const bufferSize = ctx.sampleRate * 2; // 2 seconds buffer, looped
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
  const { audioCtx, pannerNode } = initAudio();
  if (!audioCtx || !pannerNode) return;

  // Resume context if suspended (browser policy)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  stopAllSounds();
  pannerNode.pan.value = pan;
  setFader(fader);

  const now = audioCtx.currentTime;

  if (type === 'white_noise' || type === 'pink_noise') {
    const buffer = type === 'pink_noise' ? createPinkNoise(audioCtx) : createWhiteNoise(audioCtx);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(pannerNode);
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
      // Exponential ramp is better for audio perception
      osc.frequency.exponentialRampToValueAtTime(20000, now + duration);
    } else {
      osc.frequency.setValueAtTime(frequency, now);
    }

    osc.connect(pannerNode);
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