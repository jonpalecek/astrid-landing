import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database
export interface WaitlistEntry {
  id: string;
  email: string;
  created_at: string;
  source: string;
  referred_by?: string;
  notified_at?: string;
}

export interface Customer {
  id: string;
  user_id: string;
  email: string;
  name?: string;
  stripe_customer_id?: string;
  subscription_status: 'trialing' | 'active' | 'canceled' | 'past_due';
  subscription_id?: string;
  trial_ends_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Assistant {
  id: string;
  customer_id: string;
  name: string;
  emoji: string;
  personality: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Instance {
  id: string;
  customer_id: string;
  assistant_id?: string;
  droplet_id?: number;
  ip_address?: string;
  region: string;
  size_slug: string;
  status: 'provisioning' | 'active' | 'stopped' | 'error';
  moltbot_version?: string;
  agent_version?: string;
  last_heartbeat_at?: string;
  health_status: 'healthy' | 'warning' | 'critical' | 'offline' | 'unknown';
  provisioned_at?: string;
  created_at: string;
  updated_at: string;
}
