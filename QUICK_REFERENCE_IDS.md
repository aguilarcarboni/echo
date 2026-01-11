# Quick Reference: How to Find Organization and User IDs

If you need to manually find organization_id and user_id (for example, when testing with curl), here are the methods:

---

## Method 1: Using the Test Script (Recommended)

The `test_participant_flow.sh` script now **automatically handles this** for you! It will:

1. ✅ Check for existing organizations and use the first one
2. ✅ Create a test organization if none exists
3. ✅ Check for existing users in that organization
4. ✅ Create a test user if none exists

**Just run:**
```bash
./test_participant_flow.sh
```

**You don't need to enter anything** - it will handle everything automatically!

---

## Method 2: Using API Calls (Manual)

### Step 1: Get Admin Token

```bash
TOKEN_RESPONSE=$(curl -s -X POST http://127.0.0.1:5000/token \
  -H "Content-Type: application/json" \
  -d '{"token": "all"}')

# Extract token
TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.access_token')
# OR without jq:
TOKEN=$(echo $TOKEN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))")
```

### Step 2: Get Existing Organizations

```bash
curl -X GET "http://127.0.0.1:5000/organizations/read" \
  -H "Authorization: Bearer $TOKEN"
```

**Response example:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "My Organization",
    "created_at": "2024-01-01 12:00:00",
    "updated_at": "2024-01-01 12:00:00"
  }
]
```

**Extract organization_id:**
```bash
ORG_ID="550e8400-e29b-41d4-a716-446655440000"
```

### Step 3: Get Existing Users

```bash
curl -X GET "http://127.0.0.1:5000/users/read?organization_id=$ORG_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**Response example:**
```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "organization_id": "550e8400-e29b-41d4-a716-446655440000",
    "role": "admin",
    "created_at": "2024-01-01 12:00:00",
    "updated_at": "2024-01-01 12:00:00"
  }
]
```

**Extract user_id:**
```bash
USER_ID="660e8400-e29b-41d4-a716-446655440000"
```

---

## Method 3: Create New Organization and User

If you don't have any organizations or users yet, create them:

### Create Organization

```bash
curl -X POST http://127.0.0.1:5000/organizations/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "organization": {
      "name": "My Test Organization"
    }
  }'
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Organization created successfully"
}
```

### Create User

```bash
curl -X POST http://127.0.0.1:5000/users/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "user": {
      "email": "test@example.com",
      "organization_id": "550e8400-e29b-41d4-a716-446655440000",
      "role": "admin"
    }
  }'
```

**Response:**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "message": "User created successfully"
}
```

---

## Method 4: Using Database Directly (Advanced)

If you have direct database access:

```sql
-- Get all organizations
SELECT id, name FROM organizations;

-- Get all users in an organization
SELECT id, email, organization_id FROM users 
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000';
```

---

## Summary

**For automated testing:** Use `./test_participant_flow.sh` - it handles everything automatically!

**For manual testing:** 
1. Get token from `/token` endpoint
2. List organizations with `/organizations/read`
3. List users with `/users/read?organization_id=...`
4. Or create new ones if needed

**The script now does all of this for you automatically!** 🎉
