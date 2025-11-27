# Setup Steps for Separate Development Servers

## Prerequisites

Start MongoDB container:

```bash
docker run -d -p 27011:27017 --name=doc-flow-mongo mongo
```

## Step 1: Backend Setup

### Initialize Admin User

Terminal 1 - Backend:

```bash
MONGODB_URI=mongodb://localhost:27011 npm run init-admin
```

This will:
- Create an admin user group
- Create an admin user with credentials:
  - Username: admin
  - Password: admin123

### Initialize Documents

```bash
MONGODB_URI=mongodb://localhost:27011 npm run init-docs
```

This will:
- Scan the /outputs directory for PDF document folders
- Add all found documents to MongoDB
- Automatically grant admin group access to all documents

### Start the Backend Server

```bash
MONGODB_URI=mongodb://localhost:27011 PORT=5002 npm run dev
```

The backend will:
- Connect to MongoDB on localhost:27011
- Run on port 5002
- Auto-reload on file changes (using nodemon)

## Step 2: Frontend Setup

Terminal 2 - Frontend:

```bash
npm run dev
```

The frontend will:
- Run on port 3000 (default Next.js port)
- Auto-reload on file changes (hot module replacement)
- Connect to backend API at http://localhost:5002

## Step 3: Verify Everything is Running

Open a third terminal to test:

```bash
# Check backend health
curl http://localhost:5002/api/health

# Check frontend
curl http://localhost:3000
```
