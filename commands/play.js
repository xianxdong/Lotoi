const { SlashCommandBuilder, EmbedBuilder, MessageFlags, VoiceConnectionStates } = require("discord.js");
const { createAudioPlayer, NoSubscriberBehavior, createAudioResource, StreamType, getVoiceConnection } = require('@discordjs/voice');
const config = require("../config")

module.exports = {

    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Plays music in a voice channel"),

    async execute(interaction){

        const player = createAudioPlayer({behaviors : {noSubscriber: NoSubscriberBehavior.Pause}});
        const audioResource = createAudioResource("C:/Users/Xiang/Desktop/Projects/discord bot/Proi Proi.mp3", {inputType: StreamType.Arbitrary})
        const connection = getVoiceConnection(interaction.guild.id);

        connection.subscribe(player)
        player.play(audioResource)
        

        player.on('stateChange', (oldState, newState) => {
            console.log(`Audio player transitioned from ${oldState.status} to ${newState.status}`);
        });

        connection.on(VoiceConnectionStates.Disconnected, () =>{
            console.log("Bot has disconnected. Destorying audioplayer")
            player.stop()
        })

    }   

}