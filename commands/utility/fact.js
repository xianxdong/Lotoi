const { SlashCommandBuilder, MessageFlags, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {

    data: new SlashCommandBuilder()
    .setName("fact")
    .setDescription("Fetches a random fact about cats"),

    async execute(interaction){
        await interaction.deferReply();

        try {

            const response = await axios.get('https://catfact.ninja/fact');
            console.log(response)
            const data = await response.data
            // console.log(data)

            await interaction.editReply(`Cat Fact: ${data.fact}`);

        } catch (error){
            console.error(error);
            await interaction.editReply("Error. Could not fetch cat facts");
        }

        
    }

};

