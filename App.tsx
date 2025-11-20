
import React from 'react';
import { ChatInterface } from './components/ChatInterface';

const App: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans overflow-hidden">
      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative w-full h-full">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
        <ChatInterface />
      </main>
    </div>
  );
};

export default App;
