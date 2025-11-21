#!/bin/bash

# Test script for the backend API

API_URL="http://localhost:5001"

echo "========================================"
echo "Testing Document API"
echo "========================================"

echo -e "\n1. Testing Health Endpoint..."
curl -s "${API_URL}/health" | jq '.'

echo -e "\n\n2. Testing GET /api/documents (List all documents)..."
curl -s "${API_URL}/api/documents" | jq '.'

echo -e "\n\n3. Testing GET /api/documents/BMRA-Single-Server (Get specific document)..."
curl -s "${API_URL}/api/documents/BMRA-Single-Server" | jq '.success, .data.root | keys'

echo -e "\n\n4. Testing GET /api/documents/invalid-doc (404 test)..."
curl -s "${API_URL}/api/documents/invalid-doc" | jq '.'

echo -e "\n\n========================================"
echo "API Tests Complete"
echo "========================================"
