'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { User } from '@supabase/supabase-js';
import { 
  User as UserIcon, 
  Bot, 
  MessageSquare, 
  Cpu, 
  Bell, 
  CreditCard,
  Save,
  Check,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

type SettingsTab = 'account' | 'assistant' | 'channels' | 'ai' | 'notifications' | 'billing';

interface Instance {
  id: string;
  user_id: string;
  droplet_name: string;
  droplet_id: string;
  droplet_ip: string;
  region: string;
  size: string;
  status: string;
  status_message: string;
  gateway_token: string;
  tunnel_id: string;
  tunnel_hostname: string;
  assistant_name: string;
  assistant_emoji: string;
  health_status: string;
  created_at: string;
  provisioned_at: string;
}

interface Profile {
  id: string;
  subscription_status: string | null;
  subscription_id: string | null;
  subscription_ends_at: string | null;
  stripe_customer_id: string | null;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [user, setUser] = useState<User | null>(null);
  const [instance, setInstance] = useState<Instance | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const [instanceResult, profileResult] = await Promise.all([
          supabase
            .from('instances')
            .select('*')
            .eq('user_id', user.id)
            .single(),
          supabase
            .from('profiles')
            .select('id, subscription_status, subscription_id, subscription_ends_at, stripe_customer_id')
            .eq('id', user.id)
            .single()
        ]);
        
        setInstance(instanceResult.data);
        setProfile(profileResult.data);
      }
      
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  const tabs = [
    { id: 'account' as const, label: 'Account', icon: UserIcon },
    { id: 'assistant' as const, label: 'Assistant', icon: Bot },
    { id: 'channels' as const, label: 'Channels', icon: MessageSquare },
    { id: 'ai' as const, label: 'AI / API', icon: Cpu },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'billing' as const, label: 'Billing', icon: CreditCard },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500">Manage your account and assistant</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-amber-50 text-amber-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'account' && <AccountSettings user={user} />}
          {activeTab === 'assistant' && <AssistantSettings instance={instance} supabase={supabase} />}
          {activeTab === 'channels' && <ChannelsSettings instance={instance} />}
          {activeTab === 'ai' && <AISettings instance={instance} />}
          {activeTab === 'notifications' && <NotificationsSettings />}
          {activeTab === 'billing' && <BillingSettings profile={profile} />}
        </div>
      </div>
    </div>
  );
}

function AccountSettings({ user }: { user: User | null }) {
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [timezone, setTimezone] = useState('America/Los_Angeles');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName }
    });
    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Account</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <p className="text-slate-900 bg-slate-50 px-3 py-2 rounded-lg">{user?.email}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
            >
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Europe/Paris">Paris (CET)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Plan</label>
            <div className="flex items-center gap-3">
              <span className="text-slate-900">Free Trial</span>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                7 days left
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Member since</label>
            <p className="text-slate-900">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl border border-red-200 p-6">
        <h2 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h2>
        <p className="text-slate-600 mb-4">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
        <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
          Delete Account
        </button>
      </div>
    </>
  );
}

const PERSONALITY_TRAITS = [
  { id: 'warm', label: 'Warm & Friendly', description: 'Approachable and personable tone' },
  { id: 'professional', label: 'Professional', description: 'Polished and business-appropriate' },
  { id: 'direct', label: 'Direct & Concise', description: 'Gets to the point quickly' },
  { id: 'detailed', label: 'Detail-Oriented', description: 'Thorough and comprehensive' },
  { id: 'playful', label: 'Playful / Witty', description: 'Light humor when appropriate' },
  { id: 'proactive', label: 'Proactive', description: 'Anticipates needs and suggests actions' },
  { id: 'encouraging', label: 'Encouraging', description: 'Supportive and motivating' },
  { id: 'analytical', label: 'Analytical', description: 'Data-driven and logical' },
  { id: 'creative', label: 'Creative', description: 'Thinks outside the box' },
  { id: 'patient', label: 'Patient', description: 'Takes time to explain things clearly' },
  { id: 'curious', label: 'Curious', description: 'Asks clarifying questions' },
  { id: 'organized', label: 'Organized', description: 'Structured and systematic approach' },
];

