'use client';

import { useProjects, Project } from '@/hooks/use-workspace';
import { 
  Rocket, 
  Target, 
  Check, 
  Clock,
  AlertCircle,
  Pause,
  Loader2,
  RefreshCw
} from 'lucide-react';

export default function ProjectsPage() {
  const { projects, isLoading, isError, error, refresh } = useProjects();

  const activeProjects = projects.filter(p => p.status === 'active');
  const onHoldProjects = projects.filter(p => p.status === 'on-hold');
  const completedProjects = projects.filter(p => p.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-500">Manage your active work</p>
        </div>
        <button
          onClick={() => refresh()}
          className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
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
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && projects.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Target className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No projects yet</h2>
          <p className="text-slate-500">
            Ask your assistant to help you create and track projects!
          </p>
        </div>
      )}

      {/* Active Projects */}
      {activeProjects.length > 0 && (
        <ProjectSection 
          title="Active" 
          icon={<Rocket className="w-4 h-4 text-purple-500" />}
          projects={activeProjects} 
        />
      )}

      {/* On Hold Projects */}
      {onHoldProjects.length > 0 && (
        <ProjectSection 
          title="On Hold" 
          icon={<Pause className="w-4 h-4 text-amber-500" />}
          projects={onHoldProjects} 
        />
      )}

      {/* Completed Projects */}
      {completedProjects.length > 0 && (
        <ProjectSection 
          title="Completed" 
          icon={<Check className="w-4 h-4 text-green-500" />}
          projects={completedProjects} 
        />
      )}
    </div>
  );
}

function ProjectSection({ 
  title, 
  icon,
  projects 
}: { 
  title: string;
  icon: React.ReactNode;
  projects: Project[];
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-600">
        {icon}
        {title} ({projects.length})
      </div>
      
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const totalTasks = project.tasks.length;
  const doneTasks = project.tasks.filter(t => t.done).length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-slate-900">{project.name}</h3>
          {project.description && (
            <p className="text-sm text-slate-500 mt-0.5">{project.description}</p>
          )}
        </div>
        <div className="text-right">
          <span className="text-sm font-medium text-slate-900">{progress}%</span>
          <p className="text-xs text-slate-400">{doneTasks}/{totalTasks} tasks</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
        <div 
          className="h-full bg-purple-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Tasks list */}
      {project.tasks.length > 0 && (
        <ul className="space-y-2">
          {project.tasks.map((task) => (
            <li key={task.id} className="flex items-center gap-2 text-sm">
              <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                task.done 
                  ? 'bg-green-100 border-green-300 text-green-600' 
                  : 'border-slate-300'
              }`}>
                {task.done && <Check className="w-2.5 h-2.5" />}
              </span>
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
