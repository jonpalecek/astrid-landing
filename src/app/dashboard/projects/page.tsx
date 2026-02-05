'use client';

import { useState } from 'react';
import { useProjects, Project, ProjectTask } from '@/hooks/use-workspace';
import { ConfirmModal } from '@/components/ConfirmModal';
import { 
  Rocket, 
  Target, 
  Check, 
  Clock,
  AlertCircle,
  Pause,
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
  X,
  ChevronDown,
  Pencil
} from 'lucide-react';

export default function ProjectsPage() {
  const { 
    projects, 
    isLoading, 
    isError, 
    error, 
    refresh, 
    addProject, 
    updateProject,
    updateStatus, 
    deleteProject,
    addProjectTask,
    toggleProjectTask,
    updateProjectTask,
    deleteProjectTask
  } = useProjects();
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeProjects = projects.filter(p => p.status === 'active');
  const pausedProjects = projects.filter(p => p.status === 'paused' || p.status === 'on-hold');
  const completedProjects = projects.filter(p => p.status === 'completed');

  const handleStatusChange = async (projectId: string, status: string) => {
    try {
      await updateStatus(projectId, status);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDelete = async (projectId: string) => {
    try {
      await deleteProject(projectId);
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  const handleAddProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    try {
      await addProject({ 
        name, 
        description: description || undefined,
        status: 'active'
      });
      setShowAddModal(false);
      form.reset();
    } catch (err) {
      console.error('Failed to add project:', err);
      alert('Failed to add project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-500">Manage your active work</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Project
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

      {/* Error State */}
      {isError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700">{error}</p>
        </div>
      )}

      {/* Loading State - only show if no cached data */}
      {isLoading && projects.length === 0 && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && projects.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Target className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No projects yet</h2>
          <p className="text-slate-500 mb-4">
            Get started by creating your first project!
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Project
          </button>
        </div>
      )}

      {/* Active Projects */}
      {activeProjects.length > 0 && (
        <ProjectSection 
          title="Active" 
          icon={<Rocket className="w-4 h-4 text-purple-500" />}
          projects={activeProjects}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onUpdateProject={updateProject}
          onToggleTask={toggleProjectTask}
          onAddTask={addProjectTask}
          onUpdateTask={updateProjectTask}
          onDeleteTask={deleteProjectTask}
        />
      )}

      {/* Paused Projects */}
      {pausedProjects.length > 0 && (
        <ProjectSection 
          title="Paused" 
          icon={<Pause className="w-4 h-4 text-amber-500" />}
          projects={pausedProjects}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onUpdateProject={updateProject}
          onToggleTask={toggleProjectTask}
          onAddTask={addProjectTask}
          onUpdateTask={updateProjectTask}
          onDeleteTask={deleteProjectTask}
        />
      )}

      {/* Completed Projects */}
      {completedProjects.length > 0 && (
        <ProjectSection 
          title="Completed" 
          icon={<Check className="w-4 h-4 text-green-500" />}
          projects={completedProjects}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onUpdateProject={updateProject}
          onToggleTask={toggleProjectTask}
          onAddTask={addProjectTask}
          onUpdateTask={updateProjectTask}
          onDeleteTask={deleteProjectTask}
        />
      )}

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Add Project</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddProject} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Project name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  autoFocus
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="My awesome project"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="What's this project about?"
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
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Add Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface ProjectSectionProps {
  title: string;
  icon: React.ReactNode;
  projects: Project[];
  onStatusChange: (projectId: string, status: string) => void;
  onDelete: (projectId: string) => void;
  onUpdateProject: (projectId: string, updates: { name?: string; description?: string }) => Promise<void>;
  onToggleTask: (projectId: string, taskId: string, done: boolean) => Promise<void>;
  onAddTask: (projectId: string, task: { title: string; due?: string; priority?: string }) => Promise<void>;
  onUpdateTask: (projectId: string, taskId: string, updates: { title?: string; due?: string; priority?: string }) => Promise<void>;
  onDeleteTask: (projectId: string, taskId: string) => Promise<void>;
}

function ProjectSection({ title, icon, projects, onStatusChange, onDelete, onUpdateProject, onToggleTask, onAddTask, onUpdateTask, onDeleteTask }: ProjectSectionProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-600">
        {icon}
        {title} ({projects.length})
      </div>
      
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {projects.map((project) => (
          <ProjectCard 
            key={project.id} 
            project={project}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
            onUpdateProject={onUpdateProject}
            onToggleTask={onToggleTask}
            onAddTask={onAddTask}
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask}
          />
        ))}
      </div>
    </div>
  );
}

interface ProjectCardProps {
  project: Project;
  onStatusChange: (projectId: string, status: string) => void;
  onDelete: (projectId: string) => void;
  onUpdateProject: (projectId: string, updates: { name?: string; description?: string }) => Promise<void>;
  onToggleTask: (projectId: string, taskId: string, done: boolean) => Promise<void>;
  onAddTask: (projectId: string, task: { title: string; due?: string; priority?: string }) => Promise<void>;
  onUpdateTask: (projectId: string, taskId: string, updates: { title?: string; due?: string; priority?: string }) => Promise<void>;
  onDeleteTask: (projectId: string, taskId: string) => Promise<void>;
}

function ProjectCard({ project, onStatusChange, onDelete, onUpdateProject, onToggleTask, onAddTask, onUpdateTask, onDeleteTask }: ProjectCardProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const totalTasks = project.tasks.length;
  const doneTasks = project.tasks.filter(t => t.done).length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const statusOptions = [
    { value: 'active', label: 'Active', icon: Rocket, color: 'text-purple-500' },
    { value: 'paused', label: 'Paused', icon: Pause, color: 'text-amber-500' },
    { value: 'completed', label: 'Completed', icon: Check, color: 'text-green-500' },
  ];

  const currentStatus = statusOptions.find(s => s.value === project.status) || statusOptions[0];

  const handleToggleTask = async (task: ProjectTask) => {
    try {
      await onToggleTask(project.id, task.id, !task.done);
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    setTaskToDelete(null);
    try {
      await onDeleteTask(project.id, taskToDelete);
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleDeleteProject = async () => {
    setShowDeleteConfirm(false);
    try {
      await onDelete(project.id);
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  const handleEditProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdating(true);
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    try {
      await onUpdateProject(project.id, { name, description });
      setShowEditModal(false);
    } catch (err) {
      console.error('Failed to update project:', err);
      alert('Failed to update project');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdating(true);
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    const title = formData.get('title') as string;

    try {
      await onAddTask(project.id, { title });
      setShowAddTaskModal(false);
      form.reset();
    } catch (err) {
      console.error('Failed to add task:', err);
      alert('Failed to add task');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTask) return;
    setIsUpdating(true);
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    const title = formData.get('title') as string;
    const due = formData.get('due') as string;
    const priority = formData.get('priority') as string;

    try {
      await onUpdateTask(project.id, editingTask.id, { 
        title, 
        due: due || undefined,
        priority: priority || undefined
      });
      setEditingTask(null);
    } catch (err) {
      console.error('Failed to update task:', err);
      alert('Failed to update task');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900">{project.name}</h3>
          {project.description && (
            <p className="text-sm text-slate-500 mt-0.5">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Edit Button */}
          <button
            onClick={() => setShowEditModal(true)}
            className="p-1 text-slate-300 hover:text-purple-500 opacity-0 group-hover:opacity-100 transition-all"
            title="Edit project"
          >
            <Pencil className="w-4 h-4" />
          </button>

          {/* Status Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg border transition-colors ${
                project.status === 'active' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                project.status === 'paused' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                'bg-green-50 border-green-200 text-green-700'
              }`}
            >
              <currentStatus.icon className="w-3 h-3" />
              {currentStatus.label}
              <ChevronDown className="w-3 h-3" />
            </button>
            
            {showStatusMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowStatusMenu(false)} 
                />
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 min-w-[120px]">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onStatusChange(project.id, option.value);
                        setShowStatusMenu(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-50 ${
                        project.status === option.value ? 'bg-slate-50' : ''
                      }`}
                    >
                      <option.icon className={`w-3 h-3 ${option.color}`} />
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Delete Button */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
            title="Delete project"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-purple-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-slate-500">{doneTasks}/{totalTasks}</span>
      </div>

      {/* Tasks list */}
      {project.tasks.length > 0 && (
        <ul className="space-y-2 mb-3">
          {project.tasks.map((task) => (
            <li key={task.id} className="flex items-center gap-2 text-sm group/task">
              <button
                onClick={() => handleToggleTask(task)}
                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                  task.done 
                    ? 'bg-green-100 border-green-300 text-green-600 hover:bg-green-200' 
                    : 'border-slate-300 hover:border-purple-400 hover:bg-purple-50'
                }`}
              >
                {task.done && <Check className="w-2.5 h-2.5" />}
              </button>
              <span className={`flex-1 ${task.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                {task.title}
              </span>
              {task.due && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {task.due}
                </span>
              )}
              {task.priority && task.priority !== 'normal' && (
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                  task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {task.priority}
                </span>
              )}
              <button
                onClick={() => setEditingTask(task)}
                className="p-0.5 text-slate-300 hover:text-purple-500 opacity-0 group-hover/task:opacity-100 transition-all"
                title="Edit task"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                onClick={() => setTaskToDelete(task.id)}
                className="p-0.5 text-slate-300 hover:text-red-500 opacity-0 group-hover/task:opacity-100 transition-all"
                title="Delete task"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add Task Button */}
      <button
        onClick={() => setShowAddTaskModal(true)}
        className="flex items-center gap-1 text-xs text-slate-400 hover:text-purple-500 transition-colors"
      >
        <Plus className="w-3 h-3" />
        Add task
      </button>

      {/* Edit Project Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Edit Project</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditProject} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Project name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  autoFocus
                  defaultValue={project.name}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={project.description || ''}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
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
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
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

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Add Task to {project.name}</h2>
              <button
                onClick={() => setShowAddTaskModal(false)}
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="What needs to be done?"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                >
                  {isUpdating ? (
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

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Edit Task</h2>
              <button
                onClick={() => setEditingTask(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditTask} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Task title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  autoFocus
                  defaultValue={editingTask.title}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Due date
                </label>
                <input
                  type="date"
                  name="due"
                  defaultValue={editingTask.due || ''}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Priority
                </label>
                <select
                  name="priority"
                  defaultValue={editingTask.priority || 'normal'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
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

      {/* Delete Project Confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.name}" and all its tasks? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={handleDeleteProject}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Delete Task Confirmation */}
      <ConfirmModal
        isOpen={!!taskToDelete}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        onConfirm={handleDeleteTask}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>
  );
}
