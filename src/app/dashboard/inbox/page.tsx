import { createClient } from '@/lib/supabase-server';
import { OpenClawSSHClient } from '@/lib/openclaw-client';
import { parseInbox } from '@/lib/workspace-parsers';
import { 
  Inbox, 
  Sparkles,
  AlertCircle,
  Circle
} from 'lucide-react';

export default async function InboxPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get user's instance
  const { data: instance } = await supabase
    .from('instances')
    .select('droplet_ip, status')
    .eq('user_id', user?.id)
    .single();

  let items: ReturnType<typeof parseInbox> = [];
  let error: string | null = null;

  if (instance?.status === 'active' && instance?.droplet_ip) {
    try {
      const client = new OpenClawSSHClient(instance.droplet_ip);
      const content = await client.readFile('INBOX.md');
      if (content) {
        items = parseInbox(content);
      }
    } catch (e) {
      console.error('Failed to fetch inbox:', e);
      error = 'Unable to load inbox from your assistant';
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Inbox</h1>
        <p className="text-slate-500">Quick captures and items to process</p>
      </div>

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
          <Inbox className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No assistant connected</h2>
          <p className="text-slate-500 mb-6">
            Set up your assistant to start capturing items.
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
      {instance?.droplet_ip && items.length === 0 && !error && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Inbox zero! 🎉</h2>
          <p className="text-slate-500">
            Nothing to process. Send items to your assistant to capture them here.
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
              <li key={item.id} className="flex items-start gap-3 p-4 hover:bg-slate-50">
                <Circle className="w-2 h-2 text-blue-400 mt-2 shrink-0" />
                <div className="flex-1">
                  <p className="text-slate-800">{item.content}</p>
                  {item.source && (
                    <p className="text-xs text-slate-400 mt-1">from: {item.source}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Help text */}
      {items.length > 0 && (
        <p className="text-sm text-slate-500 text-center">
          💡 Ask your assistant to help you process these items into projects, tasks, or ideas.
        </p>
      )}
    </div>
  );
}
