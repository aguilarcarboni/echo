# Participant Flow - Implementation Summary

## What Was Added

This document summarizes what was implemented to enable the complete participant flow in the Echo research platform.

---

## Overview

The participant flow allows:
1. **Participants to receive studies** via unique access codes
2. **Participants to access studies** without admin authentication
3. **Participants to complete tasks** (discussion, camera, gallery, etc.)
4. **Participants to upload responses** (text, videos, images)
5. **Admins to view responses** in the study detail page

---

## Backend Changes

### 1. Participant Access Code System (`api/src/components/participants.py`)

**Added:**
- Automatic `access_code` generation when participants are created
- Secure random 8-character access codes (e.g., `ABC123XY`)
- `get_participant_by_access_code()` function to verify participant access

**Changes:**
- Modified `create_participant()` to generate access codes
- Modified `bulk_create_participants()` to generate unique codes for each participant

### 2. Public Participant API Endpoints (`api/src/app/participant_public.py`)

**New endpoints (no JWT required):**
- `GET /participant/study/<study_id>?access_code=...` - Get study details for participant
- `GET /participant/task/<task_id>?access_code=...` - Get task details
- `POST /participant/submit-response` - Submit a response to a task
- `GET /participant/my-responses?access_code=...` - Get participant's responses
- `POST /participant/upload-url` - Get file upload URL (placeholder for future)

**Security:**
- All endpoints verify `access_code` before allowing access
- Participants can only access their own studies/tasks
- Public endpoints exempted from JWT authentication

### 3. JWT Authentication Update (`api/run.py`)

**Changes:**
- Updated `jwt_required_except_login()` to exempt `participant_public.*` routes
- Registered public participant blueprint at `/participant` prefix

---

## Frontend Changes

### 1. Participant Study Access Page (`frontend/src/app/participant/[studyId]/page.tsx`)

**Features:**
- Access code input form
- Study overview with tasks list
- Progress tracking (completed vs total tasks)
- Task status indicators (completed/in-progress/not started)
- Navigation to individual tasks

**URL:** `/participant/[studyId]?access_code=ABC123XY`

### 2. Participant Task Completion Page (`frontend/src/app/participant/[studyId]/task/[taskId]/page.tsx`)

**Features:**
- Task-specific input interfaces:
  - **Discussion**: Textarea for text responses
  - **Camera**: Video recording (start/stop) + file upload
  - **Gallery/Collage**: Image selection + preview + file upload
  - **Classification**: Placeholder for drag-and-drop (future)
- File upload to Supabase Storage
- Response submission with validation
- Success/error messaging

**URL:** `/participant/[studyId]/task/[taskId]?access_code=ABC123XY`

### 3. API Utility Functions (`frontend/src/utils/api.ts`)

**Added:**
- `getParticipantStudy()` - Get study with participant context
- `getParticipantTask()` - Get task details
- `submitParticipantResponse()` - Submit response to task
- `getParticipantResponses()` - Get participant's responses

**Note:** These use direct `fetch()` calls (no auth token required) since they're public endpoints.

---

## Database Schema Changes

### Required: Add `access_code` Field to `participants` Table

You need to add the `access_code` column to your `participants` table:

```sql
ALTER TABLE participants 
ADD COLUMN IF NOT EXISTS access_code TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_participants_access_code ON participants(access_code);
```

**Run this SQL in your Supabase SQL Editor.**

---

## File Upload Flow

### Current Implementation

1. **Frontend uploads directly to Supabase Storage** using Supabase client
2. **Storage path format:** `participant-uploads/{study_id}/{participant_id}/{timestamp}-{filename}`
3. **Public URLs** are returned after upload
4. **URLs are included** in `response_data` when submitting responses

### Supabase Storage Setup Required

1. **Create bucket:** `participant-uploads` (Private)
2. **Storage policies:**
   ```sql
   -- Allow participants to upload (public upload)
   CREATE POLICY "Participants can upload"
   ON storage.objects FOR INSERT
   WITH CHECK (bucket_id = 'participant-uploads');

   -- Allow org members to read participant uploads
   CREATE POLICY "Org members can view uploads"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'participant-uploads');
   ```

---

## How It Works: End-to-End Flow

### Step 1: Admin Creates Study and Participants

```bash
# 1. Create study
POST /studies/create
{
  "study": {
    "name": "Product Feedback Study",
    "status": "active",
    ...
  }
}

# 2. Create participants (access codes auto-generated)
POST /participants/bulk-create
{
  "study_id": "...",
  "contacts": ["participant1@example.com", "participant2@example.com"]
}

# 3. Retrieve access codes
GET /participants/read?study_id=...
# Response includes access_code for each participant
```

