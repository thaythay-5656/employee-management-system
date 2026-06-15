FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 8080

ENV HOST=0.0.0.0
ENV PORT=8080

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8080"]