const { EmbedBuilder } = require("discord.js");
const config = require("../../config");

/**
 * NowPlayingPanel
 *
 * Creates and deletes the "MUSIC PANEL" embed message.
 */
class NowPlayingPanel {
    constructor({ channel }) {
        this.channel = channel;
        this.message = null;
    }

    setChannel(channel) {
        this.channel = channel;
    }

    async clear() {
        const msg = this.message;
        this.message = null;
        if (!msg) return;
        try {
            if (typeof msg.deletable === "boolean" && !msg.deletable) return;
            await msg.delete().catch(() => {});
        } catch {}
    }

    buildEmbed(song) {
        return new EmbedBuilder()
            .setColor(config.blurple || "#7bb1f5")
            .setTimestamp()
            .setFields({
                name: "",
                value: `[${song.title}](${song.songUrl}) **-** \`[${song.duration}]\``
            })
            .setThumbnail(song.thumbnail || null)
            .setAuthor({ name: "MUSIC PANEL", iconURL: song.interaction.user.avatarURL() });
    }

    async show(song) {
        if (!this.channel || !song) return;
        try {
            await this.clear();
            const embed = this.buildEmbed(song);
            this.message = await this.channel.send({ embeds: [embed] });
        } catch {
            // ignore: likely missing perms
        }
    }
}

module.exports = NowPlayingPanel;