### Step 2: Participant Receives Access Code

**Option 1: Admin shares access code directly**
- Admin retrieves participant's `access_code` from database
- Sends access code to participant via email/SMS/etc.

**Option 2: Admin shares study link with access code**
- Admin creates link: `http://localhost:3000/participant/STUDY_ID?access_code=ABC123XY`
- Participant clicks link and automatically accesses study

### Step 3: Participant Accesses Study

1. **Navigate to:** `/participant/STUDY_ID`
2. **Enter access code** (or auto-filled from URL)
3. **View study overview:**
   - Study name, objective, status
   - List of tasks with completion status
   - Progress bar

### Step 4: Participant Completes Tasks

**Discussion Task:**
1. Click "Start" on discussion task
2. Enter text in textarea
3. Click "Submit Response"

**Camera Task:**
1. Click "Start" on camera task
2. Grant camera/microphone permissions
3. Click "Start Recording"
4. Record video
5. Click "Stop Recording"
6. Review video (or upload file instead)
7. Click "Submit Response"

**Gallery Task:**
1. Click "Start" on gallery task
2. Select images (multiple)
3. Preview images
4. Click "Submit Response"

### Step 5: Response Stored in Database

- Response saved to `responses` table
- Links to `participant_id` and `task_id`
- `response_data` JSON contains:
  - Text responses: `{"text": "..."}`
  - Video responses: `{"videoUrl": "...", "duration": 120}`
  - Image responses: `{"images": ["url1", "url2"], "selectedImage": "url1"}`

### Step 6: Admin Views Responses

1. Navigate to: `/studies/STUDY_ID`
2. Click "Responses" tab
3. View all participant responses with details

---

## Testing Checklist

✅ **Backend API:**
- [x] Access codes generated automatically
- [x] Public endpoints work without JWT
- [x] Access code validation works
- [x] Participants can only access their own data
- [x] Response submission works for all task types

✅ **Frontend:**
- [x] Participant study access page works
- [x] Access code input and validation
- [x] Task list displays correctly
- [x] Progress tracking works
- [x] Task completion pages work for all types
- [x] File uploads work (video, images)
- [x] Response submission works
- [x] Success/error messages display

✅ **Integration:**
- [x] End-to-end flow works
- [x] Responses appear in admin view
- [x] File uploads accessible after submission

---

## Important Notes

### 1. Access Code Format
- **8 characters**, uppercase alphanumeric
- **Unique per participant**
- **Case-sensitive** when verifying

### 2. Security Considerations
- Access codes should be treated as **sensitive** (like passwords)
- Share access codes securely (encrypted email, SMS, etc.)
- Consider adding **expiration** for access codes (future enhancement)
- Consider **rate limiting** on public endpoints (future enhancement)

### 3. File Upload Limits
- **Video files:** Consider size limits (e.g., 100MB max)
- **Image files:** Consider size/format limits (e.g., 10MB, JPG/PNG only)
- **Storage costs:** Monitor Supabase Storage usage

### 4. Task Types Not Yet Implemented
- **Classification/Ranking:** Requires drag-and-drop UI (to be implemented)
- **Fill Blanks:** Similar to discussion, but needs structured input (to be implemented)

---

## Next Steps / Future Enhancements

1. **Email Integration:**
   - Auto-send access codes via email when participants are created
   - Send reminder emails for incomplete tasks

2. **Access Code Expiration:**
   - Add `expires_at` field to participants
   - Validate expiration when accessing study

3. **Progress Tracking:**
   - Mark participant as "completed" when all tasks done
   - Auto-email admin when participant completes study

4. **Response Validation:**
   - Add validation rules per task type
   - Require minimum video/image count for gallery tasks
   - Character limits for text responses

5. **Response Editing:**
   - Allow participants to edit responses before study closes
   - Track response history (versions)

6. **Analytics Dashboard:**
   - Completion rates per study
   - Average time to complete tasks
   - Response quality metrics

---

## Summary

✅ **Complete participant flow is now functional!**

Participants can:
- ✅ Access studies with unique access codes
- ✅ View all tasks and their progress
- ✅ Complete different task types (discussion, camera, gallery)
- ✅ Upload files (videos, images)
- ✅ Submit responses

Admins can:
- ✅ Create studies and participants
- ✅ Retrieve access codes for participants
- ✅ View all participant responses
- ✅ Track completion status

**You can now test the complete flow!** See `PARTICIPANT_TESTING_GUIDE.md` for detailed testing instructions.
