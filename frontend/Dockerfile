# Stage 1: Build the bundle
FROM node:22-slim AS builder
WORKDIR /app

COPY employee-hub/package*.json ./
RUN npm install --legacy-peer-deps

COPY employee-hub/ .
RUN npm run build

# Stage 2: Production runtime Environment
FROM node:22-slim
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Copy production artifacts from the builder stage
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package*.json ./

EXPOSE 3000

# The standard deployment entrypoint for TanStack Start
CMD ["node", ".output/server/index.mjs"]