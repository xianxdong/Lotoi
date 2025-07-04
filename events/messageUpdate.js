const { Events, EmbedBuilder } = require("discord.js");


module.exports = {
    name: Events.MessageUpdate,
    async execute(oldMessage, newMessage, client){
        // console.log("Message event fired")

        const logChannel = await client.channels.fetch('1390744469233729668');

        try {
            await logChannel.send(`Old Message: ${oldMessage.content}\n New Message: ${newMessage.content}`);
            // console.log("running")
        } catch(error) {
            console.error(error)
        }
    }
};