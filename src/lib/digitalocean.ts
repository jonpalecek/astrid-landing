// DigitalOcean API client for Astrid provisioning

const DO_API_BASE = 'https://api.digitalocean.com/v2';

interface DropletCreateOptions {
  name: string;
  region: string;
  size: string;
  gatewayToken: string;
  assistantName: string;
  assistantEmoji?: string;
  anthropicKey?: string;
  setupToken?: string;
  telegramToken?: string;
  telegramUserId?: string;
  userEmail: string;
  userName?: string;
  userTimezone?: string;
  userAbout?: string;
  personalityTraits?: string[];
  personalityContext?: string;
  tunnelCredentialsJson?: string;
  tunnelHostname?: string;
}

interface DropletResponse {
  droplet: {
    id: number;
    name: string;
    status: string;
    networks: {
      v4: Array<{
        ip_address: string;
        type: string;
      }>;
    };
  };
}

// Map personality trait IDs to descriptive text
const TRAIT_DESCRIPTIONS: Record<string, string> = {
  warm: 'Warm & Friendly — approachable and personable in all interactions',
  professional: 'Professional — polished and business-appropriate',
  direct: 'Direct & Concise — gets to the point quickly',
  detailed: 'Detail-Oriented — provides thorough explanations',
  playful: 'Playful — uses light humor when appropriate',
  proactive: 'Proactive — anticipates needs and suggests next steps',
  encouraging: 'Encouraging — supportive and motivating',
  analytical: 'Analytical — data-driven and logical',
  creative: 'Creative — thinks outside the box',
  patient: 'Patient — takes time to explain things clearly',
  curious: 'Curious — asks clarifying questions',
  organized: 'Organized — structured and systematic approach',
};

