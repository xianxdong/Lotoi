# 🎧 Lotoi
Lotoi is a self-contained, production-grade Discord music bot featuring queue management, MongoDB persistence, and full Docker deployment.

## ✨Features
- 🎵 Stream high-quality audio using ffmpeg + yt-dlp
- 💬 Modern slash commands with discord.js v14
- 🧠 MongoDB (via Mongoose) for persistent data and stats
- 🐳 Docker-ready for cloud deployment (Railway, Render, etc.)
- 🧩 Modular architecture with easy-to-extend command system

## 🧰Tech Stack
- Node.js 18+
- discord.js v14
- MongoDB + Mongoose
- yt-dlp + ffmpeg
- Docker (for deployment)

## ⚙️Environment Variables
```env
DISCORD_TOKEN=your-discord-bot-token
CLIENT_ID=your-bot-client-id
GUILD_ID=your-server-id
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/database
NODE_ENV=dev
YTDLP_PATH=path/to/ytdlp
COOKIE_FILE=path/to/cookie/file
```
📄 You can copy .env.example to .env and fill in your values.\
⚠️ **Note:** In `.env` files do **not** put spaces around `=` (use `KEY=value`, not `KEY = value`).

## 🧱 Installation (via Docker)

1. **Clone the repository**
```bash
git clone https://github.com/xianxdong/Lotoi.git
cd Lotoi
```

2. **Copy and edit environment variables**
```bash
cp .env.example .env
```
Then open `.env` and fill in your credentials:
```env
DISCORD_TOKEN=your-discord-bot-token
CLIENT_ID=your-bot-client-id
GUILD_ID=your-server-id
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/database
NODE_ENV=dev # Switch to production if needed
YTDLP_PATH=path/to/ytdlp # OPTIONAL. Only use if your system can't automatically find the path
COOKIE_FILE=path/to/cookie/file # OPTIONAL. Only use if needed
```

3. **Build and run the container**
```bash
docker build -t lotoi .
docker run -d --name lotoi --env-file .env lotoi
```
⚠️**Notes:** Make sure Docker is properly installed. Also make sure Docker Desktop is also installed

## 🧠 Notes
- Uses **yt-dlp** and **FFmpeg** inside the container for reliable audio extraction/transcoding.
- Connects to **MongoDB** via **Mongoose** for persistence (queues, history, settings).
- Docker-first: local runs and cloud deployments share the exact same environment.
- For some sources, you may need a cookies file (`COOKIE_FILE`) to improve playback reliability.

## 🧑‍💻 Author

**Xian Dong**  
- [GitHub](https://github.com/xianxdong)  
- [LinkedIn](https://www.linkedin.com/in/xianxdong)

## ⚖️ License
This project is licensed under the **MIT License**.  
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![discord.js](https://img.shields.io/badge/discord.js-v14-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen)
![Docker](https://img.shields.io/badge/Docker-Ready-informational)