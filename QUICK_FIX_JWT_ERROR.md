# Quick Fix: "Not enough segments" JWT Error

## Problem

You're getting this error when trying to use admin API endpoints:
```json
{
  "msg": "Not enough segments"
}
```

This means you're missing or have an invalid JWT token in your request.

---

## Solution: Get a Token First

### Step 1: Get Admin Token

```bash
curl -X POST http://127.0.0.1:5000/token \
  -H "Content-Type: application/json" \
  -d '{"token": "all"}'
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "expires_in": 3600
}
```

### Step 2: Copy the `access_token` value

### Step 3: Use it in your requests

```bash
# Replace YOUR_TOKEN_HERE with the actual token
curl -X POST http://127.0.0.1:5000/studies/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "study": {
      "organization_id": "YOUR_ORG_ID",
      "created_by": "YOUR_USER_ID",
      "name": "Test Study",
      "status": "active"
    }
  }'
```

---

## Complete Example

Here's a working example that gets a token and uses it:

```bash
# Step 1: Get token
TOKEN_RESPONSE=$(curl -s -X POST http://127.0.0.1:5000/token \
  -H "Content-Type: application/json" \
  -d '{"token": "all"}')

# Extract token (requires jq or use grep)
TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.access_token')
# OR without jq:
TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# Step 2: Use token
curl -X POST http://127.0.0.1:5000/studies/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "study": {
      "organization_id": "00000000-0000-0000-0000-000000000000",
      "created_by": "00000000-0000-0000-0000-000000000000",
      "name": "Test Study",
      "status": "active"
    }
  }'
```

---

## Common Issues

### Issue 1: Token is missing from request

**Symptom:** Getting "Not enough segments" error

**Fix:** Make sure you include the `Authorization` header:
```bash
-H "Authorization: Bearer YOUR_TOKEN"
```

### Issue 2: Token format is wrong

**Symptom:** Getting "Not enough segments" error

**Fix:** Make sure the token is directly after "Bearer " (no extra spaces):
```bash
# ❌ Wrong
-H "Authorization: Bearer  YOUR_TOKEN"  # Extra space

# ✅ Correct
-H "Authorization: Bearer YOUR_TOKEN"
```

### Issue 3: Token expired

**Symptom:** Getting "Token has expired" error

**Fix:** Get a new token (tokens expire after 1 hour)

### Issue 4: Using participant endpoints with admin token

**Symptom:** Trying to use participant endpoints (like `/participant/study/...`) with admin token

**Fix:** Participant endpoints don't need tokens! They use `access_code` instead:
```bash
# ✅ Correct - No token needed, uses access_code
curl -X GET "http://127.0.0.1:5000/participant/study/STUDY_ID?access_code=ABC123XY"

# ❌ Wrong - Don't use Authorization header for participant endpoints
curl -X GET "http://127.0.0.1:5000/participant/study/STUDY_ID?access_code=ABC123XY" \
  -H "Authorization: Bearer TOKEN"  # Not needed!
```

---

## Automated Script

I've created a script that handles token management automatically:

```bash
# Run the test script
./test_participant_flow.sh
```

This script will:
1. ✅ Get a token automatically
2. ✅ Create a study
3. ✅ Create tasks
4. ✅ Create a participant
5. ✅ Get the access code
6. ✅ Show you the participant URL

---

## Quick Reference

### Admin Endpoints (Need Token)
- `POST /studies/create` - Need token
- `POST /tasks/create` - Need token
- `POST /participants/create` - Need token
- `GET /participants/read` - Need token
- `GET /responses/read` - Need token

### Participant Endpoints (No Token, Use Access Code)
- `GET /participant/study/STUDY_ID?access_code=...` - No token needed
- `GET /participant/task/TASK_ID?access_code=...` - No token needed
- `POST /participant/submit-response` - No token needed (access_code in body)
- `GET /participant/my-responses?access_code=...` - No token needed

### Public Endpoints (No Token)
- `POST /token` - Public (gets you a token)

---

## Still Having Issues?

1. **Check API is running:**
   ```bash
   curl http://127.0.0.1:5000/
   # Should return: {"title": "api"}
   ```

2. **Check token endpoint works:**
   ```bash
   curl -X POST http://127.0.0.1:5000/token \
     -H "Content-Type: application/json" \
     -d '{"token": "all"}'
   ```

3. **Check your token format:**
   ```bash
   # Token should look like: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTY...
   # Should have 3 parts separated by dots: header.payload.signature
   ```

4. **Verify Authorization header:**
   ```bash
   # Check if header is being sent correctly
   curl -v -X POST http://127.0.0.1:5000/studies/create \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"study": {...}}'
   # Look for "Authorization: Bearer ..." in the output
   ```
