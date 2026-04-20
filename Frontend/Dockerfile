# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Build Angular app
COPY . .
RUN npm run build

# Production stage - Serve with Nginx
FROM nginx:stable-alpine

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built Angular app from builder stage
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html

# Create a non-root user for security
# Ensure nginx user and group exist with correct permissions
RUN if ! getent group nginx > /dev/null; then addgroup -g 1001 -S nginx; fi && \
    if ! getent passwd nginx > /dev/null; then adduser -S nginx -u 1001 -G nginx; fi

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
