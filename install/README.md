# Docker Installation Guide

## Prerequisites

1. Ensure that you have your PDF processing results in `~/pdf-results/` directory on your host machine. This directory will be mounted to the backend container to access the JSON output files.

2. **Important**: Before building, you must set the API URL environment variables because Next.js embeds `NEXT_PUBLIC_*` variables at build time.

## Environment Setup

### Step 1: Create Environment File

Copy the example environment file and customize it:

```bash
cp .env.example .env
```

### Step 2: Configure URLs

Edit `.env` and set your backend and frontend URLs:

**For local development:**
```env
NEXT_PUBLIC_API_URL=http://localhost:5001
FRONTEND_URL=http://localhost:3000
```

**For server deployment (e.g., IP: 10.138.190.67):**
```env
NEXT_PUBLIC_API_URL=http://10.138.190.67:5001
FRONTEND_URL=http://10.138.190.67:3000
```

**⚠️ Important Notes:**
- `NEXT_PUBLIC_API_URL` is used by the frontend to call the backend API
- This variable is embedded during build time and cannot be changed after building
- To change the API URL, you must rebuild the frontend image
- `FRONTEND_URL` is used by backend for CORS and can be changed at runtime

## Building Individual Docker Images

### Backend

**With default localhost:**
```bash
cd ../backend
docker build -t doc-flow-backend:latest .
```

**With custom frontend URL:**
```bash
cd ../backend
docker build \
  --build-arg FRONTEND_URL=http://10.138.190.67:3000 \
  -t doc-flow-backend:latest .
```

**With proxy (if needed):**
```bash
docker build \
    --build-arg no_proxy=$no_proxy \
  --build-arg http_proxy=$http_proxy \
  --build-arg https_proxy=$https_proxy \
  --build-arg FRONTEND_URL=http://10.138.190.67:3000 \
  -t doc-flow-backend:latest .
```

### Frontend

**With default localhost:**
```bash
cd ../frontend
docker build -t doc-flow-frontend:latest .
```

**With custom API URL (REQUIRED for server deployment):**
```bash
cd ../frontend
docker build \
  --build-arg NEXT_PUBLIC_API_URL=http://10.138.190.67:5001 \
  -t doc-flow-frontend:latest .
```

**With proxy (if needed behind corporate proxy):**
```bash
docker build \
  --build-arg http_proxy=$http_proxy \
  --build-arg https_proxy=$https_proxy \
  --build-arg no_proxy=$no_proxy \
  --build-arg NEXT_PUBLIC_API_URL=http://10.138.190.67:5001 \
  -t doc-flow-frontend:latest .
```

### Backend
```bash
# Navigate to backend directory
cd ../backend

# Build the backend image
docker build -t doc-flow-backend:latest .
```

### Frontend
```bash
# Navigate to frontend directory
cd ../frontend

# Build the frontend image
docker build -t doc-flow-frontend:latest .
```

## Using Docker Compose

Docker Compose will use the `.env` file automatically if it exists in the same directory.

### Build and Start All Services

**With .env file (recommended):**
```bash
# Make sure .env is configured first!
docker-compose up --build -d
```

**With inline environment variables:**
```bash
NEXT_PUBLIC_API_URL=http://10.138.190.67:5001 \
FRONTEND_URL=http://10.138.190.67:3000 \
docker-compose up --build -d
```

**With proxy:**
```bash
docker-compose build \
  --build-arg http_proxy=$http_proxy \
  --build-arg https_proxy=$https_proxy
docker-compose up -d
```

### Start Services (without rebuilding)
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only
docker-compose logs -f frontend
```

### Rebuild Specific Service
```bash
# Rebuild backend
docker-compose up --build -d backend

# Rebuild frontend
docker-compose up --build -d frontend
```

## Accessing the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **Backend Health Check**: http://localhost:5001/health

## Environment Variables

The docker-compose setup uses the following environment variables:

### Build-time Variables (Must be set before building)
- `NEXT_PUBLIC_API_URL` - Backend API URL for frontend (embedded in build)
  - Default: `http://localhost:5001`
  - Example: `http://10.138.190.67:5001`

### Runtime Variables
- `FRONTEND_URL` - Frontend URL for backend CORS configuration
  - Default: `http://localhost:3000`
  - Example: `http://10.138.190.67:3000`
- `PDF_RESULTS_DIR` - Path to PDF results directory inside container
  - Default: `/pdf-results`
- `PORT` - Server ports (5001 for backend, 3000 for frontend)

### Volume Mounts
- `${HOME}/pdf-results:/pdf-results:ro` - Mounts your local `~/pdf-results/` directory to `/pdf-results` in the container (read-only)

## Complete Deployment Example

### For Server at IP 10.138.190.67:

1. **Create .env file:**
```bash
cat > .env << EOF
NEXT_PUBLIC_API_URL=http://10.138.190.67:5001
FRONTEND_URL=http://10.138.190.67:3000
EOF
```

2. **Build and run:**
```bash
docker-compose up --build -d
```

3. **Access the application:**
- Frontend: http://10.138.190.67:3000
- Backend API: http://10.138.190.67:5001
- Health Check: http://10.138.190.67:5001/health

## Troubleshooting

### Check container status
```bash
docker-compose ps
```

### Restart a specific service
```bash
docker-compose restart backend
docker-compose restart frontend
```

### Remove all containers and volumes
```bash
docker-compose down -v
```

### Access container shell
```bash
# Backend
docker exec -it doc-flow-backend sh

# Frontend
docker exec -it doc-flow-frontend sh
```
