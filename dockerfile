# Use Node base image
FROM node:18

# Install LibreOffice
RUN apt-get update && apt-get install -y libreoffice

# Set working directory
WORKDIR /app

# Copy files
COPY . .

# Install dependencies
RUN npm install

# Expose port
EXPOSE 10000

# Start app
CMD ["node", "server.js"]