
import React from 'react';
import { MessageSquare, Trash2, Plus, Clock, ChevronLeft } from 'lucide-react';
import { ChatSession } from '../types';

interface ChatHistoryProps {
  isOpen: boolean;
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onClose: () => void;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({
  isOpen,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onClose
}) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-20 transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 bottom-0 w-72 bg-gray-950 border-r border-gray-800 z-30 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
          <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Operations Log
          </h2>
          <button 
            onClick={onClose} 
            className="md:hidden p-2 text-gray-500 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3 px-4 rounded-lg transition-all shadow-lg shadow-indigo-600/20 font-medium group"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            <span>Initialize New Sequence</span>
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-800">
          {sessions.length === 0 ? (
            <div className="text-center text-gray-600 text-xs mt-10 italic">
              No past operations found.
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => {
                  onSelectSession(session.id);
                  if (window.innerWidth < 768) onClose();
                }}
                className={`group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border border-transparent ${
                  session.id === currentSessionId
                    ? 'bg-gray-800 border-indigo-500/30 text-white shadow-md'
                    : 'hover:bg-gray-900 text-gray-400 hover:text-gray-200'
                }`}
              >
                <MessageSquare className={`w-4 h-4 flex-shrink-0 ${
                  session.id === currentSessionId ? 'text-indigo-400' : 'text-gray-600'
                }`} />
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate pr-6">
                    {session.title}
                  </div>
                  <div className="text-[10px] opacity-60 flex justify-between">
                    <span>{formatDate(session.updatedAt)}</span>
                    <span className={`uppercase ${
                       session.mode === 'thinking' ? 'text-purple-400' :
                       session.mode === 'search' ? 'text-blue-400' : 'text-indigo-400'
                    }`}>{session.mode}</span>
                  </div>
                </div>

                {/* Delete Button (visible on group hover) */}
                <button
                  onClick={(e) => onDeleteSession(session.id, e)}
                  className="absolute right-2 top-3 p-1.5 rounded-md text-gray-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete Session"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/30 text-[10px] text-gray-600 text-center font-mono">
          ARCHIVE_STATUS: SECURE
        </div>
      </div>
    </>
  );
};
