/**
 * GuildMusicQueue
 * 
 * A Moonlink-backed music queue and playback coordinator for a single guild.
 * 
 * Responsibilities
 * - Owns and manages a single Moonlink player instance for a guild.
 * - Mirrors a lightweight local queue (songList) for UI/embeds and UX, while delegating
 *   the actual audio queueing/streaming to Moonlink's player/queue.
 * - Attaches one set of manager-level event listeners (trackStart/trackEnd/queueEnd/etc.)
 *   and ensures they are detached on teardown to avoid duplicate handlers.
 * - Produces/maintains a "Now Playing" embed (isPlayingMessage) and cleans it up across
 *   all end/stop/disconnect paths.
 * - Applies a small suppression window for queueEnd caused by manual stop(), but not skip().
 *
 * Notes
 * - Ensure the player is connected using ensureConnection() before attempting to add/play.
 * - Song durations are formatted upstream; this class does not transform durations.
 * - This class respects repeatSong at a simple, single-track level (re-enqueue current).
 */

const { EmbedBuilder } = require("discord.js");
const config = require("../config");
const Song = require("./Song");
const ms = require("ms");
const queueManager = require("../music/queueManager");
const { ensureMoonlinkConnection } = require("./ensureMoonlinkConnection");

class MusicQueue {
    /**
     * @param {string} guildId - Discord guild ID
     * @param {import('discord.js').ChatInputCommandInteraction} interaction - The interaction that created/uses this queue
     */
    constructor(guildId, interaction) {
        this.guildId = guildId;
        this.interaction = interaction;
        this.manager = interaction.client.manager;

        // A Moonlink player instance (set/updated by ensureConnection)
        this.player = this.manager.players.get(guildId) || null;

        // Local mirror for UX and embeds (Moonlink handles the real playback queue)
        this.songList = [];      // Array<Song>
        this.currentSong = null; // Song | null
        this.isPlaying = false;  // True when Moonlink is actively playing a track

        // Idle-eject timer (cleared on new playback)
        this.idleTime = null;
        this.channel = this.interaction.channel; // Text channel for embeds/notifications
        this.repeatSong = false;                 // Simple repeat of the current song
        this.isPlayingMessage = null;            // Message for the "MUSIC PANEL" embed

        // Listener bookkeeping to avoid duplicate manager.on(...) registrations
        this._listenersAttached = false;
        this._handlers = null;

        // Suppress spurious queueEnd only for manual stop (not for skip)
        // This mitigates false-positive queueEnd that can emit during manual teardown.
        this._suppressQueueEnd = false;
        this._suppressClearTimer = null;

        if (this.player) {
            this._attachPlayerListeners();
        }
    }

    /**
     * @returns {Song|null} The current song (local mirror), or null if none
     */
    getCurrentSong() {
        return this.currentSong;
    }

    /**
     * @returns {Song[]} An array (copy) of pending songs in the local mirror
     */
    getSongList() {
        return this.songList;
    }

    /**
     * Ensure a Moonlink player exists and is connected for this guild,
     * and that event listeners are attached exactly once.
     *
     * Returns the player on success, or null on failure.
     */
    async ensureConnection({ voiceChannelId, textChannelId, setDeaf = true, botMember = null } = {}) {
        // If we already have a player instance, ensure we have listeners and return.
        if (this.player && !this._listenersAttached) {
            this._attachPlayerListeners();
            return this.player;
        }

        // Ensure/establish a connection using the helper (fixed 500ms internal wait)
        const result = await ensureMoonlinkConnection(
            this.manager,
            this.interaction.guild,
            voiceChannelId ?? this.interaction.member.voice.channelId,
            textChannelId ?? this.interaction.channel.id,
            { setDeaf, botMember: botMember ?? (this.interaction.guild.members.me) }
        );

        if (!result?.ok) return null;

        // If we replaced the underlying player instance, detach old listeners first
        if (this.player && this.player !== result.player) {
            this._detachPlayerListeners();
        }

        this.player = result.player;
        this._attachPlayerListeners();
        return this.player;
    }

    /**
     * Pause playback (no-op if player missing or not playing).
     */
    pause() {
        try { this.player?.pause?.(true); } catch {}
    }

    /**
     * Resume playback (no-op if player missing).
     */
    resume() {
        try { this.player?.pause?.(false); } catch {}
    }

