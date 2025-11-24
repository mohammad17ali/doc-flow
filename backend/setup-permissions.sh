#!/bin/bash

# Document Permissions Setup Script
# This script helps set up document permissions for the doc-flow system

set -e

echo "=================================================="
echo "📄 Document Permissions Setup"
echo "=================================================="
echo ""

# Check if MongoDB is running
echo "1️⃣  Checking MongoDB connection..."
if ! mongosh --eval "db.version()" >/dev/null 2>&1; then
    echo "❌ Error: MongoDB is not running or not accessible"
    echo "   Please start MongoDB and try again"
    exit 1
fi
echo "✅ MongoDB is running"
echo ""

# Create user groups
echo "2️⃣  Creating user groups..."
echo ""

# Get admin token
read -p "Enter admin session token: " ADMIN_TOKEN

if [ -z "$ADMIN_TOKEN" ]; then
    echo "❌ Error: Admin token is required"
    exit 1
fi

# Create BMRA-Admins group
echo "Creating BMRA-Admins group..."
BMRA_RESPONSE=$(curl -s -X POST http://localhost:5002/api/admin/groups \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "BMRA-Admins",
    "description": "Administrators with access to BMRA documentation",
    "permissions": ["documents:read"]
  }')

echo "$BMRA_RESPONSE" | jq '.'

# Create Tender-Team group
echo ""
echo "Creating Tender-Team group..."
TENDER_RESPONSE=$(curl -s -X POST http://localhost:5002/api/admin/groups \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tender-Team",
    "description": "Team members working on tender processes",
    "permissions": ["documents:read"]
  }')

echo "$TENDER_RESPONSE" | jq '.'
echo ""

# Initialize document permissions
echo "3️⃣  Initializing document permissions..."
echo ""

cd "$(dirname "$0")"
npm run init-docs

echo ""
echo "=================================================="
echo "✅ Setup Complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Assign users to groups using:"
echo "   POST /api/admin/users/:userId/groups"
echo ""
echo "2. Verify permissions by logging in as a user and accessing:"
echo "   GET /api/documents"
echo ""
echo "See PERMISSIONS_README.md for detailed documentation"
echo ""
