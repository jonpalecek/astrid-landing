import { createClient } from '@/lib/supabase-server';
import { getTunnelStatus } from '@/lib/cloudflare';
import Link from 'next/link';
import { 
  Sparkles, 
  ArrowRight,
  Wifi,
  WifiOff,
  Settings,
  Circle,
  Check,
} from 'lucide-react';
import { DashboardContent } from './dashboard-content';

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
      {!isActive && !isProvisioning && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Getting Started
          </h2>
          <p className="text-slate-600 mb-4">Complete these steps to set up your AI assistant:</p>
          <div className="space-y-3">
            <GettingStartedItem done={true} label="Create your account" />
            <GettingStartedItem done={!!instance} label="Connect your AI (Claude API key or subscription)" />
            <GettingStartedItem done={!!instance} label="Connect Telegram" />
            <GettingStartedItem done={false} label="Personalize your assistant" />
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

      {/* Dashboard Content - Client component with SWR */}
      <DashboardContent isActive={isActive} />
    </div>
  );
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
