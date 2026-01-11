# Study Access Link Analysis

## Current State

### How It Works Now:
1. **Admin creates participants** - Each participant gets a unique `access_code` (8 characters)
2. **Admin shares access code** - Must manually retrieve and share each participant's code
3. **Participant accesses study** - Uses their unique code at `/participant/[studyId]?access_code=ABC123XY`
4. **Participant completes tasks** - Each response is tied to their participant ID

### Current Flow:
```
Admin → Create Study → Create Participants (each gets unique code) → Share codes individually
                                                      ↓
Participant → Enter code → Access study → Complete tasks → Submit responses
```

---

## Proposed Solutions

### Option 1: Study-Level Public Link (Simplest for Testing) ⭐ RECOMMENDED FOR NOW

**Concept:** Generate a single public link per study that anyone can use.

**How it works:**
- Admin clicks "Get Public Link" on study detail page
- System generates/shows: `http://localhost:3000/participant/[studyId]/join?code=STUDY_ACCESS_CODE`
- **Anyone** with this link can access the study
- First time someone uses the link → automatically creates a participant record for them
- Subsequent visits → identifies them by cookie/storage and links to existing participant

**Pros:**
- ✅ **Easiest for testing** - Just share one link
- ✅ **Quick to implement** - Minimal changes needed
- ✅ **Simple UX** - Copy/paste link, done
- ✅ **No pre-registration needed** - Participants can start immediately

**Cons:**
- ⚠️ Less secure - anyone with link can participate (OK for testing, not for production)
- ⚠️ Can't track who's who without additional info (but we can collect email/contact)
- ⚠️ Multiple submissions possible (unless we add duplicate prevention)

**Use Case:** Perfect for **testing, demos, and early prototypes**

---

### Option 2: Study Access Code (Better Balance)

**Concept:** Each study has its own access code, but participants still get individual tracking.

**How it works:**
- Study has a `study_access_code` field (e.g., "STUDY-ABC123")
- Admin shares link: `http://localhost:3000/participant/[studyId]/join?study_code=STUDY-ABC123`
- When participant visits:
  1. If first time → Collects their contact (email/phone) → Creates participant record with unique `access_code`
  2. If returning (by cookie/email) → Links to existing participant
- Each participant still gets individual `access_code` for their own tracking

**Pros:**
- ✅ **Secure** - Only people with study code can access
- ✅ **Trackable** - Each participant still has unique ID
- ✅ **Flexible** - Can require email or make it optional
- ✅ **Prevents duplicates** - Can check by email/contact

**Cons:**
- ⚠️ Still need to collect contact info (adds one step)
- ⚠️ Requires database field for `study_access_code`

**Use Case:** Good for **controlled testing and limited studies**

---

### Option 3: Hybrid - Study Link + Optional Registration

**Concept:** Public link that creates participants on-demand, but allows email collection.

**How it works:**
- Study has `public_access_enabled` flag + optional `study_access_code`
- Link: `http://localhost:3000/participant/[studyId]/join`
- Flow:
  1. If `public_access_enabled = true` → Anyone can access
  2. On first visit → Shows optional form: "Enter email (optional) to save your progress"
  3. Creates participant record (with or without contact)
  4. Stores participant ID in localStorage/cookie
  5. Returns same participant on future visits

**Pros:**
- ✅ **Most flexible** - Works for both public and controlled studies
- ✅ **User-friendly** - Optional registration lowers friction
- ✅ **Trackable if needed** - Can collect contact when desired
- ✅ **Duplicate prevention** - By localStorage/cookie

**Cons:**
- ⚠️ More complex implementation
- ⚠️ Cookie/localStorage can be cleared (loses progress tracking)

**Use Case:** Best for **production and flexible studies**

---

### Option 4: Invitation System (Most Robust)

**Concept:** Admin sends individual invitation links to pre-registered participants.

**How it works:**
- Admin creates participants with emails
- System generates individual invitation links per participant
- Link: `http://localhost:3000/participant/[studyId]/invite?token=UNIQUE_INVITE_TOKEN`
- Token is tied to specific participant (one-time use or reusable)
- Participant clicks link → Auto-authenticated → Can complete study

