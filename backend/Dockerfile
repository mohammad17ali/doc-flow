# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build arguments (optional for backend as it uses runtime env vars)
ARG FRONTEND_URL=http://localhost:3000

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Production stage
FROM node:20-alpine

# Install netcat for MongoDB health check
RUN apk add --no-cache netcat-openbsd

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Copy initialization script
COPY init.sh ./
RUN chmod +x init.sh

# Expose port
EXPOSE 5001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5001

# Start the application using the init script
CMD ["./init.sh"]
