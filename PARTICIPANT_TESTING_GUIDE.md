# Participant Testing Guide

This guide explains how to test the complete participant flow - from receiving a study invitation to submitting responses.

## Overview

The participant flow consists of:
1. **Admin creates a study** and invites participants
2. **Participants receive access codes** (automatically generated when they're created)
3. **Participants access the study** using their access code
4. **Participants complete tasks** (different types: camera, gallery, discussion, etc.)
5. **Participants submit responses** (text, images, videos)
6. **Admin views responses** in the study detail page

---

## Prerequisites

1. **Backend API running** on `http://127.0.0.1:5000`
2. **Frontend running** on `http://localhost:3000`
3. **Supabase Storage configured** with bucket `participant-uploads`
4. **Database tables** created (studies, tasks, participants, responses)

---

## Step 1: Create a Study and Participants (Admin)

### 1.1 Create a Study

```bash
curl -X POST http://127.0.0.1:5000/studies/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "study": {
      "organization_id": "YOUR_ORG_ID",
      "created_by": "YOUR_USER_ID",
      "name": "Product Feedback Study",
      "objective": "Gather feedback on our new product",
      "study_type": "user_research",
      "status": "active",
      "target_participants": 10,
      "duration_days": 7
    }
  }'
```

Save the `study_id` from the response.

### 1.2 Create Tasks for the Study

```bash
# Task 1: Discussion
curl -X POST http://127.0.0.1:5000/tasks/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "task": {
      "study_id": "YOUR_STUDY_ID",
      "type": "discussion",
      "title": "Tell us about your experience",
      "instructions": "Share your thoughts about the product",
      "order_index": 1
    }
  }'

# Task 2: Camera (Video)
curl -X POST http://127.0.0.1:5000/tasks/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "task": {
      "study_id": "YOUR_STUDY_ID",
      "type": "camera",
      "title": "Record a video review",
      "instructions": "Record yourself explaining your thoughts",
      "order_index": 2
    }
  }'

# Task 3: Gallery (Image Selection)
curl -X POST http://127.0.0.1:5000/tasks/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "task": {
      "study_id": "YOUR_STUDY_ID",
      "type": "gallery",
      "title": "Select your favorite images",
      "instructions": "Choose 3-5 images that represent your experience",
      "order_index": 3
    }
  }'
```

### 1.3 Create Participants

```bash
# Single participant
curl -X POST http://127.0.0.1:5000/participants/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "participant": {
      "study_id": "YOUR_STUDY_ID",
      "contact": "participant@example.com",
      "demographics": {
        "age": 30,
        "gender": "female",
        "location": "New York"
      },
      "status": "invited"
    }
  }'
```

**Important:** The response includes the participant's `access_code`. Save this!

**OR bulk create:**

```bash
curl -X POST http://127.0.0.1:5000/participants/bulk-create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "study_id": "YOUR_STUDY_ID",
    "contacts": ["participant1@example.com", "participant2@example.com"],
    "demographics": {
      "age": 25,
      "gender": "other",
      "location": "San Francisco"
    }
  }'
```

**Note:** Each participant gets a unique `access_code` when created. You'll need to retrieve these codes to give to participants.

### 1.4 Retrieve Participant Access Codes

```bash
curl -X GET "http://127.0.0.1:5000/participants/read?study_id=YOUR_STUDY_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

The response will include all participants with their `access_code` fields.

---

## Step 2: Participant Access (No Auth Required)

### 2.1 Participant Accesses Study via Frontend

1. Navigate to: `http://localhost:3000/participant/YOUR_STUDY_ID`
2. Enter the access code (e.g., `ABC123XY`)
3. Click "Access Study"

**OR via API directly:**

```bash
curl -X GET "http://127.0.0.1:5000/participant/study/YOUR_STUDY_ID?access_code=PARTICIPANT_ACCESS_CODE"
```

This returns:
- Study details
- Participant info
- All tasks (with completion status)
- Existing responses

---

## Step 3: Participant Completes Tasks

### 3.1 Discussion Task (Text Response)

1. Click "Start" on a discussion task
2. Enter text in the textarea
3. Click "Submit Response"

**API call:**
```bash
curl -X POST http://127.0.0.1:5000/participant/submit-response \
  -H "Content-Type: application/json" \
  -d '{
    "access_code": "PARTICIPANT_ACCESS_CODE",
    "task_id": "TASK_ID",
    "response_data": {
      "text": "I really enjoyed using this product. The interface was intuitive and the features were helpful."
    }
  }'
```

### 3.2 Camera Task (Video Response)

1. Click "Start" on a camera task
2. Click "Start Recording" (grants camera/microphone permission)
3. Record your video
4. Click "Stop Recording"
5. Review the video
6. Click "Submit Response"

**OR upload a video file:**
1. Click "Choose File" and select a video
2. Click "Submit Response"

**API call:**
```bash
curl -X POST http://127.0.0.1:5000/participant/submit-response \
  -H "Content-Type: application/json" \
  -d '{
    "access_code": "PARTICIPANT_ACCESS_CODE",
    "task_id": "TASK_ID",
    "response_data": {
      "videoUrl": "https://storage.supabase.co/participant-uploads/...",
      "duration": 120
    }
  }'
```

**Note:** The frontend automatically uploads video files to Supabase Storage and returns the URL.

### 3.3 Gallery Task (Image Selection)

1. Click "Start" on a gallery task
2. Click "Choose File" and select one or more images
3. Images appear as previews
4. Click "Submit Response"

**API call:**
```bash
curl -X POST http://127.0.0.1:5000/participant/submit-response \
  -H "Content-Type: application/json" \
  -d '{
    "access_code": "PARTICIPANT_ACCESS_CODE",
    "task_id": "TASK_ID",
    "response_data": {
      "images": [
        "https://storage.supabase.co/participant-uploads/...",
        "https://storage.supabase.co/participant-uploads/..."
      ],
      "selectedImage": "https://storage.supabase.co/participant-uploads/..."
    }
  }'
```

### 3.4 Collage Task (Creative Assembly)

Similar to gallery, but participants select multiple images to create a collage.

### 3.5 Classification Task (Ranking/Sorting)

This requires a drag-and-drop interface (to be implemented). For now, it's a placeholder.

---

## Step 4: View Responses (Admin)

### 4.1 Via Frontend

1. Navigate to: `http://localhost:3000/studies/YOUR_STUDY_ID`
2. Click the "Responses" tab
3. View all participant responses

### 4.2 Via API

```bash
curl -X GET "http://127.0.0.1:5000/responses/read?study_id=YOUR_STUDY_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## Step 5: Complete Testing Checklist

### ✅ Backend API Tests

- [ ] Create study successfully
- [ ] Create tasks for study
- [ ] Create participants (single and bulk)
- [ ] Access codes are generated automatically
- [ ] Public participant endpoints work without JWT
- [ ] Participant can access study with valid access code
- [ ] Participant can submit text response (discussion)
- [ ] Participant can submit video response (camera)
- [ ] Participant can submit image response (gallery)
- [ ] Invalid access code is rejected
- [ ] Participant can't access other participants' studies
- [ ] Responses are linked to correct participant and task

### ✅ Frontend Tests

- [ ] Participant can enter access code and access study
- [ ] Study overview page shows all tasks
- [ ] Completed tasks are marked as "Completed"
- [ ] Task progress bar shows correct percentage
- [ ] Discussion task: text input works
- [ ] Camera task: video recording works
- [ ] Camera task: video upload works
- [ ] Gallery task: image selection and preview works
- [ ] Gallery task: image upload works
- [ ] Response submission shows success message
- [ ] Error messages display correctly
- [ ] Navigation between pages works

### ✅ File Upload Tests

- [ ] Video files upload to Supabase Storage
- [ ] Image files upload to Supabase Storage
- [ ] Uploaded files are accessible via URL
- [ ] File paths are organized by study/participant
- [ ] Large files are handled correctly (consider size limits)

### ✅ Security Tests

- [ ] Participants can't access other participants' data
- [ ] Access codes are unique per participant
- [ ] Public endpoints reject invalid access codes
- [ ] File uploads are restricted to participant's own folder

---

## Troubleshooting

### Issue: "Invalid access code"

**Solution:**
- Verify the access code is correct (case-sensitive)
- Check that the participant belongs to the study
- Ensure the study status is "active" or "draft"

### Issue: "Task not found"

**Solution:**
- Verify the task_id is correct
- Check that the task belongs to the participant's study

### Issue: File upload fails

**Solution:**
- Check Supabase Storage bucket `participant-uploads` exists
- Verify storage policies allow public uploads (for participants)
- Check file size limits
- Verify Supabase credentials in frontend `.env`

### Issue: Camera/microphone not working

**Solution:**
- Check browser permissions
- Use HTTPS in production (required for media access)
- Test in Chrome/Firefox (better WebRTC support)

---

## Quick Test Script

Here's a complete test script you can run:

```bash
#!/bin/bash

# Configuration
API_URL="http://127.0.0.1:5000"
ADMIN_TOKEN="YOUR_ADMIN_TOKEN"
STUDY_ID=""
PARTICIPANT_ACCESS_CODE=""

# Step 1: Get admin token
echo "Step 1: Getting admin token..."
TOKEN_RESPONSE=$(curl -s -X POST $API_URL/token \
  -H "Content-Type: application/json" \
  -d '{"token": "all"}')
ADMIN_TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.access_token')
echo "Token: $ADMIN_TOKEN"

# Step 2: Create study
echo "Step 2: Creating study..."
STUDY_RESPONSE=$(curl -s -X POST $API_URL/studies/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "study": {
      "organization_id": "YOUR_ORG_ID",
      "created_by": "YOUR_USER_ID",
      "name": "Test Study",
      "status": "active"
    }
  }')
STUDY_ID=$(echo $STUDY_RESPONSE | jq -r '.id')
echo "Study ID: $STUDY_ID"

# Step 3: Create task
echo "Step 3: Creating task..."
TASK_RESPONSE=$(curl -s -X POST $API_URL/tasks/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"task\": {
      \"study_id\": \"$STUDY_ID\",
      \"type\": \"discussion\",
      \"title\": \"Test Task\",
      \"instructions\": \"Answer this question\",
      \"order_index\": 1
    }
  }")
