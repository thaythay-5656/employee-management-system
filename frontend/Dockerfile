# Change from node:18-slim or node:lts-hydrogen to node:22-slim
FROM node:22-slim

WORKDIR /app

COPY employee-hub/package*.json ./
RUN npm install --legacy-peer-deps

COPY employee-hub/ .

EXPOSE 5173
CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "5173"]