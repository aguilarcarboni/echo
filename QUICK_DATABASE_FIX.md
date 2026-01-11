# ⚠️ QUICK FIX: Database Migration Required

## The Error

```
Table 'studies' has extra columns in model: {'study_access_code'}
```

**Meaning:** The Python model has `study_access_code` field, but the database table doesn't have this column yet.

## ✅ SOLUTION: Add Column to Database

**Go to Supabase Dashboard → SQL Editor and run this:**

```sql
ALTER TABLE studies 
ADD COLUMN IF NOT EXISTS study_access_code TEXT UNIQUE;

UPDATE studies
SET study_access_code = UPPER(SUBSTRING(ENCODE(GEN_RANDOM_BYTES(8), 'base64') FROM 1 FOR 10))
WHERE study_access_code IS NULL;

CREATE INDEX IF NOT EXISTS idx_studies_access_code ON studies(study_access_code);
```

**Then restart your API server:**
```bash
cd api
python run.py
```

## ✅ Verify It Worked

After running the SQL, verify the column was added:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'studies' AND column_name = 'study_access_code';
```

Should return:
```
column_name        | data_type
-------------------|----------
study_access_code  | text
```

**Then restart your API server** - it should start without errors!

---

## Why This Happened

The DatabaseManager validates that the Python models match the database tables exactly. Since we added `study_access_code` to the model but not yet to the database, it's throwing this error.

**Once you add the column to the database, everything will work!** ✅
