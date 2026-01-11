#!/bin/bash

# Echo Participant Flow Testing Script
# This script helps you test the complete participant flow

API_URL="http://127.0.0.1:5000"

echo "=========================================="
echo "Echo Participant Flow Testing Script"
echo "=========================================="
echo ""

# Step 1: Get Admin Token
echo "Step 1: Getting admin authentication token..."
TOKEN_RESPONSE=$(curl -s -X POST $API_URL/token \
  -H "Content-Type: application/json" \
  -d '{"token": "all"}')

# Check if response contains error
if echo "$TOKEN_RESPONSE" | grep -q "error\|Error\|ERROR"; then
    echo "❌ Failed to get token. Response: $TOKEN_RESPONSE"
    echo ""
    echo "Make sure:"
    echo "  1. API server is running on $API_URL"
    echo "  2. The /token endpoint is accessible"
    exit 1
fi

# Try to extract token using different methods
# Method 1: Use jq if available (most reliable)
if command -v jq &> /dev/null; then
    ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token // empty' 2>/dev/null)
fi

# Method 2: Use Python if jq not available (Python is usually available)
if [ -z "$ACCESS_TOKEN" ] && command -v python3 &> /dev/null; then
    ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))" 2>/dev/null)
fi

# Method 3: Use grep with better pattern (fallback)
if [ -z "$ACCESS_TOKEN" ]; then
    # Remove newlines and whitespace, then extract token
    CLEANED=$(echo "$TOKEN_RESPONSE" | tr -d '\n' | tr -d ' ')
    ACCESS_TOKEN=$(echo "$CLEANED" | grep -oP '"access_token":"\K[^"]*' 2>/dev/null || \
                   echo "$CLEANED" | sed -n 's/.*"access_token":"\([^"]*\).*/\1/p')
fi

# Method 4: Manual extraction as last resort
if [ -z "$ACCESS_TOKEN" ]; then
    # Try to find token between quotes
    ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | sed -n 's/.*"access_token"[[:space:]]*:[[:space:]]*"\([^"]*\).*/\1/p')
fi

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ Failed to extract token from response."
    echo "Response received: $TOKEN_RESPONSE"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check if response is valid JSON"
    echo "  2. Install jq for better JSON parsing: brew install jq (macOS) or apt-get install jq (Linux)"
    echo "  3. Make sure API is returning the correct format"
    exit 1
fi

echo "✅ Token received: ${ACCESS_TOKEN:0:20}..."
echo ""

# Step 2: Create or Get Organization and User
echo "Step 2: Setting up organization and user..."
echo ""

