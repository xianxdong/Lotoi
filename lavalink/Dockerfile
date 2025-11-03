# Build on the official Lavalink image (pin exact version for reproducibility)
FROM ghcr.io/lavalink-devs/lavalink:4.1.1

# Prepare plugins dir with Lavalink's user (uid 1000)
USER root
RUN mkdir -p /opt/Lavalink/plugins && chown -R 1000:1000 /opt/Lavalink/plugins

# Pin the YouTube plugin version here (bump consciously)
ARG YT_PLUGIN_VER=1.16.0
ADD https://maven.lavalink.dev/releases/dev/lavalink/youtube/youtube-plugin/${YT_PLUGIN_VER}/youtube-plugin-${YT_PLUGIN_VER}.jar \
    /opt/Lavalink/plugins/youtube-plugin-${YT_PLUGIN_VER}.jar

# Lock perms and drop back to lavalink user
RUN chown 1000:1000 /opt/Lavalink/plugins/*.jar && chmod 0644 /opt/Lavalink/plugins/*.jar
USER 1000:1000
