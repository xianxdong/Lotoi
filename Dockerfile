# Start from a lightweight Node.js 20 image based on Debian Bookworm
FROM node:20-bookworm-slim

# -----------------------------------------------------------------------------
# Install system dependencies
# - ffmpeg: for audio playback in Discord bots
# - python3: required for node-gyp to build native addons and ytdlp support
# - build-essential + pkg-config: provide compilers & build tools
# - libopus-dev: headers for @discordjs/opus voice encoding
# - curl: for downloading yt-dlp
# - ca-certificates: ensure HTTPS works securely
# Then clean up apt cache to reduce image size
# -----------------------------------------------------------------------------
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    build-essential \
    pkg-config \
    libopus-dev \
    curl \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# -----------------------------------------------------------------------------
# Download the latest yt-dlp binary (newer than Debian’s version)
# and make it executable so the bot can use it directly
# -----------------------------------------------------------------------------
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
      -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

# Set working directory to /app inside the container
WORKDIR /app

# -----------------------------------------------------------------------------
# Copy package.json and package-lock.json first
# This allows Docker to cache npm dependencies
# if your source code changes but dependencies don’t
# -----------------------------------------------------------------------------
COPY package*.json ./

# Install production dependencies only (skip devDeps)
RUN npm ci --omit=dev

# Copy the rest of your project files into the image
COPY . .

# -----------------------------------------------------------------------------
# Default command when the container starts:
# runs "node index.js" to launch your Discord bot
# -----------------------------------------------------------------------------
CMD ["node","index.js"]