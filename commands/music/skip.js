const { EmbedBuilder, MessageFlags, SlashCommandBuilder, Embed } = require("discord.js");
const config = require("../../config");
const queueManager = require("../../music/queueManager");
const { EmptyQueueList } = require("../../music/errors");
require("dotenv").config();

module.exports = {

    data: new SlashCommandBuilder()
        .setName("skip")
        .setDescription("Skips the song"),


    async execute(interaction){
        const botInfo = await interaction.guild.members.fetch(process.env.DISCORD_CLIENT_ID);
        const embed = new EmbedBuilder()
            .setTimestamp()
            .setColor(config.red);
        try {

            if (botInfo.voice.channelId === null){
                embed.setFields({name: "", value: "I'm not in a VC channel"});
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

            let song = queue.getCurrentSong();
            if (!song){
                throw new EmptyQueueList()
            };

            queue.skip()
            embed.setFields({name: "", value: `**Successfully skipped the song**: \`${song.title}\` \n**Song requested by**: \`${song.requestedBy}\` \n**Song skipped by**:\`${interaction.user.username}\``}).setColor(config.green);
            await interaction.editReply({embeds: [embed]});

        } catch (error){
            if (error instanceof EmptyQueueList){
                embed.setFields({name: "", value: "Error: Music Queue is empty"}).setColor(config.red);
                await interaction.editReply({embeds: [embed]});
            } else {
                console.error(error);
            };
        };
    }
};