'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  Bot,
  Key,
  MessageSquare,
  User,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  Smile
} from 'lucide-react';

type Step = 'welcome' | 'ai-setup' | 'name-assistant' | 'about-you' | 'personality' | 'telegram' | 'launching';

const PERSONALITY_TRAITS = [
  { id: 'warm', label: 'Warm & Friendly', description: 'Approachable and personable' },
  { id: 'professional', label: 'Professional', description: 'Polished and business-like' },
  { id: 'direct', label: 'Direct & Concise', description: 'Gets to the point quickly' },
  { id: 'detailed', label: 'Detail-Oriented', description: 'Thorough explanations' },
  { id: 'playful', label: 'Playful / Witty', description: 'Light humor when appropriate' },
  { id: 'proactive', label: 'Proactive', description: 'Anticipates your needs' },
  { id: 'encouraging', label: 'Encouraging', description: 'Supportive and motivating' },
  { id: 'analytical', label: 'Analytical', description: 'Data-driven and logical' },
  { id: 'creative', label: 'Creative', description: 'Thinks outside the box' },
  { id: 'patient', label: 'Patient', description: 'Takes time to explain' },
  { id: 'curious', label: 'Curious', description: 'Asks clarifying questions' },
  { id: 'organized', label: 'Organized', description: 'Structured approach' },
];

