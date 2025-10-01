# Lotoi

A multipurpose Discord bot for moderation, music playback, and server utilities. Supports per‑guild configuration stored in MongoDB via Mongoose.

Highlights
- Moderation: ban, kick, mute, unmute, slowmode
- Music: play, queue, skip, join, disconnect (yt‑dlp + ffmpeg)
- Message logging: edit/delete logs to a configurable channel
- Utilities: ping, server info, avatar/banner fetch, random cat facts
- Persistence: per‑guild config document created automatically

Tech stack
- Node.js 18+
- discord.js v14
- MongoDB + Mongoose
- yt‑dlp + ffmpeg

Prerequisites
- Discord application and bot token
  - Enable Privileged Intents as needed (Server Members, Message Content) in the Discord Developer Portal
- Node.js 18 or 20
- MongoDB (Atlas or self‑hosted)
- ffmpeg installed on the host (Docker image already includes it)

Quick start (local)
1) Clone and install
- git clone https://github.com/xianxdong/Lotoi.git
- cd Lotoi
- npm install

2) Configure environment
- Copy .env.example to .env and fill values

Required envs
- DISCORD_TOKEN: Your bot token
- DISCORD_CLIENT_ID: The application (bot) client ID
- MONGODB_URI: MongoDB connection string
- MONGODB_NAME: Base database name (e.g., lotoi)
- DEPLOYMODE_MODE: dev or production
Database name used at runtime is MONGODB_NAME + "_" + DEPLOYMODE_MODE (e.g., lotoi_dev)

Optional envs
- DISCORD_GUILD_ID: Only used if you want to register per‑guild commands in a local deploy script (global deployment used by default)
- COOKIE_FILE: Path to cookies file for yt‑dlp (Railway/server only)
- YTDLP_PATH: Custom path to yt‑dlp binary (Linux servers)

3) Register slash commands
- node deploy-commands.js
This registers global commands; allow a few minutes for global propagation (Discord).

4) Run the bot
- node index.js

Docker
- Build: docker build -t xianxdong/lotoi .
- Run (example):
  docker run --rm \
    -e DISCORD_TOKEN=... \
    -e DISCORD_CLIENT_ID=... \
    -e MONGODB_URI=... \
    -e MONGODB_NAME=lotoi \
    -e DEPLOYMODE_MODE=production \
    xianxdong/lotoi

Commands
Moderation
- /ban user reason?
- /kick user reason?
- /mute user duration reason?
- /unmute user reason?
- /slowmode time

Music
- /join
- /play url
- /queue
- /skip
- /disconnect

Utility
- /ping
- /server
- /avatar user
- /banner user
- /bannersmall user
- /fact

Configuration
- Message log channel: Use /setmessagelog #channel
  - The bot stores the channel in your guild’s config doc and sends message edit/delete embeds there.
  - Make sure the bot has View Channel, Send Messages, and Embed Links in the chosen channel.

Message logging and database
- On startup (events/ready.js), the bot backfills a per‑guild document using findOneAndUpdate with upsert:
  - Ensures exactly one document per guild exists without overwriting existing settings
  - Collection name is derived from your model (e.g., guildConfigModel → guildconfigs)
- When messages are edited or deleted, the bot reads settings?.messageLogChannel and posts embeds to that channel if configured.

MongoDB connection
- database/mongoose.js connects once per process
- Uses dbName = `${MONGODB_NAME}_${DEPLOYMODE_MODE}` for clean dev/production separation
- Graceful shutdown closes the Mongoose connection (SIGINT/SIGTERM)

Permissions/intents
- Client is initialized with all intents (131071) and Message partials
- Ensure your bot has:
  - Guild text permissions to post embeds in log/music channels
  - Voice permissions for music (ViewChannel, Connect, Speak; MoveMembers if joining full channels)

Troubleshooting
- Commands don’t show up
  - Ensure node deploy-commands.js ran with the same DISCORD_CLIENT_ID and DISCORD_TOKEN
  - Global commands can take a few minutes; try re‑inviting the bot or using a per‑guild deploy during development
- No message logs appear
  - Run /setmessagelog and choose a channel where the bot can post embeds
  - Check MongoDB: confirm a doc exists for the guild and messageLogChannel is set
- DB document missing for a guild
  - The ready backfill creates docs on startup for all joined guilds
  - Verify you’re looking at the correct database name (MONGODB_NAME_DEPLOYMODE_MODE)
- Music errors
  - Ensure ffmpeg is installed and on PATH (not needed inside the provided Docker image)
  - yt‑dlp availability: set YTDLP_PATH or ensure the binary exists; optionally set COOKIE_FILE for region‑restricted tracks

Development
- Update commands: node deploy-commands.js
- Start: node index.js
- Lint/format: (not configured; feel free to add eslint/prettier)
- Tests: (not configured)

Security
- Never commit your .env
- Rotate DISCORD_TOKEN if it leaks
- Limit bot permissions to what you need on production servers

License
- No license file is present. Add a LICENSE to clarify terms before distributing.

Contributing
- PRs and issues are welcome. Please include:
  - Repro steps or server logs for bugs
  - Proposed behavior and minimal diffs for features