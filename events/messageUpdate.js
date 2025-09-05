const { Events, EmbedBuilder } = require("discord.js");

module.exports = {
    name: Events.MessageUpdate,
    async execute(oldMessage, newMessage, client){
        // console.log("Message event fired");

        try {
            if (oldMessage.partial){
                oldMessage =  await oldMessage.fetch();
            };
        } catch (error){
            return;
        };

        try{
            if (newMessage.partial){
                newMessage = await newMessage.fetch();
            }
        } catch (error){
            return;
        };

        if (!oldMessage?.author || !newMessage?.author){
            return;
        }

        if (oldMessage.author.bot || newMessage.author.bot){
            return;
        }

        if (newMessage.webhookId || oldMessage.webhookId){
            return;
        }

        const before = oldMessage.content ?? "";
        const after  = newMessage.content ?? "";
        if (before === after){
            return;
        }

        const embed = new EmbedBuilder()
            .setDescription(`**Message sent by ${newMessage.author.username} was edited in **https://discord.com/channels/${newMessage.guildId}/${newMessage.channelId}/${newMessage.id}`)
            .addFields(
                {name: `**Before**`, value: `${before}`},
                {name: `**After**`, value: `${after}`}
            )
            .setAuthor({name: newMessage.author.username, iconURL: newMessage.author.avatarURL()})
            .setColor(0x0099FF)
            .setFooter({text:`User ID: ${newMessage.author.id}`})
            .setTimestamp();
        try {
            // Will be later replaced with database for server customization
            const logChannel = await client.channels.fetch('1410727602259365980');
            await logChannel.send({embeds: [embed]});
        } catch(error) {
            console.error(error);
        }
    }
};