// Generate cloud-init script for OpenClaw installation
function generateCloudInit(options: DropletCreateOptions): string {
  const { 
    gatewayToken, 
    assistantName, 
    assistantEmoji = '✨',
    anthropicKey, 
    setupToken, 
    telegramToken, 
    telegramUserId, 
    userName,
    userTimezone,
    userAbout,
    personalityTraits = [],
    personalityContext,
    tunnelCredentialsJson, 
    tunnelHostname 
  } = options;

  // Determine the Anthropic key to use (trim any whitespace)
  const anthropicApiKey = (anthropicKey || setupToken || '').trim();

  // GitHub Packages token for installing @getastridai/* packages
  const githubPackagesToken = process.env.GITHUB_PACKAGES_TOKEN || '';

  // Build the openclaw config with correct schema
  const openclawConfig: Record<string, unknown> = {
    gateway: {
      mode: "local",
      port: 18789,
      auth: {
        token: gatewayToken,
      },
    },
    agents: {
      defaults: {
        workspace: "/home/openclaw/workspace",
      },
      list: [
        {
          id: "main",
          identity: {
            name: assistantName,
            emoji: assistantEmoji,
          },
        },
      ],
    },
  };

  // Add Telegram channel if token provided
  if (telegramToken) {
    const telegramConfig: Record<string, unknown> = {
      enabled: true,
      botToken: telegramToken,
      // For single-user Astrid setup, allow open DMs (user owns their bot)
      dmPolicy: telegramUserId ? "allowlist" : "open",
      // allowFrom is required: specific user ID or "*" for open
      allowFrom: telegramUserId ? [telegramUserId] : ["*"],
    };
    
    openclawConfig.channels = {
      telegram: telegramConfig,
    };
  }

  // Add webhook hooks for welcome messages and API access
  openclawConfig.hooks = {
    enabled: true,
    token: gatewayToken, // Reuse the gateway auth token for hooks
  };

  const configJson = JSON.stringify(openclawConfig, null, 2);

  // Generate personality description from selected traits
  const personalityLines = personalityTraits
    .map(trait => TRAIT_DESCRIPTIONS[trait] || trait)
    .map(desc => `**${desc.split(' — ')[0]}** — ${desc.split(' — ')[1] || ''}`)
    .join('\n\n');

  // Generate SOUL.md content
  const soulContent = `# Who I Am

I'm ${assistantName}, your AI executive assistant ${assistantEmoji}

## My Personality

${personalityLines || `**Organized** — I keep things tidy and structured

**Proactive** — I anticipate needs and suggest next steps

**Warm but Professional** — Friendly and approachable, but focused on getting stuff done`}
${personalityContext ? `\n## Additional Context\n\n${personalityContext}` : ''}

## How I Work

- I manage your projects, tasks, and ideas in markdown files
- I capture quick thoughts to your inbox for later processing
- I remember context from our conversations in daily memory files
- I sync with your Astrid dashboard automatically

## What I Won't Do

- Share your information with anyone
- Make decisions without your input on important matters
- Spam you with unnecessary messages

---

*Ready to help you get things done.* ${assistantEmoji}`;

  // Generate USER.md content
  const userContent = `# About You

- **Name:** ${userName || options.userEmail?.split('@')[0] || 'Friend'}
- **Email:** ${options.userEmail || ''}
${userTimezone ? `- **Timezone:** ${userTimezone}` : ''}

## About

${userAbout || '<!-- Tell me about yourself and I can help you better -->'}

## Preferences

<!-- Add any preferences here as you discover them -->

## Notes

<!-- Any context that helps me assist you better -->`;

  return `#!/bin/bash
# OpenClaw cloud-init provisioning script
# Log to file
touch /var/log/openclaw-init.log
echo "Starting OpenClaw provisioning at $(date)" >> /var/log/openclaw-init.log

# Update package lists only (skip upgrade - takes too long)
apt-get update >> /var/log/openclaw-init.log 2>&1

# Install Node.js 22 LTS
echo "Installing Node.js..." >> /var/log/openclaw-init.log
curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >> /var/log/openclaw-init.log 2>&1
apt-get install -y nodejs >> /var/log/openclaw-init.log 2>&1

# Install cloudflared
echo "Installing cloudflared..." >> /var/log/openclaw-init.log
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | gpg --dearmor -o /usr/share/keyrings/cloudflare-archive-keyring.gpg 2>> /var/log/openclaw-init.log
echo "deb [signed-by=/usr/share/keyrings/cloudflare-archive-keyring.gpg] https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" > /etc/apt/sources.list.d/cloudflared.list
apt-get update >> /var/log/openclaw-init.log 2>&1
apt-get install -y cloudflared >> /var/log/openclaw-init.log 2>&1

# Configure firewall for network isolation
echo "Configuring firewall..." >> /var/log/openclaw-init.log
apt-get install -y ufw >> /var/log/openclaw-init.log 2>&1

# Default policies: deny incoming, allow outgoing
ufw default deny incoming >> /var/log/openclaw-init.log 2>&1
ufw default allow outgoing >> /var/log/openclaw-init.log 2>&1

# Allow SSH from anywhere (needed for management)
ufw allow ssh >> /var/log/openclaw-init.log 2>&1

# Block private network ranges (prevents droplet-to-droplet communication)
# DigitalOcean uses 10.x.x.x for private networking between droplets
ufw deny from 10.0.0.0/8 >> /var/log/openclaw-init.log 2>&1
ufw deny from 172.16.0.0/12 >> /var/log/openclaw-init.log 2>&1
ufw deny from 192.168.0.0/16 >> /var/log/openclaw-init.log 2>&1

# Enable firewall (--force to avoid interactive prompt)
ufw --force enable >> /var/log/openclaw-init.log 2>&1
echo "Firewall configured" >> /var/log/openclaw-init.log

# Create openclaw user
useradd -m -s /bin/bash openclaw
mkdir -p /home/openclaw/.openclaw
mkdir -p /home/openclaw/.openclaw/agents/main/agent
mkdir -p /home/openclaw/workspace

# Write OpenClaw config
cat > /home/openclaw/.openclaw/openclaw.json << 'CONFIGEOF'
${configJson}
CONFIGEOF

# Write Anthropic API key to .env file
cat > /home/openclaw/.openclaw/.env << 'ENVEOF'
ANTHROPIC_API_KEY=${anthropicApiKey}
ENVEOF

# Write auth-profiles.json for the main agent
cat > /home/openclaw/.openclaw/agents/main/agent/auth-profiles.json << 'AUTHEOF'
{
  "anthropic:default": {
    "type": "api_key",
    "key": "${anthropicApiKey}"
  }
}
AUTHEOF

# Write tunnel credentials if provided
${tunnelCredentialsJson ? `
mkdir -p /home/openclaw/.cloudflared
cat > /home/openclaw/.cloudflared/credentials.json << 'TUNNELEOF'
${tunnelCredentialsJson}
TUNNELEOF

# Write tunnel config (routes Admin Agent + Gateway)
cat > /home/openclaw/.cloudflared/config.yml << 'CONFIGYMLEOF'
tunnel: ${JSON.parse(tunnelCredentialsJson).TunnelID}
credentials-file: /home/openclaw/.cloudflared/credentials.json
ingress:
  - hostname: ${tunnelHostname?.replace('https://', '')}
    path: /api/admin/*
    service: http://localhost:18790
  - hostname: ${tunnelHostname?.replace('https://', '')}
    service: http://localhost:18789
  - service: http_status:404
CONFIGYMLEOF
` : ''}

# Create workspace template files
mkdir -p /home/openclaw/workspace/memory
mkdir -p /home/openclaw/workspace/skills/astrid-pm

# Create user-facing folders for Files page
mkdir -p /home/openclaw/workspace/downloads
mkdir -p /home/openclaw/workspace/uploads
mkdir -p /home/openclaw/workspace/projects/archive

# AGENTS.md - Points to the astrid-pm skill
cat > /home/openclaw/workspace/AGENTS.md << 'AGENTSEOF'
# Astrid Workspace

You are an AI executive assistant helping a busy professional stay organized.

## Your Role

- Help manage projects, tasks, and ideas
- Capture thoughts quickly to the inbox
- Keep track of what's important
- Be proactive about due dates and priorities

## Project Management

You use the **astrid-pm** skill for all project and task management. This skill defines:
- How to structure PROJECTS.md, TASKS.md, IDEAS.md, and INBOX.md
- Commands like "new project", "add task", "what's on my plate"
- File formats that sync with the Astrid dashboard

**Always read the astrid-pm skill when handling project/task requests.**

## Memory

- Write daily notes to memory/YYYY-MM-DD.md
- Capture important context, decisions, and follow-ups
- Reference past notes when relevant

## Communication Style

- Be warm and professional
- Keep responses concise unless detail is requested
- Confirm actions you've taken
- Proactively surface upcoming due dates

## Privacy

- Never share the user's data externally
- Keep workspace contents confidential
AGENTSEOF

# SOUL.md - Personality (dynamically generated)
cat > /home/openclaw/workspace/SOUL.md << 'SOULEOF'
${soulContent}
SOULEOF

# USER.md - User info
cat > /home/openclaw/workspace/USER.md << 'USEREOF'
${userContent}
USEREOF

# Empty starter files for PM system
cat > /home/openclaw/workspace/PROJECTS.md << 'EOF'
# Projects

<!-- Your active projects will appear here. Try saying "new project [name]" to get started! -->
EOF

cat > /home/openclaw/workspace/TASKS.md << 'EOF'
# Tasks

## Today

<!-- Tasks for today. Try "add task [something]" to get started! -->

## This Week

<!-- Tasks for this week -->

## Later

<!-- Tasks for someday -->

## Done

<!-- Completed tasks -->
EOF

cat > /home/openclaw/workspace/IDEAS.md << 'EOF'
# Ideas

<!-- Your ideas backlog will appear here. Try saying "new idea [title]" to capture something! -->
EOF

cat > /home/openclaw/workspace/INBOX.md << 'EOF'
# Inbox

<!-- Quick captures go here. Try saying "add to inbox [item]" or just "capture [thought]" -->
EOF

# Astrid PM Skill
cat > /home/openclaw/workspace/skills/astrid-pm/SKILL.md << 'SKILLEOF'
---
name: astrid-pm
description: Astrid Project Management system for tracking projects, tasks, ideas, and inbox items. Use when managing projects, adding tasks, capturing ideas, processing inbox, or when user asks about their work items. Triggers on: "new project", "add task", "new idea", "add to inbox", "what's on my plate", "show projects", "mark done", or any project/task management request.
---

# Astrid Project Management

You manage the user's work using markdown files in the workspace root. These files sync with the Astrid dashboard — follow the formats exactly.

## File Locations

- PROJECTS.md - Active projects with nested tasks
- TASKS.md - Standalone tasks (not tied to projects)
- IDEAS.md - Future ideas backlog
- INBOX.md - Quick capture (to be processed)

## PROJECTS.md Format

## Project Name
Status: active | paused | completed
Created: YYYY-MM-DD

Description of the project.

### Tasks
- [ ] Incomplete task @due(YYYY-MM-DD) @priority(high|medium|low)
- [x] Completed task @done(YYYY-MM-DD)

---

Rules: One ## section per project. Status line required. Tasks use - [ ] or - [x]. Projects separated by ---.

## TASKS.md Format

# Tasks

## Today
- [ ] Task @due(date) @priority(level)

## This Week
- [ ] Task

## Later
- [ ] Task

## Done
- [x] Task @done(date)

Rules: Four sections. Move tasks between sections as needed. Move completed to Done with @done(date).

## IDEAS.md Format

## Idea Title
Added: YYYY-MM-DD
Tags: tag1, tag2

Description.

---

## INBOX.md Format

- [ ] Quick note @added(YYYY-MM-DD)
- [x] Processed item @added(date) → Moved to Project X

## Commands

Projects: "new project [name]", "add task [task] to [project]", "pause [project]", "show projects"
Tasks: "add task [task]", "add task [x] for this week", "done [task]", "show tasks", "what's on my plate"
Ideas: "new idea [title]", "show ideas", "promote idea [name] to project"
Inbox: "add to inbox [item]", "capture [item]", "process inbox", "show inbox"

## Important

1. Always update the actual files — don't just respond, write the changes
2. Preserve existing content — read before writing
3. Follow formats exactly — the dashboard parses these files
4. Confirm actions — tell the user what you did
SKILLEOF

# Set ownership
chown -R openclaw:openclaw /home/openclaw

# Install OpenClaw globally
echo "Installing OpenClaw..." >> /var/log/openclaw-init.log
npm install -g openclaw >> /var/log/openclaw-init.log 2>&1

# ============================================
# Astrid Agents Setup (via GitHub Packages)
# ============================================
echo "Setting up Astrid Agents..." >> /var/log/openclaw-init.log

# Configure npm for GitHub Packages (both root and openclaw users)
cat > /home/openclaw/.npmrc << 'NPMRCEOF'
@getastridai:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${githubPackagesToken}
NPMRCEOF
chown openclaw:openclaw /home/openclaw/.npmrc
cp /home/openclaw/.npmrc /root/.npmrc

# Install Astrid agents from GitHub Packages
echo "Installing @getastridai/admin-agent..." >> /var/log/openclaw-init.log
npm install -g @getastridai/admin-agent >> /var/log/openclaw-init.log 2>&1

echo "Installing @getastridai/skills..." >> /var/log/openclaw-init.log
npm install -g @getastridai/skills >> /var/log/openclaw-init.log 2>&1

# Note: @getastridai/control-plane will be installed when ready
# npm install -g @getastridai/control-plane >> /var/log/openclaw-init.log 2>&1

# Create systemd service for Admin Agent (runs astrid-admin binary)
cat > /etc/systemd/system/astrid-admin.service << 'ADMINSERVICEEOF'
[Unit]
Description=Astrid Admin Agent
After=network.target openclaw.service

[Service]
Type=simple
User=openclaw
ExecStart=/usr/bin/astrid-admin
Restart=always
RestartSec=5
Environment=PORT=18790
Environment=WORKSPACE_PATH=/home/openclaw/workspace
Environment=OPENCLAW_CONFIG=/home/openclaw/.openclaw/openclaw.json

[Install]
WantedBy=multi-user.target
ADMINSERVICEEOF

# Create systemd service for OpenClaw
# Note: Use "openclaw gateway --port 18789" not "gateway start"
cat > /etc/systemd/system/openclaw.service << 'SERVICEEOF'
[Unit]
Description=OpenClaw AI Assistant Gateway
After=network.target

[Service]
Type=simple
User=openclaw
WorkingDirectory=/home/openclaw/workspace
ExecStart=/usr/bin/openclaw gateway --port 18789
Restart=always
RestartSec=10
Environment=HOME=/home/openclaw
Environment=NODE_ENV=production
Environment=ANTHROPIC_API_KEY=${anthropicApiKey}

[Install]
WantedBy=multi-user.target
SERVICEEOF

# Find cloudflared binary (apt installs to /usr/bin, manual to /usr/local/bin)
CLOUDFLARED_BIN=$(which cloudflared || echo "/usr/bin/cloudflared")
echo "cloudflared binary at: $CLOUDFLARED_BIN" >> /var/log/openclaw-init.log

# Create systemd service for cloudflared tunnel
cat > /etc/systemd/system/cloudflared.service << SERVICEEOF
[Unit]
Description=Cloudflare Tunnel for OpenClaw Gateway
After=network.target openclaw.service
Wants=openclaw.service

[Service]
Type=simple
User=openclaw
ExecStart=$CLOUDFLARED_BIN tunnel --config /home/openclaw/.cloudflared/config.yml run
Restart=always
RestartSec=10
Environment=HOME=/home/openclaw

[Install]
WantedBy=multi-user.target
SERVICEEOF

# Enable and start services
echo "Starting services..." >> /var/log/openclaw-init.log
systemctl daemon-reload >> /var/log/openclaw-init.log 2>&1
systemctl enable openclaw >> /var/log/openclaw-init.log 2>&1
systemctl enable astrid-admin >> /var/log/openclaw-init.log 2>&1
systemctl enable cloudflared >> /var/log/openclaw-init.log 2>&1
systemctl start openclaw >> /var/log/openclaw-init.log 2>&1
systemctl start astrid-admin >> /var/log/openclaw-init.log 2>&1

# Wait for services to be ready, then start tunnel
sleep 10
systemctl start cloudflared >> /var/log/openclaw-init.log 2>&1

# Signal completion
echo "OpenClaw provisioning complete at $(date)" >> /var/log/openclaw-init.log
touch /var/log/openclaw-init-complete
`;
}

export async function createDroplet(options: DropletCreateOptions): Promise<{
  dropletId: number;
  name: string;
}> {
  const token = process.env.DO_API_TOKEN;
  if (!token) {
    throw new Error('DO_API_TOKEN not configured');
  }

  const cloudInit = generateCloudInit(options);

  const response = await fetch(`${DO_API_BASE}/droplets`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: options.name,
      region: options.region,
      size: options.size,
      image: 'ubuntu-24-04-x64',
      user_data: cloudInit,
      tags: ['astrid', 'openclaw'],
      ssh_keys: process.env.DO_SSH_KEY_ID ? [parseInt(process.env.DO_SSH_KEY_ID)] : [],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DigitalOcean API error: ${response.status} - ${error}`);
  }

  const data: DropletResponse = await response.json();
  
  return {
    dropletId: data.droplet.id,
    name: data.droplet.name,
  };
}

