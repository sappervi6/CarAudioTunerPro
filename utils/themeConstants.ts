export type ThemeMode = 'day' | 'night';
export type ThemeType = 'preset' | 'nfl';

export interface ThemeConfig {
  id: string;
  name: string;
  type: ThemeType;
  colors: {
    primary: string;
    secondary: string;
    tertiary: string;
    bg?: string; // Optional custom bg overrides
    card?: string;
  };
}

export const PRESET_THEMES: ThemeConfig[] = [
  {
    id: 'cyberpunk',
    name: 'Clean Gray',
    type: 'preset',
    colors: {
      primary: '#FFFFFF', // Neon Blue
      secondary: '#a1b2c3', // Neon Pink
      tertiary: '#6a6a6a', // Neon Green
    }
  },
  {
    id: 'studio',
    name: 'Classic Studio',
    type: 'preset',
    colors: {
      primary: '#fbbf24', // Amber/Gold
      secondary: '#f87171', // Soft Red
      tertiary: '#34d399', // Emerald
    }
  },
  {
    id: 'midnight',
    name: 'Midnight Pro',
    type: 'preset',
    colors: {
      primary: '#818cf8', // Indigo
      secondary: '#2dd4bf', // Teal
      tertiary: '#f472b6', // Pink
    }
  }
];

export const NFL_TEAMS: ThemeConfig[] = [
  // NFC East
  { id: 'dal', name: 'Dallas Cowboys', type: 'nfl', colors: { primary: '#003594', secondary: '#869397', tertiary: '#FFFFFF' } },
  { id: 'nyg', name: 'New York Giants', type: 'nfl', colors: { primary: '#002244', secondary: '#A71930', tertiary: '#FFFFFF' } },
  { id: 'phi', name: 'Philadelphia Eagles', type: 'nfl', colors: { primary: '#004C54', secondary: '#A5ACAF', tertiary: '#000000' } },
  { id: 'was', name: 'Washington Commanders', type: 'nfl', colors: { primary: '#5A1414', secondary: '#FFB612', tertiary: '#FFFFFF' } },
  
  // NFC North
  { id: 'chi', name: 'Chicago Bears', type: 'nfl', colors: { primary: '#0B162A', secondary: '#C83803', tertiary: '#FFFFFF' } },
  { id: 'det', name: 'Detroit Lions', type: 'nfl', colors: { primary: '#0076B6', secondary: '#B0B7BC', tertiary: '#000000' } },
  { id: 'gb', name: 'Green Bay Packers', type: 'nfl', colors: { primary: '#203731', secondary: '#FFB612', tertiary: '#FFFFFF' } },
  { id: 'min', name: 'Minnesota Vikings', type: 'nfl', colors: { primary: '#4F2683', secondary: '#FFC62F', tertiary: '#FFFFFF' } },

  // NFC South
  { id: 'atl', name: 'Atlanta Falcons', type: 'nfl', colors: { primary: '#A71930', secondary: '#000000', tertiary: '#A5ACAF' } },
  { id: 'car', name: 'Carolina Panthers', type: 'nfl', colors: { primary: '#0085CA', secondary: '#101820', tertiary: '#A5ACAF' } },
  { id: 'no', name: 'New Orleans Saints', type: 'nfl', colors: { primary: '#D3BC8D', secondary: '#101820', tertiary: '#FFFFFF' } },
  { id: 'tb', name: 'Tampa Bay Buccaneers', type: 'nfl', colors: { primary: '#D50A0A', secondary: '#34302B', tertiary: '#FF7900' } },

  // NFC West
  { id: 'ari', name: 'Arizona Cardinals', type: 'nfl', colors: { primary: '#97233F', secondary: '#000000', tertiary: '#FFFFFF' } },
  { id: 'lar', name: 'Los Angeles Rams', type: 'nfl', colors: { primary: '#003594', secondary: '#FFA300', tertiary: '#FFFFFF' } },
  { id: 'sf', name: 'San Francisco 49ers', type: 'nfl', colors: { primary: '#AA0000', secondary: '#B3995D', tertiary: '#000000' } },
  { id: 'sea', name: 'Seattle Seahawks', type: 'nfl', colors: { primary: '#002244', secondary: '#69BE28', tertiary: '#A5ACAF' } },

  // AFC East
  { id: 'buf', name: 'Buffalo Bills', type: 'nfl', colors: { primary: '#00338D', secondary: '#C60C30', tertiary: '#FFFFFF' } },
  { id: 'mia', name: 'Miami Dolphins', type: 'nfl', colors: { primary: '#008E97', secondary: '#FC4C02', tertiary: '#005778' } },
  { id: 'ne', name: 'New England Patriots', type: 'nfl', colors: { primary: '#002244', secondary: '#C60C30', tertiary: '#B0B7BC' } },
  { id: 'nyj', name: 'New York Jets', type: 'nfl', colors: { primary: '#125740', secondary: '#000000', tertiary: '#FFFFFF' } },

  // AFC North
  { id: 'bal', name: 'Baltimore Ravens', type: 'nfl', colors: { primary: '#241773', secondary: '#9E7C0C', tertiary: '#000000' } },
  { id: 'cin', name: 'Cincinnati Bengals', type: 'nfl', colors: { primary: '#FB4F14', secondary: '#000000', tertiary: '#FFFFFF' } },
  { id: 'cle', name: 'Cleveland Browns', type: 'nfl', colors: { primary: '#311D00', secondary: '#FF3C00', tertiary: '#FFFFFF' } },
  { id: 'pit', name: 'Pittsburgh Steelers', type: 'nfl', colors: { primary: '#FFB612', secondary: '#101820', tertiary: '#FFFFFF' } },

  // AFC South
  { id: 'hou', name: 'Houston Texans', type: 'nfl', colors: { primary: '#03202F', secondary: '#A71930', tertiary: '#FFFFFF' } },
  { id: 'ind', name: 'Indianapolis Colts', type: 'nfl', colors: { primary: '#002C5F', secondary: '#A2AAAD', tertiary: '#FFFFFF' } },
  { id: 'jax', name: 'Jacksonville Jaguars', type: 'nfl', colors: { primary: '#006778', secondary: '#9F792C', tertiary: '#000000' } },
  { id: 'ten', name: 'Tennessee Titans', type: 'nfl', colors: { primary: '#0C2340', secondary: '#4B92DB', tertiary: '#C8102E' } },

  // AFC West
  { id: 'den', name: 'Denver Broncos', type: 'nfl', colors: { primary: '#FB4F14', secondary: '#002244', tertiary: '#FFFFFF' } },
  { id: 'kc', name: 'Kansas City Chiefs', type: 'nfl', colors: { primary: '#E31837', secondary: '#FFB81C', tertiary: '#FFFFFF' } },
  { id: 'lv', name: 'Las Vegas Raiders', type: 'nfl', colors: { primary: '#000000', secondary: '#A5ACAF', tertiary: '#FFFFFF' } },
  { id: 'lac', name: 'Los Angeles Chargers', type: 'nfl', colors: { primary: '#0080C6', secondary: '#FFC20E', tertiary: '#FFFFFF' } },
];

