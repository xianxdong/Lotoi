const youtubedl = require("youtube-dl-exec")
const { LinkNotFound } = require("./errors")

class Song {
    constructor(songUrl, interaction){
        this.songUrl = songUrl;
        this.interaction = interaction;
        this.requestedBy = this.interaction.user.username;
        this.title = "";
        this.streamURL = "";
        this.thumbnail = "";
        this.duration = 0;
    }

    async loadMetadata(){
        try {

            const subprocess = await youtubedl.exec(this.songUrl, {dumpSingleJson: true, noWarnings: true, preferFreeFormats: true});
            let output = '';

            for await (const chunk of subprocess.stdout){
                output += chunk.toString();
            };

            const audioData = JSON.parse(output);

            if (!audioData){
                throw new LinkNotFound("Error! Couldn't process and gather music data. Is the link valid?");
            };

            this.title = audioData.title;
            this.thumbnail = audioData.thumbnail;
            this.duration = audioData.duration
            const urlFormat251 = audioData.formats.find(f => f.format_id === '251')?.url;

            if (!urlFormat251){
                throw new Error("Error: Couldn't find a valid stream URL for format 251");
            };

            this.streamURL = urlFormat251;

        } catch (error){
            console.log("Error when processing link")
            if (error.name == "ChildProcessError"){
                return false;
            }
        };
    };

    async createAudioResource(){
        try {
        const { createAudioResource, StreamType } = require("@discordjs/voice");

        if (!this.streamURL){
            throw new LinkNotFound(`Error. streamURL is ${this.streamURL}. Was the metadata loaded?`);
        };

        const audioResource = createAudioResource(this.streamURL, {inputType: StreamType.WebmOpus});
        return audioResource;

        } catch (error){
            console.error(error);
        };
    };

};


module.exports = Song;