const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("avatar")
        .setDescription("Provides the avatar of the user")
        .addUserOption(option => 
            option
            .setName("user")
            .setDescription("Gets the avatar of the user")
            .setRequired(true)
        ),
    async execute(interaction){
        try {
            await interaction.deferReply();
            const targetUser = interaction.options.getUser("user");
            await interaction.editReply(targetUser.avatarURL({size: 1024}));
        } catch (error){
            console.error(error);
        };
    }
};