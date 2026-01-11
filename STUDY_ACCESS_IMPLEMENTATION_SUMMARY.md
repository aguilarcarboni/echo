# Study Access Link Implementation - Summary

## ✅ What Has Been Implemented

### Backend Changes

1. **Database Model Updated** ✅
   - Added `study_access_code` field to `Study` model in `supabase.py`
   - Field is unique, nullable, for participant registration links

2. **Studies Component Enhanced** ✅
   - Auto-generates `study_access_code` when creating studies (10 characters)
   - New function: `get_or_generate_study_access_code()` to retrieve/generate code

3. **New Admin Endpoint** ✅
   - `GET /studies/<study_id>/access-link` (admin only)
   - Returns study access code and full registration URL
   - Generates code if it doesn't exist

4. **New Public Endpoint** ✅
   - `POST /participant/join-study` (public, no JWT)
   - Accepts: `study_id`, `study_access_code`, `email`, `demographics`
   - Validates study code
   - Checks if participant exists (by email + study_id)
   - Creates participant if new, returns existing if already registered
   - Returns participant `access_code` for study access

### Frontend Changes

1. **Registration Form Page** ✅
   - New page: `/participant/[studyId]/join`
   - Accepts `code` query parameter (study_access_code)
   - Beautiful form using your UI components:
     - Email (required, validated)
     - Age (optional, number)
     - Gender (optional, select)
     - Location (optional, text)
   - Validates study code
   - Creates participant on submit
   - Redirects to study with participant access_code

2. **Admin Study Detail Page** ✅
   - Added "Get Participant Link" button
   - Client component: `ParticipantLinkButton`
   - Dialog modal shows:
     - Study access code
     - Full registration URL
     - Copy buttons for both

3. **API Functions** ✅
   - `getStudyAccessLink(studyId)` - Get study registration link (admin)
   - `joinStudy(studyId, code, email, demographics)` - Register for study (public)

---

## ⚠️ What You Need to Do

### Step 1: Database Migration (REQUIRED)

**Run this SQL in Supabase SQL Editor:**

```sql
-- Add study_access_code column to studies table
ALTER TABLE studies 
ADD COLUMN IF NOT EXISTS study_access_code TEXT UNIQUE;

-- Generate access codes for existing studies
UPDATE studies
SET study_access_code = UPPER(SUBSTRING(ENCODE(GEN_RANDOM_BYTES(8), 'base64') FROM 1 FOR 10))
WHERE study_access_code IS NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_studies_access_code ON studies(study_access_code);
```

**File:** `ADD_STUDY_ACCESS_CODE_COLUMN.sql` (already created for you)

### Step 2: Restart API Server

**IMPORTANT:** After adding the database column, restart your API server so the model changes take effect.

```bash
cd api
python run.py
```

### Step 3: Restart Frontend (Optional)

If you see TypeScript errors about `participant-link-button`, restart the Next.js dev server:

```bash
cd frontend
npm run dev
# or
yarn dev
```

---

## 📋 Complete Flow

### Admin Flow:

1. **Admin navigates to study detail page:** `/studies/[studyId]`
2. **Clicks "Get Participant Link" button**
3. **Modal shows:**
   ```
   Study Access Code: ABC123XYZW
   Participant Registration Link: 
   http://localhost:3000/participant/[studyId]/join?code=ABC123XYZW
   ```
4. **Admin copies link** → Shares with participants

### Participant Flow:

1. **Participant receives link:** 
   `http://localhost:3000/participant/[studyId]/join?code=ABC123XYZW`
   
2. **Clicks link** → Lands on registration form
   - Form validates study code automatically
   - Shows fields: Email (req), Age, Gender, Location (all optional except email)
   
3. **Participant fills form** → Submits
   - Backend validates study code
   - Checks if participant already exists (by email)
   - Creates new participant OR returns existing
   - Generates participant `access_code`
   
4. **System redirects to study:**
   `/participant/[studyId]?access_code=PARTICIPANT_CODE`
   
5. **Participant accesses study** → Completes tasks → Submits responses

---

## 🧪 Testing Instructions

### Test 1: Get Study Access Link (Admin)

1. Start API server and frontend
2. Login as admin
3. Navigate to any study: `/studies/[studyId]`
4. Click "Get Participant Link" button
5. **Expected:** Modal shows with study access code and registration URL

### Test 2: Participant Registration

1. Copy the registration link from Test 1
2. Open in new browser/incognito window
3. **Expected:** Registration form appears with study code pre-filled
4. Fill form:
   - Email: `test@example.com` (required)
   - Age: `30` (optional)
   - Gender: `female` (optional)
   - Location: `New York` (optional)
5. Click "Join Study"
6. **Expected:** Redirected to study page with access_code in URL

### Test 3: Duplicate Registration

1. Use same email to register again
2. **Expected:** Returns existing participant (doesn't create duplicate)
3. Redirects to study with existing access_code

### Test 4: Complete Flow

1. Register as participant (Test 2)
2. Complete a task (e.g., discussion)
3. Submit response
4. **Expected:** Response saved and linked to participant
5. Admin view: `/studies/[studyId]` → Responses tab
6. **Expected:** See response from participant

---

## 🔍 What to Check if Something Doesn't Work

### Issue: "Table 'studies' has extra columns in model: {'study_access_code'}"

**Fix:** Add the column to database (see Step 1 above), then restart API server

### Issue: "Invalid study access code"

**Check:**
- Study code in URL matches study's `study_access_code` in database
- Study status is 'active' or 'draft'
- Study exists and is accessible

### Issue: TypeScript error about participant-link-button

**Fix:** 
- Restart Next.js dev server
- Check file exists: `frontend/src/app/studies/[id]/participant-link-button.tsx`
- Verify 'use client' directive at top of file

### Issue: "Failed to get participant link"

**Check:**
- API server is running
- Admin is authenticated (has valid JWT token)
- Study ID is correct

---

## 📝 Next Steps (Future Enhancements)

### Phase 2: Enhancements (Optional)

1. **Email Collection as Optional:**
   - Make email optional for anonymous participation
   - Use localStorage/cookie to track participants

2. **Form Customization:**
   - Allow admin to configure which demographics to collect per study
   - Add custom fields (company, role, industry, etc.)

3. **Link Expiration:**
   - Add `link_expires_at` to studies
   - Validate expiration when joining

4. **Participant Limits:**
   - Enforce `target_participants` limit
   - Reject registration if study is full

5. **Email Notifications:**
   - Send confirmation email when participant registers
   - Send reminder emails for incomplete studies

---

## Summary

✅ **Complete implementation of Option A (Custom Form)** is done!

**What works:**
- Admin can get study registration link
- Participants can register with email + demographics
- Participants automatically get access_code
- Participants can complete study tasks
- Admin can view responses

**What you need to do:**
1. ✅ Run database migration (add `study_access_code` column)
2. ✅ Restart API server
3. ✅ Test the complete flow

**You're ready to test!** 🎉