**Pros:**
- ✅ **Most secure** - Each participant has unique invitation
- ✅ **Best tracking** - Know exactly who participated
- ✅ **Email reminders** - Can send follow-ups
- ✅ **Progress tracking** - Can see completion status per participant

**Cons:**
- ⚠️ Requires pre-registration (can't do walk-ins)
- ⚠️ More complex - need invitation tokens, email system
- ⚠️ Less flexible for testing

**Use Case:** Best for **production studies with known participants**

---

## Recommendation for Your Use Case

### For Testing/Development: **Option 1 (Study-Level Public Link)**

**Why:**
- You want to "test physically like a participant"
- Quick to implement
- No email system needed
- Easy to share (one link)
- Perfect for demos

**Implementation would be:**
1. Add `study_access_code` field to studies table (optional, auto-generated if null)
2. New endpoint: `/studies/[id]/get-access-link` (admin only)
3. New frontend route: `/participant/[studyId]/join?code=STUDY_ACCESS_CODE`
4. On visit with valid code:
   - Check if participant exists (by cookie/localStorage)
   - If not → Create anonymous participant OR prompt for email
   - Store participant ID in localStorage
   - Redirect to study page with participant's `access_code` in URL

**Admin UI Addition:**
- Button on study detail page: "Get Participant Link"
- Shows modal with: `http://localhost:3000/participant/[studyId]/join?code=ABC123XY`
- Copy button to clipboard

---

## Flow Comparison

### Current Flow (Per-Participant Codes):
```
Admin → Create 10 participants → Get 10 different codes → Share individually
Participant 1 → Uses code ABC123XY
Participant 2 → Uses code DEF456ZW
... (10 different codes)
```

### Proposed Flow (Study-Level Link):
```
Admin → Create study → Get ONE link → Share to anyone
Participant 1 → Visits link → Auto-created → Completes study
Participant 2 → Visits link → Auto-created → Completes study
... (one link for all)
```

---

## Implementation Considerations

### What Needs to Change:

1. **Database:**
   - Add `study_access_code` to `studies` table (optional, can be auto-generated)
   - Keep `access_code` on `participants` (for tracking)

2. **Backend:**
   - New endpoint: `POST /studies/[id]/generate-access-link` (admin only)
   - Modify participant creation to support "on-demand" creation from study link
   - New endpoint: `POST /participant/join-study` (public, uses study_access_code)

3. **Frontend:**
   - New page: `/participant/[studyId]/join` - handles study code validation
   - Admin UI: "Get Participant Link" button on study detail page
   - Optional: Email collection form for tracking

4. **Security:**
   - Study access codes should be reasonably secure (e.g., 10-12 characters)
   - Can add expiration dates for study links
   - Can limit number of participants per study
   - Can require study to be "active" status

---

## Questions to Consider

1. **Do you want to track who submitted what?**
   - If yes → Collect email/contact on join
   - If no → Anonymous participants work fine

2. **Should links expire?**
   - For testing → No expiration needed
   - For production → Maybe set expiration date

3. **Can one person submit multiple times?**
   - For testing → Allow it (easier to test)
   - For production → Prevent duplicates (check by email/cookie)

4. **Should study link be one-time use per person?**
   - First visit creates participant → Second visit shows "already completed"
   - OR allow editing responses

---

## My Recommendation

**Start with Option 1 (Study-Level Public Link)** for these reasons:

1. ✅ **Fastest to implement** - Minimal changes
2. ✅ **Easiest to test** - One link, works immediately
3. ✅ **Good for demos** - Share link with stakeholders
4. ✅ **Can evolve later** - Easy to add email collection or security later
5. ✅ **Fits your use case** - "test physically like a participant"

**Implementation Order:**
1. Add `study_access_code` to studies (auto-generate if null)
2. Create `/participant/[studyId]/join` page that accepts study code
3. Auto-create participant on first visit (store in localStorage)
4. Add "Get Link" button to admin study detail page
5. Later: Add optional email collection for tracking

**Would you like me to implement Option 1, or do you prefer a different approach?**
