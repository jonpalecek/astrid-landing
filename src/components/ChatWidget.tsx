'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  MessageSquare, 
  X, 
  Minus, 
  Send, 
  AlertCircle,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  error?: boolean;
  streaming?: boolean;
}

interface ChatWidgetProps {
  assistantName?: string;
  assistantEmoji?: string;
  tunnelUrl?: string;
  gatewayToken?: string;
}

export default function ChatWidget({ 
  assistantName = 'Sam', 
  assistantEmoji = '✨',
  tunnelUrl,
  gatewayToken
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (!tunnelUrl || !gatewayToken || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setIsConnecting(true);

    // Convert https:// to wss://
    const wsUrl = tunnelUrl.replace(/^https?:\/\//, 'wss://');
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected, waiting for challenge...');
        // Don't send auth yet - wait for connect.challenge event
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (e) {
          console.error('Failed to parse WS message:', e);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setIsConnecting(false);
        wsRef.current = null;

        // Reconnect after delay if widget is still open
        if (isOpen) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnecting(false);
      };

    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setIsConnecting(false);
    }
  }, [tunnelUrl, gatewayToken, isOpen]);

  const handleWebSocketMessage = (data: any) => {
    console.log('WS message:', data);
    
    // Handle connect.challenge - respond with auth
    if (data.type === 'event' && data.event === 'connect.challenge') {
      console.log('Received challenge, sending connect request...');
      wsRef.current?.send(JSON.stringify({
        type: 'req',
        id: `connect-${Date.now()}`,
        method: 'connect',
        params: {
          minProtocol: 3,
          maxProtocol: 3,
          client: {
            id: 'webchat',
            version: '1.0.0',
            platform: 'web',
            mode: 'webchat'
          },
          role: 'operator',
          scopes: ['operator.read', 'operator.write'],
          caps: [],
          commands: [],
          permissions: {},
          auth: { token: gatewayToken },
          locale: navigator.language || 'en-US',
          userAgent: navigator.userAgent
        }
      }));
      return;
    }

    // Handle connection acknowledgment (response to connect request)
    if (data.type === 'res' && data.ok && data.payload?.type === 'hello-ok') {
      console.log('Connect succeeded:', data.payload);
      setIsConnected(true);
      setIsConnecting(false);
      
      // Add welcome message
      if (messages.length === 0) {
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: `Hey! 👋 I'm ${assistantName}. How can I help you today?`,
          timestamp: new Date(),
        }]);
      }
      return;
    }

    // Handle connect failure
    if (data.type === 'res' && !data.ok) {
      console.error('Connect failed:', data.error);
      setIsConnecting(false);
      return;
    }

    // Handle chat responses
    if (data.type === 'chat' || data.type === 'chat.chunk' || data.type === 'chat.stream') {
      const content = data.content || data.text || data.chunk || '';
      const isDone = data.done || data.finished || data.type === 'chat.done';
      
      if (content) {
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg?.streaming && lastMsg.role === 'assistant') {
            // Append to existing streaming message
            return prev.map((msg, i) => 
              i === prev.length - 1 
                ? { ...msg, content: msg.content + content }
                : msg
            );
          } else {
            // Start new assistant message
            return [...prev, {
              id: Date.now().toString(),
              role: 'assistant',
              content: content,
              timestamp: new Date(),
              streaming: true,
            }];
          }
        });
      }

      if (isDone) {
        setIsTyping(false);
        setCurrentRunId(null);
        setMessages(prev => prev.map(msg => ({ ...msg, streaming: false })));
      }
    }

    // Handle chat.send acknowledgment
    if (data.type === 'chat.send.ack' || data.id?.startsWith('chat-')) {
      if (data.runId) {
        setCurrentRunId(data.runId);
      }
    }

    // Handle errors
    if (data.type === 'error' || data.error) {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.error?.message || data.message || 'Something went wrong. Please try again.',
        timestamp: new Date(),
        error: true,
      }]);
    }
  };

  // Connect when widget opens
  useEffect(() => {
    if (isOpen && tunnelUrl && gatewayToken) {
      connectWebSocket();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isOpen, connectWebSocket, tunnelUrl, gatewayToken]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const sendMessage = async () => {
    if (!inputValue.trim() || isTyping || !isConnected) return;

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
      // Send via WebSocket
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const msgId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        wsRef.current.send(JSON.stringify({
          type: 'req',
          id: `chat-${msgId}`,
          method: 'chat.send',
          params: {
            message: messageText,
            sessionKey: 'dashboard-chat',
            idempotencyKey: msgId,
          }
        }));
      } else {
        throw new Error('Not connected');
      }
    } catch (error) {
      console.error('Send error:', error);
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Failed to send message. Please check your connection.',
        timestamp: new Date(),
        error: true,
      }]);
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

  const reconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    connectWebSocket();
  };

  // Don't render if no tunnel configured
  if (!tunnelUrl || !gatewayToken) {
    return null;
  }

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
                  <div className="flex items-center gap-1">
                    {isConnecting ? (
                      <p className="text-xs text-amber-500">Connecting...</p>
                    ) : isConnected ? (
                      <>
                        <Wifi className="w-3 h-3 text-green-500" />
                        <p className="text-xs text-green-500">Online</p>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-3 h-3 text-red-500" />
                        <button 
                          onClick={reconnect}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Reconnect
                        </button>
                      </>
                    )}
                  </div>
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
                      {message.streaming && (
                        <span className="inline-block w-2 h-4 bg-slate-400 animate-pulse ml-1" />
                      )}
                    </div>
                  </div>
                ))}

                {isTyping && messages[messages.length - 1]?.role !== 'assistant' && (
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
                    placeholder={isConnected ? "Type a message..." : "Connecting..."}
                    disabled={isTyping || !isConnected}
                    className="flex-1 px-4 py-2 bg-slate-50 rounded-full text-sm focus:outline-none focus:bg-slate-100 transition-colors disabled:opacity-50"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!inputValue.trim() || isTyping || !isConnected}
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
          <MessageSquare className="w-6 h-6 text-white" />
        )}
      </button>
    </>
  );
}
