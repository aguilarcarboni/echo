#!/bin/bash

# Test script for participants bulk-create endpoint
# Make sure your Flask server is running first: cd api && python run.py

API_URL="http://localhost:5000"

echo "=== Testing Participants Bulk-Create Endpoint ==="
echo ""

# Step 1: Get authentication token
echo "Step 1: Getting authentication token..."
TOKEN_RESPONSE=$(curl -s -X POST ${API_URL}/token \
  -H "Content-Type: application/json" \
  -d '{"token": "all"}')

TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access_token":"[^"]*' | grep -o '[^"]*$')

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get token. Response: $TOKEN_RESPONSE"
    exit 1
fi

echo "✅ Token obtained: ${TOKEN:0:20}..."
echo ""

# Step 2: Get or create a study_id
echo "Step 2: Getting an existing study..."
STUDIES_RESPONSE=$(curl -s -X GET "${API_URL}/studies/read" \
  -H "Authorization: Bearer ${TOKEN}")

# Try to extract first study_id from response
STUDY_ID=$(echo $STUDIES_RESPONSE | grep -o '"id":"[^"]*' | head -1 | grep -o '[^"]*$')

if [ -z "$STUDY_ID" ]; then
    echo "⚠️  No existing studies found. You'll need to create one first."
    echo "   Run this command to create a study:"
    echo ""
    echo "   curl -X POST ${API_URL}/studies/create \\"
    echo "     -H 'Content-Type: application/json' \\"
    echo "     -H 'Authorization: Bearer ${TOKEN}' \\"
    echo "     -d '{\"study\": {\"name\": \"Test Study\", \"objective\": \"Testing bulk create\", \"organization_id\": \"YOUR_ORG_ID\", \"created_by\": \"YOUR_USER_ID\"}}'"
    echo ""
    echo "   Then update STUDY_ID in this script and run again."
    exit 1
fi

echo "✅ Found study ID: $STUDY_ID"
echo ""

# Step 3: Test bulk-create with 'participants' key (frontend format)
echo "Step 3: Testing bulk-create with 'participants' key..."
BULK_CREATE_RESPONSE=$(curl -s -X POST ${API_URL}/participants/bulk-create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{
    \"study_id\": \"${STUDY_ID}\",
    \"participants\": [
      \"test1@example.com\",
      \"test2@example.com\",
      \"test3@example.com\"
    ],
    \"demographics\": {
      \"location\": \"Test Location\"
    }
  }")

echo "Response:"
echo "$BULK_CREATE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$BULK_CREATE_RESPONSE"
echo ""

# Step 4: Verify participants were created
echo "Step 4: Verifying participants were created..."
VERIFY_RESPONSE=$(curl -s -X GET "${API_URL}/participants/read?study_id=${STUDY_ID}" \
  -H "Authorization: Bearer ${TOKEN}")

echo "Participants for study ${STUDY_ID}:"
echo "$VERIFY_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$VERIFY_RESPONSE"
echo ""

echo "=== Test Complete ==="

