const { Events, EmbedBuilder } = require("discord.js");

module.exports = {
    name: Events.MessageUpdate,
    async execute(oldMessage, newMessage, client){
        // console.log("Message event fired");
        const embed = new EmbedBuilder()
            .setDescription(`**Message sent by ${newMessage.author.globalName} was edited in **https://discord.com/channels/${newMessage.guildId}/${newMessage.channelId}/${newMessage.id}`)
            .addFields(
                {name: `**Before**`, value: `${oldMessage.content}`},
                {name: `**After**`, value: `${newMessage.content}`}
            )
            .setAuthor({name: newMessage.author.username, iconURL: newMessage.author.avatarURL()})
            .setColor(0x0099FF)
            .setFooter({text:`User ID: ${newMessage.author.id}`});
        const logChannel = await client.channels.fetch('1390744469233729668');
        try {
            if (oldMessage.content != null){
                if (oldMessage.author.id != 823992654425620575 && newMessage.author.id != 823992654425620575){
                    await logChannel.send({embeds: [embed]});
                }
            }
            // console.log(newMessage);
        } catch(error) {
            console.error(error);
        }
    }
};