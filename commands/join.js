const { SlashCommandBuilder, EmbedBuilder, MessageFlags, VoiceConnectionStates } = require("discord.js");
const { joinVoiceChannel, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const config = require("../config")

module.exports = {

    data: new SlashCommandBuilder()
        .setName("join")
        .setDescription("Joins the vc the member is in"),
    
    async execute(interaction){
        const botInfo = await interaction.guild.members.fetch(config.clientId);
        const embed = new EmbedBuilder()
            .setTimestamp()
            .setColor(config.red)
            .setFields({name: "", value: "Please join a vc"})
        
        if (interaction.member.voice.channelId === null){
            await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
            return;
        } else if (botInfo.voice.channelId === interaction.member.voice.channelId){
            embed.setFields({name: "", value: "I'm already in the vc channel"})
            await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
            return;
        } 
        // else if (botInfo.voice.channelId !== interaction.member.voice.channelId){
        //     connection.channelId = interaction.member.voice.channelId
        // }

        try {
            await interaction.deferReply();
            const connection = joinVoiceChannel({
                channelId: interaction.member.voice.channelId,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator
            });

            embed.setFields({name: "", value: "Successfully connected to VC"}).setColor(config.green);
            await interaction.editReply({embeds: [embed]});
            
            connection.on('stateChange', (oldState, newState) => {
	            console.log(`Connection in ${interaction.guild.name} transitioned from ${oldState.status} to ${newState.status}`);
            });

            connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
            try {
                await Promise.race([
                    entersState(connection, VoiceConnectionStatus.Signalling, 1_000),
                    entersState(connection, VoiceConnectionStatus.Connecting, 1_000),
                ]);
                // Seems to be reconnecting to a new channel - ignore disconnect
            } catch {
                // Seems to be a real disconnect which SHOULDN'T be recovered from
                connection.destroy();
                
            }
        });

        } catch (error){
            console.error(error)
            connection.destroy();
        }
    }
}