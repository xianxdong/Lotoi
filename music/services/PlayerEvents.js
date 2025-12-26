/**
 * PlayerEvents
 *
 * Attaches/detaches Moonlink manager events for a guild, delegating to callbacks.
 */
class PlayerEvents {
    constructor({ manager, guildId, callbacks }) {
        this.manager = manager;
        this.guildId = guildId;
        this.callbacks = callbacks;
        this._handlers = null;
        this._attached = false;
    }

    attach() {
        if (this._attached) return;

        this._handlers = {
            trackStart: (player, track) => {
                if (player.guildId !== this.guildId) return;
                this.callbacks.trackStart?.(player, track);
            },
            trackEnd: (player, track, payload) => {
                if (player.guildId !== this.guildId) return;
                this.callbacks.trackEnd?.(player, track, payload);
            },
            queueEnd: (player) => {
                if (player.guildId !== this.guildId) return;
                this.callbacks.queueEnd?.(player);
            },
            playerDisconnected: (player) => {
                if (player.guildId !== this.guildId) return;
                this.callbacks.playerDisconnected?.(player);
            },
            playerDestroyed: (player) => {
                if (player.guildId !== this.guildId) return;
                this.callbacks.playerDestroyed?.(player);
            }
        };

        this.manager.on("trackStart", this._handlers.trackStart);
        this.manager.on("trackEnd", this._handlers.trackEnd);
        this.manager.on("queueEnd", this._handlers.queueEnd);
        this.manager.on("playerDisconnected", this._handlers.playerDisconnected);
        this.manager.on("playerDestroyed", this._handlers.playerDestroyed);

        this._attached = true;
    }

    detach() {
        if (!this._attached || !this._handlers) return;

        try {
            this.manager.off("trackStart", this._handlers.trackStart);
            this.manager.off("trackEnd", this._handlers.trackEnd);
            this.manager.off("queueEnd", this._handlers.queueEnd);
            this.manager.off("playerDisconnected", this._handlers.playerDisconnected);
            this.manager.off("playerDestroyed", this._handlers.playerDestroyed);
        } catch {}

        this._attached = false;
        this._handlers = null;
    }

    get attached() {
        return this._attached;
    }
}

module.exports = PlayerEvents;
