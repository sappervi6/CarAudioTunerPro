export interface SpeakerSpecs {
  size: string;
  rmsPower: number;
  impedance: number;
  voiceCoils: 'Single' | 'Dual';
  sensitivity: number;
  type: 'Subwoofer' | 'Component' | 'Coaxial' | 'Midrange' | 'Tweeter';
}

export interface OhmValues {
  volts: string;
  amps: string;
  watts: string;
  ohms: string;
}

export type ToneType = 'sine' | 'square' | 'sawtooth' | 'triangle' | 'white_noise' | 'pink_noise' | 'sweep';

export interface ToneConfig {
  frequency: number;
  duration?: number; // seconds
  type: ToneType;
  label: string;
}

// System Builder Types
export type SpeakerSize = '1"' | '3.5"' | '4"' | '5.25"' | '6.5"' | '5x7"' | '6x8"' | '6x9"' | '8"' | '10"' | '12"' | '15"';

export interface SpeakerZone {
  enabled: boolean;
  location: string;
  size: SpeakerSize;
  isComponent: boolean; // separate tweeter
  count: number;
  // Electrical Specs
  rmsPerSpeaker: number;
  impedance: number;
  sensitivity: number;
}

export interface SubwooferZone {
  enabled: boolean;
  location: 'Trunk' | 'Underseat' | 'Rear Deck' | 'Center Console';
  size: SpeakerSize;
  count: number;
  enclosureType: 'Sealed' | 'Ported' | 'Bandpass' | 'Free Air';
  // Electrical Specs
  rmsPerSub: number;
  impedance: number;
  sensitivity: number;
}

export interface PortConfig {
  boxVolume: number; // Cubic Feet
  tuningFreq: number; // Hz
  portType: 'Round' | 'Slot';
  portDiameter: number; // Inches (or width for slot)
  portHeight?: number; // Inches (for slot)
  numPorts: number;
}

export interface SystemConfig {
  frontDoor: SpeakerZone;
  rearDoor: SpeakerZone;
  frontDash: SpeakerZone;
  frontPillars: SpeakerZone;
  centerChannel: SpeakerZone;
  rearDeck: SpeakerZone;
  subwoofer: SubwooferZone;
  enclosure: PortConfig;
}