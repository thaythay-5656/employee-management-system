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

RUN rm -rf /usr/share/nginx/html/*

# 3. Copy your fresh React client build files into the empty directory
COPY --from=builder /app/dist/client /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]