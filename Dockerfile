# Stage 1: Build the Vue frontend
FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build
# Output lands in /app/public (vite outDir: '../public')


# Stage 2: Production image
FROM node:22-alpine

WORKDIR /app

# Install backend dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy backend source
COPY server.js ./
COPY database/ ./database/
COPY routes/ ./routes/
COPY services/ ./services/
COPY sockets/ ./sockets/

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/public ./public

# Uploads directory for photo-to-list feature
RUN mkdir -p uploads

EXPOSE 3000

CMD ["node", "server.js"]
