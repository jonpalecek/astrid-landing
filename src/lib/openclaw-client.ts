/**
 * OpenClaw Gateway Client
 * 
 * For MVP: Uses SSH to communicate with VMs (works from local dev)
 * For Production: Will use HTTP proxy or Edge Functions
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { homedir } from 'os';
import path from 'path';

const execAsync = promisify(exec);

// SSH key path for Astrid deploy
const SSH_KEY_PATH = process.env.SSH_KEY_PATH || path.join(homedir(), '.ssh', 'astrid_deploy');
const SSH_TIMEOUT = 15000;

export interface OpenClawConfig {
  gateway?: {
    port?: number;
    mode?: string;
    auth?: { token?: string };
  };
  agents?: {
    defaults?: {
      workspace?: string;
      model?: { primary?: string };
    };
    list?: Array<{
      id: string;
      identity?: { name?: string; emoji?: string };
    }>;
  };
  channels?: {
    telegram?: {
      enabled?: boolean;
      botToken?: string;
      dmPolicy?: string;
    };
  };
  meta?: {
    lastTouchedVersion?: string;
    lastTouchedAt?: string;
  };
}

export interface AssistantInfo {
  name: string;
  emoji: string;
  model: string;
}

export class OpenClawSSHClient {
  private dropletIp: string;

  constructor(dropletIp: string) {
    this.dropletIp = dropletIp;
  }

  /**
   * Execute a command on the VM via SSH
   */
  private async ssh(command: string): Promise<string> {
    const { stdout } = await execAsync(
      `ssh -i ${SSH_KEY_PATH} -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@${this.dropletIp} "${command}"`,
      { timeout: SSH_TIMEOUT }
    );
    return stdout.trim();
  }

  /**
   * Get current OpenClaw configuration from the VM
   */
  async getConfig(): Promise<OpenClawConfig> {
    const configJson = await this.ssh('cat /home/openclaw/.openclaw/openclaw.json');
    return JSON.parse(configJson);
  }

  /**
   * Write configuration to the VM
   */
  async setConfig(config: OpenClawConfig): Promise<void> {
    const configJson = JSON.stringify(config, null, 2);
    // Escape for shell
    const escaped = configJson.replace(/'/g, "'\\''");
    
    await execAsync(
      `ssh -i ${SSH_KEY_PATH} -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@${this.dropletIp} 'cat > /home/openclaw/.openclaw/openclaw.json << '"'"'EOFCONFIG'"'"'\n${escaped}\nEOFCONFIG\nchown openclaw:openclaw /home/openclaw/.openclaw/openclaw.json'`,
      { timeout: SSH_TIMEOUT }
    );
  }

  /**
   * Restart OpenClaw service
   */
  async restart(): Promise<void> {
    await execAsync(
      `ssh -i ${SSH_KEY_PATH} -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@${this.dropletIp} "systemctl restart openclaw"`,
      { timeout: 30000 }
    );
  }

  /**
   * Get OpenClaw service status
   */
  async getServiceStatus(): Promise<{ active: boolean; uptime?: string }> {
    try {
      const status = await this.ssh('systemctl is-active openclaw');
      const isActive = status === 'active';
      
      if (isActive) {
        const uptime = await this.ssh('systemctl show openclaw --property=ActiveEnterTimestamp --value');
        return { active: true, uptime };
      }
      
      return { active: false };
    } catch {
      return { active: false };
    }
  }

  /**
   * Update specific config fields and restart
   */
  async updateConfig(updates: {
    assistantName?: string;
    assistantEmoji?: string;
    model?: string;
  }): Promise<OpenClawConfig> {
    // Get current config
    const config = await this.getConfig();

    // Update assistant identity
    if (updates.assistantName || updates.assistantEmoji) {
      if (!config.agents) config.agents = { list: [] };
      if (!config.agents.list) config.agents.list = [];
      
      let mainAgent = config.agents.list.find(a => a.id === 'main');
      if (!mainAgent) {
        mainAgent = { id: 'main', identity: {} };
        config.agents.list.push(mainAgent);
      }
      if (!mainAgent.identity) mainAgent.identity = {};
      
      if (updates.assistantName) mainAgent.identity.name = updates.assistantName;
      if (updates.assistantEmoji) mainAgent.identity.emoji = updates.assistantEmoji;
    }

    // Update model
    if (updates.model) {
      if (!config.agents) config.agents = {};
      if (!config.agents.defaults) config.agents.defaults = {};
      if (!config.agents.defaults.model) config.agents.defaults.model = {};
      config.agents.defaults.model.primary = updates.model;
    }

    // Write and restart
    await this.setConfig(config);
    await this.restart();

    return config;
  }

  /**
   * Read a file from the workspace
   */
  async readFile(relativePath: string): Promise<string | null> {
    try {
      const content = await this.ssh(`cat /home/openclaw/workspace/${relativePath}`);
      return content;
    } catch {
      return null;
    }
  }

  /**
   * Write a file to the workspace
   */
  async writeFile(relativePath: string, content: string): Promise<boolean> {
    try {
      const escaped = content.replace(/'/g, "'\\''");
      await execAsync(
        `ssh -i ${SSH_KEY_PATH} -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@${this.dropletIp} 'cat > /home/openclaw/workspace/${relativePath} << '"'"'EOFFILE'"'"'\n${escaped}\nEOFFILE\nchown openclaw:openclaw /home/openclaw/workspace/${relativePath}'`,
        { timeout: SSH_TIMEOUT }
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * List files in a workspace directory
   */
  async listFiles(relativePath: string = ''): Promise<string[]> {
    try {
      const output = await this.ssh(`ls -1 /home/openclaw/workspace/${relativePath} 2>/dev/null || echo ""`);
      return output.split('\n').filter(Boolean);
    } catch {
      return [];
    }
  }

  /**
   * Extract assistant info from config
   */
  static extractAssistantInfo(config: OpenClawConfig): AssistantInfo {
    const mainAgent = config.agents?.list?.find(a => a.id === 'main');
    
    return {
      name: mainAgent?.identity?.name || 'Astrid',
      emoji: mainAgent?.identity?.emoji || '✨',
      model: config.agents?.defaults?.model?.primary || 'anthropic/claude-sonnet-4-5',
    };
  }
}
