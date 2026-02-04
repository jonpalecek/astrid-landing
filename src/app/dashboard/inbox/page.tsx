'use client';

import { useState } from 'react';
import { useInbox } from '@/hooks/use-workspace';
import { 
  Inbox, 
  Sparkles,
  AlertCircle,
  Circle,
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
  ArrowRight,
  CheckSquare
} from 'lucide-react';

export default function InboxPage() {
  const { items, isLoading, isError, error, refresh, addItem, deleteItem, processToTask } = useInbox();
  const [newItem, setNewItem] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    
    setIsAdding(true);
    try {
      await addItem(newItem.trim());
      setNewItem('');
    } catch (err) {
      console.error('Failed to add item:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      await deleteItem(itemId);
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const handleProcessToTask = async (itemId: string) => {
    setProcessingId(itemId);
    try {
      await processToTask(itemId, 'today');
    } catch (err) {
      console.error('Failed to process item:', err);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inbox</h1>
          <p className="text-slate-500">Quick captures and items to process</p>
        </div>
        <button
          onClick={() => refresh()}
          className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Quick Add */}
      <form onSubmit={handleAddItem} className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Capture something quickly..."
          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={isAdding || !newItem.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {isAdding ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Add
        </button>
      </form>

      {/* Error State */}
      {isError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700">{error}</p>
        </div>
      )}

      {/* Loading State - only show if no cached data */}
      {isLoading && items.length === 0 && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && items.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Inbox zero! 🎉</h2>
          <p className="text-slate-500">
            Nothing to process. Use the input above to capture quick thoughts.
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
              <li key={item.id} className="flex items-start gap-3 p-4 group hover:bg-slate-50">
                <Circle className="w-2 h-2 text-blue-400 mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800">{item.content}</p>
                  {item.source && (
                    <p className="text-xs text-slate-400 mt-1">from: {item.source}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => handleProcessToTask(item.id)}
                    disabled={processingId === item.id}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Convert to task"
                  >
                    {processingId === item.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <CheckSquare className="w-3 h-3" />
                    )}
                    To Task
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Help text */}
      {items.length > 0 && (
        <p className="text-sm text-slate-500 text-center">
          💡 Click "To Task" to convert items to tasks, or ask your assistant to help process them.
        </p>
      )}
    </div>
  );
}
