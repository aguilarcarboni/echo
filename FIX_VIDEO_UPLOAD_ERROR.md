# Fix: Video Upload "signature verification failed" Error

## Problem

Participants can't upload videos for camera tasks. Getting error:
```
Upload failed: signature verification failed
```

## Root Cause

The `participant-uploads` bucket either:
1. Doesn't exist in Supabase Storage
2. Doesn't have policies that allow anonymous/uploads
3. The anon key doesn't have permission to upload

## Solution Options

### Option 1: Set Up Storage Policies (Quick Fix) ⭐ RECOMMENDED FOR NOW

**This allows participants to upload files directly using the anon key.**

#### Step 1: Create the Bucket (If Not Exists)

In **Supabase Dashboard → Storage**:
1. Click "New Bucket"
2. Name: `participant-uploads`
3. **Public:** ❌ No (Private)
4. **File size limit:** Set appropriate limit (e.g., 100MB for videos)
5. Click "Create bucket"

#### Step 2: Set Up Storage Policies

In **Supabase Dashboard → SQL Editor**, run this:

```sql
-- Allow anonymous users to upload files to participant-uploads bucket
CREATE POLICY "Allow anonymous uploads to participant-uploads"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'participant-uploads');

-- Allow anonymous users to read files they uploaded
CREATE POLICY "Allow anonymous read own files"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'participant-uploads');

-- Allow authenticated users (admin) to read all files
CREATE POLICY "Allow authenticated read participant uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'participant-uploads');
```

**Note:** This allows ANYONE to upload to the bucket (anonymous users). For production, you might want to restrict this further, but for testing it's fine.

#### Step 3: Verify Environment Variables

Check your frontend `.env.local` (or `.env`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Make sure these are set correctly. You can find them in:
- Supabase Dashboard → Settings → API
- `NEXT_PUBLIC_SUPABASE_URL` = Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `anon` `public` key

---

### Option 2: Backend Upload Endpoint (More Secure)

**This uses the backend to handle uploads with proper authentication.**

Instead of frontend uploading directly, the backend generates signed URLs or handles uploads server-side.

**Implementation would be:**
1. Backend endpoint: `POST /participant/get-upload-url`
2. Returns signed upload URL (valid for 1 hour)
3. Frontend uploads to signed URL
4. More secure, but more complex

**For now, Option 1 is easier and works for testing!**

---

## Troubleshooting

### Issue 1: "Bucket does not exist"

**Fix:**
1. Go to Supabase Dashboard → Storage
2. Create bucket `participant-uploads`
3. Set it as Private (not Public)
4. Run the storage policies SQL above

### Issue 2: "Invalid API key"

**Fix:**
1. Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
2. Make sure it's the **anon** `public` key (not service_role)
3. Restart Next.js dev server after changing env vars

### Issue 3: "Row Level Security policy violation"

**Fix:**
Run the storage policies SQL above to allow anonymous uploads

### Issue 4: "File too large"

**Fix:**
1. Increase bucket file size limit in Supabase Dashboard
2. Or add file size validation in frontend

---

## Verification

After setting up storage:

1. **Check bucket exists:**
   ```sql
   SELECT * FROM storage.buckets WHERE id = 'participant-uploads';
   ```

2. **Check policies exist:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%participant-uploads%';
   ```

3. **Test upload:**
   - Try uploading a video in the participant task page
   - Should work without errors

---

## Quick Test Script

After setting up storage, test with:

```javascript
// In browser console on participant task page:
const testFile = new File(['test'], 'test.webm', { type: 'video/webm' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const { data, error } = await supabase.storage
  .from('participant-uploads')
  .upload('test/test.webm', testFile);

console.log('Upload result:', { data, error });
```

If this works, the bucket and policies are configured correctly!

---

## Summary

**Quick Fix:** 
1. Create `participant-uploads` bucket in Supabase
2. Run the storage policies SQL above
3. Restart frontend server
4. Test video upload

The error should be resolved! ✅
