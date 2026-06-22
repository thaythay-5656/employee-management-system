# Stage 1: Build the React Application
FROM node:22-slim AS builder
WORKDIR /app
COPY employee-hub/package*.json ./
RUN npm install --legacy-peer-deps
COPY employee-hub/ .
RUN npm run build

RUN ls -la && ls -la dist/

# Stage 2: Serve via Nginx
FROM nginx:alpine

# 1. Overwrite default config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 2. Point directly to the nested client build folder
COPY --from=builder /app/dist/client /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]