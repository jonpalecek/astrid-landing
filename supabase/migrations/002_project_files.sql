-- Project Files: Link files from the second brain to projects
-- Migration: 002_project_files.sql

-- Create project_files table
CREATE TABLE IF NOT EXISTS project_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate links
    UNIQUE(project_id, file_path)
);

-- Create indexes
CREATE INDEX idx_project_files_project ON project_files(project_id);
CREATE INDEX idx_project_files_user ON project_files(user_id);

-- Enable RLS
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see/manage their own project files
CREATE POLICY "Users can view own project files"
    ON project_files FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own project files"
    ON project_files FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own project files"
    ON project_files FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own project files"
    ON project_files FOR DELETE
    USING (auth.uid() = user_id);
