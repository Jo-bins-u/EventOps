FROM node:18-alpine

RUN apk add --no-cache wget

WORKDIR /app

COPY package.json ./

RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 5000

CMD ["npm", "run", "dev"]
