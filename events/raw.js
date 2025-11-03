const { Events } = require("discord.js");

module.exports = {

    name: Events.Raw,
    async execute(packet, client){
        const packetType = packet?.t;

        const isVoicePacket = packetType === "VOICE_STATE_UPDATE" || packetType === "VOICE_SERVER_UPDATE";

        if (!isVoicePacket) return;
        
        if (typeof client.manager?.packetUpdate === "function"){
            client.manager.packetUpdate(packet);
        } else if (typeof client.manager?.updateVoiceState === "function") {
            client.manager.updateVoiceState(packet);
        } else {
            console.error("Moonlink manager is missing both packetUpdate and updateVoiceState methods.")
        };
    },
};