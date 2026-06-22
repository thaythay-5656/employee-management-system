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

# 3. Copy the compiled assets folder cleanly
COPY --from=builder /app/dist/client/assets /usr/share/nginx/html/assets

# 4. Create the index.html shell dynamically and automatically find the main entry script
RUN ENTRY_SCRIPT=$(ls /usr/share/nginx/html/assets/client-*.js 2>/dev/null || ls /usr/share/nginx/html/assets/index-*.js | head -n 1) && \
    FILENAME=$(basename $ENTRY_SCRIPT) && \
    echo "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'/><meta name='viewport' content='width=device-width,initial-scale=1.0'/><title>Employee Hub</title></head><body><div id='root'></div><script type='module' src='/assets/$FILENAME'></script></body></html>" > /usr/share/nginx/html/index.html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]