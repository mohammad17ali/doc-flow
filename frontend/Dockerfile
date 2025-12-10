# -----------------------------
# Build Stage
# -----------------------------
FROM node:20-alpine AS builder

# Accept proxy arguments
ARG http_proxy
ARG https_proxy
ARG no_proxy

# Accept API URL as build argument
ARG NEXT_PUBLIC_API_URL=http://localhost:5001

# Set proxy environment variables if provided
ENV http_proxy=${http_proxy}
ENV https_proxy=${https_proxy}
ENV no_proxy=${no_proxy}

# Set Next.js public environment variable for build time
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

WORKDIR /app

# Copy only package files first (better caching)
COPY package*.json ./

# Install all dependencies (including dev)
# Use npm install if package-lock.json might be missing
RUN npm install

# Copy the rest of the application
COPY . .

# Build the Next.js app with the API URL baked in
RUN npm run build

# -----------------------------
# Production Stage
# -----------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Accept proxy for runtime ONLY if truly required
# (Consider removing if unnecessary in production)
ARG http_proxy
ARG https_proxy
ARG no_proxy
ENV http_proxy=${http_proxy}
ENV https_proxy=${https_proxy}
ENV no_proxy=${no_proxy}

# Copy only necessary files
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev --ignore-scripts

# Copy built Next.js output
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Copy Next.js config
COPY --from=builder /app/next.config.mjs ./

# Expose the correct port
EXPOSE 3000

# Use a non-root user for better security
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
USER nextjs

# Start the app
CMD ["npm", "start"]
