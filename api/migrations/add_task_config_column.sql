-- Migration: Add config column to tasks table
-- This column stores task-specific configuration (items, template, layout) as JSONB
-- Run this in your Supabase SQL Editor

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS config JSONB;

-- Add a comment to document the column
COMMENT ON COLUMN tasks.config IS 'Stores task-specific configuration: items (classification), template (fill_blanks), layout (collage)';
