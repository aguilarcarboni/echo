-- Fix: Make participant-uploads bucket public for direct URL access
-- Run this in your Supabase SQL Editor

-- Update the bucket to be public
UPDATE storage.buckets
SET public = true
WHERE id = 'participant-uploads';

-- Verify the bucket is now public
SELECT id, name, public, created_at
FROM storage.buckets
WHERE id = 'participant-uploads';

-- The bucket should show public = true
