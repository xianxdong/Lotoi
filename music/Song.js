const { formatDuration } = require("./AudioLengthFormatHelper");

class Song {
    constructor(query, interaction) {
        this.query = query;
        this.interaction = interaction;
        this.requestedBy = this.interaction.user.username;
        this.songUrl = "";

        this.title = "";
        this.thumbnail = "";
        this.duration = 0;      // formatted string (set after load)
        this.results = null;    // Moonlink search result
        this.track = null;      // Moonlink track object (first track)
    }

    async loadMetadata() {
        try {
            const manager = this.interaction.client.manager;

            const results = await manager.search({
                query: this.query,
                source: "youtube",
                requester: this.requestedBy
            });

            if (!results || !Array.isArray(results.tracks) || results.tracks.length === 0) {
                // No tracks resolved (bad URL or nothing found)
                return false;
            }

            const track = results.tracks[0];
            this.results = results;
            this.track = track;

            this.songUrl = track.url || "";
            this.title = track.title || "(untitled)";
            this.thumbnail = track.artworkUrl || "";
            // Moonlink durations are milliseconds
            this.duration = formatDuration(track.duration || 0);

            return true; // success
        } catch (error) {
            console.log("Error when processing query:", error?.message || error);
            return false;
        };
    };

    async createAudioResource(player) {
        try {
            if (!this.track) {
                throw new Error("Track not loaded. Call loadMetadata() and check its return value before enqueuing.");
            };
			
            await player.queue.add(this.track);
			return true
        } catch (error) {
            console.error(error);
			return false
        };
    };
};

module.exports = Song;