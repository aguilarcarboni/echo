-- Add study_access_code column to studies table
-- Run this in your Supabase SQL Editor

-- Step 1: Add the column
ALTER TABLE studies 
ADD COLUMN IF NOT EXISTS study_access_code TEXT UNIQUE;

-- Step 2: Generate access codes for existing studies (if any)
-- Note: The Python backend will auto-generate codes when studies are accessed,
-- but you can pre-populate them here if needed
UPDATE studies
SET study_access_code = UPPER(SUBSTRING(ENCODE(GEN_RANDOM_BYTES(8), 'base64') FROM 1 FOR 10))
WHERE study_access_code IS NULL;

-- Step 3: Create index for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_studies_access_code ON studies(study_access_code);

-- Step 4: Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'studies' AND column_name = 'study_access_code';
