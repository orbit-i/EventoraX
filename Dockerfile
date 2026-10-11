# ========================================================
# EventoraX Enterprise Multi-Tenant SaaS & PaaS Dockerfile
# Optimized Multi-Stage Production Build
# ========================================================

# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build frontend bundle
COPY . .
RUN npm run build

# Stage 2: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY server.js ./
COPY db ./db
COPY middleware ./middleware
COPY routes ./routes
COPY database.sql ./
COPY --from=builder /app/dist ./dist

EXPOSE 5000

# Run with unprivileged user for security
USER node

CMD ["node", "server.js"]
