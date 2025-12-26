/**
 * QueueState
 *
 * Local mirror state for the guild music queue.
 */
class QueueState {
    constructor() {
        this.songList = [];
        this.currentSong = null;
        this.isPlaying = false;
        this.repeatSong = false;
    }

    resetPlaybackState() {
        this.songList = [];
        this.currentSong = null;
        this.isPlaying = false;
    }
}

module.exports = QueueState;
