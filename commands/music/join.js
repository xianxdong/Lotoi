const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const { joinVoiceChannel } = require('@discordjs/voice');
const config = require("../../config");
require("dotenv").config();

module.exports = {

    data: new SlashCommandBuilder()
        .setName("join")
        .setDescription("Joins the vc the member is in"),
    
    async execute(interaction){
        const botInfo = await interaction.guild.members.fetch(process.env.DISCORD_CLIENT_ID);
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

        try {
            await interaction.deferReply();
            const connection = joinVoiceChannel({
                channelId: interaction.member.voice.channelId,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator});

            if (!connection){
                embed.setFields({name: "", value: `Failed to connect to VC`});
                await interaction.editReply({embeds: [embed]});
                return;
            }

            embed.setFields({name: "", value: "Successfully connected to VC"}).setColor(config.green);
            await interaction.editReply({embeds: [embed]});

        } catch (error){
            console.error(error);
        };
    }
};