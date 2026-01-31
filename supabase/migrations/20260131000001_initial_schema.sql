-- Astrid Initial Schema
-- Created: 2026-01-31

-- ===========================================
-- WAITLIST (for landing page)
-- ===========================================
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'landing', -- landing, referral, etc.
  referred_by UUID REFERENCES waitlist(id),
  notified_at TIMESTAMPTZ -- when we sent launch notification
);

-- Index for email lookups
CREATE INDEX idx_waitlist_email ON waitlist(email);

-- ===========================================
-- CUSTOMERS
-- ===========================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  stripe_customer_id TEXT UNIQUE,
  subscription_status TEXT DEFAULT 'trialing', -- trialing, active, canceled, past_due
  subscription_id TEXT,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user lookups
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_stripe_id ON customers(stripe_customer_id);

-- ===========================================
-- ASSISTANTS (customer's AI assistant config)
-- ===========================================
CREATE TABLE IF NOT EXISTS assistants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Astrid',
  emoji TEXT DEFAULT '✨',
  personality JSONB DEFAULT '{}', -- traits, custom instructions
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assistants_customer ON assistants(customer_id);

-- ===========================================
-- INSTANCES (VM/infrastructure tracking)
-- ===========================================
CREATE TABLE IF NOT EXISTS instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  assistant_id UUID REFERENCES assistants(id),
  
  -- DigitalOcean info
  droplet_id BIGINT UNIQUE,
  ip_address INET,
  region TEXT DEFAULT 'sfo3',
  size_slug TEXT DEFAULT 's-1vcpu-2gb',
  
  -- Status
  status TEXT DEFAULT 'provisioning', -- provisioning, active, stopped, error
  moltbot_version TEXT,
  agent_version TEXT,
  
  -- Health
  last_heartbeat_at TIMESTAMPTZ,
  health_status TEXT DEFAULT 'unknown', -- healthy, warning, critical, offline
  
  -- Timestamps
  provisioned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_instances_customer ON instances(customer_id);
CREATE INDEX idx_instances_status ON instances(status);
CREATE INDEX idx_instances_health ON instances(health_status);

-- ===========================================
-- AI CREDENTIALS (encrypted)
-- ===========================================
CREATE TABLE IF NOT EXISTS ai_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  auth_type TEXT NOT NULL, -- 'api_key' or 'setup_token'
  -- Note: actual credentials stored encrypted or in vault
  credential_hint TEXT, -- last 4 chars for display
  is_valid BOOLEAN DEFAULT true,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_credentials_customer ON ai_credentials(customer_id);

-- ===========================================
-- CHANNELS (Telegram, Email, etc.)
-- ===========================================
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL, -- telegram, email, whatsapp
  
  -- Channel-specific config (varies by type)
  config JSONB DEFAULT '{}',
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, active, error
  connected_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_channels_customer ON channels(customer_id);
CREATE INDEX idx_channels_type ON channels(channel_type);

-- ===========================================
-- ONBOARDING PROGRESS
-- ===========================================
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE UNIQUE,
  
  -- Steps completed
  account_created BOOLEAN DEFAULT false,
  payment_added BOOLEAN DEFAULT false,
  ai_connected BOOLEAN DEFAULT false,
  assistant_named BOOLEAN DEFAULT false,
  profile_completed BOOLEAN DEFAULT false,
  personality_set BOOLEAN DEFAULT false,
  channel_connected BOOLEAN DEFAULT false,
  email_setup BOOLEAN DEFAULT false,
  
  -- Current step for resuming
  current_step TEXT DEFAULT 'account',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_onboarding_customer ON onboarding_progress(customer_id);

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Waitlist: anyone can insert (public signup), only admins can read
CREATE POLICY "Anyone can join waitlist" ON waitlist
  FOR INSERT WITH CHECK (true);

-- Customers: users can only see/edit their own data
CREATE POLICY "Users can view own customer data" ON customers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own customer data" ON customers
  FOR UPDATE USING (auth.uid() = user_id);

-- Assistants: users can manage their own assistants
CREATE POLICY "Users can manage own assistants" ON assistants
  FOR ALL USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

-- Instances: users can view their own instances
CREATE POLICY "Users can view own instances" ON instances
  FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

-- AI Credentials: users can manage their own credentials
CREATE POLICY "Users can manage own credentials" ON ai_credentials
  FOR ALL USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

-- Channels: users can manage their own channels
CREATE POLICY "Users can manage own channels" ON channels
  FOR ALL USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

-- Onboarding: users can manage their own progress
CREATE POLICY "Users can manage own onboarding" ON onboarding_progress
  FOR ALL USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

-- ===========================================
-- FUNCTIONS
-- ===========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_assistants_updated_at
  BEFORE UPDATE ON assistants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_instances_updated_at
  BEFORE UPDATE ON instances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_ai_credentials_updated_at
  BEFORE UPDATE ON ai_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_channels_updated_at
  BEFORE UPDATE ON channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_onboarding_progress_updated_at
  BEFORE UPDATE ON onboarding_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
