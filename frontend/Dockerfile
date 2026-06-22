FROM node:22-slim AS builder
WORKDIR /app
COPY employee-hub/package*.json ./
RUN npm install --legacy-peer-deps
COPY employee-hub/ .
RUN npm run build

FROM node:22-slim
WORKDIR /app
COPY employee-hub/package*.json ./
RUN npm install --legacy-peer-deps
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["npx", "vite", "preview", "--port", "3000", "--host", "0.0.0.0"]