import React, { useEffect, useState } from 'react';
import { Cpu, Database, Wifi, Activity, Zap } from 'lucide-react';

export const ProcessingUnit: React.FC = () => {
  const [logLines, setLogLines] = useState<string[]>([]);
  const [cpuUsage, setCpuUsage] = useState(12);
  const [memoryUsage, setMemoryUsage] = useState(34);

  useEffect(() => {
    const logs = [
      "Initializing neural pathways...",
      "Loading language models...",
      "Analyzing syntactic structures...",
      "Optimizing logic gates...",
      "Fetching context vectors...",
      "Verifying constraints...",
      "Compiling response buffer..."
    ];
    
    let index = 0;
    const interval = setInterval(() => {
      if (index < logs.length) {
        setLogLines(prev => [...prev.slice(-3), `> ${logs[index]}`]);
        setCpuUsage(prev => Math.min(99, prev + Math.floor(Math.random() * 15)));
        setMemoryUsage(prev => Math.min(90, prev + Math.floor(Math.random() * 10)));
        index++;
      }
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-md my-4 p-1 bg-gray-950/80 border border-indigo-500/30 rounded-lg overflow-hidden backdrop-blur-sm shadow-lg shadow-indigo-500/10">
      <div className="bg-gray-900/80 p-3 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span className="text-xs font-mono text-indigo-300 font-bold tracking-wider">APEX_CORE_V3.1</span>
        </div>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500/40"></div>
          <div className="w-2 h-2 rounded-full bg-yellow-500/40"></div>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        </div>
      </div>
      
      <div className="p-4 grid grid-cols-2 gap-4">
        {/* Stats */}
        <div className="space-y-3">
          <div className="bg-gray-900/50 p-2 rounded border border-gray-800/50">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Cpu className="w-3 h-3" />
                <span>CPU</span>
              </div>
              <span className="text-xs font-mono text-indigo-400">{cpuUsage}%</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${cpuUsage}%` }}></div>
            </div>
          </div>
          
          <div className="bg-gray-900/50 p-2 rounded border border-gray-800/50">
             <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Database className="w-3 h-3" />
                <span>MEM</span>
              </div>
              <span className="text-xs font-mono text-emerald-400">{memoryUsage}GB</span>
            </div>
             <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${memoryUsage}%` }}></div>
            </div>
          </div>
        </div>

        {/* Terminal Log */}
        <div className="bg-black/40 rounded border border-indigo-500/20 p-2 font-mono text-[10px] text-indigo-300/80 leading-relaxed h-[88px] flex flex-col justify-end overflow-hidden relative">
           <div className="absolute inset-0 crt-overlay opacity-20"></div>
           {logLines.map((line, i) => (
             <div key={i} className="truncate animate-pulse">{line}</div>
           ))}
           <div className="flex items-center gap-1 mt-1">
             <span className="text-indigo-500">_</span>
           </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-indigo-900/20 py-1 px-3 flex items-center justify-between">
         <div className="flex items-center gap-2 text-[10px] text-indigo-400/60">
            <Wifi className="w-3 h-3" />
            <span>UPLINK_ESTABLISHED</span>
         </div>
         <div className="flex items-center gap-1 text-[10px] text-indigo-400/60">
            <Zap className="w-3 h-3" />
            <span>PROCESSING</span>
         </div>
      </div>
    </div>
  );
};
