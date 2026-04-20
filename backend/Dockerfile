# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install dumb-init to handle signals properly
RUN apk add --no-cache dumb-init

# Copy only dist and node_modules from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Ensure public/uploads exists and set permissions
RUN mkdir -p public/uploads && \
    chown -R nodejs:nodejs /app/public

USER nodejs

EXPOSE 3000

# Use dumb-init
ENTRYPOINT ["dumb-init", "--"]

# Start the application using index.js
CMD ["node", "dist/index.js"]
