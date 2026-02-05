'use client';

import { useState } from 'react';
import { useTasks, Task, useProjects } from '@/hooks/use-workspace';
import { ConfirmModal } from '@/components/ConfirmModal';
import { 
  CheckCircle2, 
  Circle,
  Clock,
  AlertCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
  X,
  Pencil,
  Rocket,
  Check
} from 'lucide-react';

export default function TasksPage() {
  const { tasks, sections, isLoading, isError, error, refresh, toggleTask, addTask, updateTask, deleteTask, promoteTask } = useTasks();
  const { refresh: refreshProjects } = useProjects();
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group tasks by section
  const tasksBySection = {
    today: tasks.filter(t => sections.today.includes(t.id)),
    thisWeek: tasks.filter(t => sections.thisWeek.includes(t.id)),
    later: tasks.filter(t => sections.later.includes(t.id)),
    done: tasks.filter(t => sections.done.includes(t.id)),
  };

  const pendingCount = tasksBySection.today.length + tasksBySection.thisWeek.length;
  const overdueCount = tasks.filter(t => !t.done && t.due && new Date(t.due) < new Date()).length;

  const handleToggle = async (task: Task) => {
    try {
      await toggleTask(task.id, !task.done);
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await deleteTask(taskId);
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleAddTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    const title = formData.get('title') as string;
    const section = formData.get('section') as string;
    const due = formData.get('due') as string;
    const priority = formData.get('priority') as string;

    try {
      await addTask({ 
        title, 
        section: section || 'today',
        due: due || undefined,
        priority: priority || 'normal'
      });
      setShowAddModal(false);
      form.reset();
    } catch (err) {
      console.error('Failed to add task:', err);
      alert('Failed to add task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
          <p className="text-slate-500">Your standalone tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Task
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
      {tasks.length > 0 && (
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1 text-slate-600">
            <Circle className="w-4 h-4" />
            {pendingCount} pending
          </span>
          {overdueCount > 0 && (
            <span className="flex items-center gap-1 text-red-600">
              <AlertTriangle className="w-4 h-4" />
              {overdueCount} overdue
            </span>
          )}
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
      {isLoading && tasks.length === 0 && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && tasks.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No tasks yet</h2>
          <p className="text-slate-500 mb-4">
            Get started by adding your first task!
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      )}

      {/* Task Sections */}
      {tasksBySection.today.length > 0 && (
        <TaskSection 
          title="Today" 
          icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
          tasks={tasksBySection.today}
          onToggle={handleToggle}
          onUpdate={updateTask}
          onDelete={handleDelete}
          onPromote={promoteTask}
          onProjectsRefresh={refreshProjects}
        />
      )}

      {tasksBySection.thisWeek.length > 0 && (
        <TaskSection 
          title="This Week" 
          icon={<Clock className="w-4 h-4 text-amber-500" />}
          tasks={tasksBySection.thisWeek}
          onToggle={handleToggle}
          onUpdate={updateTask}
          onDelete={handleDelete}
          onPromote={promoteTask}
          onProjectsRefresh={refreshProjects}
        />
      )}

      {tasksBySection.later.length > 0 && (
        <TaskSection 
          title="Later" 
          icon={<Circle className="w-4 h-4 text-slate-400" />}
          tasks={tasksBySection.later}
          onToggle={handleToggle}
          onUpdate={updateTask}
          onDelete={handleDelete}
          onPromote={promoteTask}
          onProjectsRefresh={refreshProjects}
        />
      )}

      {tasksBySection.done.length > 0 && (
        <TaskSection 
          title="Done" 
          icon={<CheckCircle2 className="w-4 h-4 text-green-500" />}
          tasks={tasksBySection.done}
          onToggle={handleToggle}
          onUpdate={updateTask}
          onDelete={handleDelete}
          onPromote={promoteTask}
          onProjectsRefresh={refreshProjects}
        />
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Add Task</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddTask} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Task title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  autoFocus
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="What needs to be done?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Section
                  </label>
                  <select
                    name="section"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="today">Today</option>
                    <option value="thisWeek">This Week</option>
                    <option value="later">Later</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    name="priority"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Due date (optional)
                </label>
                <input
                  type="date"
                  name="due"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface TaskSectionProps {
  title: string;
  icon: React.ReactNode;
  tasks: Task[];
  onToggle: (task: Task) => void;
  onUpdate: (taskId: string, updates: { title?: string; due?: string; priority?: string }) => Promise<void>;
  onDelete: (taskId: string) => void;
  onPromote: (taskId: string) => Promise<unknown>;
  onProjectsRefresh: () => void;
}

function TaskSection({ title, icon, tasks, onToggle, onUpdate, onDelete, onPromote, onProjectsRefresh }: TaskSectionProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-600">
        {icon}
        {title} ({tasks.length})
      </div>
      
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {tasks.map((task) => (
          <TaskRow 
            key={task.id} 
            task={task} 
            onToggle={onToggle}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onPromote={onPromote}
            onProjectsRefresh={onProjectsRefresh}
          />
        ))}
      </div>
    </div>
  );
}

interface TaskRowProps {
  task: Task;
  onToggle: (task: Task) => void;
  onUpdate: (taskId: string, updates: { title?: string; due?: string; priority?: string }) => Promise<void>;
  onDelete: (taskId: string) => void;
  onPromote: (taskId: string) => Promise<unknown>;
  onProjectsRefresh: () => void;
}

function TaskRow({ task, onToggle, onUpdate, onDelete, onPromote, onProjectsRefresh }: TaskRowProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPromoteConfirm, setShowPromoteConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const isOverdue = !task.done && task.due && new Date(task.due) < new Date();

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdating(true);
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    const title = formData.get('title') as string;
    const due = formData.get('due') as string;
    const priority = formData.get('priority') as string;

    try {
      await onUpdate(task.id, { title, due: due || undefined, priority });
      setShowEditModal(false);
    } catch (err) {
      console.error('Failed to update task:', err);
      alert('Failed to update task');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePromote = async () => {
    setShowPromoteConfirm(false);
    try {
      await onPromote(task.id);
      onProjectsRefresh();
    } catch (err) {
      console.error('Failed to promote task:', err);
      alert('Failed to promote task');
    }
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    try {
      await onDelete(task.id);
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };
  
  return (
    <>
      <div className="flex items-center gap-3 p-4 group">
        <button
          onClick={() => onToggle(task)}
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
            task.done 
              ? 'bg-green-100 border-green-500 text-green-600 hover:bg-green-200' 
              : 'border-slate-300 hover:border-amber-500 hover:bg-amber-50'
          }`}
        >
          {task.done && <CheckCircle2 className="w-3 h-3" />}
        </button>
        
        <span 
          className={`flex-1 cursor-pointer ${task.done ? 'text-slate-400 line-through' : 'text-slate-800'}`}
          onClick={() => onToggle(task)}
        >
          {task.title}
        </span>
        
        {task.due && (
          <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
            <Clock className="w-3 h-3" />
            {task.due}
          </span>
        )}
        
        {task.priority && task.priority !== 'normal' && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
            task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
            'bg-slate-100 text-slate-600'
          }`}>
            {task.priority}
          </span>
        )}

        <button
          onClick={() => setShowEditModal(true)}
          className="p-1 text-slate-300 hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-all"
          title="Edit task"
        >
          <Pencil className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowPromoteConfirm(true)}
          className="p-1 text-slate-300 hover:text-purple-500 opacity-0 group-hover:opacity-100 transition-all"
          title="Promote to project"
        >
          <Rocket className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
          title="Delete task"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Promote Confirmation */}
      <ConfirmModal
        isOpen={showPromoteConfirm}
        title="Promote to Project"
        message={`Create a new project from "${task.title}"? The task will be removed from your task list.`}
        confirmText="Promote"
        variant="promote"
        onConfirm={handlePromote}
        onCancel={() => setShowPromoteConfirm(false)}
      />

      {/* Edit Task Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Edit Task</h2>
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
                  Task title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  autoFocus
                  defaultValue={task.title}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Due date
                  </label>
                  <input
                    type="date"
                    name="due"
                    defaultValue={task.due || ''}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    name="priority"
                    defaultValue={task.priority || 'normal'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
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
    </>
  );
}
