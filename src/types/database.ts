// Database types for Astrid

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: 'active' | 'on_hold' | 'completed' | 'archived';
  color: string;
  icon: string;
  position: number;
  created_at: string;
  updated_at: string;
  // Computed fields (from joins)
  task_count?: number;
  completed_task_count?: number;
}

export interface Task {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  due_date: string | null;
  position: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InboxItem {
  id: string;
  user_id: string;
  content: string;
  source: 'web' | 'telegram' | 'email' | 'chat';
  source_metadata: Record<string, unknown>;
  attachments: Array<{
    type: string;
    url: string;
    name: string;
  }>;
  processed: boolean;
  processed_at: string | null;
  created_at: string;
}

export interface Idea {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: 'active' | 'archived' | 'promoted';
  promoted_to_project_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: 'project' | 'task' | 'idea' | 'inbox_item';
  entity_id: string;
  entity_name: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  user_id: string;
  file_path: string;
  file_name: string;
  notes: string | null;
  created_at: string;
}

export interface Instance {
  id: string;
  user_id: string;
  droplet_id: string | null;
  droplet_name: string | null;
  droplet_ip: string | null;
  region: string;
  size: string;
  gateway_port: number;
  gateway_token: string;
  tunnel_id: string | null;
  tunnel_hostname: string | null;
  status: 'pending' | 'provisioning' | 'configuring' | 'active' | 'stopped' | 'error' | 'destroying';
  status_message: string | null;
  last_health_check: string | null;
  health_status: 'healthy' | 'unhealthy' | 'unknown' | null;
  assistant_name: string;
  assistant_emoji: string;
  created_at: string;
  updated_at: string;
  provisioned_at: string | null;
}

// Insert types (omit auto-generated fields)
export type ProjectInsert = Omit<Project, 'id' | 'created_at' | 'updated_at' | 'task_count' | 'completed_task_count'>;
export type TaskInsert = Omit<Task, 'id' | 'created_at' | 'updated_at'>;
export type InboxItemInsert = Omit<InboxItem, 'id' | 'created_at'>;
export type IdeaInsert = Omit<Idea, 'id' | 'created_at' | 'updated_at'>;
export type ProjectFileInsert = Omit<ProjectFile, 'id' | 'created_at'>;

// Update types (all fields optional except id)
export type ProjectUpdate = Partial<Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
export type TaskUpdate = Partial<Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
export type IdeaUpdate = Partial<Omit<Idea, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
