# Use the official Node.js image based on Alpine
FROM node:18-alpine

# Set the working directory
WORKDIR /usr/src/app

# Install build dependencies for Puppeteer and other required packages
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    python3 \
    make \
    g++ \
    cairo-dev \
    pango-dev \
    giflib-dev \
    jpeg-dev \
    pixman-dev

# Set Puppeteer configuration to use the installed Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 8002

# Command to run the app
CMD ["node", "app.js"]
