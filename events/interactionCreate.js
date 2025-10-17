const { Events, MessageFlags } = require('discord.js');
require("dotenv").config();

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		if (process.env.DEPLOYMODE_MODE === "dev" && interaction.guild.id !== process.env.DISCORD_GUILD_ID) return;
		if (process.env.DEPLOYMODE_MODE !== "dev" && interaction.guild.id === process.env.DISCORD_GUILD_ID) return;


		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
			} else {
				await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
			}
		}
	},
};