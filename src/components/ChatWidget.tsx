'use client';

import { useState } from 'react';
import { 
  MessageSquare, 
  X, 
  ExternalLink,
  Sparkles,
  Copy,
  Check
} from 'lucide-react';

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
  const [copied, setCopied] = useState(false);

  const handleLaunchChat = () => {
    if (tunnelUrl) {
      window.open(tunnelUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopyToken = async () => {
    if (gatewayToken) {
      await navigator.clipboard.writeText(gatewayToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const close = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-lg">
                {assistantEmoji}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Chat with {assistantName}</h3>
                <p className="text-xs text-green-500">Online</p>
              </div>
            </div>
            <button
              onClick={close}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-8 h-8 text-amber-600" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-1">Full Chat Experience</h4>
              <p className="text-sm text-slate-600 mb-4">
                Open the full chat interface to talk with {assistantName} in real-time.
              </p>
            </div>

            {tunnelUrl ? (
              <>
                <button
                  onClick={handleLaunchChat}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors"
                >
                  <MessageSquare className="w-5 h-5" />
                  Launch Chat
                  <ExternalLink className="w-4 h-4" />
                </button>

                {gatewayToken && (
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-2">
                      First time? You'll need this token to connect:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-white px-2 py-1.5 rounded border border-slate-200 font-mono truncate">
                        {gatewayToken.slice(0, 20)}...
                      </code>
                      <button
                        onClick={handleCopyToken}
                        className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
                        title="Copy token"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-500" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-sm text-slate-500">
                Chat unavailable — assistant not connected.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
            <p className="text-xs text-slate-500 text-center">
              💡 You can also chat via Telegram for mobile access
            </p>
          </div>
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
          <X className="w-6 h-6 text-slate-600" />
        ) : (
          <MessageSquare className="w-6 h-6 text-white" />
        )}
      </button>
    </>
  );
}
