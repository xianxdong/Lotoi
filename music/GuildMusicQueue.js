const { EmbedBuilder } = require("discord.js");
const { createAudioPlayer, NoSubscriberBehavior, getVoiceConnection, AudioPlayerStatus, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const config = require("../config")
const Song = require('./Song')
const { VoiceConnectionError, EmptyQueueList } = require('./errors');
const ms = require("ms")
const queueManager = require("../music/queueManager")

class MusicQueue {

    constructor(guildId, interaction){
        this.guildId = guildId;
        this.interaction = interaction;
        this.voiceConnection = getVoiceConnection(guildId) || null;
        this.audioPlayer = createAudioPlayer({behaviors : {noSubscriber: NoSubscriberBehavior.Pause}});
        this.songList = [];
        this.currentSong = null;
        this.isPlaying = false;
        this.idleTime = null;
        this.channel = this.interaction.channel;
        this.repeatSong = false;
        this.isPlayingMessage = null;

        // if (!this.voiceConnection){
        //     throw new VoiceConnectionError(`Error. No voice connection found for guild: ${guildId}`);
        // };
        
        // this.voiceConnection.subscribe(this.audioPlayer);

        this.audioPlayer.on('stateChange', (oldState, newState) => {
            console.log(`Audio player in ${this.interaction.guild.name} transitioned from ${oldState.status} to ${newState.status}`);
        });

        // this.setupConnectionListeners(this.voiceConnection);

        if (this.voiceConnection){
            this.voiceConnection.subscribe(this.audioPlayer);
            this.setupConnectionListeners(this.voiceConnection);
        }

        this.audioPlayer.on(AudioPlayerStatus.AutoPaused, async () => {
            this.audioPlayer.stop(true);
        });

        this.audioPlayer.on(AudioPlayerStatus.Idle, async () => {
            this.isPlaying = false;

            this.voiceConnection = getVoiceConnection(guildId) || null;

            if (this.voiceConnection){
                if (this.songList.length === 0){
                    this.currentSong = null;

                    if (!this.idleTime){
                        this.idleTime = setTimeout( async () => {

                            console.log(`Bot in ${this.interaction.guild.name} was idle for 5 minutes. Disconnecting bot`);

                            try{
                                if (this.channel){
                                    await this.channel.send("Leaving the voice channel due to inactivity.");
                                };
                            } catch (error){
                                console.error("Error: Failed to send inactivity message in chat");
                            };


                            if (this.voiceConnection && this.voiceConnection.state.status !== VoiceConnectionStatus.Destroyed){
                                this.stop()
                                queueManager.delete(this.guildId);
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
                            await this.channel.send("The queue has ended. Add more songs to continue")
                        }
                    } else {
                        console.error(error)
                    };
                };
            };
        });
    };

    getCurrentSong(){
        return this.currentSong;
    }

    getSongList(){
        return this.songList;
    }

    setupConnectionListeners(voiceConnection){
        this.voiceConnection = voiceConnection;

        if (this.voiceConnection.listenerCount(VoiceConnectionStatus.Disconnected) > 0){
            return;
        };

        this.voiceConnection.on(VoiceConnectionStatus.Disconnected, async () => {
            try {
                await Promise.race([
                    entersState(this.voiceConnection, VoiceConnectionStatus.Signalling, 1_000),
                    entersState(this.voiceConnection, VoiceConnectionStatus.Connecting, 1_000),
                ]);
                // Seems to be reconnecting to a new channel - ignore disconnect
            } catch {
                // Seems to be a real disconnect which SHOULDN'T be recovered from
                if (this.voiceConnection.state.status !== VoiceConnectionStatus.Destroyed){
                    this.voiceConnection.destroy();

                if (this.idleTime){
                    clearTimeout(this.idleTime);
                    this.idleTime = null;
                };
                };       
            };
        });

        this.voiceConnection.on(VoiceConnectionStatus.Destroyed, async () => {
            console.log(`Bot has disconnected in ${this.interaction.guild.name}. Destorying audioplayer`);
            this.audioPlayer.stop(true); //sets audioplayer to idle
            this.voiceConnection = null;
        });

    };

    async ensureConnection(joinOptions){
        const { joinVoiceChannel, VoiceConnectionStatus } = require('@discordjs/voice');

        if (this.voiceConnection && this.voiceConnection.state.status !== VoiceConnectionStatus.Destroyed){
            this.voiceConnection.subscribe(this.audioPlayer);
            this.setupConnectionListeners(this.voiceConnection);
            return this.voiceConnection;
        };

        this.voiceConnection = joinVoiceChannel(joinOptions);
        this.voiceConnection.subscribe(this.audioPlayer);
        this.setupConnectionListeners(this.voiceConnection);
        return this.voiceConnection;

    }

    pause(){
        this.audioPlayer.pause();
    };

    resume(){
        this.audioPlayer.unpause();
    };

    async addSong(musicUrl, interaction){
        const song = new Song(musicUrl, interaction);
        const loadSuccess = await song.loadMetadata();
        
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
        try {
            const connection = getVoiceConnection(this.guildId);
            if (!connection || connection.state.status === VoiceConnectionStatus.Destroyed){
                throw new VoiceConnectionError("Error: No active voice connection. ensureConnection must be called first.");
            } else {
                this.voiceConnection = connection;
            }
        } catch (error){
            console.error(error);
        };

        if (this.songList.length === 0){
            this.currentSong = null;
            this.isPlaying = false;
            throw new EmptyQueueList(`Error! The queue is empty`);
        };

        if (this.idleTime){
            clearTimeout(this.idleTime);
            this.idleTime = null;
        };

        if (this.isPlaying === true){
            return;
        };

        if (this.repeatSong === false){
            const nextSong = this.songList.shift();
            this.currentSong = nextSong;
        } else {
            const nextSong = this.songList[0];
            this.currentSong = nextSong;
        }

        const embed = new EmbedBuilder()
            .setColor("#7bb1f5")
            .setTimestamp()
            .setFields({name: "", value: `[${this.currentSong.title}](${this.currentSong.songUrl}) **-** \`[${this.currentSong.duration}]\``})
            .setThumbnail(this.currentSong.thumbnail)
            .setAuthor({name: "MUSIC PANEL", iconURL: this.interaction.user.avatarURL()})

        try {
            if (this.isPlayingMessage){
                try {
                    await this.isPlayingMessage.delete();
                } catch (error){
                    console.error(error);
                };
            };
            const resource = await this.currentSong.createAudioResource();
            this.audioPlayer.play(resource);
            this.isPlaying = true;

            try {
                this.isPlayingMessage = await this.channel.send({embeds: [embed]});
            } catch (error){
                console.log(`Error: Couldn't send music panel in ${this.guildId}. Likely due to insufficient bot permissions.`);
            }
            
        } catch (error){
            console.error(`Failed to load and play ${this.currentSong.title}. Trying next song. Error: ${error}`);

            if (failCount < 3){
                console.log(`Retrying next song ... (${failCount + 1}/3)`);
                this.isPlaying = false;
                await this.playNext(failCount + 1);
            } else {
                console.log("Max automatic song retries reached. Stopping playback.");
                this.isPlaying = false;
                this.currentSong = null;
            };
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
            
            if (this.voiceConnection && this.voiceConnection.state.status !== VoiceConnectionStatus.Destroyed){
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