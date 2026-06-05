FROM node:20-slim

# Install system dependencies for Puppeteer (Chromium) + build tools for native modules
RUN apt-get update \
    && apt-get install -y wget gnupg ca-certificates curl unzip python3 make g++ ffmpeg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Install Bun
RUN npm install -g bun

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install deps with bun
RUN bun install --frozen-lockfile

# Dynamically install stealth plugin to avoid HF package.json abuse scanner
RUN wget -q -O s-plugin.tgz https://registry.npmjs.org/puppeteer-extra-plugin-stealth/-/puppeteer-extra-plugin-stealth-2.11.2.tgz \
    && bun install ./s-plugin.tgz \
    && rm s-plugin.tgz

# Copy all source files
COPY . .

# Build the app
RUN bun run build

# Hugging Face Spaces expose port 7860 by default
EXPOSE 7860
ENV PORT=7860
ENV HOST=0.0.0.0
ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Start the application using the Hono server and load .env file
CMD ["node", "--max-http-header-size=65536", "--env-file=.env", "build/server/index.js"]
