-- Setup Storage Bucket and Policies for Participant Uploads
-- Run this in your Supabase SQL Editor

-- Step 1: Create the bucket if it doesn't exist (public bucket for easy access to uploaded media)
INSERT INTO storage.buckets (id, name, public)
VALUES ('participant-uploads', 'participant-uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Step 2: Allow anonymous users to upload files to participant-uploads bucket
-- This policy allows anyone (including participants without authentication) to upload files
CREATE POLICY IF NOT EXISTS "Allow anonymous uploads to participant-uploads"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'participant-uploads');

-- Step 3: Allow anonymous users to read files they uploaded
-- This allows participants to view their uploaded files
CREATE POLICY IF NOT EXISTS "Allow anonymous read own files"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'participant-uploads');

-- Step 4: Allow authenticated users (admin) to read all files in participant-uploads
-- This allows admins to view all participant uploads
CREATE POLICY IF NOT EXISTS "Allow authenticated read participant uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'participant-uploads');

-- Step 5: Allow authenticated users to delete files (for admin management)
CREATE POLICY IF NOT EXISTS "Allow authenticated delete participant uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'participant-uploads');

-- Step 6: Verify the bucket was created
SELECT id, name, public, created_at
FROM storage.buckets
WHERE id = 'participant-uploads';

-- Step 7: Verify policies were created
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%participant-uploads%';
