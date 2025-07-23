const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const { createAudioPlayer, NoSubscriberBehavior, createAudioResource, StreamType, getVoiceConnection, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const config = require("../config")
const youtubedl = require("youtube-dl-exec");
const MusicQueue = require("../music/MusicQueue");
const queueManager = require("../music/queueManager")
const { InvalidLinkError, EmptyQueueList } = require("../music/errors")

module.exports = {

    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Plays music in a voice channel")
        .addStringOption(option =>
            option
            .setName("url")
            .setDescription("Paste in the youtube music URL")
            .setRequired(true)
        ),

    async execute(interaction){
        await interaction.deferReply()
        const urlLink = interaction.options.getString("url")


        let queue = queueManager.get(interaction.guild.id)
        if (!queue){
            queue = new MusicQueue(interaction.guild.id, interaction);
            queueManager.set(interaction.guild.id, queue)
        }

        // console.log(queue)
        const musicSuccess = queue.addSong(urlLink, interaction);

        if (!musicSuccess){
            await interaction.editReply({content: "Invalid link."})
            return;
        }
        
        

        await interaction.editReply("Testing!")
        
    }
}