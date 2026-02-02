-- Instances: Track customer OpenClaw VMs
-- Migration: 003_instances.sql

-- Create instances table
CREATE TABLE IF NOT EXISTS instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- DigitalOcean
    droplet_id TEXT,
    droplet_name TEXT,
    droplet_ip TEXT,
    region TEXT NOT NULL DEFAULT 'nyc1',
    size TEXT NOT NULL DEFAULT 's-1vcpu-2gb',
    
    -- Gateway connection
    gateway_port INTEGER NOT NULL DEFAULT 18789,
    gateway_token TEXT NOT NULL,
    tunnel_id TEXT, -- Cloudflare Tunnel ID
    tunnel_hostname TEXT, -- e.g., {instance-id}.tunnel.getastrid.ai
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending', 
    -- pending | provisioning | configuring | active | stopped | error | destroying
    status_message TEXT,
    last_health_check TIMESTAMPTZ,
    health_status TEXT, -- healthy | unhealthy | unknown
    
    -- Assistant config (denormalized for quick access)
    assistant_name TEXT DEFAULT 'Astrid',
    assistant_emoji TEXT DEFAULT '✨',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    provisioned_at TIMESTAMPTZ,
    
    -- Ensure one instance per user (MVP - can change later for multi-instance)
    UNIQUE(user_id)
);

-- Indexes
CREATE INDEX idx_instances_user ON instances(user_id);
CREATE INDEX idx_instances_status ON instances(status);
CREATE INDEX idx_instances_droplet ON instances(droplet_id);

-- Enable RLS
ALTER TABLE instances ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own instance"
    ON instances FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own instance"
    ON instances FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own instance"
    ON instances FOR UPDATE
    USING (auth.uid() = user_id);

-- Note: DELETE is intentionally not allowed via RLS
-- Instance destruction goes through the API which handles cleanup

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_instances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER instances_updated_at
    BEFORE UPDATE ON instances
    FOR EACH ROW
    EXECUTE FUNCTION update_instances_updated_at();
