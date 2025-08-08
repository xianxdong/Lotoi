const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("banner")
        .setDescription("Provides the banner of the user")
        .addUserOption(option => 
            option
            .setName("user")
            .setDescription("Gets the banner of the user") 
            .setRequired(true)
        ),
    async execute(interaction){

        try {
            await interaction.deferReply();
            const targetUser = await interaction.options.getUser("user").fetch(true);
            if (targetUser.bannerURL() !== null){
                await interaction.editReply(targetUser.bannerURL({size: 4096}));
            } else {
                await interaction.editReply("The user does not have a banner")
            }
        } catch (error){
            console.error(error);
        };


    }
};