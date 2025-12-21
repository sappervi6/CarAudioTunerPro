import React from 'react';
import { ThemeConfig, ThemeMode, PRESET_THEMES, NFL_TEAMS } from '../utils/themeConstants';

interface ThemeSettingsProps {
  currentTheme: ThemeConfig;
  currentMode: ThemeMode;
  onThemeChange: (theme: ThemeConfig) => void;
  onModeChange: (mode: ThemeMode) => void;
}

const ThemeSettings: React.FC<ThemeSettingsProps> = ({ 
  currentTheme, 
  currentMode, 
  onThemeChange, 
  onModeChange 
}) => {
  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="bg-dark-card p-6 rounded-xl border border-gray-800 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-3 h-8 bg-gradient-to-b from-neon-blue to-neon-pink rounded-full"></span>
            Interface Customization
        </h2>

        {/* Mode Toggle */}
        <div className="mb-8">
            <h3 className="text-gray-400 font-bold text-sm uppercase mb-4">Display Mode</h3>
            <div className="flex bg-dark-surface p-1 rounded-lg w-fit border border-gray-700">
                <button
                    onClick={() => onModeChange('night')}
                    className={`px-6 py-2 rounded-md font-bold text-sm transition-all ${
                        currentMode === 'night' 
                        ? 'bg-gray-700 text-white shadow' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                >
                    <span className="mr-2">🌙</span> Night
                </button>
                <button
                    onClick={() => onModeChange('day')}
                    className={`px-6 py-2 rounded-md font-bold text-sm transition-all ${
                        currentMode === 'day' 
                        ? 'bg-white text-black shadow' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                >
                    <span className="mr-2">☀️</span> Day
                </button>
            </div>
        </div>

        {/* Built-in Themes */}
        <div className="mb-8">
            <h3 className="text-gray-400 font-bold text-sm uppercase mb-4">Preset Themes</h3>
            <div className="grid md:grid-cols-3 gap-4">
                {PRESET_THEMES.map(theme => (
                    <button
                        key={theme.id}
                        onClick={() => onThemeChange(theme)}
                        className={`relative p-4 rounded-xl border text-left transition-all overflow-hidden group ${
                            currentTheme.id === theme.id 
                            ? 'border-neon-blue bg-dark-surface' 
                            : 'border-gray-700 bg-dark-bg hover:border-gray-500'
                        }`}
                    >
                        <div className="relative z-10">
                            <h4 className={`font-bold ${currentTheme.id === theme.id ? 'text-white' : 'text-gray-300'}`}>
                                {theme.name}
                            </h4>
                            <div className="flex gap-2 mt-3">
                                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.colors.primary }}></div>
                                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.colors.secondary }}></div>
                                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.colors.tertiary }}></div>
                            </div>
                        </div>
                        {currentTheme.id === theme.id && (
                            <div className="absolute top-0 right-0 p-2">
                                <div className="w-2 h-2 rounded-full bg-neon-blue shadow-[0_0_8px_rgba(0,243,255,0.8)]"></div>
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>

        {/* NFL Themes */}
        <div>
            <h3 className="text-gray-400 font-bold text-sm uppercase mb-4 flex items-center">
                <span>NFL Team Colors</span>
                <span className="ml-2 px-2 py-0.5 rounded bg-blue-900/30 text-blue-400 text-[10px] border border-blue-800">UNOFFICIAL</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {NFL_TEAMS.map(team => (
                    <button
                        key={team.id}
                        onClick={() => onThemeChange(team)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                            currentTheme.id === team.id 
                            ? 'border-neon-blue bg-dark-surface ring-1 ring-neon-blue' 
                            : 'border-gray-700 bg-dark-bg hover:border-gray-500'
                        }`}
                    >
                        <div className="flex justify-between items-start mb-2">
                             <div className="font-bold text-xs text-gray-300 leading-tight">{team.name}</div>
                        </div>
                        <div className="h-2 w-full flex rounded-full overflow-hidden">
                             <div className="h-full w-1/2" style={{ backgroundColor: team.colors.primary }}></div>
                             <div className="h-full w-1/2" style={{ backgroundColor: team.colors.secondary }}></div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings;
