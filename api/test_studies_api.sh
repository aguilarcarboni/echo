#!/bin/bash

# Test script for Studies API
# This script demonstrates how to properly test the Studies API endpoints

API_URL="http://localhost:5000"

echo "=========================================="
echo "Testing Studies API"
echo "=========================================="
echo ""

# Step 1: Get authentication token
echo "Step 1: Getting authentication token..."
TOKEN_RESPONSE=$(curl -s -X POST "$API_URL/token" \
  -H "Content-Type: application/json" \
  -d '{"token": "all"}')

echo "Token response: $TOKEN_RESPONSE"
echo ""

# Extract token from response (assuming JSON response with access_token field)
# Note: This requires jq to be installed. If not available, manually copy the token.
if command -v jq &> /dev/null; then
    ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.access_token')
else
    echo "⚠️  jq not found. Please manually extract the access_token from the response above."
    echo "   The token should look like: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    echo ""
    read -p "Enter the access_token: " ACCESS_TOKEN
fi

if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" == "null" ]; then
    echo "❌ Failed to get access token. Please check your API server is running."
    exit 1
fi

echo "✅ Successfully obtained token"
echo ""

# Step 2: Create an organization (required for studies)
echo "Step 2: Creating an organization..."
ORG_RESPONSE=$(curl -s -X POST "$API_URL/organizations/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "organization": {
      "name": "Test Organization"
    }
  }')

echo "Organization response: $ORG_RESPONSE"
echo ""

# Extract organization ID
if command -v jq &> /dev/null; then
    ORGANIZATION_ID=$(echo $ORG_RESPONSE | jq -r '.id // empty')
    if [ -z "$ORGANIZATION_ID" ] || [ "$ORGANIZATION_ID" == "null" ]; then
        echo "⚠️  Failed to create organization. Trying to find existing one..."
        # Try to read existing organizations
        EXISTING_ORGS=$(curl -s -X GET "$API_URL/organizations/read" \
          -H "Authorization: Bearer $ACCESS_TOKEN")
        ORGANIZATION_ID=$(echo $EXISTING_ORGS | jq -r '.[0].id // empty')
    fi
else
    echo "⚠️  jq not found. Please manually extract the organization ID from the response above."
    read -p "Enter the organization ID: " ORGANIZATION_ID
fi

if [ -z "$ORGANIZATION_ID" ] || [ "$ORGANIZATION_ID" == "null" ]; then
    echo "❌ Failed to get organization ID. Cannot create study."
    exit 1
fi

echo "✅ Using organization ID: $ORGANIZATION_ID"
echo ""

# Step 3: Create a user (required for studies)
echo "Step 3: Creating a user..."
USER_RESPONSE=$(curl -s -X POST "$API_URL/users/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"user\": {
      \"email\": \"test-user-$(date +%s)@example.com\",
      \"organization_id\": \"$ORGANIZATION_ID\",
      \"role\": \"admin\"
    }
  }")

echo "User response: $USER_RESPONSE"
echo ""

# Extract user ID
if command -v jq &> /dev/null; then
    USER_ID=$(echo $USER_RESPONSE | jq -r '.id // empty')
    if [ -z "$USER_ID" ] || [ "$USER_ID" == "null" ]; then
        echo "⚠️  Failed to create user. Trying to find existing one..."
        # Try to read existing users
        EXISTING_USERS=$(curl -s -X GET "$API_URL/users/read" \
          -H "Authorization: Bearer $ACCESS_TOKEN")
        USER_ID=$(echo $EXISTING_USERS | jq -r '.[0].id // empty')
    fi
else
    echo "⚠️  jq not found. Please manually extract the user ID from the response above."
    read -p "Enter the user ID: " USER_ID
fi

if [ -z "$USER_ID" ] || [ "$USER_ID" == "null" ]; then
    echo "❌ Failed to get user ID. Cannot create study."
    exit 1
fi

echo "✅ Using user ID: $USER_ID"
echo ""

# Step 4: Test creating a study
echo "Step 4: Creating a study..."
CREATE_RESPONSE=$(curl -s -X POST "$API_URL/studies/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"study\": {
      \"organization_id\": \"$ORGANIZATION_ID\",
      \"created_by\": \"$USER_ID\",
      \"name\": \"My First Study\",
      \"objective\": \"Learn how to build APIs\",
      \"status\": \"draft\"
    }
  }")

echo "Create response: $CREATE_RESPONSE"
echo ""

# Extract study ID if available
if command -v jq &> /dev/null; then
    STUDY_ID=$(echo $CREATE_RESPONSE | jq -r '.id // empty')
    if [ -n "$STUDY_ID" ] && [ "$STUDY_ID" != "null" ]; then
        echo "✅ Study created with ID: $STUDY_ID"
    fi
fi
echo ""

# Step 5: Test reading studies
echo "Step 5: Reading studies (filtered by status=draft)..."
READ_RESPONSE=$(curl -s -X GET "$API_URL/studies/read?status=draft" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Read response: $READ_RESPONSE"
echo ""

# Step 6: Test reading all studies
echo "Step 6: Reading all studies..."
READ_ALL_RESPONSE=$(curl -s -X GET "$API_URL/studies/read" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Read all response: $READ_ALL_RESPONSE"
echo ""

echo "=========================================="
echo "Testing complete!"
echo "=========================================="
echo ""
echo "To test manually, use these commands:"
echo ""
echo "1. Get token:"
echo "   curl -X POST $API_URL/token -H 'Content-Type: application/json' -d '{\"token\": \"all\"}'"
echo ""
echo "2. Use token in subsequent requests:"
echo "   curl -X GET '$API_URL/studies/read?status=draft' -H 'Authorization: Bearer YOUR_TOKEN_HERE'"
echo ""

