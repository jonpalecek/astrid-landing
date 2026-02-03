'use client';

import { useTasks, Task } from '@/hooks/use-workspace';
import { 
  CheckCircle2, 
  Circle,
  Clock,
  AlertCircle,
  AlertTriangle,
  Loader2,
  RefreshCw
} from 'lucide-react';

export default function TasksPage() {
  const { tasks, sections, isLoading, isError, error, refresh } = useTasks();

  // Group tasks by section
  const tasksBySection = {
    today: tasks.filter(t => sections.today.includes(t.id)),
    thisWeek: tasks.filter(t => sections.thisWeek.includes(t.id)),
    later: tasks.filter(t => sections.later.includes(t.id)),
    done: tasks.filter(t => sections.done.includes(t.id)),
  };

  const pendingCount = tasksBySection.today.length + tasksBySection.thisWeek.length;
  const overdueCount = tasks.filter(t => !t.done && t.due && new Date(t.due) < new Date()).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
          <p className="text-slate-500">Your standalone tasks</p>
        </div>
        <button
          onClick={() => refresh()}
          className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
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
          <p className="text-slate-500">
            Ask your assistant to add tasks for you!
          </p>
        </div>
      )}

      {/* Task Sections */}
      {tasksBySection.today.length > 0 && (
        <TaskSection 
          title="Today" 
          icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
          tasks={tasksBySection.today} 
        />
      )}

      {tasksBySection.thisWeek.length > 0 && (
        <TaskSection 
          title="This Week" 
          icon={<Clock className="w-4 h-4 text-amber-500" />}
          tasks={tasksBySection.thisWeek} 
        />
      )}

      {tasksBySection.later.length > 0 && (
        <TaskSection 
          title="Later" 
          icon={<Circle className="w-4 h-4 text-slate-400" />}
          tasks={tasksBySection.later} 
        />
      )}

      {tasksBySection.done.length > 0 && (
        <TaskSection 
          title="Done" 
          icon={<CheckCircle2 className="w-4 h-4 text-green-500" />}
          tasks={tasksBySection.done} 
        />
      )}
    </div>
  );
}

function TaskSection({ title, icon, tasks }: { title: string; icon: React.ReactNode; tasks: Task[] }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-600">
        {icon}
        {title} ({tasks.length})
      </div>
      
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  const isOverdue = !task.done && task.due && new Date(task.due) < new Date();
  
  return (
    <div className="flex items-center gap-3 p-4">
      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
        task.done 
          ? 'bg-green-100 border-green-500 text-green-600' 
          : 'border-slate-300'
      }`}>
        {task.done && <CheckCircle2 className="w-3 h-3" />}
      </span>
      
      <span className={`flex-1 ${task.done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
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
    </div>
  );
}
