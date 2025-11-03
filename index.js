// Require the necessary discord.js classes
const fs = require("node:fs")
const path = require("node:path")
const { Client, Collection, Partials } = require('discord.js');
require("dotenv").config();
const { Manager } = require("moonlink.js");
const { attachNodeEvents } = require("./moonlink/nodeEvents");

// Create a new client instance
const client = new Client({ 
	intents: 131071,
	partials: [Partials.Message],
});

const manager = new Manager({
	nodes: [
		{
			host: process.env.LAVALINK_HOST,
			port: process.env.LAVALINK_PORT,
			password: process.env.LAVALINK_PASSWORD,
			secure: false,
		},
	],
	sendPayload: (guildId, payload) => {
		const guild = client.guilds.cache.get(guildId)
		if (guild){
			guild.shard.send(JSON.parse(payload));
		}
	},
	defaultVolume: 100,
	autoPlay: false,
});

client.manager = manager;

attachNodeEvents(client);

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}


const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);

	if (event.name === "raw"){
		client.on(event.name, (packet) => event.execute(packet, client));
    	continue;
	};

	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args, client));
	};
};



// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);