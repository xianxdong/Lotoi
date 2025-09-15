const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const config = require("../../config");
const queueManager = require("../../music/queueManager")
require("dotenv").config();

module.exports = {

    data: new SlashCommandBuilder()
        .setName("disconnect")
        .setDescription("Disconnects the bot from the vc manually"),
    
    async execute(interaction){
        const botInfo = await interaction.guild.members.fetch(process.env.DISCORD_CLIENT_ID);
        const embed = new EmbedBuilder()
            .setTimestamp()
            .setColor(config.green)
            .setFields({name: "", value: "Successfully disconnected from VC"});

        if (botInfo.voice.channelId === null){
            embed.setFields({name: "", value: "I'm not in a VC channel"}).setColor(config.red);
            await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
            return;
        } else if (interaction.member.voice.channelId === null){
            embed.setFields({name: "", value: "You are not in a VC channel"}).setColor(config.red);
            await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
            return;
        } else if (botInfo.voice.channelId !== interaction.member.voice.channelId){
            embed.setFields({name: "", value: "You are not in the same VC channel as the bot"});
            await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
            return;
        };

        try {
            await interaction.deferReply();
            let queue = queueManager.get(interaction.guild.id);

            if (!queue){
                embed.setFields({name: "", value: "No active music session found"}).setColor(config.red);
                await interaction.editReply({embeds: [embed]});
                return;
            }

            queue.stop();
            await interaction.editReply({embeds: [embed]});
        } catch (error){
            console.error(error);
        };
    }
}