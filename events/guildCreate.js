const { Events } = require('discord.js');
const guildConfigModel = require("../model/guildConfigModel");

module.exports = {

    name: Events.GuildCreate,
    once: false,

    async execute(guild){
        const doc = await guildConfigModel.findOneAndUpdate(
            { guildId: guild.id },
            { $setOnInsert: { guildId: guild.id }},
            { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
        );   
    }
};

