const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const { getVoiceConnection, AudioPlayerStatus, entersState , VoiceConnectionStatus, joinVoiceChannel } = require('@discordjs/voice');
const config = require("../../config");
const MusicQueue = require("../../music/GuildMusicQueue");
const queueManager = require("../../music/queueManager");
const { InvalidLinkError, EmptyQueueList } = require("../../music/errors");

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
        const urlLink = interaction.options.getString("url");
        const embed = new EmbedBuilder()
            .setTimestamp()
            .setColor(config.red)
            .setFields({name: "", value: "Please join a vc"});

        if (interaction.member.voice.channelId === null){
            await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
            return;
        }

        try {
            await interaction.deferReply();
            const existingConnection = getVoiceConnection(interaction.guild.id);

            if (!existingConnection){
                joinVoiceChannel({
                    channelId: interaction.member.voice.channelId,
                    guildId: interaction.guild.id,
                    adapterCreator: interaction.guild.voiceAdapterCreator
                });
            };

            let queue = queueManager.get(interaction.guild.id);
            if (!queue){
                queue = new MusicQueue(interaction.guild.id, interaction);
                queueManager.set(interaction.guild.id, queue);
            }

            const musicSuccess = await queue.addSong(urlLink, interaction);

            if (!musicSuccess){
                embed.setFields({name: "", value: "Invalid link provided."});
                await interaction.editReply({embeds: [embed]});
                return;
            }
            
            const songList = queue.getSongList();

            if (songList.length > 0){
                const song = songList[songList.length - 1];
                embed.setFields({name: "", value: `[${song.title}](${song.songUrl}) -[${song.duration}]`}).setColor(config.green)
                .setAuthor({name: `Added song to queue #${songList.length + 1}`, iconURL: interaction.user.avatarURL()});
            } else if (songList.length === 0){
                const song = queue.getCurrentSong();
                embed.setFields({name: "", value: `[${song.title}](${song.songUrl}) -[${song.duration}]`}).setColor(config.green)
                .setAuthor({name: `Added song to queue #${songList.length + 1}`, iconURL: interaction.user.avatarURL()});
            };

            await interaction.editReply({embeds: [embed]});
            
        } catch (error){
            console.error(error);
            await interaction.editReply("Error fetching audio. Please try again");
        };
    }
};