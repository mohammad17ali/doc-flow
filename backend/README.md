# Document Flow Backend - Complete Guide

A document management system with user authentication, group-based access control, and document permissions.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB running on `localhost:27011`
- PDF documents in `/home/intel/pdf-results/ervin/outputs/`

### 1. Start MongoDB

```bash
docker run -d -p 27011:27017 --name=doc-flow mongo
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Initialize Documents

Scan the outputs directory and create document records in the database:

```bash
npm run init-docs
```

This creates document records **without permissions**. You'll assign permissions later.

### 4. Initialize Admin User

Create the default admin user and admin group:

```bash
npm run init-admin
```

**Default credentials:**
- Username: `admin`
- Password: `admin123`

⚠️ **Change this password in production!**

### 5. Start the Server

```bash
npm run dev
```

Server runs on `http://localhost:5002`

---

## 📋 Complete Workflow

### Step 1: Login as Admin

```bash
curl -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionToken": "d2348f54a94a852745c6d4c1b118a8d6...",
    "user": {
      "userId": "...",
      "username": "admin",
      "email": "admin@intel.com",
      "groups": ["admin"],
      "groupIds": ["..."]
    }
  }
}
```

Save the `sessionToken` for subsequent requests.

### Step 2: Create User Groups

Create groups for different teams:

```bash
# Set your admin token
ADMIN_TOKEN="your-session-token-here"

# Create Engineering group
curl -X POST http://localhost:5002/api/admin/groups \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Engineering",
    "description": "Engineering team members"
  }'

# Create Sales group
curl -X POST http://localhost:5002/api/admin/groups \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sales",
    "description": "Sales department"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Group created successfully",
  "data": {
    "groupId": "69245489f3331d528d65f67b"
  }
}
```

Save the `groupId` for each group.

### Step 3: List Available Documents

```bash
curl -X GET http://localhost:5002/api/admin/documents \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

This shows all documents in the system with their current permissions.

### Step 4: Assign Documents to Groups

Grant groups access to specific documents:

```bash
# Grant Engineering group access to BMRA-Single-Server
curl -X POST http://localhost:5002/api/admin/documents/<BMRA-Single-Server>/permissions \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "groupId": "69245489f3331d528d65f67b"
  }'

# Grant Sales group access to sales-materials
curl -X POST http://localhost:5002/api/admin/documents/marketing-materials/permissions \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "groupId": "MARKETING_GROUP_ID"
  }'
```

### Step 5: Create Users

```bash
# Create user Alice
curl -X POST http://localhost:5002/api/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "email": "alice@example.com",
    "password": "AlicePass123"
  }'

# Create user Bob
curl -X POST http://localhost:5002/api/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "bob",
    "email": "bob@example.com",
    "password": "BobPass123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "userId": "674320a1b2c3d4e5f6a7b8d1"
  }
}
```

### Step 6: Add Users to Groups

```bash
# Add Alice to Engineering group
curl -X POST http://localhost:5002/api/admin/users/ALICE_USER_ID/groups/ENGINEERING_GROUP_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Add Bob to Marketing group
curl -X POST http://localhost:5002/api/admin/users/BOB_USER_ID/groups/MARKETING_GROUP_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Or add to multiple groups at once
curl -X POST http://localhost:5002/api/admin/users/ALICE_USER_ID/groups \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "groupIds": ["GROUP_ID_1", "GROUP_ID_2"]
  }'
```

### Step 7: Test User Access

Login as a regular user and see what documents they can access:

```bash
# Login as Alice
curl -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "password": "AlicePass123"
  }'

# Save Alice's token
ALICE_TOKEN="alices-session-token"

# List documents Alice can see (only documents her groups have access to)
curl -X GET http://localhost:5002/api/documents \
  -H "Authorization: Bearer $ALICE_TOKEN"

# Get a specific document
curl -X GET http://localhost:5002/api/documents/BMRA-Single-Server \
  -H "Authorization: Bearer $ALICE_TOKEN"

