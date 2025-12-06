import React, { useState } from 'react';
import Calculator from './components/Calculator';
import SystemBuilder from './components/SystemBuilder';
import ToneGenerator from './components/ToneGenerator';
import RTA from './components/RTA';

enum Tab {
  CALCULATOR = 'Calculator',
  BUILDER = 'System Builder',
  GENERATOR = 'Tone Gen',
  RTA = 'RTA / Analyzer'
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.CALCULATOR);

  return (
    <div className="min-h-screen bg-dark-bg text-white pb-20">
      {/* Header */}
      <header className="border-b border-gray-800 bg-dark-bg/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-neon-blue to-neon-pink rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
            </div>
            <h1 className="font-bold text-xl tracking-tight">Audio<span className="text-neon-blue">Tuner</span> Pro</h1>
          </div>
        </div>
      </header>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="overflow-x-auto pb-2 mb-6">
          <div className="flex gap-2 p-1 bg-dark-surface rounded-xl w-max md:w-fit mx-auto md:mx-0">
            {Object.values(Tab).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 md:px-6 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab 
                    ? 'bg-gray-700 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <main className="animate-fade-in">
          {activeTab === Tab.CALCULATOR && <Calculator />}
          {activeTab === Tab.BUILDER && <SystemBuilder />}
          {activeTab === Tab.GENERATOR && <ToneGenerator />}
          {activeTab === Tab.RTA && <RTA />}
        </main>
      </div>
      
      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12 py-8 text-center text-gray-500 text-sm">
        <p>© 2024 AudioTuner Pro. Use responsibly. <br/> High volumes can damage hearing and equipment.</p>
      </footer>
    </div>
  );
};

export default App;