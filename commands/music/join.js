const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits } = require("discord.js");
const config = require("../../config");
const { ensureMoonlinkConnection } = require("../../music/ensureMoonlinkConnection");
require("dotenv").config();

module.exports = {

    data: new SlashCommandBuilder()
        .setName("join")
        .setDescription("Joins the vc the member is in"),
    
    async execute(interaction){
        const botInfo = interaction.guild.members.me ?? await interaction.guild.members.fetch(process.env.DISCORD_CLIENT_ID);
        const embed = new EmbedBuilder()
            .setTimestamp()
            .setColor(config.red)
            .setFields({name: "", value: "Please join a vc"});
        
        if (interaction.member.voice.channelId === null){
            await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
            return;
        } else if (botInfo.voice.channelId === interaction.member.voice.channelId){
            embed.setFields({name: "", value: "I'm already in the vc channel"})
            await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
            return;
        } else if (botInfo.voice.channelId && (botInfo.voice.channelId !== interaction.member.voice.channelId)){
            embed.setFields({name: "", value: "I'm already in a different VC channel. Use /disconnect before trying again"});
            await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
            return;
        }

        const channel = interaction.member.voice.channel;
        const botPermission = botInfo.permissionsIn(channel);

        if (!botPermission.has(PermissionFlagsBits.ViewChannel)){
            embed.setFields({name: "", value: "Cannot join vc. Missing permissions: ViewChannel"});
            await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
            return;
        };

        if (!botPermission.has(PermissionFlagsBits.Connect)){
            embed.setFields({name: "", value: "Cannot join vc. Missing permissions: Connect"});
            await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
            return;
        };

        if (!botPermission.has(PermissionFlagsBits.Speak)){
            embed.setFields({name: "", value: "Cannot speak in vc. Missing permissions: Speak"});
            await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
            return;
        };

        if (channel.userLimit && channel.userLimit > 0 && channel.members.size >= channel.userLimit && !botPermission.has(PermissionFlagsBits.MoveMembers)) {
            embed.setFields({ name: "", value: "The voice channel is full. Missing permissions to join: MoveMembers" });
            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            return;
        };

        try {
            await interaction.deferReply();

            const manager = interaction.client.manager;
            const voiceChannelId = interaction.member.voice.channelId;
            const textChannelId = interaction.channel.id;

            // Use the helper to ensure a connected, ready player
            const result = await ensureMoonlinkConnection(
                manager,
                interaction.guild,
                voiceChannelId,
                textChannelId,
                {
                    // These are optional; timeout is fixed in the helper (500ms).
                    setDeaf: true,
                    botMember: botInfo
                }
            );

            if (!result.ok){
                embed.setFields({name: "", value: `Failed to connect to VC`});
                await interaction.editReply({embeds: [embed]});
                return;
            };

            embed.setFields({name: "", value: "Successfully connected to VC"}).setColor(config.green);
            await interaction.editReply({embeds: [embed]});

        } catch (error){
            console.error(error);
        };
    }
};