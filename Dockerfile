# Minimal Node.js 22 image (Debian Bookworm)
FROM node:22-bookworm-slim

# No ENV baked into the image — inject via docker run/compose env or .env at runtime.

# Set working directory
WORKDIR /app

# Install prod deps using cached layer
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the rest of the app
COPY . .

# Start the bot
CMD ["node", "index.js"]