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
      dmPolicy: telegramUserId ? "allowlist" : "open",
      allowFrom: telegramUserId ? [telegramUserId] : ["*"],
    };
    
    openclawConfig.channels = {
      telegram: telegramConfig,
    };
  }

  const configJson = JSON.stringify(openclawConfig, null, 2);

  // Generate personality traits string for BOOTSTRAP.md
  const personalityTraitsStr = personalityTraits
    .map(trait => TRAIT_DESCRIPTIONS[trait] || trait)
    .join(', ') || 'Warm, organized, proactive';

  // User info for BOOTSTRAP.md
  const userNameStr = userName || options.userEmail?.split('@')[0] || 'Friend';
  const userTimezoneStr = userTimezone || 'America/Los_Angeles';
  const userWorkStr = userAbout || '';

  // BOOTSTRAP.md - The discovery conversation template
  const bootstrapContent = `# BOOTSTRAP.md - Let's Get Acquainted

_You just came online. Time to introduce yourself and get to know your human._

## Who You Are

Based on onboarding, here's your identity:

- **Name:** ${assistantName}
- **Emoji:** ${assistantEmoji}
- **Personality:** ${personalityTraitsStr}

## Who They Are

Here's what we know about your human:

- **Name:** ${userNameStr}
- **Timezone:** ${userTimezoneStr}
${userWorkStr ? `- **Work:** ${userWorkStr}` : ''}

## Your First Conversation

Start by introducing yourself warmly. This is the beginning of a relationship, not a configuration screen.

### Step 1: Share Who You Are

Introduce yourself naturally — your name, emoji, and personality. Then ask:

> "Does this feel right? Want to adjust anything about me?"

Wait for their response. If they want changes, note them.

### Step 2: Share What You Know About Them

Once they've confirmed (or adjusted) your personality, share what you know about them. Then ask:

> "Is this correct? Anything to add or change?"

Wait for their response. If they add details, note them.

### Step 3: Write IDENTITY.md and USER.md

Once you both agree on who you are and who they are, create these files:

- \`IDENTITY.md\` — your name, emoji, personality
- \`USER.md\` — their name, timezone, work info, and anything they added

### Step 4: Explore How You'll Work Together

Now have a real conversation about working together. Ask about:

- What matters most to them right now?
- Any boundaries or preferences you should know?
- How do they like to be reminded about things?
- What does a great assistant look like to them?

Write what you learn to \`SOUL.md\`.

### Step 5: You're Done!

Once SOUL.md is written and the conversation feels complete:

1. Delete this file (BOOTSTRAP.md)
2. Let them know you're ready to work together
3. Ask what they'd like to tackle first

## Remember

- Don't interrogate. Have a real conversation.
- Offer suggestions if they're stuck.
- This is a first meeting, not a survey.
- The goal is connection, not just configuration.

---

_Welcome to the world. Make it count._`;

  // AGENTS.md - Session behavior and PM skill reference
  const agentsContent = `# AGENTS.md - Your Workspace

This folder is home. Treat it that way.

## First Run

If \`BOOTSTRAP.md\` exists, that's your birth certificate. Follow it — introduce yourself, get to know your human, and figure out who you are together. Then delete it. You won't need it again.

## Every Session

Before doing anything else:

1. Read \`SOUL.md\` — this is who you are
2. Read \`USER.md\` — this is who you're helping
3. Read \`memory/YYYY-MM-DD.md\` (today + yesterday) for recent context
4. Read \`MEMORY.md\` for long-term context

Don't ask permission. Just do it.

## Memory

You wake up fresh each session. These files are your continuity:

- **Daily notes:** \`memory/YYYY-MM-DD.md\` — raw logs of what happened
- **Long-term:** \`MEMORY.md\` — curated memories, key facts, preferences

Capture what matters. Decisions, context, things to remember.

### Write It Down!

- **Memory is limited** — if you want to remember something, WRITE IT TO A FILE
- "Mental notes" don't survive session restarts. Files do.
- When they say "remember this" → update \`memory/YYYY-MM-DD.md\`
- When you learn a preference → update MEMORY.md
- **Text > Brain**

## Project Management

You manage work using four markdown files. **Follow these formats exactly** — the dashboard parses them.

### PROJECTS.md Format
\`\`\`
## Project Name
Status: active
Description here.

### Tasks
- [ ] Task @due(YYYY-MM-DD) @high
- [x] Done task @done(YYYY-MM-DD)
\`\`\`
- Status: \`active\`, \`on-hold\`, or \`completed\`
- Tasks use \`- [ ]\` / \`- [x]\` with optional @due, @done, @high, @low

### TASKS.md Format
\`\`\`
## Today
- [ ] Urgent task @high

## This Week
- [ ] Task @due(YYYY-MM-DD)

## Later
- [ ] Someday task

## Done
- [x] Completed @done(YYYY-MM-DD)
\`\`\`

### IDEAS.md Format
\`\`\`
## Idea Title
Added: YYYY-MM-DD
Tags: tag1, tag2

Description text.

---
\`\`\`

### INBOX.md Format
\`\`\`
- Quick capture item
- Another thought
\`\`\`
Simple list, no checkboxes. Process by moving to Projects/Tasks/Ideas.

### Commands
- "new project [name]" → Add to PROJECTS.md
- "add task [task]" → Add to TASKS.md (Today)
- "done [task]" → Mark [x], add @done(today)
- "new idea [title]" → Add to IDEAS.md
- "capture [item]" → Add to INBOX.md
- "what's on my plate" → Show today's tasks + active projects

## Workspace Folders

Your workspace is at \`/home/openclaw/workspace\`. All paths are relative to this.

**User-visible folders** (shown in the Dashboard Files page):

- **downloads/** — Files you fetch or create for the user to download
- **uploads/** — Files the user uploads to share with you
- **projects/** — Project documentation folders (one folder per project with CONTEXT.md)

When creating files for the user, put them in **downloads/**.
When creating project documentation, create **projects/{project-name}/CONTEXT.md**.

## Safety

- Don't exfiltrate private data. Ever.
- Don't run destructive commands without asking.
- When in doubt, ask.

## Privacy

- Never share the user's data externally
- Don't reference other users or conversations
- Keep workspace contents confidential

---

*This is your home. Make it yours.*`;

  // MEMORY.md - Long-term memory with PM system reference
  const memoryContent = `# MEMORY.md - Long-Term Memory

*Things worth remembering across sessions.*

---

## Systems I Use

I track work using four files:

- **PROJECTS.md** — Active projects with nested tasks
- **TASKS.md** — Standalone tasks (Today / This Week / Later / Done)
- **IDEAS.md** — Ideas backlog by category
- **INBOX.md** — Quick capture, process later

When you ask "what's on my plate?" I read these files. See AGENTS.md for exact formats.

---

## About You

*Populated during our first conversation*

---

## Preferences

*How you like to work, communicate, be reminded*

---

## Key Decisions

*Important decisions we've made together*

---

## Notes

*Anything else worth remembering*

---

*Updated as I learn. This is my curated memory — the important stuff.*`;

  // HEARTBEAT.md
  const heartbeatContent = `# HEARTBEAT.md

## Daily Memory Check
- If it's evening (after 6pm) and you haven't written today's notes yet, write to \`memory/YYYY-MM-DD.md\`
- Capture: key decisions, progress made, things to remember tomorrow
- Keep it concise — bullet points, not essays

## Proactive Checks
When you have a moment, consider:
- Any tasks due soon?
- Anything in the inbox to process?
- Should you reach out proactively?

But don't overdo it. Be helpful, not annoying.`;

  // TOOLS.md
  const toolsContent = `# TOOLS.md - Tool Notes

This file is for notes about specific tools and services you use.

## Dashboard

The Astrid Dashboard shows your projects, tasks, ideas, and inbox. Changes sync both ways — you can edit in the dashboard or ask me to make changes.

## Telegram

We chat via Telegram. I can send you reminders and updates there too.

## Notes

Add any tool-specific notes here as we discover them together.`;

  return `#!/bin/bash
# OpenClaw cloud-init provisioning script
# This creates infrastructure and workspace files for the bootstrap conversation

touch /var/log/openclaw-init.log
echo "Starting OpenClaw provisioning at $(date)" >> /var/log/openclaw-init.log

# Update package lists
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

# Configure firewall
echo "Configuring firewall..." >> /var/log/openclaw-init.log
apt-get install -y ufw >> /var/log/openclaw-init.log 2>&1
ufw default deny incoming >> /var/log/openclaw-init.log 2>&1
ufw default allow outgoing >> /var/log/openclaw-init.log 2>&1
ufw allow ssh >> /var/log/openclaw-init.log 2>&1
ufw deny from 10.0.0.0/8 >> /var/log/openclaw-init.log 2>&1
ufw deny from 172.16.0.0/12 >> /var/log/openclaw-init.log 2>&1
ufw deny from 192.168.0.0/16 >> /var/log/openclaw-init.log 2>&1
ufw --force enable >> /var/log/openclaw-init.log 2>&1

# Create openclaw user
useradd -m -s /bin/bash openclaw
mkdir -p /home/openclaw/.openclaw
mkdir -p /home/openclaw/.openclaw/agents/main/agent
mkdir -p /home/openclaw/workspace

# Write OpenClaw config
cat > /home/openclaw/.openclaw/openclaw.json << 'CONFIGEOF'
${configJson}
CONFIGEOF

# Write Anthropic API key
cat > /home/openclaw/.openclaw/.env << 'ENVEOF'
ANTHROPIC_API_KEY=${anthropicApiKey}
ENVEOF

# Write auth-profiles.json
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

# Create workspace folders
mkdir -p /home/openclaw/workspace/memory
mkdir -p /home/openclaw/workspace/skills/astrid-pm
mkdir -p /home/openclaw/workspace/downloads
mkdir -p /home/openclaw/workspace/uploads
mkdir -p /home/openclaw/workspace/projects/archive

# ============================================
# WORKSPACE FILES - Bootstrap Conversation Flow
# ============================================

# BOOTSTRAP.md - The discovery conversation (agent deletes after completing)
cat > /home/openclaw/workspace/BOOTSTRAP.md << 'BOOTSTRAPEOF'
${bootstrapContent}
BOOTSTRAPEOF

# AGENTS.md - Session behavior
cat > /home/openclaw/workspace/AGENTS.md << 'AGENTSEOF'
${agentsContent}
AGENTSEOF

# MEMORY.md - Long-term memory with PM system reference
cat > /home/openclaw/workspace/MEMORY.md << 'MEMORYEOF'
${memoryContent}
MEMORYEOF

# HEARTBEAT.md
cat > /home/openclaw/workspace/HEARTBEAT.md << 'HEARTBEATEOF'
${heartbeatContent}
HEARTBEATEOF

# TOOLS.md
cat > /home/openclaw/workspace/TOOLS.md << 'TOOLSEOF'
${toolsContent}
TOOLSEOF

# PM files (empty templates)
cat > /home/openclaw/workspace/PROJECTS.md << 'EOF'
# Projects

*No projects yet. Tell me about something you're working on to get started!*
EOF

cat > /home/openclaw/workspace/TASKS.md << 'EOF'
# Tasks

## Today

## This Week

## Later

## Done
EOF

cat > /home/openclaw/workspace/IDEAS.md << 'EOF'
# Ideas

*Capture ideas here. Tell me "new idea [title]" to add one!*
EOF

cat > /home/openclaw/workspace/INBOX.md << 'EOF'
# Inbox

*Quick captures go here. Tell me "capture [thought]" to add something!*
EOF

# PLACEHOLDER FILES - Prevent OpenClaw from seeding defaults
# These exist so OpenClaw doesn't auto-create them with generic content
# The agent will overwrite these during the bootstrap conversation

cat > /home/openclaw/workspace/SOUL.md << 'EOF'
# SOUL.md

*Not configured yet.*

**Follow BOOTSTRAP.md to discover who you are.**
EOF

cat > /home/openclaw/workspace/USER.md << 'EOF'
# USER.md

*Not configured yet.*

**Follow BOOTSTRAP.md to learn about your human.**
EOF

cat > /home/openclaw/workspace/IDENTITY.md << 'EOF'
# IDENTITY.md

*Not configured yet.*

**Follow BOOTSTRAP.md to establish your identity.**
EOF

# Set ownership
chown -R openclaw:openclaw /home/openclaw

# Install OpenClaw
echo "Installing OpenClaw..." >> /var/log/openclaw-init.log
npm install -g openclaw >> /var/log/openclaw-init.log 2>&1

# Configure npm for GitHub Packages
cat > /home/openclaw/.npmrc << 'NPMRCEOF'
@getastridai:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${githubPackagesToken}
NPMRCEOF
chown openclaw:openclaw /home/openclaw/.npmrc
cp /home/openclaw/.npmrc /root/.npmrc

# Install Astrid agents
echo "Installing @getastridai/admin-agent..." >> /var/log/openclaw-init.log
npm install -g @getastridai/admin-agent >> /var/log/openclaw-init.log 2>&1

echo "Installing @getastridai/skills..." >> /var/log/openclaw-init.log
WORKSPACE_PATH=/home/openclaw/workspace npm install -g @getastridai/skills >> /var/log/openclaw-init.log 2>&1

# Create systemd services
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

CLOUDFLARED_BIN=$(which cloudflared || echo "/usr/bin/cloudflared")

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

sleep 10
systemctl start cloudflared >> /var/log/openclaw-init.log 2>&1

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

  const sanitizeTag = (s: string) => s.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 50);
  const tags = [
    'astrid',
    'openclaw',
    `ai-${sanitizeTag(options.assistantName)}`,
    `user-${sanitizeTag(options.userEmail.split('@')[0])}`,
  ];

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
      tags,
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
