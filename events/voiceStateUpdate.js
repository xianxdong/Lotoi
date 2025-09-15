const queueManager = require("../music/queueManager");
const { Events, NewsChannel } = require("discord.js")

module.exports = {

    name: Events.VoiceStateUpdate,

    async execute(oldState, newState){

        const botId = newState.client.user?.id;
        if (!botId || newState.id !== botId) return;

        const wasIn = oldState.channelId;
        const nowIn = newState.channelId;

        // Bot was moved between channels.
        if (wasIn && nowIn && (wasIn !== nowIn)){
            console.log(`[Voice] Bot moved: ${oldState.channel?.name} -> ${newState.channel?.name} in ${newState.guild.name}`);
            return;
        };

        // Bot was manually disconnected by a admin
        if (wasIn && !nowIn){
            console.log(`[Voice] Bot disconnected from ${oldState.channel?.name} in ${newState.guild.name}`);
            const guildId = newState.guild.id;
            const queue = queueManager.get(guildId);

            if (queue){
                try {
                    await queue.stop();
                } catch (error){
                    console.error("Error in [voiceStateUpdate]: Stopping queue");
                }
                queueManager.delete(guildId);
            };
        };
    }
};