FROM node:22-slim

WORKDIR /app

# Copy configuration files
COPY employee-hub/package*.json ./
RUN npm install --legacy-peer-deps

# Copy the source code
COPY employee-hub/ .

# Build the application assets natively
RUN npm run build

EXPOSE 3000

# Start using the universal framework runner to handle dynamic build paths automatically
CMD ["npx", "vinxi", "start"]