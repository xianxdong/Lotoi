# 🎧 Discord Bot

A Discord bot featuring **music playback**, **moderation tools**, and **Docker Compose** deployment.  
Built with **Node.js**, **discord.js v14**, **Lavalink + Moonlink**, and **MongoDB**.


## ✨ Features
- 🎵 **High-quality audio** via **Lavalink** with **Moonlink** client
- 💬 **Slash commands** (discord.js v14)
- 🧠 **MongoDB persistence** (Mongoose) for queues, settings, stats
- 🧩 **Modular architecture** for easy feature additions
- 🐳 **Docker Compose** for local and VPS deployment
- 🛡️ **Moderation + utility** commands included


## 🧰 Tech Stack

| Layer        | Technology                 |
|--------------|----------------------------|
| Language     | Node.js 18+                |
| Discord API  | discord.js v14             |
| Audio System | Lavalink + Moonlink        |
| Database     | MongoDB + Mongoose         |
| Deployment   | Docker Compose / VPS       |

## ⚙️ Environment Variables

~~~env
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_GUILD_ID=

MONGODB_URI=
MONGODB_NAME=
DEPLOYMODE_MODE=dev # dev for development, production for production deployment. 
You are required to make a mongodb database with MONGODB_NAME + "_" + DEPLOYMODE_MODE
LAVALINK_HOST=
LAVALINK_PORT=
LAVALINK_PASSWORD=
YTCIPHER_PASSWORD=
YOUTUBE_REFRESH_TOKEN=
MOONLINK_VERBOSE=0
~~~

Copy `.env.example` → `.env` and fill in your values.  
**Tip:** No spaces around `=` (use `KEY=value`).



## 🧱 Installation & Deployment (Docker Compose)

Note: Ensure docker compose has been installed. If you are on windows installed docker desktop and ensure docker composed is installed and running. 

1) **Clone**
~~~bash
git clone https://github.com/xianxdong/Discord-Bot.git
cd discord-bot
~~~

2) **Configure**
~~~bash
cp .env.example .env
# edit .env with your tokens, Lavalink credentials, and MongoDB URI
~~~

3) **Up**
~~~bash
docker compose up -d
# follow logs
docker compose logs -f
~~~


## 🧩 `docker-compose.yml` Example

> Place this at the repo root as `docker-compose.yml`.  
> It starts **Lavalink** and the **bot**; adjust image / build context to your setup.
> I already included a docker-compose.yml file but you can adjust the settings yourself. Below is an simple example edit. 

~~~yaml
version: "3.9"

services:
  lavalink:
    image: ghcr.io/lavalink-devs/lavalink:4
    container_name: lavalink
    restart: unless-stopped
    environment:
      - SERVER_PORT=2333
      - LAVALINK_SERVER_PASSWORD=${LAVALINK_PASSWORD}
    ports:
      - "2333:2333"
    # Optional: mount application.yml if you want custom sources/config
    # volumes:
    #   - ./lavalink/application.yml:/opt/Lavalink/application.yml

  bot:
    build: .
    container_name: discord-bot
    restart: unless-stopped
    depends_on:
      - lavalink
    env_file:
      - .env
    # If your bot reads host/port from env, LAN access works out-of-the-box
    # networks can be customized if needed
~~~


## 🧠 Notes
- Audio is fully handled by **Lavalink**; **Moonlink** is the Node client layer.
- Use a hosted MongoDB (Atlas) or add a MongoDB service to Compose.
- Structure is modular so you can add commands/features quickly.


## 📄 License
MIT — see `LICENSE` for details.

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![discord.js](https://img.shields.io/badge/discord.js-v14-blue)
![Lavalink](https://img.shields.io/badge/Audio-Lavalink-purple)
![Docker Compose](https://img.shields.io/badge/Docker-Compose-informational)