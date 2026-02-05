'use client';

import { useState } from 'react';
import { useIdeas, Idea, useTasks, useProjects } from '@/hooks/use-workspace';
import { ConfirmModal } from '@/components/ConfirmModal';
import { 
  Lightbulb, 
  Sparkles,
  AlertCircle,
  Folder,
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
  X,
  Pencil,
  CheckSquare,
  Rocket,
  Check
} from 'lucide-react';

export default function IdeasPage() {
  const { ideas, isLoading, isError, error, refresh, addIdea, updateIdea, deleteIdea, promoteIdea } = useIdeas();
  const { refresh: refreshTasks } = useTasks();
  const { refresh: refreshProjects } = useProjects();
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group ideas by category
  const categories = ideas.reduce((acc, idea) => {
    const cat = idea.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(idea);
    return acc;
  }, {} as Record<string, Idea[]>);

  const categoryNames = Object.keys(categories);

  const handleAddIdea = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const category = formData.get('category') as string;

    try {
      await addIdea({ 
        title, 
        content: content || undefined,
        category: category || 'Uncategorized'
      });
      setShowAddModal(false);
      form.reset();
    } catch (err) {
      console.error('Failed to add idea:', err);
      alert('Failed to add idea');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ideas</h1>
          <p className="text-slate-500">Your idea backlog and inspiration</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Idea
          </button>
          <button
            onClick={() => refresh()}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats */}
      {ideas.length > 0 && (
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <span className="flex items-center gap-1">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            {ideas.length} {ideas.length === 1 ? 'idea' : 'ideas'}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Folder className="w-4 h-4 text-slate-400" />
            {categoryNames.length} {categoryNames.length === 1 ? 'category' : 'categories'}
          </span>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700">{error}</p>
        </div>
      )}

      {/* Loading State - only show if no cached data */}
      {isLoading && ideas.length === 0 && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && ideas.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No ideas yet</h2>
          <p className="text-slate-500 mb-4">
            Capture your first spark of inspiration!
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Idea
          </button>
        </div>
      )}

      {/* Ideas by Category */}
      {categoryNames.map((category) => (
        <div key={category}>
          <div className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-600">
            <Folder className="w-4 h-4 text-amber-500" />
            {category} ({categories[category].length})
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {categories[category].map((idea) => (
              <IdeaRow 
                key={idea.id}
                idea={idea}
                onUpdate={updateIdea}
                onDelete={deleteIdea}
                onPromote={promoteIdea}
                onTasksRefresh={refreshTasks}
                onProjectsRefresh={refreshProjects}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Help text */}
      {ideas.length > 0 && (
        <p className="text-sm text-slate-500 text-center">
          💡 Use the rocket to promote ideas to projects, or checkbox to make them tasks!
        </p>
      )}

      {/* Add Idea Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Add Idea</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddIdea} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Idea title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  autoFocus
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="What's your idea?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="e.g., Product, Marketing"
                  defaultValue="Uncategorized"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  name="content"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                  placeholder="Any details or thoughts..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Add Idea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface IdeaRowProps {
  idea: Idea;
  onUpdate: (ideaId: string, updates: { title?: string; content?: string; tags?: string[] }) => Promise<void>;
  onDelete: (ideaId: string) => Promise<void>;
  onPromote: (ideaId: string, to: 'task' | 'project', section?: string) => Promise<void>;
  onTasksRefresh: () => void;
  onProjectsRefresh: () => void;
}

function IdeaRow({ idea, onUpdate, onDelete, onPromote, onTasksRefresh, onProjectsRefresh }: IdeaRowProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPromoteTaskConfirm, setShowPromoteTaskConfirm] = useState(false);
  const [showPromoteProjectConfirm, setShowPromoteProjectConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdating(true);
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;

    try {
      await onUpdate(idea.id, { title, content });
      setShowEditModal(false);
    } catch (err) {
      console.error('Failed to update idea:', err);
      alert('Failed to update idea');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    try {
      await onDelete(idea.id);
    } catch (err) {
      console.error('Failed to delete idea:', err);
    }
  };

  const handlePromoteToTask = async () => {
    setShowPromoteTaskConfirm(false);
    try {
      await onPromote(idea.id, 'task');
      onTasksRefresh();
    } catch (err) {
      console.error('Failed to promote to task:', err);
    }
  };

  const handlePromoteToProject = async () => {
    setShowPromoteProjectConfirm(false);
    try {
      await onPromote(idea.id, 'project');
      onProjectsRefresh();
    } catch (err) {
      console.error('Failed to promote to project:', err);
    }
  };

  return (
    <>
      <div className="p-4 group">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-slate-800 font-medium">{idea.title}</p>
            {idea.notes && (
              <p className="text-sm text-slate-500 mt-1">{idea.notes}</p>
            )}
          </div>
          
          <button
            onClick={() => setShowEditModal(true)}
            className="p-1 text-slate-300 hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-all"
            title="Edit idea"
          >
            <Pencil className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setShowPromoteTaskConfirm(true)}
            className="p-1 text-slate-300 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all"
            title="Convert to task"
          >
            <CheckSquare className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setShowPromoteProjectConfirm(true)}
            className="p-1 text-slate-300 hover:text-purple-500 opacity-0 group-hover:opacity-100 transition-all"
            title="Promote to project"
          >
            <Rocket className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
            title="Delete idea"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Edit Idea</h2>
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
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  autoFocus
                  defaultValue={idea.title}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="content"
                  rows={4}
                  defaultValue={idea.notes || ''}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
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
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
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
        title="Delete Idea"
        message={`Are you sure you want to delete "${idea.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Promote to Task Confirmation */}
      <ConfirmModal
        isOpen={showPromoteTaskConfirm}
        title="Convert to Task"
        message={`Convert "${idea.title}" to a task? The idea will be removed from your ideas list.`}
        confirmText="Convert"
        variant="default"
        onConfirm={handlePromoteToTask}
        onCancel={() => setShowPromoteTaskConfirm(false)}
      />

      {/* Promote to Project Confirmation */}
      <ConfirmModal
        isOpen={showPromoteProjectConfirm}
        title="Promote to Project"
        message={`Create a new project from "${idea.title}"? The idea will be removed from your ideas list.`}
        confirmText="Promote"
        variant="promote"
        onConfirm={handlePromoteToProject}
        onCancel={() => setShowPromoteProjectConfirm(false)}
      />
    </>
  );
}
