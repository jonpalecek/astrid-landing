import { createClient } from '@/lib/supabase-server';
import { OpenClawSSHClient } from '@/lib/openclaw-client';
import { parseTasks, parseProjects } from '@/lib/workspace-parsers';
import { 
  CheckCircle2, 
  Circle,
  Clock,
  AlertCircle,
  Check,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

export default async function TasksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get user's instance
  const { data: instance } = await supabase
    .from('instances')
    .select('droplet_ip, status')
    .eq('user_id', user?.id)
    .single();

  let standaloneTasks: ReturnType<typeof parseTasks> = [];
  let projectTasks: ReturnType<typeof parseTasks> = [];
  let error: string | null = null;

  if (instance?.status === 'active' && instance?.droplet_ip) {
    try {
      const client = new OpenClawSSHClient(instance.droplet_ip);
      
      // Fetch both tasks and projects
      const [tasksContent, projectsContent] = await Promise.all([
        client.readFile('TASKS.md'),
        client.readFile('PROJECTS.md'),
      ]);
      
      if (tasksContent) {
        standaloneTasks = parseTasks(tasksContent);
      }
      
      if (projectsContent) {
        const projects = parseProjects(projectsContent);
        projectTasks = projects.flatMap(p => 
          p.tasks.map(t => ({ ...t, projectName: p.name }))
        );
      }
    } catch (e) {
      console.error('Failed to fetch tasks:', e);
      error = 'Unable to load tasks from your assistant';
    }
  }

  // Combine and organize tasks
  const allTasks = [...standaloneTasks, ...projectTasks];
  const todoTasks = allTasks.filter(t => t.status === 'todo');
  const inProgressTasks = allTasks.filter(t => t.status === 'in-progress');
  const blockedTasks = allTasks.filter(t => t.status === 'blocked');
  const doneTasks = allTasks.filter(t => t.status === 'done');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
        <p className="text-slate-500">All your tasks in one place</p>
      </div>

      {/* Stats */}
      {allTasks.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="To Do" count={todoTasks.length} color="slate" />
          <StatCard label="In Progress" count={inProgressTasks.length} color="blue" />
          <StatCard label="Blocked" count={blockedTasks.length} color="red" />
          <StatCard label="Done" count={doneTasks.length} color="green" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700">{error}</p>
        </div>
      )}

      {/* No Instance State */}
      {!instance?.droplet_ip && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No assistant connected</h2>
          <p className="text-slate-500 mb-6">
            Set up your assistant to start tracking tasks.
          </p>
          <a 
            href="/dashboard/onboarding"
            className="inline-flex items-center gap-1 px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            Get Started
          </a>
        </div>
      )}

      {/* Empty State */}
      {instance?.droplet_ip && allTasks.length === 0 && !error && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No tasks yet</h2>
          <p className="text-slate-500">
            Ask your assistant to help you create and track tasks!
          </p>
        </div>
      )}

      {/* In Progress */}
      {inProgressTasks.length > 0 && (
        <TaskSection 
          title="In Progress" 
          icon={<Circle className="w-4 h-4 text-blue-500 fill-blue-500" />}
          tasks={inProgressTasks} 
        />
      )}

      {/* Blocked */}
      {blockedTasks.length > 0 && (
        <TaskSection 
          title="Blocked" 
          icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
          tasks={blockedTasks} 
        />
      )}

      {/* To Do */}
      {todoTasks.length > 0 && (
        <TaskSection 
          title="To Do" 
          icon={<Circle className="w-4 h-4 text-slate-400" />}
          tasks={todoTasks} 
        />
      )}

      {/* Done */}
      {doneTasks.length > 0 && (
        <TaskSection 
          title="Completed" 
          icon={<Check className="w-4 h-4 text-green-500" />}
          tasks={doneTasks} 
          collapsed
        />
      )}
    </div>
  );
}

function StatCard({ label, count, color }: { label: string; count: number; color: string }) {
  const colors: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700',
    blue: 'bg-blue-100 text-blue-700',
    red: 'bg-red-100 text-red-700',
    green: 'bg-green-100 text-green-700',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
      <p className={`text-2xl font-bold ${colors[color]?.split(' ')[1] || 'text-slate-900'}`}>
        {count}
      </p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

function TaskSection({ 
  title, 
  icon,
  tasks,
  collapsed = false
}: { 
  title: string;
  icon: React.ReactNode;
  tasks: Array<ReturnType<typeof parseTasks>[0] & { projectName?: string }>;
  collapsed?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-600">
        {icon}
        {title} ({tasks.length})
      </div>
      
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center gap-3 p-4">
            <span className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
              task.status === 'done' 
                ? 'bg-green-100 border-green-300 text-green-600' 
                : task.status === 'blocked'
                ? 'bg-red-100 border-red-300 text-red-600'
                : task.status === 'in-progress'
                ? 'bg-blue-100 border-blue-300'
                : 'border-slate-300'
            }`}>
              {task.status === 'done' && <Check className="w-3 h-3" />}
              {task.status === 'blocked' && <span className="text-xs font-bold">!</span>}
            </span>
            
            <div className="flex-1 min-w-0">
              <p className={`${task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                {task.title}
              </p>
              {task.projectName && (
                <p className="text-xs text-slate-400 mt-0.5">in {task.projectName}</p>
              )}
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              {task.due && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {task.due}
                </span>
              )}
              {task.priority && task.priority !== 'medium' && (
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                  task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {task.priority}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
