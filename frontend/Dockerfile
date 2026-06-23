# Stage 1: Build the Application
FROM node:22-slim AS builder
WORKDIR /app
COPY employee-hub/package*.json ./employee-hub/
RUN cd employee-hub && npm install --legacy-peer-deps
COPY employee-hub/ ./employee-hub/
RUN cd employee-hub && npm run build

# Stage 2: Run the Production Server
FROM node:22-slim
WORKDIR /app

# Copy packages and install production dependencies
COPY employee-hub/package*.json ./
RUN npm install --legacy-peer-deps

# Copy the compiled production build from Stage 1
COPY --from=builder /app/employee-hub/dist ./dist

EXPOSE 3000

CMD ["node", "--experimental-modules", "dist/server/server.js"]