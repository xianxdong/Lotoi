const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const { getVoiceConnection } = require('@discordjs/voice');
const config = require("../config")


module.exports = {

    data: new SlashCommandBuilder()
        .setName("disconnect")
        .setDescription("Disconnects the bot from the vc manually"),
    
    async execute(interaction){

        const embed = new EmbedBuilder()
            .setTimestamp()
            .setColor(config.green)
            .setFields({name: "", value: "Successfully disconnected from VC"});

        try {
            await interaction.deferReply();
            const connection = getVoiceConnection(interaction.guild.id);
            connection.disconnect()
            await interaction.editReply({embeds: [embed]});

        } catch (error){
            console.error(error)
        }
    }
}