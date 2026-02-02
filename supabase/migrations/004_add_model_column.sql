-- Migration: 004_add_model_column.sql
-- Add model column to instances table for caching the current AI model

ALTER TABLE instances 
ADD COLUMN IF NOT EXISTS model TEXT DEFAULT 'anthropic/claude-sonnet-4-5';

COMMENT ON COLUMN instances.model IS 'Current AI model (e.g., anthropic/claude-sonnet-4-5)';
