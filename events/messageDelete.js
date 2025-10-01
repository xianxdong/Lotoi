const { Events, EmbedBuilder, MessageReaction } = require("discord.js");
const guildConfigModel = require("../model/guildConfigModel");

module.exports = {

    name: Events.MessageDelete,
    async execute(message, client){

        const settings = await guildConfigModel.findOne({ guildId: message.guildId });
        const channelId = settings?.messageLogChannel;
        if (!channelId) return;

        if (message.partial){
            try {
                message = await message.fetch();
            } catch (error){S
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
            const logChannel = await client.channels.fetch(channelId);
            if (message.content != null){
                await logChannel.send({embeds: [embed]});
            }
            // console.log(message);
        } catch(error) {
            console.error(error);
        }
    }
}