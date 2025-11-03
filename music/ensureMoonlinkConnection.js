"use strict";

const { waitForConnect } = require("./waitForConnect");

/**
 * Ensure the Moonlink player is created, connected, and ready for the given guild/VC.
 *
 * Behavior:
 * - Resets stale players (not connected, missing voiceChannelId, or bot not in a VC).
 * - Syncs player voice/text channels.
 * - Connects once and waits briefly (fixed 500 ms in waitForConnect) for playerConnected/playerReady.
 * - If events are late, accepts success if the bot's voice state is already in the target VC.
 * - If still not confirmed, does a single destroy+recreate+retry.
 *
 * Note: The connection wait timeout is fixed at 500 ms in waitForConnect. To change it,
 * you must edit DEFAULT_TIMEOUT_MS in music/waitForConnect.js.
 *
 * @param {import("moonlink.js").MoonlinkManager} manager
 * @param {import("discord.js").Guild} guild
 * @param {string} voiceChannelId
 * @param {string} textChannelId
 * @param {{
 *   retry?: boolean,         // default: true
 *   yieldMs?: number,        // default: 50
 *   setDeaf?: boolean,       // default: true
 *   botMember?: import("discord.js").GuildMember
 * }} [opts]
 * @returns {Promise<{ ok: boolean, player: any, created: boolean, retried: boolean, usedVoiceStateFallback: boolean }>}
 */
async function ensureMoonlinkConnection(manager, guild, voiceChannelId, textChannelId, opts = {}) {
    const setDeafOnConnect = opts.setDeaf !== false;
    const teardownYieldMs = typeof opts.yieldMs === "number" ? opts.yieldMs : 50;
    const shouldRetryOnce = opts.retry !== false;

    const guildId = guild.id;
    const cachedBotMember = opts.botMember ?? guild.members.me ?? null;

    let createdNewPlayer = false;
    let attemptedRetry = false;
    let usedVoiceStateFallback = false;

    let moonlinkPlayer = manager.players.get(guildId);

    const isPlayerStale = () => {
        const botNotInAnyVoiceChannel = !cachedBotMember?.voice?.channelId;
        return (moonlinkPlayer && (!moonlinkPlayer.connected || !moonlinkPlayer.voiceChannelId || botNotInAnyVoiceChannel));
    };

    const syncPlayerChannelsToTargets = (playerToSync) => {
        try {
            if (typeof playerToSync.setVoiceChannel === "function") playerToSync.setVoiceChannel(voiceChannelId);
            if (typeof playerToSync.setTextChannel === "function") playerToSync.setTextChannel(textChannelId);
            if ("voiceChannelId" in playerToSync) playerToSync.voiceChannelId = voiceChannelId;
            if ("textChannelId" in playerToSync) playerToSync.textChannelId = textChannelId;
        } catch {}
    };

    const tearDownPlayerCompletely = (playerToTearDown) => {
        try { playerToTearDown.stop(); } catch {}
        try { playerToTearDown.disconnect?.(); } catch {}
        try { playerToTearDown.destroy(); } catch {}
        try { manager.players.delete(guildId); } catch {}
    };

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    // 1) If existing player is stale, tear it down so we don't carry bad state forward
    if (isPlayerStale()) {
        tearDownPlayerCompletely(moonlinkPlayer);
        moonlinkPlayer = null;
    }

    // 2) Create new player or reuse and sync channels
    if (!moonlinkPlayer) {
        moonlinkPlayer = manager.players.create({
            guildId,
            voiceChannelId,
            textChannelId,
            autoPlay: false
        });
        createdNewPlayer = true;
    } else {
        syncPlayerChannelsToTargets(moonlinkPlayer);
    }

    // 3) Connect and wait briefly for connection events (fixed 500 ms inside waitForConnect)
    moonlinkPlayer.connect({ setDeaf: setDeafOnConnect });
    let connectedSuccessfully = await waitForConnect(manager, guildId);

    // 3a) If events are late, accept success if bot's voice state already matches the target VC
    if (!connectedSuccessfully) {
        const currentBotMember = guild.members.me;
        if (currentBotMember?.voice?.channelId === voiceChannelId) {
            connectedSuccessfully = true;
            usedVoiceStateFallback = true;
        }
    }

    // 4) If still not connected, do a single destroy+recreate+retry
    if (!connectedSuccessfully && shouldRetryOnce) {
        tearDownPlayerCompletely(moonlinkPlayer);
        await sleep(teardownYieldMs);

        moonlinkPlayer = manager.players.create({
            guildId,
            voiceChannelId,
            textChannelId,
            autoPlay: false
        });
        attemptedRetry = true;

        moonlinkPlayer.connect({ setDeaf: setDeafOnConnect });
        connectedSuccessfully = await waitForConnect(manager, guildId);

        if (!connectedSuccessfully) {
            const currentBotMemberAfterRetry = guild.members.me;
            if (currentBotMemberAfterRetry?.voice?.channelId === voiceChannelId) {
                connectedSuccessfully = true;
                usedVoiceStateFallback = true;
            }
        }
    }

    return {
        ok: connectedSuccessfully,
        player: moonlinkPlayer,
        created: createdNewPlayer,
        retried: attemptedRetry,
        usedVoiceStateFallback
    };
}

module.exports = { ensureMoonlinkConnection };