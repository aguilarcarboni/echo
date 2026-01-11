# Video Upload and Display Fix

## Issues Fixed

1. **Video Duration**: Now calculates actual video duration instead of file size
2. **Video Playback**: Fixed URL format handling for Supabase Storage
3. **Bucket Access**: Made bucket public for direct URL access

## Steps to Fix

### 1. Make the Storage Bucket Public

Run this SQL in your Supabase SQL Editor:

```sql
-- Make participant-uploads bucket public
UPDATE storage.buckets
SET public = true
WHERE id = 'participant-uploads';

-- Verify it's public
SELECT id, name, public FROM storage.buckets WHERE id = 'participant-uploads';
```

**Important**: The bucket MUST be public (`public = true`) for videos to be accessible via direct URLs.

### 2. Restart Your Frontend Server

After updating the bucket, restart your Next.js dev server:

```bash
cd frontend
npm run dev
# or
yarn dev
```

### 3. Test Video Upload

1. Go to a participant task page with a camera/video task
2. Record or upload a video
3. Submit the response
4. Check the studies page - the video should now play correctly

## What Changed

### Frontend Changes

1. **Duration Calculation**: Now gets actual video duration from the video element metadata
   - For recorded videos: Duration is calculated from the MediaRecorder blob
   - For uploaded videos: Duration is calculated from the video file metadata

2. **URL Handling**: The `uploadFile` function in `storage.ts` uses `getPublicUrl` which should return the correct format:
   - Format: `https://{project-ref}.supabase.co/storage/v1/object/public/participant-uploads/{path}`

3. **Response Renderer**: Improved error handling and URL validation
   - Better error messages if video fails to load
   - Proper URL format validation

## Troubleshooting

If videos still don't play:

1. **Check Bucket is Public**:
   ```sql
   SELECT id, name, public FROM storage.buckets WHERE id = 'participant-uploads';
   ```
   Should return `public = true`

2. **Check Storage Policies**:
   ```sql
   SELECT policyname, permissive, roles, cmd 
   FROM pg_policies 
   WHERE tablename = 'objects' 
   AND policyname LIKE '%participant-uploads%';
   ```
   Should have policies for INSERT (anon) and SELECT (anon, authenticated)

3. **Verify URL Format**: 
   - The URL stored in `response_data.videoUrl` should start with `https://`
   - Should contain `.supabase.co/storage/v1/object/public/participant-uploads/`

4. **Check Browser Console**: 
   - Look for CORS errors
   - Look for 404 errors (bucket not found)
   - Look for 403 errors (permission denied)

5. **Test URL Directly**: 
   - Copy the video URL from the database
   - Paste it directly in your browser
   - If it works in browser but not in the video tag, it's likely a CORS issue
   - If it doesn't work in browser, it's a bucket/permission issue

## Expected Behavior

- ✅ Videos play in the embedded player
- ✅ Duration shows correctly (e.g., "2m 30s")
- ✅ "Open video in new tab" link works
- ✅ Videos are accessible via direct URL
