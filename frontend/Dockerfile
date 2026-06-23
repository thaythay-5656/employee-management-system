# Stage 1: Build the Application
FROM node:22-slim AS builder
WORKDIR /app
COPY employee-hub/package*.json ./
RUN npm install --legacy-peer-deps
COPY employee-hub/ .
RUN npm run build

# Stage 2: Run the Production Vinxi Server
FROM node:22-slim
WORKDIR /app

# Copy packages and install dependencies
COPY employee-hub/package*.json ./
RUN npm install --legacy-peer-deps

# 🌟 FIX: Point to the nested employee-hub folder for the build artifacts
COPY --from=builder /app/employee-hub/dist ./dist
COPY --from=builder /app/employee-hub/.output ./.output

EXPOSE 3000

# Run Vinxi using the local node_modules binary safely
CMD ["npx", "vinxi", "start", "--port", "3000", "--host", "0.0.0.0"]