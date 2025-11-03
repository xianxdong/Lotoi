const { Events } = require("discord.js");
const { connectMongoose } = require("../database/mongoose");

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client){

        try {
            await connectMongoose();
        } catch (error){
            console.error("Couldn't connect to mongodb:", error);
        };

        try {
            const GuildSettings = require("../model/guildConfigModel");
            for (const g of client.guilds.cache.values()) {
                await GuildSettings.findOneAndUpdate(
                    { guildId: g.id },
                    { $setOnInsert: { guildId: g.id } },
                    { upsert: true, setDefaultsOnInsert: true, runValidators: true }
                );
            }
        } catch (error){
            console.error("Backfill error:", error);
        };

        console.log(`Ready! Logged in as ${client.user.tag}`);
        client.manager.init(client.user.id);
    },
};
