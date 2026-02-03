'use client';

import { useEffect, useState } from 'react';
import { 
  Inbox, 
  Sparkles,
  AlertCircle,
  Circle,
  Loader2
} from 'lucide-react';

interface InboxItem {
  id: string;
  content: string;
  source?: string;
  createdAt?: string;
}

export default function InboxPage() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInbox() {
      try {
        const res = await fetch('/api/vm/inbox');
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to load inbox');
        }
        const data = await res.json();
        setItems(data.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load inbox');
      } finally {
        setLoading(false);
      }
    }
    fetchInbox();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Inbox</h1>
        <p className="text-slate-500">Quick captures and items to process</p>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!error && items.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Inbox zero! 🎉</h2>
          <p className="text-slate-500">
            Nothing to process. Send items to your assistant to capture them here.
          </p>
        </div>
      )}

      {/* Inbox Items */}
      {items.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-4 py-3 border-b border-slate-100">
            <span className="text-sm font-medium text-slate-600">
              {items.length} {items.length === 1 ? 'item' : 'items'} to process
            </span>
          </div>
          <ul className="divide-y divide-slate-100">
            {items.map((item) => (
              <li key={item.id} className="flex items-start gap-3 p-4 hover:bg-slate-50">
                <Circle className="w-2 h-2 text-blue-400 mt-2 shrink-0" />
                <div className="flex-1">
                  <p className="text-slate-800">{item.content}</p>
                  {item.source && (
                    <p className="text-xs text-slate-400 mt-1">from: {item.source}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Help text */}
      {items.length > 0 && (
        <p className="text-sm text-slate-500 text-center">
          💡 Ask your assistant to help you process these items into projects, tasks, or ideas.
        </p>
      )}
    </div>
  );
}