function AssistantSettings({ instance, supabase }: { instance: Instance | null; supabase: ReturnType<typeof createClient> }) {
  const [name, setName] = useState(instance?.assistant_name || 'Astrid');
  const [emoji, setEmoji] = useState(instance?.assistant_emoji || '✨');
  const [selectedTraits, setSelectedTraits] = useState<string[]>(['warm', 'professional', 'proactive']);
  const [customContext, setCustomContext] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleTrait = (traitId: string) => {
    setSelectedTraits(prev => 
      prev.includes(traitId) 
        ? prev.filter(t => t !== traitId)
        : [...prev, traitId]
    );
  };

  const handleSave = async () => {
    if (!instance) return;
    
    setSaving(true);
    try {
      // Save to Supabase and sync to VM via API
      const response = await fetch('/api/instances/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assistantName: name,
          assistantEmoji: emoji,
        }),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error('Failed to save:', error);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Assistant Identity</h2>
        
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Assistant Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
              />
              <p className="text-xs text-slate-400 mt-1">This is how your assistant introduces itself</p>
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium text-slate-700 mb-1">Emoji</label>
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 text-center text-xl"
                maxLength={2}
              />
            </div>
          </div>

          {instance && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700">
                Assistant is running on {instance.region?.toUpperCase() || 'SFO'} server
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Personality Traits</h2>
        <p className="text-sm text-slate-500 mb-4">Select the traits that best describe how you'd like your assistant to communicate.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PERSONALITY_TRAITS.map((trait) => (
            <label
              key={trait.id}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                selectedTraits.includes(trait.id)
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedTraits.includes(trait.id)}
                onChange={() => toggleTrait(trait.id)}
                className="mt-0.5 w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
              />
              <div>
                <p className={`text-sm font-medium ${selectedTraits.includes(trait.id) ? 'text-amber-900' : 'text-slate-900'}`}>
                  {trait.label}
                </p>
                <p className={`text-xs ${selectedTraits.includes(trait.id) ? 'text-amber-700' : 'text-slate-500'}`}>
                  {trait.description}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Additional Context</h2>
        <p className="text-sm text-slate-500 mb-4">
          Share anything else that would help your assistant work better for you.
        </p>
        
        <textarea
          value={customContext}
          onChange={(e) => setCustomContext(e.target.value)}
          placeholder="Example: I prefer bullet points over long paragraphs. Don't use exclamation marks too often..."
          rows={4}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 resize-none"
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || !instance}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

function ChannelsSettings({ instance }: { instance: Instance | null }) {
  const telegramConnected = instance?.status === 'active';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Connected Channels</h2>
      
      <div className="space-y-4">
        {/* Telegram */}
        <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📱</span>
            <div>
              <p className="font-medium text-slate-900">Telegram</p>
              {telegramConnected ? (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Connected
                </p>
              ) : (
                <p className="text-sm text-slate-500">Not connected</p>
              )}
            </div>
          </div>
          {telegramConnected ? (
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
              Active
            </span>
          ) : (
            <a
              href="/dashboard/onboarding"
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              Connect
            </a>
          )}
        </div>

        {/* Email */}
        <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📧</span>
            <div>
              <p className="font-medium text-slate-900">Email</p>
              <p className="text-sm text-slate-500">Coming soon</p>
            </div>
          </div>
          <button disabled className="px-4 py-2 bg-slate-100 text-slate-400 rounded-lg cursor-not-allowed">
            Soon
          </button>
        </div>

        {/* WhatsApp */}
        <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg opacity-60">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💬</span>
            <div>
              <p className="font-medium text-slate-900">WhatsApp</p>
              <p className="text-sm text-slate-500">Coming soon</p>
            </div>
          </div>
          <button disabled className="px-4 py-2 bg-slate-100 text-slate-400 rounded-lg cursor-not-allowed">
            Soon
          </button>
        </div>
      </div>
    </div>
  );
}

const CLAUDE_MODELS = [
  { 
    id: 'anthropic/claude-opus-4-5', 
    name: 'Claude Opus 4.5', 
    description: 'Most capable model, best for complex tasks',
    price: '$$$$$',
  },
  { 
    id: 'anthropic/claude-sonnet-4-5', 
    name: 'Claude Sonnet 4.5', 
    description: 'Balanced performance and cost (recommended)',
    price: '$$$',
  },
  { 
    id: 'anthropic/claude-haiku-4-5', 
    name: 'Claude Haiku 4.5', 
    description: 'Fast and affordable for simple tasks',
    price: '$',
  },
];

interface LiveConfig {
  assistantName: string;
  assistantEmoji: string;
  model: string;
  region: string;
  status: string;
  source: 'live' | 'cache';
  warning?: string;
}

type SaveStatus = 'idle' | 'updating' | 'restarting' | 'verifying' | 'done' | 'error';

const SAVE_STATUS_MESSAGES: Record<SaveStatus, string> = {
  idle: '',
  updating: 'Updating configuration...',
  restarting: 'Restarting assistant (this takes ~30-45 seconds)...',
  verifying: 'Verifying changes...',
  done: 'Model updated successfully!',
  error: 'Failed to update model',
};

