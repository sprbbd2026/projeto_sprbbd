# ts1-front - Vite/React (dev server)
FROM node:22-alpine

WORKDIR /app

# Dependencias primeiro (cache). node_modules fica protegido por volume anonimo no compose.
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
