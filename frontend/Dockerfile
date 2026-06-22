# Stage 1: Build the React Application
FROM node:22-slim AS builder
WORKDIR /app
COPY employee-hub/package*.json ./
RUN npm install --legacy-peer-deps
COPY employee-hub/ .
RUN npm run build

# Stage 2: Serve via Nginx
FROM nginx:alpine

# 1. Overwrite default config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 2. Clear old placeholders
RUN rm -rf /usr/share/nginx/html/*

# 3. Copy EVERYTHING from the dist folder, including any root files
COPY --from=builder /app/dist/. /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]