# Get document images
curl -X GET http://localhost:5002/api/documents/BMRA-Single-Server/images \
  -H "Authorization: Bearer $ALICE_TOKEN"
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "root": {
      "content": [...],
      "children": [...]
    }
  }
}
```

**Access Denied Response (if user doesn't have permission):**
```json
{
  "success": false,
  "message": "Access denied: You do not have permission to view this document"
}
```

---

## 🔐 How Access Control Works

1. **Documents** have a `permissions` array listing which groups can access them
2. **Users** belong to one or more groups via `groupIds`
3. When a user requests documents:
   - System looks up which groups the user belongs to
   - Returns only documents where at least one of the user's groups has permission
4. **Documents without permissions** = Nobody can see them (except admins)

### Key Points:

- ✅ One document can be accessible by multiple groups
- ✅ One user can belong to multiple groups
- ✅ Users can only READ documents (no write/delete)
- ✅ Admin users (in 'admin' group) can see all documents and manage everything

---

## 📚 API Reference

### Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "alice",
  "password": "AlicePass123"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

---

### Admin - User Management

**All admin endpoints require:**
```
Authorization: Bearer <admin-session-token>
```

#### Create User
```http
POST /api/admin/users
Content-Type: application/json

{
  "username": "john",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

#### List Users
```http
GET /api/admin/users
GET /api/admin/users?activeOnly=true
```

#### Get User
```http
GET /api/admin/users/:userId
```

#### Update User
```http
PUT /api/admin/users/:userId
Content-Type: application/json

{
  "email": "newemail@example.com",
  "password": "NewPassword123",
  "isActive": true
}
```

#### Delete User
```http
DELETE /api/admin/users/:userId
```

---

### Admin - Group Management

#### Create Group
```http
POST /api/admin/groups
Content-Type: application/json

{
  "name": "Engineering",
  "description": "Engineering team"
}
```

#### List Groups
```http
GET /api/admin/groups
GET /api/admin/groups?activeOnly=true
```

#### Get Group
```http
GET /api/admin/groups/:groupId
```

#### Update Group
```http
PUT /api/admin/groups/:groupId
Content-Type: application/json

{
  "name": "Engineering-Team",
  "description": "Updated description"
}
```

#### Delete Group
```http
DELETE /api/admin/groups/:groupId
```

---

### Admin - User-Group Assignment

#### Add User to Group
```http
POST /api/admin/users/:userId/groups/:groupId
```

#### Add User to Multiple Groups
```http
POST /api/admin/users/:userId/groups
Content-Type: application/json

{
  "groupIds": ["groupId1", "groupId2"]
}
```

#### Remove User from Group
```http
DELETE /api/admin/users/:userId/groups/:groupId
```

---

### Admin - Document Management

#### List All Documents
```http
GET /api/admin/documents
```

#### Scan for New Documents
```http
GET /api/admin/documents/scan
```

#### Create Document Record
```http
POST /api/admin/documents
Content-Type: application/json

{
  "documentId": "folder-name",
  "name": "Display Name",
  "description": "Document description"
}
```

#### Get Document Details
```http
GET /api/admin/documents/:documentId
```

#### Update Document
```http
PUT /api/admin/documents/:documentId
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description"
}
```

#### Delete Document
```http
DELETE /api/admin/documents/:documentId
```

---

### Admin - Document Permissions

#### Add Group Permission to Document
```http
POST /api/admin/documents/:documentId/permissions
Content-Type: application/json

{
  "groupId": "674320a1b2c3d4e5f6a7b8c9"
}
```

#### Remove Group Permission
```http
DELETE /api/admin/documents/:documentId/permissions/:groupId
```

#### Replace All Document Permissions
```http
PUT /api/admin/documents/:documentId/permissions
Content-Type: application/json

{
  "permissions": [
    { "groupId": "groupId1" },
    { "groupId": "groupId2" }
  ]
}
```

---

### User - Document Access

**Requires user authentication:**
```
Authorization: Bearer <user-session-token>
```

#### List Accessible Documents
```http
GET /api/documents
```

Returns only documents the user's groups have permission to access.

#### Get Document Structure
```http
GET /api/documents/:documentId
```

Returns document content tree. Returns 403 if user doesn't have access.

#### Get Document Images
```http
GET /api/documents/:documentId/images
```

Returns list of image files. Returns 403 if user doesn't have access.

---

## 🛠️ Development Scripts

```bash
# Start development server with auto-reload
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start

# Initialize admin user and group
npm run init-admin

# Initialize documents from outputs directory
npm run init-docs
```

---

## 📊 Database Collections

### `users`
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  passwordHash: String,
  groupIds: [ObjectId],  // References to userGroups
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date
}
```

### `userGroups`
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### `documents`
```javascript
{
  _id: ObjectId,
  documentId: String,     // Folder name
  name: String,           // Display name
  description: String,
  filePath: String,
  permissions: [          // ACL
    {
      groupId: ObjectId  // Reference to userGroup
    }
  ],
  metadata: Object,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### `sessions`
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  sessionToken: String,
  expiresAt: Date,
  createdAt: Date
}
```

---

## 🔒 Security Notes

1. **Change default admin password** after initialization
2. **Use HTTPS** in production
3. **Set strong passwords** for all users
4. **Session tokens** expire after 24 hours
5. **Admin group** (`'admin'`) has full access to all endpoints

---

## 📝 Common Workflows

### Setup New Team Access

```bash
# 1. Create group for the team
POST /api/admin/groups
{"name": "Finance", "description": "Finance team"}

