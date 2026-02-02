'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  X, 
  Minus, 
  Send, 
  Sparkles,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  error?: boolean;
}

interface ChatWidgetProps {
  assistantName?: string;
  assistantEmoji?: string;
}

export default function ChatWidget({ 
  assistantName = 'Astrid', 
  assistantEmoji = '✨' 
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hey! 👋 I'm ${assistantName}. How can I help you today?`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputValue.trim();
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Sorry, I couldn\'t connect. Please try again.',
        timestamp: new Date(),
        error: true,
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const retryLastMessage = () => {
    // Find the last user message and resend it
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage) {
      // Remove the error message
      setMessages(prev => prev.filter(m => !m.error));
      setInputValue(lastUserMessage.content);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleOpen = () => {
    if (isOpen && isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(!isOpen);
      setIsMinimized(false);
    }
  };

  const minimize = () => {
    setIsMinimized(true);
  };

  const close = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div 
          className={`fixed bottom-20 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 transition-all duration-200 ${
            isMinimized ? 'h-14' : 'h-[500px]'
          }`}
        >
          {/* Header */}
          <div 
            className={`flex items-center justify-between px-4 py-3 border-b border-slate-100 ${
              isMinimized ? 'cursor-pointer hover:bg-slate-50' : ''
            } rounded-t-2xl`}
            onClick={isMinimized ? () => setIsMinimized(false) : undefined}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-lg">
                {assistantEmoji}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Chat with {assistantName}</h3>
                {!isMinimized && (
                  <p className="text-xs text-green-500">Online</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); minimize(); }}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                title="Minimize"
              >
                <Minus className="w-4 h-4 text-slate-500" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); close(); }}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Messages */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-amber-500 text-white rounded-br-md'
                          : message.error
                          ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-md'
                          : 'bg-slate-100 text-slate-900 rounded-bl-md'
                      }`}
                    >
                      {message.error && (
                        <div className="flex items-center gap-1 mb-1">
                          <AlertCircle className="w-3 h-3" />
                          <span className="text-xs font-medium">Error</span>
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      {message.error && (
                        <button
                          onClick={retryLastMessage}
                          className="flex items-center gap-1 mt-2 text-xs text-red-600 hover:text-red-800"
                        >
                          <RefreshCw className="w-3 h-3" /> Retry
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    disabled={isTyping}
                    className="flex-1 px-4 py-2 bg-slate-50 rounded-full text-sm focus:outline-none focus:bg-slate-100 transition-colors disabled:opacity-50"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!inputValue.trim() || isTyping}
                    className="p-2 bg-amber-500 text-white rounded-full hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-400 text-center mt-2">
                  Press Enter to send
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={toggleOpen}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 z-50 ${
          isOpen
            ? 'bg-slate-200 hover:bg-slate-300'
            : 'bg-amber-500 hover:bg-amber-600 hover:scale-105'
        }`}
      >
        {isOpen ? (
          <MessageSquare className="w-6 h-6 text-slate-600" />
        ) : (
          <>
            <MessageSquare className="w-6 h-6 text-white" />
          </>
        )}
      </button>
    </>
  );
}