export const applyTheme = (theme: ThemeConfig, mode: ThemeMode) => {
  const root = document.documentElement;
  const isNight = mode === 'night';
  const c = theme.colors;

  // -- Base Colors --
  if (isNight) {
    // NIGHT MODE
    if (theme.type === 'nfl') {
      // For NFL Night, we want a dark but colored vibe, or strict dark
      // Using primary/secondary as accents on dark
      root.style.setProperty('--color-bg', '#0f1115'); // Standard Dark
      root.style.setProperty('--color-card', '#161b22');
      root.style.setProperty('--color-surface', '#21262d');
      root.style.setProperty('--color-surface-dark', '#0d1117');
      
      root.style.setProperty('--color-text-main', '#ffffff');
      root.style.setProperty('--color-text-inverse', '#000000');
      root.style.setProperty('--color-text-muted', '#d1d5db');
      root.style.setProperty('--color-text-dim', '#9ca3af');
      root.style.setProperty('--color-text-dimmer', '#6b7280');
      
      root.style.setProperty('--color-border', '#4b5563');
      root.style.setProperty('--color-border-dim', '#374151');
      root.style.setProperty('--color-border-dark', '#1f2937');
    } else {
      // PRESETS NIGHT
      // Default colors or slight variations per preset could go here
      root.style.setProperty('--color-bg', '#0f1115');
      root.style.setProperty('--color-card', '#161b22');
      root.style.setProperty('--color-surface', '#21262d');
      root.style.setProperty('--color-surface-dark', '#0d1117');
      
      root.style.setProperty('--color-text-main', '#ffffff');
      root.style.setProperty('--color-text-inverse', '#000000');
      root.style.setProperty('--color-text-muted', '#d1d5db');
      root.style.setProperty('--color-text-dim', '#9ca3af');
      root.style.setProperty('--color-text-dimmer', '#6b7280');
      
      root.style.setProperty('--color-border', '#4b5563');
      root.style.setProperty('--color-border-dim', '#374151');
      root.style.setProperty('--color-border-dark', '#1f2937');
    }
  } else {
    // DAY MODE
    // Inverted Backgrounds
    root.style.setProperty('--color-bg', '#f3f4f6');      // gray-100
    root.style.setProperty('--color-card', '#ffffff');    // white
    root.style.setProperty('--color-surface', '#e5e7eb'); // gray-200
    root.style.setProperty('--color-surface-dark', '#d1d5db'); // gray-300
    
    // Inverted Text
    root.style.setProperty('--color-text-main', '#111827'); // gray-900
    root.style.setProperty('--color-text-inverse', '#ffffff');
    root.style.setProperty('--color-text-muted', '#374151'); // gray-700
    root.style.setProperty('--color-text-dim', '#4b5563');   // gray-600
    root.style.setProperty('--color-text-dimmer', '#6b7280'); // gray-500
    
    // Inverted Borders
    root.style.setProperty('--color-border', '#d1d5db');     // gray-300
    root.style.setProperty('--color-border-dim', '#e5e7eb'); // gray-200
    root.style.setProperty('--color-border-dark', '#f3f4f6');// gray-100
  }

  // -- Accents (Applied for both Day/Night based on selection) --
  root.style.setProperty('--color-primary', c.primary);
  root.style.setProperty('--color-secondary', c.secondary);
  root.style.setProperty('--color-tertiary', c.tertiary);
};