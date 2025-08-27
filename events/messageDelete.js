const { Events, EmbedBuilder } = require("discord.js");
const config = require("../config.json")

module.exports = {

    name: Events.MessageDelete,
    async execute(message, client){

        if (message.partial){
            try {
                message = await message.fetch();
            } catch (error){
                return;
            }
        }

        if (!message || !message.author){
            return;
        }
        if (message.author.bot){
            return;
        }

        const embed = new EmbedBuilder()
            .setDescription(`**Message sent by <@${message.author.id}> was deleted in **https://discord.com/channels/${message.guildId}/${message.channelId}`)
            .addFields(
                {name:"", value: `${message.content}`}
            )
            .setAuthor({name: message.author.username, iconURL: message.author.avatarURL()})
            .setColor([219, 43, 31])
            .setFooter({text:`Author: ${message.author.id} | Message ID: ${message.id}`})
            .setTimestamp();

        const logChannel = await client.channels.fetch("1390744469233729668");
        try {
            if (message.content != null){
                await logChannel.send({embeds: [embed]});
            }
            // console.log(message);
        } catch(error) {
            console.error(error);
        }
    }
}