const { LinkNotFound } = require("./errors");

// Known YouTube Opus itags (webm+opus)
const OPUS_ITAGS = ["251", "250", "249"];

/**
 * Pick the best audio format from yt-dlp info.
 * Prefers Opus-in-WebM (itag 251/250/249) when available,
 * otherwise falls back to highest bitrate audio-only.
 */
function pickBestAudioFormat(info) {
    const formats = Array.isArray(info.formats) ? info.formats : [];

    // quick lookup by itag
    function findFormatById(id) {
        return formats.find(f => f && f.format_id === id && f.url);
    }

    // Collect audio-only formats (no video codec, valid URL)
    const audioOnly = formats
        .filter(f => f?.url && (f.vcodec === "none" || !f.vcodec))
        .sort((a, b) => (b.abr || 0) - (a.abr || 0));

    // Prefer Opus webm first
    let chosen = null;
    for (const itag of OPUS_ITAGS) {
        const fmt = findFormatById(itag);
        if (fmt) {
            chosen = fmt;
            break;
        }
    }
    if (!chosen) {
        chosen = audioOnly[0] || null;
    }

    if (!chosen) {
        throw new LinkNotFound("No playable audio format found for this link.");
    }

    // Mark if it's Opus in WebM (so you can skip re-encode later)
    const acodec = (chosen.acodec || "").toLowerCase();
    const ext = (chosen.ext || "").toLowerCase();
    const container = (chosen.container || "").toLowerCase();

    const isOpusWebm =
        acodec.includes("opus") &&
        (ext.includes("webm") || container.includes("webm"));

    return { chosen, isOpusWebm };
}

module.exports = { pickBestAudioFormat };