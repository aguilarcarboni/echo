# Fix: 'access_code' is an invalid keyword argument for Participant

## Problem

You're getting this error when creating participants:
```
Database error in _create: 'access_code' is an invalid keyword argument for Participant
```

This happens because:
1. The SQLAlchemy model didn't have the `access_code` field defined (✅ **FIXED**)
2. The database table might not have the `access_code` column yet

## Solution

### Step 1: Add the Column to Database (If Not Already Done)

Run this SQL in your **Supabase SQL Editor**:

```sql
-- Add access_code column to participants table
ALTER TABLE participants 
ADD COLUMN IF NOT EXISTS access_code TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_participants_access_code ON participants(access_code);
```

### Step 2: Restart the API Server

**IMPORTANT:** You must restart your API server for the model changes to take effect!

```bash
# Stop the current API server (Ctrl+C)
# Then restart it
cd api
python run.py

# OR if using a script
./run.sh
```

### Step 3: Verify the Fix

After restarting, try creating a participant again:

```bash
./test_participant_flow.sh
```

## Why This Happened

The SQLAlchemy model in `api/src/utils/connectors/supabase.py` didn't have the `access_code` field defined, but the component code (`api/src/components/participants.py`) was trying to create participants with `access_code`.

The fix:
- ✅ **Added** `access_code = Column(Text, nullable=True, unique=True)` to the Participant model
- ✅ **Updated** the component code to generate access codes automatically

## Verification

To verify everything is working:

1. **Check the database has the column:**
   ```sql
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'participants' AND column_name = 'access_code';
   ```

2. **Check the model has the field:**
   Look in `api/src/utils/connectors/supabase.py` - the Participant model should have:
   ```python
   access_code = Column(Text, nullable=True, unique=True)
   ```

3. **Test creating a participant:**
   ```bash
   ./test_participant_flow.sh
   ```

## Still Having Issues?

If you still get the error after:
1. ✅ Running the SQL migration
2. ✅ Restarting the API server
3. ✅ Verifying both database and model have the column

Then check:

1. **Database column exists:**
   ```sql
   \d participants  -- In PostgreSQL
   -- Should show access_code column
   ```

2. **Model definition:**
   ```python
   # Check api/src/utils/connectors/supabase.py
   # Line ~166 should have:
   access_code = Column(Text, nullable=True, unique=True)
   ```

3. **API server logs:**
   Look for schema validation errors on startup. The DatabaseManager validates that model matches database on startup.

4. **Clear Python cache:**
   ```bash
   find api -name "*.pyc" -delete
   find api -name "__pycache__" -type d -exec rm -r {} +
   ```

Then restart the API server again.