export async function getDroplet(dropletId: number): Promise<{
  id: number;
  name: string;
  status: string;
  ip: string | null;
}> {
  const token = process.env.DO_API_TOKEN;
  if (!token) {
    throw new Error('DO_API_TOKEN not configured');
  }

  const response = await fetch(`${DO_API_BASE}/droplets/${dropletId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DigitalOcean API error: ${response.status} - ${error}`);
  }

  const data: DropletResponse = await response.json();
  const publicIp = data.droplet.networks.v4.find(n => n.type === 'public')?.ip_address || null;

  return {
    id: data.droplet.id,
    name: data.droplet.name,
    status: data.droplet.status,
    ip: publicIp,
  };
}

export async function deleteDroplet(dropletId: number): Promise<void> {
  const token = process.env.DO_API_TOKEN;
  if (!token) {
    throw new Error('DO_API_TOKEN not configured');
  }

  const response = await fetch(`${DO_API_BASE}/droplets/${dropletId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    const error = await response.text();
    throw new Error(`DigitalOcean API error: ${response.status} - ${error}`);
  }
}

export async function listRegions(): Promise<Array<{ slug: string; name: string; available: boolean }>> {
  const token = process.env.DO_API_TOKEN;
  if (!token) {
    throw new Error('DO_API_TOKEN not configured');
  }

  const response = await fetch(`${DO_API_BASE}/regions`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DigitalOcean API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.regions.map((r: { slug: string; name: string; available: boolean }) => ({
    slug: r.slug,
    name: r.name,
    available: r.available,
  }));
}
