FROM node:18

# Install LibreOffice
RUN apt-get update && apt-get install -y libreoffice

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 10000

CMD ["node", "server.js"]