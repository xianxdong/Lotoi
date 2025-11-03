"use strict";

/**
 * Fast, minimal wait for Moonlink to confirm connection via events.
 * Resolves true on playerConnected/playerReady for the given guildId, otherwise false on timeout.
 *
 * IMPORTANT: The timeout is fixed at DEFAULT_TIMEOUT_MS (500 ms) and cannot be overridden by callers.
 * To change it, edit DEFAULT_TIMEOUT_MS in this file.
 */
const DEFAULT_TIMEOUT_MS = 500;

/**
 * @param {import("moonlink.js").MoonlinkManager} manager
 * @param {string} guildId
 * @returns {Promise<boolean>}
 */
function waitForConnect(manager, guildId) {
    return new Promise((resolve) => {
        let settled = false;
        let timer;

        const cleanup = () => {
            if (timer) clearTimeout(timer);
            manager.off("playerConnected", onConnected);
            manager.off("playerReady", onReady);
        };

        const onConnected = (player) => {
            if (settled || player.guildId !== guildId) return;
            settled = true;
            cleanup();
            resolve(true);
        };

        const onReady = (player) => {
            if (settled || player.guildId !== guildId) return;
            settled = true;
            cleanup();
            resolve(true);
        };

        manager.on("playerConnected", onConnected);
        manager.on("playerReady", onReady);

        timer = setTimeout(() => {
            if (settled) return;
            settled = true;
            cleanup();
            resolve(false);
        }, DEFAULT_TIMEOUT_MS);
    });
}

module.exports = { waitForConnect, DEFAULT_TIMEOUT_MS };