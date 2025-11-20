import React from 'react';
import { ChatInterface } from './components/ChatInterface';
import { Terminal, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-950 shadow-md z-10">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20">
            <Terminal className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">DevBot AI</h1>
            <div className="flex items-center space-x-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs text-gray-400 font-medium">gemini-3-pro-preview</span>
            </div>
          </div>
        </div>
        
        <div className="hidden sm:flex items-center space-x-4 text-sm text-gray-400">
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-gray-900 border border-gray-800">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Secure Environment</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
        <ChatInterface />
      </main>
    </div>
  );
};

export default App;