# Try to get existing organizations first
ORGS_RESPONSE=$(curl -s -X GET "$API_URL/organizations/read" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if command -v jq &> /dev/null; then
    ORG_COUNT=$(echo "$ORGS_RESPONSE" | jq 'length' 2>/dev/null || echo "0")
elif command -v python3 &> /dev/null; then
    ORG_COUNT=$(echo "$ORGS_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data) if isinstance(data, list) else 0)" 2>/dev/null || echo "0")
else
    ORG_COUNT=$(echo "$ORGS_RESPONSE" | grep -o '"id"' | wc -l | tr -d ' ')
fi

if [ "$ORG_COUNT" -gt 0 ]; then
    echo "Found existing organizations. Using the first one..."
    if command -v jq &> /dev/null; then
        ORG_ID=$(echo "$ORGS_RESPONSE" | jq -r '.[0].id // empty' 2>/dev/null)
        ORG_NAME=$(echo "$ORGS_RESPONSE" | jq -r '.[0].name // "Unknown"' 2>/dev/null)
    elif command -v python3 &> /dev/null; then
        ORG_ID=$(echo "$ORGS_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0].get('id', '') if isinstance(data, list) and len(data) > 0 else '')" 2>/dev/null)
        ORG_NAME=$(echo "$ORGS_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0].get('name', 'Unknown') if isinstance(data, list) and len(data) > 0 else 'Unknown')" 2>/dev/null)
    else
        ORG_ID=$(echo "$ORGS_RESPONSE" | sed -n 's/.*"id"[[:space:]]*:[[:space:]]*"\([^"]*\).*/\1/p' | head -1)
        ORG_NAME="Existing Organization"
    fi
    
    if [ ! -z "$ORG_ID" ]; then
        echo "✅ Using organization: $ORG_NAME ($ORG_ID)"
    fi
fi

# Create organization if none exists
if [ -z "$ORG_ID" ] || [ "$ORG_COUNT" -eq 0 ]; then
    echo "No existing organizations found. Creating a test organization..."
    ORG_RESPONSE=$(curl -s -X POST $API_URL/organizations/create \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -d "{
        \"organization\": {
          \"name\": \"Test Organization $(date +%Y%m%d_%H%M%S)\"
        }
      }")
    
    if command -v jq &> /dev/null; then
        ORG_ID=$(echo "$ORG_RESPONSE" | jq -r '.id // empty' 2>/dev/null)
    elif command -v python3 &> /dev/null; then
        ORG_ID=$(echo "$ORG_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null)
    else
        ORG_ID=$(echo "$ORG_RESPONSE" | sed -n 's/.*"id"[[:space:]]*:[[:space:]]*"\([^"]*\).*/\1/p')
    fi
    
    if [ -z "$ORG_ID" ]; then
        echo "❌ Failed to create organization. Response: $ORG_RESPONSE"
        exit 1
    fi
    echo "✅ Created organization with ID: $ORG_ID"
fi

# Try to get existing users for this organization
USERS_RESPONSE=$(curl -s -X GET "$API_URL/users/read?organization_id=$ORG_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if command -v jq &> /dev/null; then
    USER_COUNT=$(echo "$USERS_RESPONSE" | jq 'length' 2>/dev/null || echo "0")
elif command -v python3 &> /dev/null; then
    USER_COUNT=$(echo "$USERS_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data) if isinstance(data, list) else 0)" 2>/dev/null || echo "0")
else
    USER_COUNT=$(echo "$USERS_RESPONSE" | grep -o '"id"' | wc -l | tr -d ' ')
fi

if [ "$USER_COUNT" -gt 0 ]; then
    echo "Found existing users in organization. Using the first one..."
    if command -v jq &> /dev/null; then
        USER_ID=$(echo "$USERS_RESPONSE" | jq -r '.[0].id // empty' 2>/dev/null)
        USER_EMAIL=$(echo "$USERS_RESPONSE" | jq -r '.[0].email // "Unknown"' 2>/dev/null)
    elif command -v python3 &> /dev/null; then
        USER_ID=$(echo "$USERS_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0].get('id', '') if isinstance(data, list) and len(data) > 0 else '')" 2>/dev/null)
        USER_EMAIL=$(echo "$USERS_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0].get('email', 'Unknown') if isinstance(data, list) and len(data) > 0 else 'Unknown')" 2>/dev/null)
    else
        USER_ID=$(echo "$USERS_RESPONSE" | sed -n 's/.*"id"[[:space:]]*:[[:space:]]*"\([^"]*\).*/\1/p' | head -1)
        USER_EMAIL="Existing User"
    fi
    
    if [ ! -z "$USER_ID" ]; then
        echo "✅ Using user: $USER_EMAIL ($USER_ID)"
    fi
fi

# Create user if none exists
if [ -z "$USER_ID" ] || [ "$USER_COUNT" -eq 0 ]; then
    echo "No existing users found. Creating a test user..."
    USER_EMAIL="test-user-$(date +%s)@echo-test.local"
    USER_RESPONSE=$(curl -s -X POST $API_URL/users/create \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -d "{
        \"user\": {
          \"email\": \"$USER_EMAIL\",
          \"organization_id\": \"$ORG_ID\",
          \"role\": \"admin\"
        }
      }")
    
    if command -v jq &> /dev/null; then
        USER_ID=$(echo "$USER_RESPONSE" | jq -r '.id // empty' 2>/dev/null)
    elif command -v python3 &> /dev/null; then
        USER_ID=$(echo "$USER_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null)
    else
        USER_ID=$(echo "$USER_RESPONSE" | sed -n 's/.*"id"[[:space:]]*:[[:space:]]*"\([^"]*\).*/\1/p')
    fi
    
    if [ -z "$USER_ID" ]; then
        echo "❌ Failed to create user. Response: $USER_RESPONSE"
        exit 1
    fi
    echo "✅ Created user with ID: $USER_ID ($USER_EMAIL)"
fi

echo ""

# Step 3: Create Study (renumbered from Step 2)
echo "Step 3: Creating a test study..."

STUDY_RESPONSE=$(curl -s -X POST $API_URL/studies/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"study\": {
      \"organization_id\": \"$ORG_ID\",
      \"created_by\": \"$USER_ID\",
      \"name\": \"Test Study - $(date +%Y%m%d_%H%M%S)\",
      \"objective\": \"Testing participant flow\",
      \"study_type\": \"user_research\",
      \"status\": \"active\",
      \"target_participants\": 10,
      \"duration_days\": 7
    }
  }")

# Extract study ID using multiple methods
if command -v jq &> /dev/null; then
    STUDY_ID=$(echo "$STUDY_RESPONSE" | jq -r '.id // empty' 2>/dev/null)
elif command -v python3 &> /dev/null; then
    STUDY_ID=$(echo "$STUDY_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null)
else
    STUDY_ID=$(echo "$STUDY_RESPONSE" | sed -n 's/.*"id"[[:space:]]*:[[:space:]]*"\([^"]*\).*/\1/p')
fi

if [ -z "$STUDY_ID" ]; then
    echo "❌ Failed to create study. Response: $STUDY_RESPONSE"
    exit 1
fi

echo "✅ Study created with ID: $STUDY_ID"
echo ""

# Step 4: Create Tasks
echo "Step 4: Creating tasks..."

# Task 1: Discussion
TASK1_RESPONSE=$(curl -s -X POST $API_URL/tasks/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"task\": {
      \"study_id\": \"$STUDY_ID\",
      \"type\": \"discussion\",
      \"title\": \"Tell us about your experience\",
      \"instructions\": \"Share your thoughts in a few sentences\",
      \"order_index\": 1
    }
  }")
# Extract task IDs
if command -v jq &> /dev/null; then
    TASK1_ID=$(echo "$TASK1_RESPONSE" | jq -r '.id // empty' 2>/dev/null)
elif command -v python3 &> /dev/null; then
    TASK1_ID=$(echo "$TASK1_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null)
else
    TASK1_ID=$(echo "$TASK1_RESPONSE" | sed -n 's/.*"id"[[:space:]]*:[[:space:]]*"\([^"]*\).*/\1/p')
fi
echo "✅ Task 1 (Discussion) created: $TASK1_ID"

# Task 2: Camera
TASK2_RESPONSE=$(curl -s -X POST $API_URL/tasks/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"task\": {
      \"study_id\": \"$STUDY_ID\",
      \"type\": \"camera\",
      \"title\": \"Record a video review\",
      \"instructions\": \"Record a short video explaining your thoughts\",
      \"order_index\": 2
    }
  }")

if command -v jq &> /dev/null; then
    TASK2_ID=$(echo "$TASK2_RESPONSE" | jq -r '.id // empty' 2>/dev/null)
elif command -v python3 &> /dev/null; then
    TASK2_ID=$(echo "$TASK2_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null)
else
    TASK2_ID=$(echo "$TASK2_RESPONSE" | sed -n 's/.*"id"[[:space:]]*:[[:space:]]*"\([^"]*\).*/\1/p')
fi
echo "✅ Task 2 (Camera) created: $TASK2_ID"
echo ""

# Step 5: Create Participant
echo "Step 5: Creating participant..."
read -p "Enter participant email (or press Enter for default): " PARTICIPANT_EMAIL
if [ -z "$PARTICIPANT_EMAIL" ]; then
    PARTICIPANT_EMAIL="test-participant-$(date +%s)@example.com"
fi

PARTICIPANT_RESPONSE=$(curl -s -X POST $API_URL/participants/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"participant\": {
      \"study_id\": \"$STUDY_ID\",
      \"contact\": \"$PARTICIPANT_EMAIL\",
      \"demographics\": {
        \"age\": 30,
        \"gender\": \"other\",
        \"location\": \"Test Location\"
      },
      \"status\": \"invited\"
    }
  }")

