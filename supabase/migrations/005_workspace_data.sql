-- Workspace data synced from assistant instances
CREATE TABLE IF NOT EXISTS workspace_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Parsed workspace content (stored as JSONB for flexibility)
  projects JSONB DEFAULT '[]'::jsonb,
  tasks JSONB DEFAULT '[]'::jsonb,
  ideas JSONB DEFAULT '[]'::jsonb,
  inbox JSONB DEFAULT '[]'::jsonb,
  
  -- Quick stats for dashboard cards
  stats JSONB DEFAULT '{}'::jsonb,
  
  -- Sync metadata
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One row per instance
  UNIQUE(instance_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_workspace_data_user_id ON workspace_data(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_data_instance_id ON workspace_data(instance_id);

-- RLS policies
ALTER TABLE workspace_data ENABLE ROW LEVEL SECURITY;

-- Users can only read their own workspace data
CREATE POLICY "Users can read own workspace data" ON workspace_data
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert/update (for API sync)
CREATE POLICY "Service role can manage workspace data" ON workspace_data
  FOR ALL USING (true) WITH CHECK (true);
