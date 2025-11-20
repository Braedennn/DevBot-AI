import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Role, Message } from '../types';
import { User, Bot, Copy, Check } from 'lucide-react';
import { ProjectDownload } from './ProjectDownload';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === Role.USER;
  const [copiedMap, setCopiedMap] = React.useState<Record<string, boolean>>({});

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedMap(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedMap(prev => ({ ...prev, [id]: false }));
    }, 2000);
  };

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[90%] md:max-w-[80%] lg:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center shadow-md ${
          isUser ? 'bg-indigo-600' : 'bg-emerald-600'
        }`}>
          {isUser ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
        </div>

        {/* Content Bubble */}
        <div className={`flex flex-col overflow-hidden rounded-2xl shadow-sm w-full ${
          isUser 
            ? 'bg-indigo-600 text-white rounded-tr-sm' 
            : 'bg-gray-800 border border-gray-700 text-gray-100 rounded-tl-sm'
        }`}>
          <div className={`px-5 py-3.5 text-sm md:text-base leading-relaxed overflow-x-auto`}>
             {/* Markdown Rendering */}
            {isUser ? (
              <div className="whitespace-pre-wrap">{message.content}</div>
            ) : (
              <ReactMarkdown
                components={{
                  // Style code blocks
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const isProjectJson = match && (match[1] === 'json-project');
                    
                    // Special renderer for Downloadable Projects
                    if (!inline && isProjectJson) {
                       return <ProjectDownload content={String(children)} />;
                    }

                    const codeId = Math.random().toString(36).substr(2, 9);
                    const codeString = String(children).replace(/\n$/, '');
                    
                    if (!inline && match) {
                      return (
                        <div className="relative my-4 rounded-lg overflow-hidden border border-gray-700 bg-gray-950/50">
                          <div className="flex items-center justify-between px-4 py-2 bg-gray-900/80 border-b border-gray-700 text-xs text-gray-400 select-none">
                            <span className="font-mono font-medium text-emerald-400 uppercase">{match[1]}</span>
                            <button
                              onClick={() => handleCopy(codeString, codeId)}
                              className="flex items-center gap-1.5 hover:text-white transition-colors"
                            >
                              {copiedMap[codeId] ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-green-400" />
                                  <span className="text-green-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        </div>
                      );
                    }
                    return (
                      <code className="px-1.5 py-0.5 mx-0.5 rounded-md bg-gray-700/50 font-mono text-sm text-emerald-200 border border-gray-600/30" {...props}>
                        {children}
                      </code>
                    );
                  },
                  // Style basic elements
                  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="mb-4 ml-6 list-disc list-outside space-y-1 marker:text-gray-500">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-4 ml-6 list-decimal list-outside space-y-1 marker:text-gray-500">{children}</ol>,
                  li: ({ children }) => <li className="pl-1">{children}</li>,
                  h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6 pb-2 border-b border-gray-700 text-white first:mt-0">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-xl font-semibold mb-3 mt-5 text-white">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-lg font-medium mb-2 mt-4 text-indigo-200">{children}</h3>,
                  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline decoration-indigo-400/30 underline-offset-2 transition-colors">{children}</a>,
                  blockquote: ({ children }) => <blockquote className="border-l-4 border-indigo-500 pl-4 py-1 my-4 bg-gray-900/30 italic text-gray-400 rounded-r">{children}</blockquote>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
          {message.isStreaming && (
            <div className="px-5 pb-3">
               <span className="inline-block w-2 h-4 bg-emerald-500 animate-pulse ml-1 align-middle"></span>
            </div>
          )}
          {message.error && (
            <div className="px-5 py-2 bg-red-500/10 border-t border-red-500/20 text-red-400 text-sm flex items-center gap-2">
               <span>⚠️ Error generating response</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};