function AISettings({ instance }: { instance: Instance | null }) {
  const [selectedModel, setSelectedModel] = useState('');
  const [currentModel, setCurrentModel] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [configSource, setConfigSource] = useState<'live' | 'cache' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isConfigured = instance?.status === 'active';

  // Fetch live config when component mounts
  useEffect(() => {
    async function fetchConfig() {
      if (!isConfigured) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/instances/config');
        if (response.ok) {
          const data: LiveConfig = await response.json();
          setSelectedModel(data.model);
          setCurrentModel(data.model);
          setConfigSource(data.source);
          if (data.warning) {
            setError(data.warning);
          }
        } else {
          setError('Failed to fetch configuration');
        }
      } catch (err) {
        console.error('Failed to fetch config:', err);
        setError('Failed to connect to your assistant');
      }
      setLoading(false);
    }

    fetchConfig();
  }, [isConfigured]);

  const handleSaveModel = async () => {
    if (!instance || selectedModel === currentModel) return;
    
    setSaving(true);
    setSaveStatus('updating');
    setError(null);
    
    try {
      // Show restarting status after a brief delay
      const restartTimer = setTimeout(() => setSaveStatus('restarting'), 2000);
      
      const response = await fetch('/api/instances/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: selectedModel }),
      });
      
      clearTimeout(restartTimer);
      
      const data = await response.json();
      
      if (response.ok) {
        setSaveStatus('verifying');
        
        // Brief delay to show verification
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setCurrentModel(selectedModel);
        setSaveStatus('done');
        setSaved(true);
        
        // Reset status after showing success
        setTimeout(() => {
          setSaved(false);
          setSaveStatus('idle');
        }, 3000);
        
        if (data.warning) {
          setError(data.warning);
        }
      } else {
        setSaveStatus('error');
        setError(data.error || 'Failed to save');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (err) {
      console.error('Failed to save model:', err);
      setSaveStatus('error');
      setError('Failed to save configuration');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
    setSaving(false);
  };

  const hasChanges = selectedModel !== currentModel;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">AI Configuration</h2>
        
        {isConfigured ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-green-700 font-medium">AI is configured and running</span>
              {configSource === 'live' && (
                <span className="ml-auto text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">Live</span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">AI Provider</label>
              <p className="text-slate-900">Claude (Anthropic)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Authentication</label>
              <p className="text-slate-900">Connected via Setup Token</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Server</label>
              <p className="text-slate-900">{instance?.region?.toUpperCase() || 'SFO'} • {instance?.droplet_ip || 'Running'}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-800 font-medium">AI not configured</p>
                <p className="text-amber-700 text-sm mt-1">Complete onboarding to set up your Claude connection.</p>
              </div>
            </div>
            <a 
              href="/dashboard/onboarding"
              className="inline-block mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              Complete Setup →
            </a>
          </>
        )}
      </div>

      {isConfigured && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-slate-900">Model Selection</h2>
            {currentModel && (
              <span className="text-xs text-slate-500">
                Current: {CLAUDE_MODELS.find(m => m.id === currentModel)?.name || currentModel}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Choose which Claude model powers your assistant. More capable models cost more but handle complex tasks better.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full"></div>
              <span className="ml-2 text-slate-500">Loading current model...</span>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {CLAUDE_MODELS.map((model) => (
                  <label
                    key={model.id}
                    className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedModel === model.id
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    } ${model.id === currentModel && selectedModel !== model.id ? 'ring-1 ring-green-300' : ''}`}
                  >
                    <input
                      type="radio"
                      name="model"
                      value={model.id}
                      checked={selectedModel === model.id}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="mt-1 w-4 h-4 text-amber-500 focus:ring-amber-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${selectedModel === model.id ? 'text-amber-900' : 'text-slate-900'}`}>
                            {model.name}
                          </p>
                          {model.id === currentModel && (
                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Active</span>
                          )}
                        </div>
                        <span className={`text-sm font-mono ${selectedModel === model.id ? 'text-amber-700' : 'text-slate-500'}`}>
                          {model.price}
                        </span>
                      </div>
                      <p className={`text-sm mt-0.5 ${selectedModel === model.id ? 'text-amber-700' : 'text-slate-500'}`}>
                        {model.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Save status indicator */}
              {saveStatus !== 'idle' && saveStatus !== 'done' && (
                <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
                  saveStatus === 'error' 
                    ? 'bg-red-50 border border-red-200' 
                    : 'bg-blue-50 border border-blue-200'
                }`}>
                  {saveStatus !== 'error' && (
                    <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  )}
                  {saveStatus === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  <div>
                    <p className={`font-medium ${saveStatus === 'error' ? 'text-red-700' : 'text-blue-700'}`}>
                      {SAVE_STATUS_MESSAGES[saveStatus]}
                    </p>
                    {saveStatus === 'restarting' && (
                      <p className="text-sm text-blue-600 mt-1">
                        Your assistant will be briefly unavailable during the restart.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Success message */}
              {saveStatus === 'done' && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <p className="font-medium text-green-700">{SAVE_STATUS_MESSAGES[saveStatus]}</p>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                {hasChanges && saveStatus === 'idle' && (
                  <span className="text-sm text-amber-600">
                    ⚠️ Changing model will restart your assistant (~45 seconds)
                  </span>
                )}
                <div className="ml-auto">
                  <button
                    onClick={handleSaveModel}
                    disabled={saving || !hasChanges}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Updating...' : saved ? 'Updated!' : hasChanges ? 'Save Model' : 'No Changes'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationsSettings() {
  const [emailDigest, setEmailDigest] = useState(true);
  const [urgentAlerts, setUrgentAlerts] = useState(true);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Notifications</h2>
      
      <div className="space-y-4">
        <label className="flex items-center justify-between p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
          <div>
            <p className="font-medium text-slate-900">Daily Email Digest</p>
            <p className="text-sm text-slate-500">Receive a summary of your day each morning</p>
          </div>
          <input
            type="checkbox"
            checked={emailDigest}
            onChange={(e) => setEmailDigest(e.target.checked)}
            className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500"
          />
        </label>

        <label className="flex items-center justify-between p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
          <div>
            <p className="font-medium text-slate-900">Urgent Alerts</p>
            <p className="text-sm text-slate-500">Get notified immediately for important items</p>
          </div>
          <input
            type="checkbox"
            checked={urgentAlerts}
            onChange={(e) => setUrgentAlerts(e.target.checked)}
            className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500"
          />
        </label>
      </div>
    </div>
  );
}

function BillingSettings({ profile }: { profile: Profile | null }) {
  const [loading, setLoading] = useState(false);

  const isTrialing = profile?.subscription_status === 'trialing';
  const isActive = profile?.subscription_status === 'active';
  const isSubscribed = isTrialing || isActive;
  const isPastDue = profile?.subscription_status === 'past_due';

  async function handleSubscribe() {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to start checkout');
      }
    } catch (err) {
      alert('Failed to start checkout');
    } finally {
      setLoading(false);
    }
  }

  async function handleManageBilling() {
    setLoading(true);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to open billing portal');
      }
    } catch (err) {
      alert('Failed to open billing portal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Current Plan</h2>
        
        {isTrialing ? (
          <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div>
              <p className="font-semibold text-slate-900">Astrid Pro — Free Trial</p>
              <p className="text-sm text-blue-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Trial active
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">$0</p>
              <p className="text-sm text-slate-500">then $99/mo</p>
            </div>
          </div>
        ) : isActive ? (
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div>
              <p className="font-semibold text-slate-900">Astrid Pro</p>
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Active subscription
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">$99</p>
              <p className="text-sm text-slate-500">per month</p>
            </div>
          </div>
        ) : isPastDue ? (
          <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
            <div>
              <p className="font-semibold text-slate-900">Astrid Pro</p>
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> Payment past due
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">$99</p>
              <p className="text-sm text-slate-500">per month</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div>
              <p className="font-semibold text-slate-900">No Active Plan</p>
              <p className="text-sm text-slate-600">Subscribe to get started</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">$99</p>
              <p className="text-sm text-slate-500">per month</p>
            </div>
          </div>
        )}

        <div className="mt-4 p-4 border border-slate-200 rounded-lg">
          <h3 className="font-medium text-slate-900 mb-2">What's included:</h3>
          <ul className="space-y-1 text-sm text-slate-600">
            <li>✓ Dedicated AI assistant instance</li>
            <li>✓ Telegram integration</li>
            <li>✓ Email capture (coming soon)</li>
            <li>✓ Project & task management</li>
            <li>✓ Unlimited inbox items</li>
            <li>✓ Daily backups</li>
          </ul>
        </div>

        {isSubscribed || isPastDue ? (
          <button 
            onClick={handleManageBilling}
            disabled={loading}
            className="mt-4 w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Manage Subscription'}
          </button>
        ) : (
          <button 
            onClick={handleSubscribe}
            disabled={loading}
            className="mt-4 w-full px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Start Free Trial'}
          </button>
        )}
      </div>

      {(isSubscribed || isPastDue) && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Subscription Details</h2>
          <div className="text-sm text-slate-600 space-y-1">
            {profile?.subscription_ends_at && (
              <p>
                {isTrialing ? 'Trial ends: ' : 'Current period ends: '}
                {new Date(profile.subscription_ends_at).toLocaleDateString()}
              </p>
            )}
            <p className="text-slate-500">
              {isTrialing 
                ? 'Your card will be charged $99/month when your trial ends. Cancel anytime in the billing portal.'
                : 'Manage your payment method, view invoices, or cancel in the billing portal.'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
