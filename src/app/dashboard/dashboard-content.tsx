'use client';

import { useDashboard } from '@/hooks/use-workspace';
import { 
  Inbox, 
  Rocket, 
  CheckCircle2, 
  Lightbulb, 
  Sparkles, 
  Target,
  ArrowRight,
  Plus,
  Circle,
  Check,
  AlertCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';

export function DashboardContent({ isActive }: { isActive: boolean }) {
  const { tasks, projects, ideas, inbox, isLoading } = useDashboard();

  // Calculate stats
  const inboxCount = inbox.items.length;
  const activeProjects = projects.projects.filter(p => p.status === 'active' || !p.status);
  const activeProjectsCount = activeProjects.length;
  const tasksDoneThisWeek = tasks.tasks.filter(t => t.done).length;
  const ideasCount = ideas.ideas.length;
  const upcomingTasks = tasks.tasks.filter(t => !t.done).slice(0, 5);
  const recentInbox = inbox.items.slice(0, 5);

  const hasError = tasks.isError || projects.isError || ideas.isError || inbox.isError;
  const errorMessage = tasks.error || projects.error || ideas.error || inbox.error;

  if (!isActive) {
    return null;
  }

  return (
    <>
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<Inbox className="w-6 h-6 text-blue-500" />}
          label="Inbox" 
          value={inboxCount.toString()} 
          sublabel={inboxCount === 1 ? "item to process" : "items to process"}
          href="/dashboard/inbox"
          loading={inbox.isLoading && inbox.items.length === 0}
        />
        <StatCard 
          icon={<Rocket className="w-6 h-6 text-purple-500" />}
          label="Active Projects" 
          value={activeProjectsCount.toString()} 
          sublabel="in progress"
          href="/dashboard/projects"
          loading={projects.isLoading && projects.projects.length === 0}
        />
        <StatCard 
          icon={<CheckCircle2 className="w-6 h-6 text-green-500" />}
          label="Tasks Done" 
          value={tasksDoneThisWeek.toString()} 
          sublabel="completed"
          href="/dashboard/tasks"
          loading={tasks.isLoading && tasks.tasks.length === 0}
        />
        <StatCard 
          icon={<Lightbulb className="w-6 h-6 text-amber-500" />}
          label="Ideas" 
          value={ideasCount.toString()} 
          sublabel="in backlog"
          href="/dashboard/ideas"
          loading={ideas.isLoading && ideas.ideas.length === 0}
        />
      </div>

      {/* Error Banner */}
      {hasError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700">{errorMessage}</p>
        </div>
      )}

      {/* Live Data Indicator */}
      {!hasError && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          {isLoading ? 'Refreshing...' : 'Live from assistant'}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inbox Preview */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Inbox className="w-5 h-5 text-blue-500" />
              Inbox
            </h2>
            <a href="/dashboard/inbox" className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </a>
          </div>
          {recentInbox.length > 0 ? (
            <ul className="space-y-2">
              {recentInbox.map((item) => (
                <li key={item.id} className="flex items-start gap-2 text-sm">
                  <Circle className="w-2 h-2 text-blue-400 mt-1.5 shrink-0" />
                  <span className="text-slate-700 line-clamp-1">{item.content}</span>
                </li>
              ))}
            </ul>
          ) : inbox.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Sparkles className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p>Inbox zero! Nothing to process.</p>
            </div>
          )}
        </div>

        {/* Active Projects */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Rocket className="w-5 h-5 text-purple-500" />
              Active Projects
            </h2>
            <a href="/dashboard/projects" className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </a>
          </div>
          {activeProjects.length > 0 ? (
            <ul className="space-y-3">
              {activeProjects.slice(0, 5).map((project) => (
                <li key={project.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-400" />
                    <span className="text-sm font-medium text-slate-700">{project.name}</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {project.tasks?.filter(t => !t.done).length || 0} tasks
                  </span>
                </li>
              ))}
            </ul>
          ) : projects.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Target className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p>No projects yet. Create your first one!</p>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Tasks */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Upcoming Tasks
          </h2>
          <a href="/dashboard/tasks" className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </a>
        </div>
        {upcomingTasks.length > 0 ? (
          <ul className="space-y-2">
            {upcomingTasks.map((task) => (
              <li key={task.id} className="flex items-center gap-3 text-sm">
                <span className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                  task.done 
                    ? 'bg-green-100 border-green-300 text-green-600' 
                    : 'border-slate-300'
                }`}>
                  {task.done && <Check className="w-3 h-3" />}
                </span>
                <span className={`flex-1 ${task.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                  {task.title}
                </span>
                {task.due && (
                  <span className="text-xs text-slate-400">{task.due}</span>
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
        ) : tasks.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <Sparkles className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p>No tasks yet. Ask your assistant to help you get organized!</p>
          </div>
        )}
      </div>
    </>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  sublabel, 
  href,
  loading 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  sublabel: string;
  href?: string;
  loading?: boolean;
}) {
  const content = (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-sm transition-all">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin text-slate-300 my-1" />
          ) : (
            <p className="text-2xl font-bold text-slate-900">{value}</p>
          )}
          <p className="text-xs text-slate-400">{sublabel}</p>
        </div>
      </div>
    </div>
  );

  if (href) {
    return <a href={href}>{content}</a>;
  }
  return content;
}
