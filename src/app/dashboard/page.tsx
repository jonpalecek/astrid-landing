import { createClient } from '@/lib/supabase-server';
import { getTunnelStatus } from '@/lib/cloudflare';
import Link from 'next/link';
import { 
  Inbox, 
  Rocket, 
  CheckCircle2, 
  Lightbulb, 
  Sparkles, 
  Target,
  MessageSquare,
  ArrowRight,
  Plus,
  Circle,
  Check,
  Wifi,
  WifiOff,
  Settings,
  AlertCircle
} from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Get instance status
  let { data: instance } = await supabase
    .from('instances')
    .select('*')
    .eq('user_id', user?.id)
    .single();

  // Check and update status if needed
  if (instance && instance.status !== 'active' && instance.tunnel_id) {
    try {
      const tunnelStatus = await getTunnelStatus(instance.tunnel_id);
      if (tunnelStatus.status === 'healthy' || tunnelStatus.connections > 0) {
        // Update to active
        await supabase
          .from('instances')
          .update({
            status: 'active',
            status_message: 'OpenClaw is running',
            health_status: 'healthy',
            last_health_check: new Date().toISOString(),
          })
          .eq('id', instance.id);
        
        instance.status = 'active';
        instance.health_status = 'healthy';
      }
    } catch (e) {
      console.error('Failed to check tunnel status:', e);
    }
  }

  const isActive = instance?.status === 'active';
  const isProvisioning = instance?.status === 'provisioning' || instance?.status === 'configuring';
  
  // Fetch workspace data from Supabase (synced by assistant)
  let workspaceStats = {
    inboxCount: 0,
    activeProjectsCount: 0,
    tasksDoneThisWeek: 0,
    ideasCount: 0,
    activeProjects: [] as Array<{ id: string; name: string; status: string; tasks: Array<{ status: string }> }>,
    recentTasks: [] as Array<{ id: string; title: string; status: string; due?: string; priority?: string }>,
    recentInbox: [] as Array<{ id: string; content: string }>,
    recentIdeas: [] as Array<{ id: string; content: string }>,
  };
  let workspaceError: string | null = null;
  let lastSyncedAt: string | null = null;

  if (isActive && instance?.id) {
    const { data: workspaceData, error: wsError } = await supabase
      .from('workspace_data')
      .select('*')
      .eq('instance_id', instance.id)
      .single();

    if (wsError && wsError.code !== 'PGRST116') {
      // PGRST116 = no rows, which is fine for new instances
      console.error('Failed to fetch workspace data:', wsError);
      workspaceError = 'Unable to load workspace data';
    } else if (workspaceData) {
      lastSyncedAt = workspaceData.synced_at;
      const stats = workspaceData.stats || {};
      const projects = workspaceData.projects || [];
      const tasks = workspaceData.tasks || [];
      const inbox = workspaceData.inbox || [];
      const ideas = workspaceData.ideas || [];

      workspaceStats = {
        inboxCount: stats.inboxCount ?? inbox.length,
        activeProjectsCount: stats.activeProjectsCount ?? projects.filter((p: any) => p.status === 'active').length,
        tasksDoneThisWeek: stats.tasksDoneThisWeek ?? 0,
        ideasCount: stats.ideasCount ?? ideas.length,
        activeProjects: projects.filter((p: any) => p.status === 'active').slice(0, 5),
        recentTasks: tasks.filter((t: any) => t.status !== 'done').slice(0, 5),
        recentInbox: inbox.slice(0, 5),
        recentIdeas: ideas.slice(0, 5),
      };
    } else {
      // No workspace data yet - assistant hasn't synced
      workspaceError = 'Waiting for assistant to sync workspace data...';
    }
  }

  // Get current hour for greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 
                    user?.email?.split('@')[0] || 'there';

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          {greeting}, {firstName} 👋
        </h1>
        <p className="mt-1 text-slate-500">
          Here&apos;s what&apos;s happening with your assistant today.
        </p>
      </div>

      {/* Getting Started - Show prominently if no active instance */}
      {!isActive && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Getting Started
          </h2>
          <p className="text-slate-600 mb-4">Complete these steps to set up your AI assistant:</p>
          <div className="space-y-3">
            <GettingStartedItem 
              done={true} 
              label="Create your account" 
            />
            <GettingStartedItem 
              done={!!instance} 
              label="Connect your AI (Claude API key or subscription)" 
            />
            <GettingStartedItem 
              done={!!instance} 
              label="Connect Telegram" 
            />
            <GettingStartedItem 
              done={false} 
              label="Personalize your assistant" 
            />
          </div>
          <a 
            href="/dashboard/onboarding" 
            className="inline-flex items-center gap-1 mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            Continue Setup <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      )}

      {/* Assistant Status Card - Show when instance exists */}
      {instance && (
        <div className={`rounded-xl border p-6 ${
          isActive 
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
            : isProvisioning
            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
            : 'bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${
                isActive ? 'bg-green-100' : isProvisioning ? 'bg-blue-100' : 'bg-slate-100'
              }`}>
                {instance.assistant_emoji || '🤖'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  {instance.assistant_name || 'Your Assistant'}
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      <Wifi className="w-3 h-3" /> Online
                    </span>
                  ) : isProvisioning ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      <span className="animate-spin">⏳</span> Setting up...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                      <WifiOff className="w-3 h-3" /> Offline
                    </span>
                  )}
                </h2>
                <p className="text-slate-500 text-sm">
                  {isActive 
                    ? 'Your AI assistant is running and ready to help!' 
                    : isProvisioning 
                    ? 'Your assistant is being set up. This may take a few minutes.'
                    : instance.status_message || 'Assistant is offline'}
                </p>
              </div>
            </div>
            <Link 
              href="/dashboard/settings" 
              className="flex items-center gap-1 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-white/50 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" /> Settings
            </Link>
          </div>
          {isActive && (
            <div className="mt-4 pt-4 border-t border-green-200/50 flex items-center gap-6 text-sm text-slate-600">
              <span>Region: {instance.region?.toUpperCase() || 'SFO'}</span>
              <span>•</span>
              <span>Tunnel: Connected</span>
              {instance.tunnel_hostname && (
                <>
                  <span>•</span>
                  <span className="font-mono text-xs bg-white/50 px-2 py-0.5 rounded">
                    {instance.tunnel_hostname.replace('https://', '')}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<Inbox className="w-6 h-6 text-blue-500" />}
          label="Inbox" 
          value={workspaceStats.inboxCount.toString()} 
          sublabel={workspaceStats.inboxCount === 1 ? "item to process" : "items to process"}
          href="/dashboard/inbox"
        />
        <StatCard 
          icon={<Rocket className="w-6 h-6 text-purple-500" />}
          label="Active Projects" 
          value={workspaceStats.activeProjectsCount.toString()} 
          sublabel="in progress"
          href="/dashboard/projects"
        />
        <StatCard 
          icon={<CheckCircle2 className="w-6 h-6 text-green-500" />}
          label="Tasks Done" 
          value={workspaceStats.tasksDoneThisWeek.toString()} 
          sublabel="this week"
        />
        <StatCard 
          icon={<Lightbulb className="w-6 h-6 text-amber-500" />}
          label="Ideas" 
          value={workspaceStats.ideasCount.toString()} 
          sublabel="in backlog"
          href="/dashboard/ideas"
        />
      </div>

      {/* Workspace Error Banner */}
      {workspaceError && isActive && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700">{workspaceError}</p>
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
          {workspaceStats.recentInbox.length > 0 ? (
            <ul className="space-y-2">
              {workspaceStats.recentInbox.map((item) => (
                <li key={item.id} className="flex items-start gap-2 text-sm">
                  <Circle className="w-2 h-2 text-blue-400 mt-1.5 shrink-0" />
                  <span className="text-slate-700 line-clamp-1">{item.content}</span>
                </li>
              ))}
            </ul>
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
          {workspaceStats.activeProjects.length > 0 ? (
            <ul className="space-y-3">
              {workspaceStats.activeProjects.map((project) => (
                <li key={project.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-400" />
                    <span className="text-sm font-medium text-slate-700">{project.name}</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {project.tasks.filter(t => t.status !== 'done').length} tasks
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Target className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p>No projects yet. Create your first one!</p>
              <a 
                href="/dashboard/projects/new" 
                className="inline-flex items-center gap-1 mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                <Plus className="w-4 h-4" /> New Project
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Tasks */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          Upcoming Tasks
        </h2>
        {workspaceStats.recentTasks.length > 0 ? (
          <ul className="space-y-2">
            {workspaceStats.recentTasks.map((task) => (
              <li key={task.id} className="flex items-center gap-3 text-sm">
                <span className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                  task.status === 'done' 
                    ? 'bg-green-100 border-green-300 text-green-600' 
                    : task.status === 'in-progress'
                    ? 'bg-blue-100 border-blue-300'
                    : 'border-slate-300'
                }`}>
                  {task.status === 'done' && <Check className="w-3 h-3" />}
                </span>
                <span className={`flex-1 ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                  {task.title}
                </span>
                {task.due && (
                  <span className="text-xs text-slate-400">{task.due}</span>
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
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <Sparkles className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p>No tasks yet. Ask your assistant to help you get organized!</p>
          </div>
        )}
      </div>

    </div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  sublabel, 
  href 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  sublabel: string;
  href?: string;
}) {
  const content = (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-sm transition-all">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
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

function GettingStartedItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`w-6 h-6 rounded-full flex items-center justify-center ${
        done ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
      }`}>
        {done ? <Check className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
      </span>
      <span className={done ? 'text-slate-500 line-through' : 'text-slate-700'}>
        {label}
      </span>
    </div>
  );
}
