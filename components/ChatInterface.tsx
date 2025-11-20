
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, RefreshCw, Paperclip, Globe, BrainCircuit, X, File as FileIcon, Image as ImageIcon, Menu, History, ChevronDown, Terminal, ShieldCheck, MessageSquare } from 'lucide-react';
import { Message, Role, ChatSession, ChatMode, BotVersion, Attachment } from '../types';
import { sendMessageToGeminiStream, resetChatSession, resumeChatSession, generateChatTitle } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { MessageBubble } from './MessageBubble';
import { ChatHistory } from './ChatHistory';

const INITIAL_MESSAGE: Message = {
  id: 'init-1',
  role: Role.MODEL,
  content: "I am the Apex Polyglot Architect. I operate on the absolute cutting edge of every language stack. Submit your requirements; I will return 10/10 production-ready, defensively architected, and hardware-optimized code.",
  timestamp: Date.now(),
};

const NOIRE_INITIAL_MESSAGE: Message = {
  id: 'init-noire',
  role: Role.MODEL,
  content: "NOIRE System Online. Neural Omniscient Intelligent Reasoning Engine active. I am the convergence of all processing capabilities. State your directive.",
  timestamp: Date.now(),
};

export const ChatInterface: React.FC = () => {
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => Date.now().toString());
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionTitle, setSessionTitle] = useState<string>('New Sequence');
  
  // State
  const [mode, setMode] = useState<ChatMode>('standard');
  const [botVersion, setBotVersion] = useState<BotVersion>('devbot');
  const [files, setFiles] = useState<File[]>([]);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isBotSelectorOpen, setIsBotSelectorOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [savedSessions, setSavedSessions] = useState<ChatSession[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const botSelectorRef = useRef<HTMLDivElement>(null);

  // Theme Colors based on Bot Version
  const themeColor = botVersion === 'noire' ? 'purple' : 'indigo';
  const headerBg = botVersion === 'noire' ? 'bg-slate-950' : 'bg-gray-950';

  useEffect(() => {
    const loaded = storageService.getAllSessions();
    setSavedSessions(loaded);
  }, []);

  useEffect(() => {
    if (messages.length === 1 && (messages[0].id === 'init-1' || messages[0].id === 'init-noire')) return;
    
    const sessionToSave: ChatSession = {
      id: currentSessionId,
      title: sessionTitle,
      messages: messages,
      createdAt: parseInt(currentSessionId),
      updatedAt: Date.now(),
      mode: mode,
      botVersion: botVersion
    };

    storageService.saveSession(sessionToSave);
    setSavedSessions(prev => {
      const idx = prev.findIndex(s => s.id === currentSessionId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = sessionToSave;
        return updated.sort((a, b) => b.updatedAt - a.updatedAt);
      }
      return [sessionToSave, ...prev].sort((a, b) => b.updatedAt - a.updatedAt);
    });
  }, [messages, sessionTitle, currentSessionId, mode, botVersion]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setIsOptionsOpen(false);
      }
      if (botSelectorRef.current && !botSelectorRef.current.contains(event.target as Node)) {
        setIsBotSelectorOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleBotChange = (version: BotVersion) => {
    if (version === botVersion) return;
    
    setBotVersion(version);
    setIsBotSelectorOpen(false);
    
    // If we switch bots, we should probably start a clean slate if the current chat is empty
    if (messages.length === 1) {
       setMessages([version === 'noire' ? NOIRE_INITIAL_MESSAGE : INITIAL_MESSAGE]);
    }
    
    // Reset mode to standard if switching back to devbot, or thinking for noire
    if (version === 'noire') setMode('thinking'); // Noire prefers thinking
    else setMode('standard');
  };

  const handleNewChat = () => {
    resetChatSession();
    const newId = Date.now().toString();
    setCurrentSessionId(newId);
    setMessages([botVersion === 'noire' ? NOIRE_INITIAL_MESSAGE : INITIAL_MESSAGE]);
    setSessionTitle('New Sequence');
    setFiles([]);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleSelectSession = (id: string) => {
    const session = storageService.getSession(id);
    if (session) {
      setCurrentSessionId(session.id);
      setMessages(session.messages);
      setSessionTitle(session.title);
      setMode(session.mode);
      setBotVersion(session.botVersion || 'devbot');
      setFiles([]);
      resumeChatSession(session.messages, session.mode, session.botVersion || 'devbot');
    }
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    storageService.deleteSession(id);
    setSavedSessions(prev => prev.filter(s => s.id !== id));
    if (id === currentSessionId) handleNewChat();
  };

  const convertFilesToAttachments = async (filesToConvert: File[]): Promise<Attachment[]> => {
    return Promise.all(filesToConvert.map(file => new Promise<Attachment>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          name: file.name,
          type: file.type,
          data: (reader.result as string).split(',')[1]
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    })));
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && files.length === 0) || isLoading) return;

    const isFirstUserMessage = messages.length === 1 && messages[0].role === Role.MODEL;
    if (isFirstUserMessage) {
      const firstPrompt = input.trim() || (files.length > 0 ? `Analyze ${files[0].name}` : "New Chat");
      generateChatTitle(firstPrompt).then(title => setSessionTitle(title));
    }

    const attachments = await convertFilesToAttachments(files);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content: input.trim(),
      timestamp: Date.now(),
      attachments: attachments
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    const currentFiles = [...files];
    const currentMode = mode;
    const currentBot = botVersion;
    
    setFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const botMessageId = (Date.now() + 1).toString();
    const botMessage: Message = {
      id: botMessageId,
      role: Role.MODEL,
      content: '',
      timestamp: Date.now() + 1,
      isStreaming: true,
    };

    setMessages(prev => [...prev, botMessage]);

    try {
      let gatheredText = '';
      
      await sendMessageToGeminiStream(
        userMessage.content,
        currentFiles,
        currentMode,
        currentBot,
        (chunk) => {
          gatheredText += chunk;
          setMessages(prev => 
            prev.map(msg => 
              msg.id === botMessageId 
                ? { ...msg, content: gatheredText } 
                : msg
            )
          );
        }
      );

      setMessages(prev => 
        prev.map(msg => 
          msg.id === botMessageId 
            ? { ...msg, isStreaming: false } 
            : msg
        )
      );
    } catch (error) {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === botMessageId 
            ? { ...msg, isStreaming: false, error: true, content: msg.content + "\n\n*[System Error: Failed to complete response]*" } 
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getModeIcon = () => {
    if (botVersion === 'noire') return <BrainCircuit className="w-5 h-5 text-purple-400" />;
    switch (mode) {
      case 'search': return <Globe className="w-5 h-5 text-blue-400" />;
      case 'thinking': return <BrainCircuit className="w-5 h-5 text-purple-400" />;
      default: return <Sparkles className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-900">
      <ChatHistory 
        isOpen={isSidebarOpen}
        sessions={savedSessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${isSidebarOpen ? 'md:ml-72' : 'ml-0'}`}>
        
        {/* Top Header */}
        <header className={`flex items-center justify-between px-6 py-4 border-b border-gray-800 shadow-md z-10 transition-colors duration-500 ${headerBg}`}>
          <div className="flex items-center space-x-4">
             {/* Sidebar Toggle Button - Explicit "Chats" */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 text-gray-300 hover:text-white transition-all border border-gray-700/50"
            >
              <Menu className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">Chats</span>
            </button>

            {/* Bot Selector Dropdown */}
            <div className="relative" ref={botSelectorRef}>
              <button
                onClick={() => setIsBotSelectorOpen(!isBotSelectorOpen)}
                className="flex items-center space-x-3 group"
              >
                 <div className={`p-2 rounded-lg shadow-lg transition-all duration-300 ${
                   botVersion === 'noire' 
                     ? 'bg-purple-900 shadow-purple-900/20' 
                     : 'bg-indigo-600 shadow-indigo-500/20'
                 }`}>
                   {botVersion === 'noire' ? <BrainCircuit className="w-6 h-6 text-white" /> : <Terminal className="w-6 h-6 text-white" />}
                 </div>
                 <div className="text-left">
                   <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                     {botVersion === 'noire' ? 'NoireBot' : 'DevBot AI'}
                     <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isBotSelectorOpen ? 'rotate-180' : ''}`} />
                   </h1>
                   <div className="flex items-center space-x-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${botVersion === 'noire' ? 'bg-purple-400' : 'bg-green-400'}`}></span>
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${botVersion === 'noire' ? 'bg-purple-500' : 'bg-green-500'}`}></span>
                      </span>
                      <span className="text-xs text-gray-400 font-medium">
                        {botVersion === 'noire' ? 'Ultimate Processing' : 'gemini-3-pro-preview'}
                      </span>
                   </div>
                 </div>
              </button>

              {/* Bot Selector Menu */}
              {isBotSelectorOpen && (
                <div className="absolute top-full left-0 mt-3 w-72 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => handleBotChange('devbot')}
                      className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors ${
                         botVersion === 'devbot' ? 'bg-indigo-900/20 border border-indigo-500/30' : 'hover:bg-gray-800 border border-transparent'
                      }`}
                    >
                      <div className="p-2 bg-indigo-600 rounded-lg text-white">
                         <Terminal className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="text-white font-bold text-sm">DevBot AI (Classic)</div>
                        <div className="text-gray-400 text-xs mt-0.5">Reliable, fast, production-ready coding assistant.</div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleBotChange('noire')}
                      className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors ${
                         botVersion === 'noire' ? 'bg-purple-900/20 border border-purple-500/30' : 'hover:bg-gray-800 border border-transparent'
                      }`}
                    >
                      <div className="p-2 bg-purple-600 rounded-lg text-white">
                         <BrainCircuit className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="text-white font-bold text-sm">NoireBot (Ultimate)</div>
                        <div className="text-gray-400 text-xs mt-0.5">Unified intelligence. Combines Deep Thinking & Web Search.</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="hidden sm:flex items-center space-x-4 text-sm text-gray-400">
             <button 
               onClick={handleNewChat}
               className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors text-gray-300"
             >
               <RefreshCw className="w-4 h-4" />
               <span>New Chat</span>
             </button>
          </div>
        </header>

        {/* Messages Area */}
        <div className={`flex-1 overflow-y-auto px-4 sm:px-6 py-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent transition-colors duration-500 ${
          botVersion === 'noire' ? 'bg-slate-900/50' : 'bg-gray-900/50'
        }`}>
          <div className="flex flex-col justify-end min-h-full max-w-5xl mx-auto w-full">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className={`p-4 sm:p-6 backdrop-blur-md border-t transition-colors duration-500 ${
          botVersion === 'noire' ? 'bg-slate-950/80 border-purple-900/30' : 'bg-gray-950/80 border-gray-800'
        }`}>
          <div className="relative max-w-4xl mx-auto">
            
            {/* File Previews */}
            {files.length > 0 && (
              <div className="flex gap-3 mb-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700">
                {files.map((file, idx) => (
                  <div key={idx} className="relative group flex-shrink-0">
                    {file.type.startsWith('image/') ? (
                        <div className="h-16 w-16 rounded-lg border border-gray-700 overflow-hidden relative">
                           <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="preview" />
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-300 max-w-[200px]">
                           <FileIcon className="w-4 h-4 text-blue-400" />
                           <span className="truncate">{file.name}</span>
                        </div>
                    )}
                    <button 
                      onClick={() => removeFile(idx)}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className={`relative flex items-end gap-3 p-2 rounded-2xl shadow-xl focus-within:ring-2 transition-all duration-300 border ${
               botVersion === 'noire' 
               ? 'bg-slate-900/50 border-purple-500/30 focus-within:ring-purple-500/50 focus-within:border-purple-500'
               : 'bg-gray-800/50 border-gray-700 focus-within:ring-indigo-500/50 focus-within:border-indigo-500'
            }`}>
              
              {/* Options / Mode Selector (Only show for DevBot, Noire handles it automatically) */}
              {botVersion === 'devbot' && (
                <div className="relative" ref={optionsRef}>
                  <button 
                    onClick={() => setIsOptionsOpen(!isOptionsOpen)}
                    className={`p-3 rounded-xl transition-colors flex items-center gap-1 ${
                      isOptionsOpen ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                    title="Select Mode"
                  >
                    {getModeIcon()}
                  </button>
                  
                  {isOptionsOpen && (
                    <div className="absolute bottom-full left-0 mb-3 w-64 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2">
                      <div className="px-4 py-3 bg-gray-950 border-b border-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Processing Mode
                      </div>
                      <div className="p-1">
                        <button 
                          onClick={() => { setMode('standard'); setIsOptionsOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                            mode === 'standard' ? 'bg-indigo-900/30 text-indigo-300' : 'text-gray-300 hover:bg-gray-800'
                          }`}
                        >
                          <Sparkles className="w-4 h-4" />
                          <div>
                            <div className="text-sm font-medium">Standard</div>
                            <div className="text-[10px] opacity-60">Fast, balanced coding assistant</div>
                          </div>
                        </button>
                        
                        <button 
                          onClick={() => { setMode('search'); setIsOptionsOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                            mode === 'search' ? 'bg-blue-900/30 text-blue-300' : 'text-gray-300 hover:bg-gray-800'
                          }`}
                        >
                          <Globe className="w-4 h-4" />
                          <div>
                            <div className="text-sm font-medium">Deep Search</div>
                            <div className="text-[10px] opacity-60">Grounded with real-time web data</div>
                          </div>
                        </button>
                        
                        <button 
                          onClick={() => { setMode('thinking'); setIsOptionsOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                            mode === 'thinking' ? 'bg-purple-900/30 text-purple-300' : 'text-gray-300 hover:bg-gray-800'
                          }`}
                        >
                          <BrainCircuit className="w-4 h-4" />
                          <div>
                            <div className="text-sm font-medium">Deep Thinking</div>
                            <div className="text-[10px] opacity-60">Complex reasoning & architecture</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Noire Indicator */}
              {botVersion === 'noire' && (
                 <div className="p-3 text-purple-400 cursor-help" title="NoireBot automatically selects best tools">
                    <BrainCircuit className="w-5 h-5 animate-pulse" />
                 </div>
              )}

              {/* File Attachment */}
              <div className="relative">
                <input 
                  type="file" 
                  multiple 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect} 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-xl transition-colors"
                  title="Attach Files"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
              </div>
              
              {/* Text Input */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={botVersion === 'noire' ? "State your directive for Noire..." : `Ask DevBot (${mode})...`}
                className="flex-1 max-h-[200px] py-3 bg-transparent border-none focus:ring-0 text-gray-100 placeholder-gray-500 resize-none leading-relaxed"
                rows={1}
                disabled={isLoading}
              />
              
              {/* Send Button */}
              <button
                onClick={handleSendMessage}
                disabled={(!input.trim() && files.length === 0) || isLoading}
                className={`p-3 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  (input.trim() || files.length > 0) && !isLoading
                    ? `${botVersion === 'noire' ? 'bg-purple-600 shadow-purple-600/20 hover:bg-purple-500' : 'bg-indigo-600 shadow-indigo-600/20 hover:bg-indigo-500'} text-white shadow-lg hover:scale-105` 
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-5 h-5 ml-0.5" />
                )}
              </button>
            </div>
            
            <div className="mt-3 text-center flex items-center justify-center gap-4">
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                {botVersion === 'noire' ? (
                   <>
                     <BrainCircuit className="w-3 h-3 text-purple-400" />
                     <span>Running on <span className="text-purple-400 font-medium">NoireBot Unified Core</span></span>
                   </>
                ) : (
                   <>
                     {getModeIcon()}
                     <span>Mode: <span className="text-gray-300 font-medium capitalize">{mode}</span></span>
                   </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
