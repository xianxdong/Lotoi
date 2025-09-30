const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const queueManager = require("../../music/queueManager");
const config = require("../../config");

const MAX_LINES = 25;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("Displays the current music queue"),

    async execute(interaction) {
        
        if (interaction.member.voice.channelId === null){
            const embed = new EmbedBuilder()
                .setTimestamp()
                .setColor(config.red)
                .setFields({name: "", value: "Please join the VC first"});
            await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
            return;
        };
        
        await interaction.deferReply();
        const queue = queueManager.get(interaction.guild.id);
        const current = queue?.getCurrentSong?.() || null;
        const songList = queue?.getSongList?.() || [];

        // Build "Now Playing"
        const nowPlaying = current
            ? `[${current.title}](${current.songUrl}) \`[${current.duration}]\``
            : "None";

        // Build upcoming queue lines
        const lines = songList.map((song, i) => {
            const pos = i + 1;
            const title = song.title || "Untitled";
            const url = song.songUrl || "https://youtu.be/";
            const duration = song.duration ? ` \`[${song.duration}]\`` : "";
            return `**#${pos}** [${title}](${url})${duration}`;
        });

        const shown = lines.slice(0, MAX_LINES);
        const remaining = lines.length - shown.length;

        const parts = [];
        parts.push(`**Now Playing:** ${nowPlaying}`);
        if (shown.length > 0) {
            parts.push(""); // spacer
            parts.push("**Queue:**");
            parts.push(shown.join("\n"));
        } else if (!current) {
            // Nothing playing and no queued items: show a simple note
            parts.push("");
            parts.push("The queue is empty.");
        }

        const embed = new EmbedBuilder()
            .setColor(config.blurple || "#5665f3")
            .setDescription(parts.join("\n"))
            .setTimestamp()
            .setAuthor({name: interaction.user.username, iconURL: interaction.user.avatarURL()});

        if (remaining > 0) {
            embed.setFooter({ text: `...and ${remaining} more` });
        }

        await interaction.editReply({ embeds: [embed] });
    }
};