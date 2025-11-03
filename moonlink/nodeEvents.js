/**
 * Attach Moonlink manager event logs to a Discord.js client.
 *
 * Goals:
 * - One-time, low-noise operational logging (what happened, where).
 * - Helpful context (node id/host, guild id, track title).
 * - Optional verbose mode via env: MOONLINK_VERBOSE=1
 *
 * Notes:
 * - We intentionally avoid logging very chatty events (e.g., playerUpdate).
 * - This function is idempotent. Repeated calls won’t re-attach listeners.
 */

function attachNodeEvents(client) {
    if (client.__nodeEventsAttached) {
        console.log("[nodeEvents] already attached");
        return;
    }
    console.log("[nodeEvents] attaching Moonlink manager listeners...");
    client.__nodeEventsAttached = true;

    const manager = client.manager;
    const VERBOSE = process.env.MOONLINK_VERBOSE === "1"

    // Helpers to keep logs compact and consistent
    const nodeTag = (node) => {
        const id = node?.identifier;
        const host = node?.host ?? node?.options?.host;
        const port = node?.port ?? node?.options?.port;
        return id || (host ? `${host}${port ? `:${port}` : ""}` : "unknown-node");
    };

    const trackTitle = (track) =>
        track?.info?.title ?? track?.title ?? "unknown";

    const describeClose = (code, reason) => {
        // Short, common explanations. Not exhaustive, just enough to triage quickly.
        const hints = {
            1000: "normal-closure",
            1001: "going-away",
            1006: "abnormal-closure",
            4006: "session-invalid",
            4009: "session-timeout",
        };
        const hint = hints[code] || "see-logs";
        return `code=${code} (${hint}) reason=${reason ?? "n/a"}`;
    };

    // Node lifecycle
    manager.on("nodeConnected", (node) => {
        console.log(`[nodeConnected] ${nodeTag(node)}`);
    });

    manager.on("nodeReady", (node) => {
        console.log(`[nodeReady] ${nodeTag(node)}`);
    });

    manager.on("nodeError", (node, error) => {
        console.error(`[nodeError] ${nodeTag(node)} ->`, error?.message ?? error);
    });

    manager.on("nodeClose", (node, code, reason) => {
        console.warn(`[nodeClose] ${nodeTag(node)} ${describeClose(code, reason)}`);
    });

    // Player lifecycle (logging only; no cleanup logic)
    manager.on("playerConnecting", (player) => {
        console.log(`[playerConnecting] guild=${player.guildId}`);
    });

    manager.on("playerConnected", (player) => {
        console.log(`[playerConnected] guild=${player.guildId}`);
    });

    manager.on("playerReady", (player) => {
        console.log(`[playerReady] guild=${player.guildId}`);
    });

    manager.on("playerDisconnected", (player, ...rest) => {
        // rest may include reason/payload depending on Moonlink version
        console.warn(`[playerDisconnected] guild=${player.guildId}`, ...rest);
    });

    manager.on("playerDestroyed", (player) => {
        console.log(`[playerDestroyed] guild=${player.guildId}`);
    });

    // Unexpected voice close from Lavalink side
    manager.on("socketClosed", (player, payload) => {
        const code = payload?.code;
        const reason = payload?.reason;
        console.warn(`[socketClosed] guild=${player.guildId} ${describeClose(code, reason)}`);
    });

    // Playback / queue (useful, low-frequency)
    manager.on("trackStart", (player, track) => {
        console.log(`[trackStart] guild=${player.guildId} title="${trackTitle(track)}"`);
    });

    manager.on("trackEnd", (player, track, reason) => {
        console.log(
            `[trackEnd] guild=${player.guildId} reason=${reason ?? "unknown"} title="${trackTitle(track)}"`
        );
    });

    manager.on("queueEnd", (player) => {
        console.log(`[queueEnd] guild=${player.guildId}`);
    });

    // Optional verbosity (queue changes, raw/debug)
    if (VERBOSE) {
        manager.on("queueAdd", (player, track) => {
            console.log(`[queueAdd] guild=${player.guildId} title="${trackTitle(track)}"`);
        });

        manager.on("queueRemove", (player, track) => {
            console.log(`[queueRemove] guild=${player.guildId} title="${trackTitle(track)}"`);
        });

        manager.on("debug", (...args) => console.debug("[moonlink:debug]", ...args));

        manager.on("nodeRaw", (...args) => console.debug("[moonlink:nodeRaw]", ...args));

        manager.on("nodeStateChange", (node, ...rest) => {
            console.debug(`[nodeStateChange] ${nodeTag(node)}`, ...rest);
        });

        manager.on("sourceAdd", (source) => {
            console.debug(`[sourceAdd] ${String(source)}`);
        });
    }

    // Intentionally no playerUpdate logging (it’s frequent/noisy)
}

module.exports = { attachNodeEvents };