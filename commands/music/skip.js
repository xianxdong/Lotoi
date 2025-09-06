const { EmbedBuilder, MessageFlags, SlashCommandBuilder, Embed } = require("discord.js");
const { createAudioPlayer, NoSubscriberBehavior, createAudioResource, StreamType, getVoiceConnection, AudioPlayerStatus, VoiceConnectionStatus, joinVoiceChannel } = require('@discordjs/voice');
const config = require("../../config");
const MusicQueue = require("../../music/GuildMusicQueue");
const queueManager = require("../../music/queueManager")
const { InvalidLinkError, EmptyQueueList } = require("../../music/errors")
require("dotenv").config();

module.exports = {

    data: new SlashCommandBuilder()
        .setName("skip")
        .setDescription("Skips the song"),


    async execute(interaction){
        const botInfo = await interaction.guild.members.fetch(process.env.DISCORD_CLIENT_ID);
        const embed = new EmbedBuilder()
            .setTimestamp()
            .setColor(config.red)
            .setFields({name: "", value: "I'm not in a VC channel"});
        try {

            if (botInfo.voice.channelId === null){
                await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
                return;
            } else if (interaction.member.voice.channelId === null){
                embed.setFields({name: "", value: "You are not in a VC channel"});
                await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
                return;
            } else if (botInfo.voice.channelId !== interaction.member.voice.channelId){
                embed.setFields({name: "", value: "You are not in the same VC channel as the bot"});
                await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
                return;
            };

            await interaction.deferReply();

            let queue = queueManager.get(interaction.guild.id);
            if (!queue){
                embed.setFields({name: "", value: "No active music session found"}).setColor(config.red);
                await interaction.editReply({embeds: [embed]});
                return;
            }

            queue.skip()
            embed.setFields({name: "", value: "Successfully skipped "})




        } catch (error){
            console.error(error);
        }

    }

}