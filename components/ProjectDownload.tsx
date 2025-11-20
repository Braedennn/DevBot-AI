import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { Download, Package, Loader2, FileCode, AlertCircle } from 'lucide-react';

interface ProjectDownloadProps {
  content: string;
}

interface ProjectData {
  name: string;
  files: { path: string; content: string }[];
}

export const ProjectDownload: React.FC<ProjectDownloadProps> = ({ content }) => {
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [isParsing, setIsParsing] = useState(true);

  useEffect(() => {
    const parseContent = () => {
      try {
        // Clean up potential markdown artifacts if the model includes them inside the block erroneously
        const cleanedContent = content.trim();
        if (!cleanedContent) return;

        const parsed = JSON.parse(cleanedContent);
        if (parsed.name && Array.isArray(parsed.files)) {
          setProjectData(parsed);
          setIsParsing(false);
        }
      } catch (e) {
        // While streaming, JSON will be invalid. We stay in "isParsing" state implicitly 
        // until it succeeds or the stream ends (which we don't strictly know here, 
        // so we just show the loading state until valid JSON appears).
        setIsParsing(true);
      }
    };

    // Simple debounce could be added here if performance becomes an issue with large JSONs
    parseContent();
  }, [content]);

  const handleDownload = async () => {
    if (!projectData) return;
    setIsZipping(true);
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
    } finally {
      setIsZipping(false);
    }
  };

  // If we haven't successfully parsed valid project data yet
  if (!projectData) {
    return (
      <div className="my-4 p-5 rounded-xl border border-gray-700 bg-gray-900/40 flex items-center gap-4 animate-pulse">
        <div className="p-2 bg-gray-800 rounded-lg">
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-200">Generating project files...</span>
          <span className="text-xs text-gray-500">Parsing structure for ZIP archive</span>
        </div>
      </div>
    );
  }

  return (
    <div className="my-6 overflow-hidden rounded-xl border border-indigo-500/30 bg-gray-950/60 shadow-xl shadow-black/20">
       {/* Header */}
       <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/20 p-4 border-b border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-indigo-500/20 ring-1 ring-indigo-500/40 rounded-lg shadow-inner">
                <Package className="w-6 h-6 text-indigo-300" />
             </div>
             <div>
                <h3 className="text-base font-semibold text-indigo-100 tracking-tight">{projectData.name}</h3>
                <p className="text-xs text-indigo-300/60 font-medium">{projectData.files.length} files generated</p>
             </div>
          </div>
          
          <button 
            onClick={handleDownload}
            disabled={isZipping}
            className="group relative flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-all shadow-lg hover:shadow-indigo-500/25 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            {isZipping ? <Loader2 className="w-4 h-4 animate-spin relative z-10" /> : <Download className="w-4 h-4 relative z-10" />}
            <span className="relative z-10">Download ZIP</span>
          </button>
       </div>
       
       {/* File Preview List */}
       <div className="bg-black/20 p-4 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {projectData.files.map((file, idx) => (
               <div key={idx} className="flex items-center gap-2.5 text-xs text-gray-400 font-mono px-3 py-2 bg-gray-900/50 border border-gray-800/50 rounded-md hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-colors">
                  <FileCode className="w-3.5 h-3.5 text-indigo-400/70" />
                  <span className="truncate" title={file.path}>{file.path}</span>
               </div>
            ))}
          </div>
       </div>
    </div>
  );
};