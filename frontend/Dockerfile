# -----------------------------
# Build Stage
# -----------------------------
FROM node:20-alpine AS builder

# Accept proxy arguments
ARG http_proxy
ARG https_proxy
ARG no_proxy

# Set proxy environment variables if provided
ENV http_proxy=${http_proxy}
ENV https_proxy=${https_proxy}
ENV no_proxy=${no_proxy}

WORKDIR /app

# Copy only package files first (better caching)
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the Next.js app
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
RUN npm ci --omit=dev --ignore-scripts

# Copy built Next.js output
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# If you're using custom config or instrumentation
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/instrumentation.ts ./

# Expose the correct port
EXPOSE 3000

# Use a non-root user for better security
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
USER nextjs

# Start the app
CMD ["npm", "start"]
