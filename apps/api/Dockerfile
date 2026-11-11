# ── Build stage ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# The deployment platform may inject NODE_ENV=production at build time.
# Override it for this install so TypeScript and other devDependencies exist.
COPY package*.json ./
RUN NODE_ENV=development npm install --include=dev --legacy-peer-deps --no-audit --no-fund

# Copy source and compile TypeScript
COPY . .
RUN NODE_ENV=development npm run build

# ── Production stage ────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app
ENV NODE_ENV=production
ENV UPLOAD_DIR=/app/uploads

# Install runtime dependencies only
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps --no-audit --no-fund

# Copy compiled API from the builder stage
COPY --from=builder /app/dist ./dist

# Create non-root user and writable upload directories
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001 \
    && mkdir -p /app/uploads/products \
    && chown -R nodejs:nodejs /app/uploads

USER nodejs

EXPOSE 5000

CMD ["node", "dist/server.js"]
