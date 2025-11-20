import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import { Download, Terminal, CheckCircle2, Play, Cpu, Package, HardDrive } from 'lucide-react';

interface ProjectDownloadProps {
  content: string;
}

interface ProjectData {
  name: string;
  files: { path: string; content: string }[];
}

export const ProjectDownload: React.FC<ProjectDownloadProps> = ({ content }) => {
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildComplete, setBuildComplete] = useState(false);
  const [parsed, setParsed] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const cleanedContent = content.trim();
      if (!cleanedContent) return;
      const data = JSON.parse(cleanedContent);
      if (data.name && Array.isArray(data.files)) {
        setProjectData(data);
        setParsed(true);
      }
    } catch (e) {
      // Wait for valid JSON
    }
  }, [content]);

  useEffect(() => {
    if (parsed && projectData && !isBuilding && !buildComplete) {
      runBuildSequence();
    }
  }, [parsed, projectData]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines]);

  const addLine = (text: string, delay: number) => {
    return new Promise<void>(resolve => {
      setTimeout(() => {
        setTerminalLines(prev => [...prev, text]);
        resolve();
      }, delay);
    });
  };

  const runBuildSequence = async () => {
    if (!projectData) return;
    setIsBuilding(true);
    setTerminalLines([]);

    await addLine(`root@apex-arch:~/workspace# python3 generate_project.py --target="${projectData.name}"`, 400);
    await addLine(`[BOOT] Initializing Virtual Environment (venv-3.12)...`, 600);
    await addLine(`[INFO] Loaded project manifest: ${projectData.name}.json`, 300);
    await addLine(`[FS] Mounting virtual filesystem...`, 400);
    
    // Fast forward through files
    for (let i = 0; i < Math.min(projectData.files.length, 5); i++) {
      await addLine(`[WRITE] ${projectData.files[i].path} ... OK`, 150);
    }
    
    if (projectData.files.length > 5) {
      await addLine(`[WRITE] ... (${projectData.files.length - 5} more files) ... OK`, 200);
    }

    await addLine(`[COMPRESS] Executing DEFLATE algorithm...`, 500);
    await addLine(`[SUCCESS] Build artifact created: ${projectData.name}.zip`, 400);
    
    setIsBuilding(false);
    setBuildComplete(true);
  };

  const handleDownload = async () => {
    if (!projectData) return;
    try {
      const zip = new JSZip();
      projectData.files.forEach(file => {
        zip.file(file.path, file.content);
      });
      
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectData.name || 'project'}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to zip", e);
    }
  };

  if (!parsed) {
     // Loading state before we even have the JSON
     return (
      <div className="my-4 p-4 rounded-lg border border-indigo-500/20 bg-black/40 font-mono text-xs text-indigo-400/50 animate-pulse">
        &lt;WAITING_FOR_STREAM_COMPLETION&gt;
      </div>
     );
  }

  return (
    <div className="my-6 rounded-lg overflow-hidden border border-gray-700 bg-[#0c0c0c] shadow-2xl font-mono text-sm relative group">
      {/* CRT Scanline Effect Overlay */}
      <div className="absolute inset-0 crt-overlay opacity-10 pointer-events-none z-20"></div>

      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-b border-gray-800 select-none">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
          </div>
          <div className="ml-3 flex items-center gap-1.5 text-xs text-gray-400">
            <Terminal className="w-3.5 h-3.5" />
            <span>apex-terminal — python3</span>
          </div>
        </div>
        <div className="text-[10px] text-gray-600">v.4.0.1</div>
      </div>

      {/* Terminal Body */}
      <div 
        ref={terminalRef}
        className="p-4 h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent text-green-500/90 font-medium leading-relaxed"
        style={{ textShadow: '0 0 2px rgba(34, 197, 94, 0.3)' }}
      >
        {terminalLines.map((line, idx) => (
          <div key={idx} className="break-words">
            {line}
          </div>
        ))}
        {isBuilding && (
          <div className="animate-pulse inline-block w-2 h-4 bg-green-500/50 align-middle ml-1"></div>
        )}
        
        {buildComplete && (
          <div className="mt-4 p-3 border border-green-500/30 bg-green-500/5 rounded flex items-center justify-between group-hover:border-green-500/50 transition-colors">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-green-400" />
              <div>
                <div className="text-green-300 font-bold">Build Successful</div>
                <div className="text-xs text-green-500/60">{projectData?.files.length} files ready for deployment</div>
              </div>
            </div>
            
            <button 
              onClick={handleDownload}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-black font-bold text-xs uppercase tracking-wider rounded shadow-[0_0_15px_rgba(34,197,94,0.4)] hover:shadow-[0_0_25px_rgba(34,197,94,0.6)] transition-all flex items-center gap-2 active:translate-y-0.5"
            >
              <Download className="w-4 h-4" />
              Download .ZIP
            </button>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="px-3 py-1 bg-[#111] border-t border-gray-800 flex items-center justify-between text-[10px] text-gray-500 font-sans">
         <div className="flex items-center gap-3">
           <span className="flex items-center gap-1">
             <Cpu className="w-3 h-3" />
             <span>PID: {Math.floor(Math.random() * 9000) + 1000}</span>
           </span>
           <span className="flex items-center gap-1">
             <HardDrive className="w-3 h-3" />
             <span>VIRTUAL_FS</span>
           </span>
         </div>
         <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${buildComplete ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
            <span>{buildComplete ? 'IDLE' : 'EXECUTING'}</span>
         </div>
      </div>
    </div>
  );
};
