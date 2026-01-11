# Database Setup: Participant Access Codes

## Required Database Change

You need to add the `access_code` column to the `participants` table.

---

## Step 1: Add `access_code` Column

Run this SQL in your **Supabase SQL Editor**:

```sql
-- Add access_code column to participants table
ALTER TABLE participants 
ADD COLUMN IF NOT EXISTS access_code TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_participants_access_code ON participants(access_code);
```

---

## Step 2: Generate Access Codes for Existing Participants

If you already have participants in your database, generate access codes for them:

```sql
-- Generate access codes for existing participants without one
UPDATE participants
SET access_code = UPPER(SUBSTRING(ENCODE(GEN_RANDOM_BYTES(6), 'base64') FROM 1 FOR 8))
WHERE access_code IS NULL OR access_code = '';

-- If there are any duplicates (unlikely but possible), regenerate them
DO $$
DECLARE
    p RECORD;
BEGIN
    FOR p IN SELECT id FROM participants WHERE access_code IS NULL OR access_code = '' LOOP
        UPDATE participants
        SET access_code = UPPER(SUBSTRING(ENCODE(GEN_RANDOM_BYTES(6), 'base64') FROM 1 FOR 8))
        WHERE id = p.id;
    END LOOP;
END $$;
```

**Note:** The code generation in the Python backend uses `secrets.token_urlsafe(6)[:8].upper()`, which generates similar codes.

---

## Step 3: Verify the Column Exists

```sql
-- Check that the column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'participants' AND column_name = 'access_code';

-- Verify some participants have access codes
SELECT id, contact, access_code, status
FROM participants
LIMIT 10;
```

---

## Optional: Update Python Model (for clarity)

If you want to update the SQLAlchemy model for clarity (not strictly necessary if using dict-based operations), add this to `api/src/utils/connectors/supabase.py`:

```python
# Participant model - matches 'participants' table in database
class Participant(self.Base):
    __tablename__ = 'participants'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    study_id = Column(UUID(as_uuid=True), ForeignKey('studies.id', ondelete='CASCADE'), nullable=False)
    contact = Column(Text, nullable=False)
    demographics = Column(JSONB, nullable=True)
    status = Column(Text, default='invited')
    access_code = Column(Text, nullable=True, unique=True)  # ADD THIS LINE
    invited_at = Column(Text, nullable=True)
    started_at = Column(Text, nullable=True)
    completed_at = Column(Text, nullable=True)
    created_at = Column(Text, nullable=True)
    updated_at = Column(Text, nullable=True)
```

**Note:** This is optional since the code uses dictionary-based operations that don't require the model field, but it's good practice to keep the model in sync.

---

## Verification

After running the SQL:

1. **Create a new participant** via API
2. **Check the database** - the participant should have an `access_code`
3. **Retrieve the participant** - the response should include `access_code`
4. **Test participant access** - use the access code to access the study

```bash
# Test: Create participant and check access_code
curl -X POST http://127.0.0.1:5000/participants/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "participant": {
      "study_id": "YOUR_STUDY_ID",
      "contact": "test@example.com",
      "status": "invited"
    }
  }'

# Response should include participant ID, then retrieve to see access_code
curl -X GET "http://127.0.0.1:5000/participants/read?id=PARTICIPANT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Troubleshooting

### Issue: "Column does not exist"

**Solution:** Make sure you ran the `ALTER TABLE` statement and it completed successfully.

### Issue: "Duplicate key value violates unique constraint"

**Solution:** If you get this error, it means an access code collision. Regenerate:
```sql
UPDATE participants
SET access_code = UPPER(SUBSTRING(ENCODE(GEN_RANDOM_BYTES(6), 'base64') FROM 1 FOR 8))
WHERE id = 'PARTICIPANT_ID';
```

### Issue: New participants don't get access codes

**Solution:** 
1. Check the Python code is running (the `create_participant` function should generate codes)
2. Check database logs for errors
3. Verify the `access_code` column exists and is nullable

---

## Summary

✅ **Required:** Add `access_code` column to `participants` table  
✅ **Optional:** Generate codes for existing participants  
✅ **Optional:** Update Python model for clarity  

After completing this setup, the participant flow will work end-to-end!
