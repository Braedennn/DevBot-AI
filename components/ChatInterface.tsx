import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, RefreshCw, ArrowDown } from 'lucide-react';
import { Message, Role } from '../types';
import { sendMessageToGeminiStream, resetChatSession } from '../services/geminiService';
import { MessageBubble } from './MessageBubble';

const INITIAL_MESSAGE: Message = {
  id: 'init-1',
  role: Role.MODEL,
  content: "I am the Polyglot Principal Architect. I generate production-grade, mathematically optimized code. Submit your requirements or existing codebase for rigorous analysis, refactoring, and execution.",
  timestamp: Date.now(),
};

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // Create a placeholder for the bot response
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
      
      await sendMessageToGeminiStream(userMessage.content, (chunk) => {
        gatheredText += chunk;
        setMessages(prev => 
          prev.map(msg => 
            msg.id === botMessageId 
              ? { ...msg, content: gatheredText } 
              : msg
          )
        );
      });

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

  const handleReset = () => {
    resetChatSession();
    setMessages([INITIAL_MESSAGE]);
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full">
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        <div className="flex flex-col justify-end min-h-full">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 sm:p-6 bg-gray-950/80 backdrop-blur-md border-t border-gray-800">
        <div className="relative max-w-4xl mx-auto">
          
          {/* Scroll to bottom button (conditional?) - Optional UX enhancement could go here */}
          
          <div className="relative flex items-end gap-3 p-2 bg-gray-800/50 border border-gray-700 rounded-2xl shadow-xl focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500 transition-all duration-300">
             <button 
              onClick={handleReset}
              className="p-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-xl transition-colors tooltip-trigger"
              title="Start New Chat"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask NoireDev to write code..."
              className="flex-1 max-h-[200px] py-3 bg-transparent border-none focus:ring-0 text-gray-100 placeholder-gray-500 resize-none leading-relaxed"
              rows={1}
              disabled={isLoading}
            />
            
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className={`p-3 rounded-xl flex items-center justify-center transition-all duration-200 ${
                input.trim() && !isLoading
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 hover:scale-105' 
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
          
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-500 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Powered by Google Gemini 3 Pro Preview</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};