FROM node:22-slim

WORKDIR /app

# Copy package files directly into /app
COPY employee-hub/package*.json ./
RUN npm install --legacy-peer-deps

# Copy the rest of the frontend source files directly into /app
COPY employee-hub/ .

# This builds both the /app/dist and /app/.output directories
RUN npm run build

EXPOSE 3000

# 🌟 FIX: Run the actual standalone Nitro server bundle
CMD ["node", ".output/server/index.mjs"]