# Stage 1: Build the Application
FROM node:22-slim AS builder
WORKDIR /app
COPY employee-hub/package*.json ./
RUN npm install --legacy-peer-deps
COPY employee-hub/ .
RUN npm run build

# Stage 2: Run the TanStack Start Production Server
FROM node:22-slim
WORKDIR /app

# Copy packages and install production dependencies
COPY employee-hub/package*.json ./
RUN npm install --production --legacy-peer-deps

# Copy the entire compiled build output (both client and server assets)
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Start the built framework production server directly
CMD ["node", "dist/server/server.js"]