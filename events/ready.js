const { Events } = require("discord.js");
const { connectMongoose } = require("../database/mongoose");

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client){

        try {
            await connectMongoose();
        } catch (error){
            console.error("Couldn't connect to mongodb:", error)
        }

        console.log(`Ready! Logged in as ${client.user.tag}`);
    },
};
