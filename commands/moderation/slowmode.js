const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits } = require("discord.js");
const ms = require("ms");
const config = require("../../config");
require("dotenv").config();

const MAX_SLOWMODE_SECONDS = 21600; // 6 hours

// Format seconds as "1h 5m 10s" (short, skips zero units)
function formatSecondsShort(totalSeconds) {
    const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    if (s === 0) return "0s";
    const parts = [];
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = s % 60;
    if (hours) parts.push(`${hours}h`);
    if (minutes) parts.push(`${minutes}m`);
    if (seconds && !hours) parts.push(`${seconds}s`); // usually skip seconds if hours present; keep simple
    return parts.join(" ");
}

module.exports = {

    data: new SlashCommandBuilder()
        .setName("slowmode")
        .setDescription("Sets or clear's the channel's slowmode. To clear type 0")
        .addStringOption(option => 
            option
            .setName("time")
            .setDescription("How long you want the slowmode to be (e.g. 5s, 30m, 1h). Max 6h")
            .setRequired(true)
        ),

    async execute(interaction){

        const embed = new EmbedBuilder()
            .setTimestamp()
            .setAuthor({name: interaction.user.username, iconURL: interaction.user.avatarURL()});

        const userPermissions = interaction.channel.permissionsFor(interaction.member);

        if (!userPermissions.has(PermissionFlagsBits.ManageChannels)){
            embed.setFields({name: "", value: "Missing permissions: ManageChannels"})
            .setColor(config.red)
            await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
            return;
        }


		const raw = (interaction.options.getString("time") || "").trim();
        const msValue = ms(raw);
        // Guard invalid inputs (ms returns undefined)
        if (msValue === undefined) {
            embed.setFields({name: "", value: "Invalid duration. Use formats like 5s, 30m, 1h (max 6h)."})
            .setColor(config.red);
            await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
            return;
        };

        const slowmodeTime = Math.floor(msValue / 1000); // seconds

        if (slowmodeTime < 1 && slowmodeTime !== 0){
            embed.setFields({name: "", value: "Slowmode cannot be set less than 1 second"})
            .setColor(config.red)
            await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
            return;
        };

        if (slowmodeTime > MAX_SLOWMODE_SECONDS) {
            embed.setFields({name: "", value: "Slowmode cannot exceed 6 hours"})
            .setColor(config.red);
            await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
            return;
        }

        await interaction.deferReply();

        await interaction.channel.setRateLimitPerUser(slowmodeTime);

        if (slowmodeTime === 0) {
            embed.setFields({name: "", value: "Successfully cleared slowmode"}).setColor(config.green);
        } else {
            embed.setFields({name: "", value: `Successfully set slowmode to ${formatSecondsShort(slowmodeTime)}`}).setColor(config.green);
        }

        await interaction.editReply({embeds: [embed]});

    }
};