TASK_ID=$(echo $TASK_RESPONSE | jq -r '.id')
echo "Task ID: $TASK_ID"

# Step 4: Create participant
echo "Step 4: Creating participant..."
PARTICIPANT_RESPONSE=$(curl -s -X POST $API_URL/participants/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"participant\": {
      \"study_id\": \"$STUDY_ID\",
      \"contact\": \"test@example.com\",
      \"status\": \"invited\"
    }
  }")
PARTICIPANT_ID=$(echo $PARTICIPANT_RESPONSE | jq -r '.id')
echo "Participant ID: $PARTICIPANT_ID"

# Step 5: Get access code
echo "Step 5: Getting access code..."
PARTICIPANT_DATA=$(curl -s -X GET "$API_URL/participants/read?id=$PARTICIPANT_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
PARTICIPANT_ACCESS_CODE=$(echo $PARTICIPANT_DATA | jq -r '.[0].access_code')
echo "Access Code: $PARTICIPANT_ACCESS_CODE"

# Step 6: Participant accesses study
echo "Step 6: Participant accessing study..."
STUDY_ACCESS=$(curl -s -X GET "$API_URL/participant/study/$STUDY_ID?access_code=$PARTICIPANT_ACCESS_CODE")
echo "Study access response: $STUDY_ACCESS"

# Step 7: Participant submits response
echo "Step 7: Participant submitting response..."
SUBMIT_RESPONSE=$(curl -s -X POST $API_URL/participant/submit-response \
  -H "Content-Type: application/json" \
  -d "{
    \"access_code\": \"$PARTICIPANT_ACCESS_CODE\",
    \"task_id\": \"$TASK_ID\",
    \"response_data\": {
      \"text\": \"This is my test response\"
    }
  }")
echo "Submit response: $SUBMIT_RESPONSE"

echo "Test complete!"
```

---

## Next Steps

1. **Implement Classification/Ranking UI** - Drag-and-drop interface for ranking tasks
2. **Add Progress Tracking** - Show participant progress across all tasks
3. **Email Notifications** - Send access codes via email when participants are created
4. **Response Validation** - Add validation rules for each task type
5. **Response Editing** - Allow participants to edit their responses
6. **Study Completion** - Mark participant as "completed" when all tasks are done
7. **Analytics Dashboard** - Show completion rates and response statistics

---

## Summary

The participant flow is now fully functional:

✅ **Access Control**: Participants use unique access codes  
✅ **Study Access**: Public endpoints allow participants to view their studies  
✅ **Task Completion**: Different task types (discussion, camera, gallery, etc.)  
✅ **File Uploads**: Videos and images upload to Supabase Storage  
✅ **Response Submission**: Participants can submit responses via API or frontend  
✅ **Admin View**: Admins can view all responses in the study detail page  

You can now test the complete flow from participant invitation to response submission!
