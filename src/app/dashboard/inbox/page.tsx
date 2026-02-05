'use client';

import { useState } from 'react';
import { useInbox, useTasks, useProjects, InboxItem } from '@/hooks/use-workspace';
import { ConfirmModal } from '@/components/ConfirmModal';
import { 
  Inbox, 
  Sparkles,
  AlertCircle,
  Circle,
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
  CheckSquare,
  Rocket,
  Pencil,
  X,
  Check
} from 'lucide-react';

export default function InboxPage() {
  const { items, isLoading, isError, error, refresh, addItem, updateItem, deleteItem, promoteItem } = useInbox();
  const { refresh: refreshTasks } = useTasks();
  const { refresh: refreshProjects } = useProjects();
  const [newItem, setNewItem] = useState('');
  const [isAdding, setIsAdding] = useState(false);

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
              <InboxRow 
                key={item.id}
                item={item}
                onUpdate={updateItem}
                onDelete={deleteItem}
                onPromote={promoteItem}
                onTasksRefresh={refreshTasks}
                onProjectsRefresh={refreshProjects}
              />
            ))}
          </ul>
        </div>
      )}

      {/* Help text */}
      {items.length > 0 && (
        <p className="text-sm text-slate-500 text-center">
          💡 Use the checkbox to convert to task, or rocket to promote to project!
        </p>
      )}
    </div>
  );
}

interface InboxRowProps {
  item: InboxItem;
  onUpdate: (itemId: string, content: string) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
  onPromote: (itemId: string, to: 'task' | 'project', section?: string) => Promise<void>;
  onTasksRefresh: () => void;
  onProjectsRefresh: () => void;
}

function InboxRow({ item, onUpdate, onDelete, onPromote, onTasksRefresh, onProjectsRefresh }: InboxRowProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPromoteTaskConfirm, setShowPromoteTaskConfirm] = useState(false);
  const [showPromoteProjectConfirm, setShowPromoteProjectConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdating(true);
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    const content = formData.get('content') as string;

    try {
      await onUpdate(item.id, content);
      setShowEditModal(false);
    } catch (err) {
      console.error('Failed to update item:', err);
      alert('Failed to update item');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    try {
      await onDelete(item.id);
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const handlePromoteToTask = async () => {
    setShowPromoteTaskConfirm(false);
    setIsPromoting(true);
    try {
      await onPromote(item.id, 'task');
      onTasksRefresh();
    } catch (err) {
      console.error('Failed to promote to task:', err);
    } finally {
      setIsPromoting(false);
    }
  };

  const handlePromoteToProject = async () => {
    setShowPromoteProjectConfirm(false);
    setIsPromoting(true);
    try {
      await onPromote(item.id, 'project');
      onProjectsRefresh();
    } catch (err) {
      console.error('Failed to promote to project:', err);
    } finally {
      setIsPromoting(false);
    }
  };

  return (
    <>
      <li className="flex items-start gap-3 p-4 group hover:bg-slate-50">
        <Circle className="w-2 h-2 text-blue-400 mt-2 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-slate-800">{item.content}</p>
          {item.addedAt && (
            <p className="text-xs text-slate-400 mt-1">Added: {item.addedAt}</p>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={() => setShowEditModal(true)}
            className="p-1 text-slate-300 hover:text-blue-500 transition-colors"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowPromoteTaskConfirm(true)}
            disabled={isPromoting}
            className="p-1 text-slate-300 hover:text-blue-500 transition-colors"
            title="Convert to task"
          >
            {isPromoting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckSquare className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setShowPromoteProjectConfirm(true)}
            disabled={isPromoting}
            className="p-1 text-slate-300 hover:text-purple-500 transition-colors"
            title="Promote to project"
          >
            <Rocket className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1 text-slate-300 hover:text-red-500 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </li>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Edit Item</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Content *
                </label>
                <textarea
                  name="content"
                  required
                  autoFocus
                  rows={3}
                  defaultValue={item.content}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Item"
        message="Are you sure you want to delete this inbox item? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Promote to Task Confirmation */}
      <ConfirmModal
        isOpen={showPromoteTaskConfirm}
        title="Convert to Task"
        message={`Convert this item to a task? It will be added to your Today list and removed from inbox.`}
        confirmText="Convert"
        variant="default"
        onConfirm={handlePromoteToTask}
        onCancel={() => setShowPromoteTaskConfirm(false)}
      />

      {/* Promote to Project Confirmation */}
      <ConfirmModal
        isOpen={showPromoteProjectConfirm}
        title="Promote to Project"
        message="Create a new project from this item? It will be removed from your inbox."
        confirmText="Promote"
        variant="promote"
        onConfirm={handlePromoteToProject}
        onCancel={() => setShowPromoteProjectConfirm(false)}
      />
    </>
  );
}
