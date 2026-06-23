FROM node:22-slim

WORKDIR /app

# Copy package requirements
COPY employee-hub/package*.json ./
RUN npm install --legacy-peer-deps

# Copy all source files
COPY employee-hub/ .

# This popoves your dist/ folder cleanly
RUN npm run build

EXPOSE 3000

# 🌟 FIX: Use vinxi to natively start the production build artifact in dist/
CMD ["npx", "vinxi", "start"]