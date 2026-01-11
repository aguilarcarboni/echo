-- Add access_code column to participants table
-- Run this in your Supabase SQL Editor

-- Step 1: Add the column
ALTER TABLE participants 
ADD COLUMN IF NOT EXISTS access_code TEXT UNIQUE;

-- Step 2: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_participants_access_code ON participants(access_code);

-- Step 3: Generate access codes for existing participants (if any)
UPDATE participants
SET access_code = UPPER(SUBSTRING(ENCODE(GEN_RANDOM_BYTES(6), 'base64') FROM 1 FOR 8))
WHERE access_code IS NULL OR access_code = '';

-- Step 4: Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'participants' AND column_name = 'access_code';
