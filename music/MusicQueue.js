const { EmbedBuilder, embedLength } = require("discord.js");
const { createAudioPlayer, NoSubscriberBehavior, getVoiceConnection, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const config = require("../config")
const Song = require('./Song')
const { VoiceConnectionError, EmptyQueueList } = require('./errors');
const ms = require("ms")

class MusicQueue {

    constructor(guildId, interaction){
        this.guildId = guildId;
        this.interaction = interaction;
        this.voiceConnection = getVoiceConnection(guildId);
        this.audioPlayer = createAudioPlayer({behaviors : {noSubscriber: NoSubscriberBehavior.Pause}});
        this.songList = [];
        this.currentSong = null;
        this.isPlaying = false
        this.idleTime = null
        this.channel = this.interaction.channel

        if (!this.voiceConnection){
            throw new VoiceConnectionError(`Error. No voice connection found for guild: ${guildId}`);
        };
        
        this.voiceConnection.subscribe(this.audioPlayer);

        this.audioPlayer.on('stateChange', (oldState, newState) => {
            console.log(`Audio player in ${this.interaction.guild.name} transitioned from ${oldState.status} to ${newState.status}`);
        });

        this.voiceConnection.on(VoiceConnectionStatus.Destroyed, async () =>{
            console.log(`Bot has disconnected in ${this.interaction.guild.name}. Destorying audioplayer`);
            this.audioPlayer.stop(true);
        });

        this.audioPlayer.on(AudioPlayerStatus.Idle, async () => {
            this.currentSong = null;
            this.isPlaying = false;

            if (this.songList.length === 0){
                if (!this.idleTime){
                    this.idleTime = setTimeout(() => {
                        console.log(`Bot in ${this.interaction.guild.name} was idle for 5 minutes. Disconnecting bot`);
                        this.channel.send("Leaving the voice channel due to inactivity.")

                        if (this.voiceConnection){
                            this.voiceConnection.destroy();
                        }

                        this.idleTime = null;

                    }, ms("5m"));
                }
                return;
            }
            try {
                await this.playNext();
            } catch (error) {
                if (error instanceof EmptyQueueList){
                    console.log(`Queue ended for ${this.guildId}`);

                    if (this.channel){
                        this.channel.send("The queue has ended. Add more songs to continue")
                    }
                } else {
                    console.error(error)
                }
            };
        });
    };

    pause(){
        this.audioPlayer.pause();
    };

    resume(){
        this.audioPlayer.unpause();
    };

    async addSong(musicUrl, interaction){
        const song = new Song(musicUrl, interaction);
        const loadSuccess = await song.loadMetadata();
        // const embed = new EmbedBuilder()
        //     .setColor("#7bb1f5")
        //     .setTimestamp()
        //     .setTitle(`Now playing: ${song.title}`)
        //     .setURL(musicUrl)
        //     .setThumbnail(song.thumbnail)
        //     .setAuthor({name: interaction.user.username, iconURL: interaction.user.avatarURL()});

        // this.channel.send({embeds: [embed]});
        if (loadSuccess === false){
            return false;
        }

        this.songList.push(song);
        
        if (!this.isPlaying) {
            await this.playNext();
        }

        return true;
    }

    async playNext(failCount = 0){
        if (this.songList.length === 0){
            this.currentSong = null;
            this.isPlaying = false;
            throw new EmptyQueueList(`Error! The queue is empty`);
        } 
        
        if (this.idleTime){
            clearTimeout(this.idleTime);
            this.idleTime = null;
        }

        if (this.isPlaying === true){
            return;
        }

        const nextSong = this.songList.shift();
        this.currentSong = nextSong;

        const embed = new EmbedBuilder()
            .setColor("#7bb1f5")
            .setTimestamp()
            .setTitle(`${this.currentSong.title}`)
            .setURL(this.currentSong.songUrl)
            .setThumbnail(this.currentSong.thumbnail)
            .setAuthor({name: "MUSIC PANEL", iconURL: this.interaction.user.avatarURL()})

        try {
            const resource = await nextSong.createAudioResource();
            this.audioPlayer.play(resource);
            this.isPlaying = true;
            this.channel.send({embeds: [embed]});

        } catch (error){
            console.error(`Failed to load and play ${nextSong.title}. Trying next song. Error: ${error}`);

            if (failCount < 3){
                console.log(`Retrying next song ... (${failCount + 1}/3)`);
                this.isPlaying = false;
                await this.playNext(failCount + 1);
            } else {
                console.log("Max automatic song retries reached. Stopping playback.");
                this.isPlaying = false;
                this.currentSong = null;
            }
        };
    };

    async stop(){
        try {
            this.audioPlayer.stop(true);
            this.songList = [];
            this.currentSong = null;
            this.isPlaying = false;

            if (this.idleTime){
                clearTimeout(this.idleTime);
                this.idleTime = null;
            };
            
            if (this.voiceConnection){
                this.voiceConnection.disconnect();
                console.log(`Disconnected from voice in guild ${this.guildId}`);
            };

        } catch (error){
            console.error(error);
        };
    };

    async skip(){
        try {
            this.audioPlayer.stop(true);
        } catch (error){
            console.error(`Failed to skip song: ${error}`);
        };
    };

};


module.exports = MusicQueue;