const ASSISTANT_EMOJIS = ['✨', '🌟', '💫', '🧠', '💡', '🚀', '🎯', '⭐', '🌸', '🌼', '🔮', '💎'];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  
  // AI Setup
  const [aiMethod, setAiMethod] = useState<'claude-token' | 'api-key' | null>(null);
  const [claudeToken, setClaudeToken] = useState('');
  const [apiKey, setApiKey] = useState('');
  
  // Name Assistant
  const [assistantName, setAssistantName] = useState('Astrid');
  const [assistantEmoji, setAssistantEmoji] = useState('✨');
  
  // About You
  const [userName, setUserName] = useState('');
  const [timezone, setTimezone] = useState('America/Los_Angeles');
  const [aboutYou, setAboutYou] = useState('');
  
  // Personality
  const [selectedTraits, setSelectedTraits] = useState<string[]>(['warm', 'professional', 'proactive']);
  const [customContext, setCustomContext] = useState('');
  
  // Telegram
  const [telegramToken, setTelegramToken] = useState('');
  
  const router = useRouter();

  const steps: Step[] = ['welcome', 'ai-setup', 'name-assistant', 'about-you', 'personality', 'telegram', 'launching'];
  const currentIndex = steps.indexOf(currentStep);
  const totalSteps = steps.length - 2; // Exclude welcome and launching from progress
  const progressSteps = currentIndex - 1; // Offset for welcome
  const progress = Math.max(0, (progressSteps / (totalSteps - 1)) * 100);

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'welcome': return true;
      case 'ai-setup': return (aiMethod === 'claude-token' && !!claudeToken) || (aiMethod === 'api-key' && !!apiKey);
      case 'name-assistant': return assistantName.length > 0;
      case 'about-you': return userName.length > 0;
      case 'personality': return selectedTraits.length > 0;
      case 'telegram': return telegramToken.length > 0;
      default: return true;
    }
  };

  const nextStep = () => {
    const idx = steps.indexOf(currentStep);
    if (idx < steps.length - 1) {
      setCurrentStep(steps[idx + 1]);
    }
  };

  const prevStep = () => {
    const idx = steps.indexOf(currentStep);
    if (idx > 0) {
      setCurrentStep(steps[idx - 1]);
    }
  };

  const stepLabels = ['AI Setup', 'Name', 'About You', 'Personality', 'Telegram'];

  return (
    <div className="min-h-[80vh] flex flex-col">
      {/* Progress Bar */}
      {currentStep !== 'welcome' && currentStep !== 'launching' && (
        <div className="mb-8">
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-400">
            {stepLabels.map((label, i) => (
              <span 
                key={label}
                className={progressSteps >= i ? 'text-amber-600 font-medium' : ''}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="flex-1 flex items-center justify-center">
        {currentStep === 'welcome' && (
          <WelcomeStep onNext={nextStep} />
        )}

        {currentStep === 'ai-setup' && (
          <AISetupStep
            method={aiMethod}
            setMethod={setAiMethod}
            claudeToken={claudeToken}
            setClaudeToken={setClaudeToken}
            apiKey={apiKey}
            setApiKey={setApiKey}
            onNext={nextStep}
            onBack={prevStep}
            canProceed={canProceed()}
          />
        )}

        {currentStep === 'name-assistant' && (
          <NameAssistantStep
            name={assistantName}
            setName={setAssistantName}
            emoji={assistantEmoji}
            setEmoji={setAssistantEmoji}
            onNext={nextStep}
            onBack={prevStep}
            canProceed={canProceed()}
          />
        )}

        {currentStep === 'about-you' && (
          <AboutYouStep
            userName={userName}
            setUserName={setUserName}
            timezone={timezone}
            setTimezone={setTimezone}
            aboutYou={aboutYou}
            setAboutYou={setAboutYou}
            assistantName={assistantName}
            onNext={nextStep}
            onBack={prevStep}
            canProceed={canProceed()}
          />
        )}

        {currentStep === 'personality' && (
          <PersonalityStep
            selectedTraits={selectedTraits}
            setSelectedTraits={setSelectedTraits}
            customContext={customContext}
            setCustomContext={setCustomContext}
            assistantName={assistantName}
            onNext={nextStep}
            onBack={prevStep}
            canProceed={canProceed()}
          />
        )}

        {currentStep === 'telegram' && (
          <TelegramStep
            token={telegramToken}
            setToken={setTelegramToken}
            onNext={nextStep}
            onBack={prevStep}
            canProceed={canProceed()}
          />
        )}

        {currentStep === 'launching' && (
          <LaunchingStep 
            config={{
              aiMethod,
              claudeToken,
              apiKey,
              telegramToken,
              assistantName,
              assistantEmoji,
              userName,
              timezone,
              aboutYou,
              selectedTraits,
              customContext,
            }}
          />
        )}
      </div>
    </div>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center max-w-lg">
      <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Sparkles className="w-10 h-10 text-amber-500" />
      </div>
      
      <h1 className="text-3xl font-bold text-slate-900 mb-4">
        Welcome to Astrid
      </h1>
      
      <p className="text-lg text-slate-600 mb-8">
        Let's set up your AI executive assistant. This takes about 5 minutes.
      </p>

      <div className="text-left bg-slate-50 rounded-xl p-6 mb-8">
        <h3 className="font-semibold text-slate-900 mb-3">What we'll do:</h3>
        <ul className="space-y-2">
          <li className="flex items-center gap-2 text-slate-600">
            <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 text-sm">1</div>
            Connect your AI (Claude)
          </li>
          <li className="flex items-center gap-2 text-slate-600">
            <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 text-sm">2</div>
            Name & personalize your assistant
          </li>
          <li className="flex items-center gap-2 text-slate-600">
            <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 text-sm">3</div>
            Set up Telegram messaging
          </li>
          <li className="flex items-center gap-2 text-slate-600">
            <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 text-sm">4</div>
            Launch your private instance
          </li>
        </ul>
      </div>

      <button
        onClick={onNext}
        className="inline-flex items-center gap-2 px-8 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors text-lg font-medium"
      >
        Let's Go <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}

function AISetupStep({
  method,
  setMethod,
  claudeToken,
  setClaudeToken,
  apiKey,
  setApiKey,
  onNext,
  onBack,
  canProceed,
}: {
  method: 'claude-token' | 'api-key' | null;
  setMethod: (m: 'claude-token' | 'api-key') => void;
  claudeToken: string;
  setClaudeToken: (t: string) => void;
  apiKey: string;
  setApiKey: (k: string) => void;
  onNext: () => void;
  onBack: () => void;
  canProceed: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copyCommand = () => {
    navigator.clipboard.writeText('claude setup-token');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-xl w-full">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bot className="w-8 h-8 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Connect Your AI</h2>
        <p className="text-slate-600">Astrid uses Claude by Anthropic for intelligence.</p>
      </div>

      <div className="space-y-4">
        {/* Claude Subscription Option */}
        <div
          onClick={() => setMethod('claude-token')}
          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
            method === 'claude-token' 
              ? 'border-amber-500 bg-amber-50' 
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              method === 'claude-token' ? 'border-amber-500 bg-amber-500' : 'border-slate-300'
            }`}>
              {method === 'claude-token' && <Check className="w-3 h-3 text-white" />}
            </div>
            <div>
              <p className="font-medium text-slate-900">Claude Pro/Max Subscription</p>
              <p className="text-sm text-slate-500">Recommended if you already have Claude</p>
            </div>
            <span className="ml-auto px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Recommended</span>
          </div>
        </div>

        {/* API Key Option */}
        <div
          onClick={() => setMethod('api-key')}
          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
            method === 'api-key' 
              ? 'border-amber-500 bg-amber-50' 
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              method === 'api-key' ? 'border-amber-500 bg-amber-500' : 'border-slate-300'
            }`}>
              {method === 'api-key' && <Check className="w-3 h-3 text-white" />}
            </div>
            <div>
              <p className="font-medium text-slate-900">Anthropic API Key</p>
              <p className="text-sm text-slate-500">Pay-as-you-go usage billing</p>
            </div>
          </div>
        </div>
      </div>

      {/* Claude Token Input */}
      {method === 'claude-token' && (
        <div className="mt-6 p-4 bg-slate-50 rounded-xl">
          <h4 className="font-medium text-slate-900 mb-3">Get your setup token:</h4>
          <ol className="space-y-2 text-sm text-slate-600 mb-4">
            <li>1. Open Terminal on your computer</li>
            <li className="flex items-center gap-2">
              2. Run: 
              <code className="bg-slate-200 px-2 py-1 rounded font-mono text-xs">claude setup-token</code>
              <button onClick={copyCommand} className="p-1 hover:bg-slate-200 rounded">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
              </button>
            </li>
            <li>3. Copy the token it displays</li>
          </ol>
          <input
            type="password"
            value={claudeToken}
            onChange={(e) => setClaudeToken(e.target.value)}
            placeholder="Paste your setup token here"
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
          />
        </div>
      )}

      {/* API Key Input */}
      {method === 'api-key' && (
        <div className="mt-6 p-4 bg-slate-50 rounded-xl">
          <h4 className="font-medium text-slate-900 mb-3">Enter your API key:</h4>
          <p className="text-sm text-slate-600 mb-4">
            Get your API key from{' '}
            <a href="https://console.anthropic.com/settings/keys" target="_blank" className="text-amber-600 hover:text-amber-700 inline-flex items-center gap-1">
              console.anthropic.com <ExternalLink className="w-3 h-3" />
            </a>
          </p>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 font-mono"
          />
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="inline-flex items-center gap-2 px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function NameAssistantStep({
  name,
  setName,
  emoji,
  setEmoji,
  onNext,
  onBack,
  canProceed,
}: {
  name: string;
  setName: (n: string) => void;
  emoji: string;
  setEmoji: (e: string) => void;
  onNext: () => void;
  onBack: () => void;
  canProceed: boolean;
}) {
  const suggestedNames = ['Astrid', 'Alex', 'Sam', 'Aria', 'Max', 'Luna', 'Jasper', 'Nova'];

  return (
    <div className="max-w-xl w-full">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Smile className="w-8 h-8 text-pink-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Name Your Assistant</h2>
        <p className="text-slate-600">Give your assistant a name and personality.</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Assistant Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter a name"
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 text-lg"
          />
          <div className="flex flex-wrap gap-2 mt-3">
            {suggestedNames.map((n) => (
              <button
                key={n}
                onClick={() => setName(n)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  name === n 
                    ? 'bg-amber-500 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Pick an Emoji</label>
          <div className="flex flex-wrap gap-2">
            {ASSISTANT_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`w-12 h-12 text-2xl rounded-xl transition-all ${
                  emoji === e 
                    ? 'bg-amber-100 ring-2 ring-amber-500 scale-110' 
                    : 'bg-slate-50 hover:bg-slate-100'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl">
          <p className="text-sm text-slate-600">Your assistant will be:</p>
          <p className="text-2xl mt-2">
            <span className="mr-2">{emoji}</span>
            <span className="font-semibold">{name || 'Your Assistant'}</span>
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="inline-flex items-center gap-2 px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function AboutYouStep({
  userName,
  setUserName,
  timezone,
  setTimezone,
  aboutYou,
  setAboutYou,
  assistantName,
  onNext,
  onBack,
  canProceed,
}: {
  userName: string;
  setUserName: (n: string) => void;
  timezone: string;
  setTimezone: (tz: string) => void;
  aboutYou: string;
  setAboutYou: (s: string) => void;
  assistantName: string;
  onNext: () => void;
  onBack: () => void;
  canProceed: boolean;
}) {
  return (
    <div className="max-w-xl w-full">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Tell {assistantName} About You</h2>
        <p className="text-slate-600">This helps your assistant understand your context.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Your Name</label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="What should your assistant call you?"
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Timezone</label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
          >
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
            <option value="America/Denver">Mountain Time (MT)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="Europe/London">London (GMT)</option>
            <option value="Europe/Paris">Paris (CET)</option>
            <option value="Asia/Tokyo">Tokyo (JST)</option>
            <option value="Asia/Singapore">Singapore (SGT)</option>
            <option value="Australia/Sydney">Sydney (AEDT)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            What do you do? <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={aboutYou}
            onChange={(e) => setAboutYou(e.target.value)}
            placeholder="Tell your assistant about your work, role, or what you're focused on. This helps them give more relevant help.

Example: I run a small marketing agency with 5 employees. I'm focused on growing our client base and improving our processes."
            rows={4}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 resize-none"
          />
          <p className="text-xs text-slate-400 mt-1">{aboutYou.length}/500 characters</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="inline-flex items-center gap-2 px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function PersonalityStep({
  selectedTraits,
  setSelectedTraits,
  customContext,
  setCustomContext,
  assistantName,
  onNext,
  onBack,
  canProceed,
}: {
  selectedTraits: string[];
  setSelectedTraits: (traits: string[]) => void;
  customContext: string;
  setCustomContext: (s: string) => void;
  assistantName: string;
  onNext: () => void;
  onBack: () => void;
  canProceed: boolean;
}) {
  const toggleTrait = (traitId: string) => {
    setSelectedTraits(
      selectedTraits.includes(traitId) 
        ? selectedTraits.filter(t => t !== traitId)
        : [...selectedTraits, traitId]
    );
  };

  return (
    <div className="max-w-2xl w-full">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">How Should {assistantName} Behave?</h2>
        <p className="text-slate-600">Select the traits that describe your ideal assistant.</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Personality Traits <span className="text-slate-400 font-normal">(pick as many as you like)</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PERSONALITY_TRAITS.map((trait) => (
              <button
                key={trait.id}
                onClick={() => toggleTrait(trait.id)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedTraits.includes(trait.id)
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    selectedTraits.includes(trait.id)
                      ? 'border-amber-500 bg-amber-500'
                      : 'border-slate-300'
                  }`}>
                    {selectedTraits.includes(trait.id) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className={`text-sm font-medium ${
                    selectedTraits.includes(trait.id) ? 'text-amber-900' : 'text-slate-900'
                  }`}>
                    {trait.label}
                  </span>
                </div>
                <p className={`text-xs mt-1 ml-6 ${
                  selectedTraits.includes(trait.id) ? 'text-amber-700' : 'text-slate-500'
                }`}>
                  {trait.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Anything else? <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={customContext}
            onChange={(e) => setCustomContext(e.target.value)}
            placeholder="Any other preferences for how your assistant should behave?

Example: Help me stay focused on strategic work. Push back gently if I'm getting distracted by low-value tasks."
            rows={3}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 resize-none"
          />
        </div>

        {selectedTraits.length === 0 && (
          <p className="text-sm text-amber-600">Select at least one trait to continue.</p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="inline-flex items-center gap-2 px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function TelegramStep({
  token,
  setToken,
  onNext,
  onBack,
  canProceed,
}: {
  token: string;
  setToken: (t: string) => void;
  onNext: () => void;
  onBack: () => void;
  canProceed: boolean;
}) {
  return (
    <div className="max-w-xl w-full">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Connect Telegram</h2>
        <p className="text-slate-600">Chat with your assistant via Telegram.</p>
      </div>

      <div className="p-4 bg-slate-50 rounded-xl mb-6">
        <h4 className="font-medium text-slate-900 mb-3">Create your Telegram bot:</h4>
        <ol className="space-y-3 text-sm text-slate-600">
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs">1</span>
            <span>Open Telegram and search for <strong>@BotFather</strong></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs">2</span>
            <span>Send <code className="bg-slate-200 px-1 rounded">/newbot</code> and follow the prompts</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs">3</span>
            <span>Name your bot (e.g., "My Astrid")</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs">4</span>
            <span>Copy the <strong>bot token</strong> BotFather gives you</span>
          </li>
        </ol>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Bot Token</label>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ"
          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 font-mono text-sm"
        />
        <p className="text-xs text-slate-400 mt-2">
          Your token is stored securely and only used on your personal instance.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="inline-flex items-center gap-2 px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Launch My Assistant <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function LaunchingStep({ config }: { config: any }) {
  const [status, setStatus] = useState<'creating' | 'provisioning' | 'configuring' | 'ready' | 'error'>('creating');
  const [statusMessage, setStatusMessage] = useState('Starting up...');
  const [errorMessage, setErrorMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const router = useRouter();
  const hasStarted = useRef(false);
  const cancelledRef = useRef(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const configuringIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Configuring phase messages to rotate through
  const configuringMessages = [
    'Configuring your assistant...',
    'Setting up secure connections...',
    'Applying final configurations...',
    'Almost ready...',
  ];

  // Gradual progress during configuring phase
  useEffect(() => {
    if (status !== 'configuring') {
      if (configuringIntervalRef.current) {
        clearInterval(configuringIntervalRef.current);
        configuringIntervalRef.current = null;
      }
      return;
    }

    let currentProgress = 70;
    let messageIndex = 0;

    configuringIntervalRef.current = setInterval(() => {
      // Increment progress slowly from 70 to 95 (use functional update to get current value)
      setProgress(prev => {
        if (prev < 95) {
          currentProgress = Math.max(prev + 5, currentProgress);
          return currentProgress;
        }
        return prev;
      });
      
      // Rotate through messages
      messageIndex = (messageIndex + 1) % configuringMessages.length;
      setStatusMessage(configuringMessages[messageIndex]);
    }, 8000); // Every 8 seconds

    return () => {
      if (configuringIntervalRef.current) {
        clearInterval(configuringIntervalRef.current);
        configuringIntervalRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    // Reset cancelled on every effect run (handles React Strict Mode remount)
    cancelledRef.current = false;
    
    // Prevent duplicate API calls from React strict mode or re-renders
    if (hasStarted.current) {
      return;
    }
    hasStarted.current = true;

    const startProvisioning = async () => {
      try {
        setStatus('creating');
        setStatusMessage('Creating your private server...');
        setProgress(10);

        // Call the provisioning API
        const response = await fetch('/api/instances', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            region: 'sfo3', // San Francisco for now
            assistantName: config.assistantName,
            assistantEmoji: config.assistantEmoji,
            anthropicKey: config.aiMethod === 'api-key' ? config.apiKey : undefined,
            setupToken: config.aiMethod === 'claude-token' ? config.claudeToken : undefined,
            telegramToken: config.telegramToken,
            // User info for workspace customization
            userName: config.userName,
            userTimezone: config.timezone,
            userAbout: config.aboutYou,
            // Personality for SOUL.md customization
            personalityTraits: config.selectedTraits,
            personalityContext: config.customContext,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create instance');
        }

        if (cancelledRef.current) return;
        
        setStatus('provisioning');
        setStatusMessage('Server created! Installing OpenClaw...');
        setProgress(30);

        // Poll for status updates
        const pollStatus = async () => {
          if (cancelledRef.current) return;

          try {
            const statusResponse = await fetch('/api/instances', {
              credentials: 'include', // Ensure cookies are sent
            });
            
            if (!statusResponse.ok) {
              console.error('Poll failed with status:', statusResponse.status);
              return;
            }
            
            const statusData = await statusResponse.json();

            if (!statusData.instance) {
              return;
            }

            const instance = statusData.instance;
            
            switch (instance.status) {
              case 'pending':
                setProgress(prev => Math.max(prev, 20));
                setStatusMessage('Creating your private server...');
                break;
              case 'provisioning':
                setProgress(prev => Math.max(prev, 40));
                setStatusMessage('Server is booting up...');
                break;
              case 'configuring':
                setStatus('configuring');
                setProgress(prev => Math.max(prev, 70));
                // Don't override statusMessage - let the configuringInterval handle rotation
                break;
              case 'active':
                setStatus('ready');
                setProgress(100);
                setStatusMessage('Your assistant is ready!');
                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                break;
              case 'error':
                setStatus('error');
                setErrorMessage(instance.status_message || 'Something went wrong');
                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                break;
            }
          } catch (e) {
            console.error('Failed to poll status:', e);
          }
        };

        // Poll immediately, then every 5 seconds
        pollStatus();
        pollIntervalRef.current = setInterval(pollStatus, 5000);

      } catch (error) {
        if (cancelledRef.current) return;
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Failed to create instance');
      }
    };

    startProvisioning();

    return () => {
      // Only cancel if we haven't completed successfully
      // This prevents React Strict Mode cleanup from killing active polling
      cancelledRef.current = true;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (configuringIntervalRef.current) {
        clearInterval(configuringIntervalRef.current);
        configuringIntervalRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount - config is captured in closure

  const getProgressMessage = () => {
    if (status === 'error') return errorMessage;
    return statusMessage;
  };

  return (
    <div className="text-center max-w-lg">
      {status === 'ready' ? (
        <>
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            You're All Set! 🎉
          </h2>
          
          <p className="text-lg text-slate-600 mb-2">
            Say hello to <span className="font-semibold">{config.assistantEmoji} {config.assistantName}</span>
          </p>
          
          <p className="text-slate-500 mb-8">
            Open Telegram and start chatting!
          </p>

          <div className="bg-slate-50 rounded-xl p-4 mb-8 text-left">
            <p className="text-sm font-medium text-slate-700 mb-2">Try saying:</p>
            <ul className="space-y-1 text-sm text-slate-600">
              <li>"Hey {config.assistantName}, what can you help me with?"</li>
              <li>"I have a new project idea..."</li>
              <li>"What's on my plate this week?"</li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full px-6 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors font-medium"
            >
              Go to Dashboard
            </button>
            <a
              href="https://t.me"
              target="_blank"
              className="block w-full px-6 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
            >
              Open Telegram
            </a>
          </div>
        </>
      ) : status === 'error' ? (
        <>
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">😞</span>
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Something Went Wrong
          </h2>
          
          <p className="text-slate-600 mb-4">
            {errorMessage}
          </p>

          <p className="text-sm text-slate-500 mb-8">
            Don't worry, you can try again or contact support.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors font-medium"
            >
              Try Again
            </button>
            <a
              href="mailto:support@getastrid.ai"
              className="block w-full px-6 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
            >
              Contact Support
            </a>
          </div>
        </>
      ) : (
        <>
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Launching {config.assistantEmoji} {config.assistantName}
          </h2>
          
          <p className="text-slate-600 mb-6">
            {getProgressMessage()}
          </p>

          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-amber-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-slate-400">{progress}%</p>

          <p className="text-xs text-slate-400 mt-8 text-center max-w-sm">
            We're spinning up your private server, applying security patches, and configuring your assistant. This can take up to 5 minutes.
          </p>
        </>
      )}
    </div>
  );
}