# Extract participant ID
if command -v jq &> /dev/null; then
    PARTICIPANT_ID=$(echo "$PARTICIPANT_RESPONSE" | jq -r '.id // empty' 2>/dev/null)
elif command -v python3 &> /dev/null; then
    PARTICIPANT_ID=$(echo "$PARTICIPANT_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null)
else
    PARTICIPANT_ID=$(echo "$PARTICIPANT_RESPONSE" | sed -n 's/.*"id"[[:space:]]*:[[:space:]]*"\([^"]*\).*/\1/p')
fi

if [ -z "$PARTICIPANT_ID" ]; then
    echo "❌ Failed to create participant. Response: $PARTICIPANT_RESPONSE"
    exit 1
fi

echo "✅ Participant created with ID: $PARTICIPANT_ID"
echo ""

# Step 6: Get Access Code
echo "Step 6: Retrieving participant access code..."
PARTICIPANT_DATA=$(curl -s -X GET "$API_URL/participants/read?id=$PARTICIPANT_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

# Extract access_code using multiple methods
if command -v jq &> /dev/null; then
    # If response is an array, get first element
    ACCESS_CODE=$(echo "$PARTICIPANT_DATA" | jq -r 'if type=="array" then .[0].access_code // empty else .access_code // empty end' 2>/dev/null)
elif command -v python3 &> /dev/null; then
    ACCESS_CODE=$(echo "$PARTICIPANT_DATA" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if isinstance(data, list) and len(data) > 0:
        print(data[0].get('access_code', ''))
    elif isinstance(data, dict):
        print(data.get('access_code', ''))
    else:
        print('')
except:
    print('')
" 2>/dev/null)
else
    # Fallback: Try to find access_code in response
    ACCESS_CODE=$(echo "$PARTICIPANT_DATA" | sed -n 's/.*"access_code"[[:space:]]*:[[:space:]]*"\([^"]*\).*/\1/p' | head -1)
fi

if [ -z "$ACCESS_CODE" ]; then
    echo "⚠️  Could not extract access_code. You may need to check the database directly."
    echo "   Participant data: $PARTICIPANT_DATA"
    echo ""
    echo "   Troubleshooting:"
    echo "   1. Make sure you've run the database migration:"
    echo "      ALTER TABLE participants ADD COLUMN IF NOT EXISTS access_code TEXT UNIQUE;"
    echo "   2. Check if participant was created with access_code"
    echo "   3. Try installing jq for better JSON parsing: brew install jq (macOS)"
else
    echo "✅ Access Code: $ACCESS_CODE"
fi

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Study ID: $STUDY_ID"
echo "Participant ID: $PARTICIPANT_ID"
if [ ! -z "$ACCESS_CODE" ]; then
    echo "Access Code: $ACCESS_CODE"
    echo ""
    echo "Participant can now access the study at:"
    echo "  Frontend: http://localhost:3000/participant/$STUDY_ID?access_code=$ACCESS_CODE"
    echo "  API: $API_URL/participant/study/$STUDY_ID?access_code=$ACCESS_CODE"
fi
echo ""
echo "To test participant access:"
echo "  curl -X GET \"$API_URL/participant/study/$STUDY_ID?access_code=$ACCESS_CODE\""
echo ""
