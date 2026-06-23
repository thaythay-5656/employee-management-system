# Stage 1: Build the Application
FROM node:22-slim AS builder
WORKDIR /app
COPY employee-hub/package*.json ./
RUN npm install --legacy-peer-deps
COPY employee-hub/ .
RUN npm run build

# Stage 2: Serve via Vite Preview
FROM node:22-slim
WORKDIR /app

# Copy packages and install production dependencies
COPY employee-hub/package*.json ./
RUN npm install --legacy-peer-deps

# Copy the compiled production build from Stage 1
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# 🌟 FIX: Point Vite Preview directly to the client directory
CMD ["npx", "vite", "preview", "dist/client", "--port", "3000", "--host", "0.0.0.0"]