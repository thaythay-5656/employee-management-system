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

# 2. Clear out everything from the web root
RUN rm -rf /usr/share/nginx/html/*

# 3. Copy Vite's native auto-generated index.html file
COPY --from=builder /app/dist/client/index.html /usr/share/nginx/html/index.html

# 4. Copy the compiled assets folder cleanly
COPY --from=builder /app/dist/client/assets /usr/share/nginx/html/assets

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]