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

# 2. Clear out everything
RUN rm -rf /usr/share/nginx/html/*

# 3. Copy your compiled assets folder
COPY --from=builder /app/dist/client/assets /usr/share/nginx/html/assets

# 4. Inject the entrypoint index.html file directly into the web root
COPY index.html /usr/share/nginx/html/index.html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]