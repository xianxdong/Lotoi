const { Events, EmbedBuilder } = require("discord.js");

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

        
        try {
            // Will be later replaced with database for server customization
            const logChannel = await client.channels.fetch("1410727602259365980");
            if (message.content != null){
                await logChannel.send({embeds: [embed]});
            }
            // console.log(message);
        } catch(error) {
            console.error(error);
        }
    }
}