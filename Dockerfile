FROM node:20-bookworm-slim

# ffmpeg + toolchain + Opus headers (for @discordjs/opus) + curl to fetch yt-dlp
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    build-essential \
    pkg-config \
    libopus-dev \
    curl \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Install the latest yt-dlp standalone binary (much newer than Debian's)
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
      -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

CMD ["node","index.js"]