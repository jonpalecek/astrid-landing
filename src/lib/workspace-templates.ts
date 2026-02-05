/**
 * Workspace Template Management
 * 
 * Fetches templates from Supabase Storage and fills in variables
 * for the BOOTSTRAP.md file based on onboarding data.
 */

import { createServiceClient } from './supabase-server';

const TEMPLATE_BUCKET = 'workspace-templates';

// Template files to fetch (static files that are copied as-is)
const STATIC_TEMPLATES = [
  'AGENTS.md',
  'HEARTBEAT.md',
  'IDEAS.md',
  'INBOX.md',
  'MEMORY.md',
  'PROJECTS.md',
  'TASKS.md',
  'TOOLS.md',
];

// BOOTSTRAP.md has variables that need to be filled
const BOOTSTRAP_TEMPLATE = 'BOOTSTRAP.md';

export interface OnboardingData {
  assistantName: string;
  assistantEmoji: string;
  personalityTraits: string[];
  personalityContext?: string;
  userName: string;
  userTimezone: string;
  userWorkInfo: string;
  userEmail?: string;
}

// Map personality trait IDs to descriptive text
const TRAIT_DESCRIPTIONS: Record<string, string> = {
  warm: 'Warm & Friendly',
  professional: 'Professional',
  direct: 'Direct & Concise',
  detailed: 'Detail-Oriented',
  playful: 'Playful',
  proactive: 'Proactive',
  encouraging: 'Encouraging',
  analytical: 'Analytical',
  creative: 'Creative',
  patient: 'Patient',
  curious: 'Curious',
  organized: 'Organized',
};

/**
 * Fetch a single template from Supabase Storage
 */
async function fetchTemplate(filename: string): Promise<string> {
  const supabase = createServiceClient();
  
  const { data, error } = await supabase
    .storage
    .from(TEMPLATE_BUCKET)
    .download(filename);
  
  if (error) {
    throw new Error(`Failed to fetch template ${filename}: ${error.message}`);
  }
  
  return await data.text();
}

/**
 * Fill in template variables in BOOTSTRAP.md
 */
function fillBootstrapVariables(template: string, data: OnboardingData): string {
  // Build personality traits string
  const personalityTraits = data.personalityTraits
    .map(trait => TRAIT_DESCRIPTIONS[trait] || trait)
    .join(', ');
  
  let result = template;
  result = result.replace(/\{\{ASSISTANT_NAME\}\}/g, data.assistantName);
  result = result.replace(/\{\{ASSISTANT_EMOJI\}\}/g, data.assistantEmoji);
  result = result.replace(/\{\{PERSONALITY_TRAITS\}\}/g, personalityTraits || 'Warm, organized, proactive');
  result = result.replace(/\{\{USER_NAME\}\}/g, data.userName || data.userEmail?.split('@')[0] || 'Friend');
  result = result.replace(/\{\{USER_TIMEZONE\}\}/g, data.userTimezone || 'America/Los_Angeles');
  result = result.replace(/\{\{USER_WORK_INFO\}\}/g, data.userWorkInfo || '');
  
  return result;
}

/**
 * Fetch all workspace templates and prepare them for writing
 * Returns a map of filename -> content
 */
export async function getWorkspaceTemplates(onboardingData: OnboardingData): Promise<Map<string, string>> {
  const templates = new Map<string, string>();
  
  // Fetch static templates
  for (const filename of STATIC_TEMPLATES) {
    try {
      const content = await fetchTemplate(filename);
      templates.set(filename, content);
    } catch (e) {
      console.error(`Failed to fetch template ${filename}:`, e);
      // Continue with other templates
    }
  }
  
  // Fetch and fill BOOTSTRAP.md
  try {
    const bootstrapTemplate = await fetchTemplate(BOOTSTRAP_TEMPLATE);
    const filledBootstrap = fillBootstrapVariables(bootstrapTemplate, onboardingData);
    templates.set(BOOTSTRAP_TEMPLATE, filledBootstrap);
  } catch (e) {
    console.error('Failed to fetch BOOTSTRAP.md template:', e);
  }
  
  return templates;
}

/**
 * Write workspace files via Admin Agent API
 */
export async function writeWorkspaceFiles(
  adminUrl: string,
  gatewayToken: string,
  templates: Map<string, string>
): Promise<{ success: string[]; failed: string[] }> {
  const success: string[] = [];
  const failed: string[] = [];
  
  for (const [filename, content] of templates) {
    try {
      const response = await fetch(`${adminUrl}/api/admin/files/content`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${gatewayToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: `~/${filename}`,
          content,
        }),
      });
      
      if (response.ok) {
        success.push(filename);
      } else {
        const text = await response.text();
        console.error(`Failed to write ${filename}: ${response.status} - ${text}`);
        failed.push(filename);
      }
    } catch (e) {
      console.error(`Failed to write ${filename}:`, e);
      failed.push(filename);
    }
  }
  
  return { success, failed };
}

/**
 * Wait for Admin Agent to be ready
 */
export async function waitForAdminAgent(
  adminUrl: string,
  gatewayToken: string,
  maxAttempts = 60,
  delayMs = 5000
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${adminUrl}/api/admin/health`, {
        headers: { 'Authorization': `Bearer ${gatewayToken}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'ok') {
          return true;
        }
      }
    } catch {
      // Connection refused is expected while services start
    }
    
    await new Promise(r => setTimeout(r, delayMs));
  }
  
  return false;
}
