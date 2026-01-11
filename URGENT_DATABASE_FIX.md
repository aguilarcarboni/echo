# ⚠️ URGENT: Database Migration Required

## Error
```
Table 'studies' has extra columns in model: {'study_access_code'}
```

This means the Python model has `study_access_code` but the database table doesn't.

## Quick Fix (Choose One)

### Option 1: Add Column to Database (RECOMMENDED) ✅

**Run this SQL in Supabase SQL Editor RIGHT NOW:**

```sql
ALTER TABLE studies 
ADD COLUMN IF NOT EXISTS study_access_code TEXT UNIQUE;

-- Generate codes for existing studies
UPDATE studies
SET study_access_code = UPPER(SUBSTRING(ENCODE(GEN_RANDOM_BYTES(8), 'base64') FROM 1 FOR 10))
WHERE study_access_code IS NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_studies_access_code ON studies(study_access_code);
```

**Then restart your API server.**

---

### Option 2: Temporarily Remove Column from Model (Quick Test)

If you can't access the database right now, temporarily comment out the field:

In `api/src/utils/connectors/supabase.py`, line ~136:
```python
# study_access_code = Column(Text, nullable=True, unique=True)  # Temporarily disabled
```

**But this will break the new features!** Use Option 1 if possible.

---

## After Running SQL Migration

1. ✅ Verify column was added:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'studies' AND column_name = 'study_access_code';
   ```

2. ✅ Restart API server:
   ```bash
   cd api
   python run.py
   ```

3. ✅ Test the endpoint:
   ```bash
   curl -X GET "http://127.0.0.1:5000/studies/YOUR_STUDY_ID/access-link" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

The API server should start without errors after adding the column!
