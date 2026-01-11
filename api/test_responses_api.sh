#!/bin/bash

# Test script for responses API endpoints
# Make sure your Flask server is running: cd api && python run.py

API_URL="http://localhost:5000"

echo "=== Testing Responses API Endpoints ==="
echo ""

# Step 1: Get authentication token
echo "Step 1: Getting authentication token..."
TOKEN_RESPONSE=$(curl -s -X POST ${API_URL}/token \
  -H "Content-Type: application/json" \
  -d '{"token": "all"}')

TOKEN=$(echo $TOKEN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get token. Make sure the server is running."
    echo "Response: $TOKEN_RESPONSE"
    exit 1
fi

echo "✅ Token obtained: ${TOKEN:0:30}..."
echo ""

# Step 2: Get a study_id, participant_id, and task_id
echo "Step 2: Getting IDs for testing..."
STUDY_ID="451ac7d9-ac27-4229-9537-22214779443a"

# Get participant_id
PARTICIPANTS_RESPONSE=$(curl -s -X GET "${API_URL}/participants/read?study_id=${STUDY_ID}" \
  -H "Authorization: Bearer ${TOKEN}")

PARTICIPANT_ID=$(echo $PARTICIPANTS_RESPONSE | python3 -c "import sys, json; data = json.load(sys.stdin); print(data[0]['id'] if data and len(data) > 0 else '')" 2>/dev/null)

# Get task_id
TASKS_RESPONSE=$(curl -s -X GET "${API_URL}/tasks/read?study_id=${STUDY_ID}" \
  -H "Authorization: Bearer ${TOKEN}")

TASK_ID=$(echo $TASKS_RESPONSE | python3 -c "import sys, json; data = json.load(sys.stdin); print(data[0]['id'] if data and len(data) > 0 else '')" 2>/dev/null)

if [ -z "$PARTICIPANT_ID" ]; then
    echo "⚠️  No participants found for study. Creating one..."
    CREATE_PARTICIPANT_RESPONSE=$(curl -s -X POST ${API_URL}/participants/create \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${TOKEN}" \
      -d "{
        \"participant\": {
          \"study_id\": \"${STUDY_ID}\",
          \"contact\": \"test-participant-$(date +%s)@example.com\"
        }
      }")
    PARTICIPANT_ID=$(echo $CREATE_PARTICIPANT_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
    echo "✅ Created participant: ${PARTICIPANT_ID}"
fi

if [ -z "$TASK_ID" ]; then
    echo "⚠️  No tasks found for study. Creating one..."
    CREATE_TASK_RESPONSE=$(curl -s -X POST ${API_URL}/tasks/create \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${TOKEN}" \
      -d "{
        \"task\": {
          \"study_id\": \"${STUDY_ID}\",
          \"type\": \"discussion\",
          \"title\": \"Test Task for Responses\",
          \"instructions\": \"Please respond to this test task\"
        }
      }")
    TASK_ID=$(echo $CREATE_TASK_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
    echo "✅ Created task: ${TASK_ID}"
fi

if [ -z "$PARTICIPANT_ID" ] || [ -z "$TASK_ID" ]; then
    echo "❌ Could not get or create participant_id and task_id"
    exit 1
fi

echo "✅ Study ID: ${STUDY_ID}"
echo "✅ Participant ID: ${PARTICIPANT_ID}"
echo "✅ Task ID: ${TASK_ID}"
echo ""

# Step 3: Test CREATE - Text response
echo "Step 3: Testing CREATE endpoint (text response)..."
CREATE_RESPONSE=$(curl -s -X POST ${API_URL}/responses/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{
    \"response\": {
      \"participant_id\": \"${PARTICIPANT_ID}\",
      \"task_id\": \"${TASK_ID}\",
      \"response_data\": {
        \"text\": \"This is a test response. I love this product!\"
      }
    }
  }")

echo "Response:"
echo "$CREATE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CREATE_RESPONSE"

RESPONSE_ID=$(echo $CREATE_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null)

if [ -z "$RESPONSE_ID" ]; then
    echo "❌ Failed to create response"
    exit 1
fi

echo "✅ Created response with ID: ${RESPONSE_ID}"
echo ""

# Step 4: Test READ - Get all responses for participant
echo "Step 4: Testing READ endpoint (filter by participant_id)..."
READ_RESPONSE=$(curl -s -X GET "${API_URL}/responses/read?participant_id=${PARTICIPANT_ID}" \
  -H "Authorization: Bearer ${TOKEN}")

echo "Responses for participant:"
echo "$READ_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$READ_RESPONSE"
echo ""

# Step 5: Test READ - Get responses by task_id
echo "Step 5: Testing READ endpoint (filter by task_id)..."
READ_BY_TASK=$(curl -s -X GET "${API_URL}/responses/read?task_id=${TASK_ID}" \
  -H "Authorization: Bearer ${TOKEN}")

echo "Responses for task:"
echo "$READ_BY_TASK" | python3 -m json.tool 2>/dev/null || echo "$READ_BY_TASK"
echo ""

# Step 6: Test UPDATE
echo "Step 6: Testing UPDATE endpoint..."
UPDATE_RESPONSE=$(curl -s -X POST ${API_URL}/responses/update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{
    \"id\": \"${RESPONSE_ID}\",
    \"data\": {
      \"response_data\": {
        \"text\": \"Updated response text - I really love this product now!\"
      }
    }
  }")

echo "Update response:"
echo "$UPDATE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$UPDATE_RESPONSE"
echo ""

# Step 7: Verify update worked
echo "Step 7: Verifying update worked..."
VERIFY_RESPONSE=$(curl -s -X GET "${API_URL}/responses/read?id=${RESPONSE_ID}" \
  -H "Authorization: Bearer ${TOKEN}")

echo "Updated response:"
echo "$VERIFY_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$VERIFY_RESPONSE"
echo ""

# Step 8: Test DELETE
echo "Step 8: Testing DELETE endpoint..."
DELETE_RESPONSE=$(curl -s -X POST ${API_URL}/responses/delete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{
    \"id\": \"${RESPONSE_ID}\"
  }")

echo "Delete response:"
echo "$DELETE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$DELETE_RESPONSE"
echo ""

# Step 9: Verify deletion
echo "Step 9: Verifying deletion..."
VERIFY_DELETE=$(curl -s -X GET "${API_URL}/responses/read?id=${RESPONSE_ID}" \
  -H "Authorization: Bearer ${TOKEN}")

RESPONSE_COUNT=$(echo $VERIFY_DELETE | python3 -c "import sys, json; data = json.load(sys.stdin); print(len(data))" 2>/dev/null)

if [ "$RESPONSE_COUNT" = "0" ]; then
    echo "✅ Response successfully deleted (0 responses found)"
else
    echo "⚠️  Response may not have been deleted ($RESPONSE_COUNT responses found)"
fi

echo ""
echo "=== Test Complete ==="