    /**
     * Add a song by URL or query. Enqueues into Moonlink and starts playback if idle.
     * Returns false on resolution failure, true otherwise.
     */
    async addSong(musicUrl, interaction) {
        // Lazily ensure a player exists and listeners are attached
        if (!this.player) {
            await this.ensureConnection({
                voiceChannelId: interaction.member.voice.channelId,
                textChannelId: interaction.channel.id,
                botMember: interaction.guild.members.me
            });
        }
        if (!this.player) return false;

        // Resolve metadata via Song helper (Moonlink search) 
        const song = new Song(musicUrl, interaction);
        const loadSuccess = await song.loadMetadata();
        if (!loadSuccess) return false;

        // Track order for UX: maintain a local mirror list
        this.songList.push(song);

        // Enqueue into Moonlink (Song helper pushes the resolved track into player.queue)
        await song.createAudioResource(this.player);

        // If player is idle, start playback
        try {
            if (!this.player.playing) {
                await this.player.play();
            }
        } catch {}

        return true;
    }

    /**
     * Stop and teardown playback and the player, clearing the queue mirror and UI.
     * - Applies queueEnd suppression (stop-induced queueEnd bursts are ignored).
     * - Detaches listeners and destroys the player instance.
     */
    async stop() {
        try {
            // Suppress queueEnd that might be emitted by stop/destroy
            this._setQueueEndSuppression();

            // Clear local state
            this.songList = [];
            this.currentSong = null;
            this.isPlaying = false;

            if (this.idleTime) {
                clearTimeout(this.idleTime);
                this.idleTime = null;
            }

            // Delete the playing panel if present
            await this._deleteIsPlayingMessage();

            // Detach listeners first to prevent ghost handlers
            this._detachPlayerListeners();

            // Tear down the Moonlink player
            if (this.player) {
                try { this.player.queue?.clear?.(); } catch {}
                try { this.player.stop?.(); } catch {}
                try { this.player.destroy?.(); } catch {}
                try { this.manager.players.delete(this.guildId); } catch {}
                this.player = null;
            }
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * Skip the current song.
     * - Uses player.skip() when available (preferred).
     * - Falls back to player.stop() to end playback if there is no "next" track.
     * - Intentionally does NOT use queueEnd suppression for skip per current behavior.
     */
    async skip() {
        try {
            if (!this.player) return;

            // Preferred: use Moonlink's native skip if available
            if (typeof this.player.skip === "function") {
                let didSkip = true;
                try {
                    // Some implementations resolve to truthy/falsy; others resolve void.
                    const result = await this.player.skip();
                    if (typeof result === "boolean") didSkip = result;
                } catch (e) {
                    // Common when there's no next track; fall through to stop()
                    didSkip = false;
                }

                if (didSkip) return;
                // No next track to advance to — fall back to stopping the current one
            }

            // Fallback: stop the current track (ends playback when no next is queued)
            await this.player.stop?.();
        } catch (error) {
            console.error(`Failed to skip song: ${error}`);
        }
    }

    /**
     * Safely delete the current "Now Playing" message and clear the reference.
     * Clears the property first to avoid races with multiple delete attempts.
     */
    async _deleteIsPlayingMessage() {
        const msg = this.isPlayingMessage;
        this.isPlayingMessage = null; // clear first to avoid races
        if (!msg) return;
        try {
            // If deletable is exposed and false, respect it, but still guard with try/catch.
            if (typeof msg.deletable === "boolean" && !msg.deletable) return;
            await msg.delete().catch(() => {});
        } catch {}
    }

    /**
     * Clear the queueEnd suppression flag and its timer (if any).
     * Called on trackStart or when the suppression window elapses.
     */
    _clearQueueEndSuppression() {
        this._suppressQueueEnd = false;
        if (this._suppressClearTimer) {
            clearTimeout(this._suppressClearTimer);
            this._suppressClearTimer = null;
        }
    }

    /**
     * Temporarily ignore queueEnd events (e.g., those emitted by manual stop/destroy).
     * The suppression auto-clears after a short window or when a new track starts.
     * @param {number} msWindow - Milliseconds to keep suppression active (default 1500ms)
     */
    _setQueueEndSuppression(msWindow = 1500) {
        // Ignore the next queueEnd for a short window or until trackStart
        this._suppressQueueEnd = true;
        if (this._suppressClearTimer) clearTimeout(this._suppressClearTimer);
        this._suppressClearTimer = setTimeout(() => {
            this._clearQueueEndSuppression();
        }, msWindow);
    }

    /**
     * Attach manager-level Moonlink listeners exactly once for this queue instance.
     * Handlers:
     *  - trackStart: update "currentSong" mirror, post music panel, clear suppression/idle.
     *  - trackEnd:  clean up panel; process repeat mode.
     *  - queueEnd:  handle genuine end-of-queue; schedule idle teardown; suppress on stop.
     *  - playerDisconnected/playerDestroyed: clean up panel and internal state.
     */
    _attachPlayerListeners() {
        if (this._listenersAttached || !this.player) return;

        // Bind once per instance
        this._handlers = {
            trackStart: (player, track) => {
                if (player.guildId !== this.guildId) return;

                // Cancel any pending idle timeout when playing resumes
                if (this.idleTime) {
                    clearTimeout(this.idleTime);
                    this.idleTime = null;
                }

                // New track started; any manual suppression can end now
                this._clearQueueEndSuppression();

                // Advance local mirror exactly once per start (unless repeating)
                if (!this.repeatSong) {
                    if (this.songList.length > 0) {
                        this.currentSong = this.songList.shift();
                    } else {
                        // If queue was manipulated externally, keep current as-is
                        this.currentSong = this.currentSong || null;
                    }
                }
                this.isPlaying = true;

                // Post/update the "MUSIC PANEL" embed
                if (this.currentSong) {
                    const embed = new EmbedBuilder()
                        .setColor(config.blurple || "#7bb1f5")
                        .setTimestamp()
                        .setFields({
                            name: "",
                            value: `[${this.currentSong.title}](${this.currentSong.songUrl}) **-** \`[${this.currentSong.duration}]\``
                        })
                        .setThumbnail(this.currentSong.thumbnail || null)
                        .setAuthor({ name: "MUSIC PANEL", iconURL: this.interaction.user.avatarURL() });

                    (async () => {
                        try {
                            await this._deleteIsPlayingMessage();
                            this.isPlayingMessage = await this.channel.send({ embeds: [embed] });
                        } catch {
                            // ignore: likely missing perms
                        }
                    })();
                }
            },

            trackEnd: (player, track, payload) => {
                if (player.guildId !== this.guildId) return;

                // If repeat mode: re-enqueue the currentSong's track to loop
                if (this.repeatSong && this.currentSong?.track) {
                    try {
                        // Re-add the last current song back to the front
                        this.currentSong.createAudioResource(this.player);
                        this.songList.unshift(this.currentSong);
                    } catch {}
                }

                // Delete panel on end of a track
                void this._deleteIsPlayingMessage();

                this.isPlaying = false;
            },

            queueEnd: (player) => {
                if (player.guildId !== this.guildId) return;

                // Ignore queueEnd bursts caused by manual stop (suppression not applied to skip)
                if (this._suppressQueueEnd) {
                    this._clearQueueEndSuppression();
                    return;
                }

                // Guard against spurious queueEnd on races (e.g., stop before next starts)
                const queueSize =
                    (player.queue?.size ?? player.queue?.length ?? player.queue?.tracks?.length ?? 0);
                if (queueSize > 0 || player.playing) {
                    return; // there is still something queued/playing; ignore false-positive
                }

                this.isPlaying = false;
                this.currentSong = null;

                // Delete panel when the queue actually ends
                void this._deleteIsPlayingMessage();

                (async () => {
                    try {
                        if (this.channel) {
                            await this.channel.send("The queue has ended. Add more songs to continue.");
                        }
                    } catch {}
                })();

                // Only schedule ONE idle timeout per queue instance
                if (!this.idleTime) {
                    this.idleTime = setTimeout(async () => {
                        try {
                            if (this.channel) {
                                await this.channel.send("Leaving the voice channel due to inactivity.");
                            }
                        } catch {}

                        // Teardown queue and remove from manager on idle
                        await this.stop();              // detaches listeners and deletes message
                        try { queueManager.delete(this.guildId); } catch {}
                        this.idleTime = null;
                    }, ms("5m"));
                }
            },

            playerDisconnected: (player) => {
                if (player.guildId !== this.guildId) return;
                this.isPlaying = false;
                // Delete panel on disconnect
                void this._deleteIsPlayingMessage();
            },

            playerDestroyed: (player) => {
                if (player.guildId !== this.guildId) return;
                this.isPlaying = false;
                // Delete panel and detach to prevent ghost handlers persisting after destroy
                void this._deleteIsPlayingMessage();
                this._detachPlayerListeners();
                this.player = null;
            }
        };

        // Attach to manager-level events (Moonlink emits these on the manager)
        this.manager.on("trackStart", this._handlers.trackStart);
        this.manager.on("trackEnd", this._handlers.trackEnd);
        this.manager.on("queueEnd", this._handlers.queueEnd);
        this.manager.on("playerDisconnected", this._handlers.playerDisconnected);
        this.manager.on("playerDestroyed", this._handlers.playerDestroyed);

        this._listenersAttached = true;
    }

    /**
     * Detach manager-level listeners if attached, and clear handler refs.
     * Safe to call multiple times.
     */
    _detachPlayerListeners() {
        if (!this._listenersAttached || !this._handlers) return;

        try {
            this.manager.off("trackStart", this._handlers.trackStart);
            this.manager.off("trackEnd", this._handlers.trackEnd);
            this.manager.off("queueEnd", this._handlers.queueEnd);
            this.manager.off("playerDisconnected", this._handlers.playerDisconnected);
            this.manager.off("playerDestroyed", this._handlers.playerDestroyed);
        } catch {}

        this._listenersAttached = false;
        this._handlers = null;
    }
}

module.exports = MusicQueue;