# 2. Assign documents to the group
POST /api/admin/documents/budget-report/permissions
{"groupId": "FINANCE_GROUP_ID"}

# 3. Add users to the group
POST /api/admin/users/USER_ID/groups/FINANCE_GROUP_ID
```

### Grant Multi-Group Access to Document

```bash
# Same document accessible by multiple teams
POST /api/admin/documents/company-handbook/permissions
{"groupId": "ENGINEERING_ID"}

POST /api/admin/documents/company-handbook/permissions
{"groupId": "MARKETING_ID"}

POST /api/admin/documents/company-handbook/permissions
{"groupId": "FINANCE_ID"}
```

### Audit User Access

```bash
# 1. Get user details (shows their groups)
GET /api/admin/users/USER_ID

# 2. For each group, check documents
GET /api/admin/documents
# Filter by permissions.groupId in the response
```

---

## 🐛 Troubleshooting

### "Cannot connect to MongoDB"
- Ensure MongoDB is running: `docker ps | grep doc-flow`
- Check connection string in `src/config/database.ts`

### "Document folder not found"
- Ensure PDF output folders exist in `/home/intel/pdf-results/ervin/outputs/`
- Run `npm run init-docs` to scan for new documents

### "Access denied" for regular user
- Verify user is in a group: `GET /api/admin/users/:userId`
- Verify group has document permission: `GET /api/admin/documents/:documentId`
- Check user's groups match document's permitted groups

### "Invalid or expired session"
- Sessions expire after 24 hours
- Login again to get a new token

---

## 📦 Environment

Default configuration:
- **Server Port**: 5002
- **MongoDB**: mongodb://localhost:27011/doc-flow
- **Documents Path**: /home/intel/pdf-results/ervin/outputs/
- **Session Duration**: 24 hours

To modify, edit `src/config/database.ts` and `src/config/paths.ts`

---

## 🎯 Summary

This system provides:
- ✅ User authentication with sessions
- ✅ Group-based access control
- ✅ Document-level permissions
- ✅ Admin management interface
- ✅ Secure API with JWT-like session tokens
- ✅ Read-only document access for users

Users can only view documents that their groups have been granted access to. Admins manage users, groups, and document permissions through the API.
