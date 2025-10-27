// bestAudioFormatHelper.js
const { LinkNotFound } = require("./errors");

// Known YouTube Opus itags (webm+opus)
const OPUS_ITAGS = ["251", "250", "249"];

// Known HLS AV itags (mp4)
const HLS_AV_ITAGS = ["91", "92", "93", "94", "95", "96"];

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

    // 1) Prefer Opus-in-WebM (audio-only) when available
    for (const itag of OPUS_ITAGS) {
        const fmt = findFormatById(itag);
        if (fmt) {
            return {
                chosen: fmt,
                isOpusWebm: true,
            }
        };
    };

    // Collect audio-only formats (no video codec, valid URL)
    const audioOnly = formats
        .filter(f => f?.url && (f.vcodec === "none" || !f.vcodec))
        .sort((a, b) => (b.abr || 0) - (a.abr || 0));

    // 2) Otherwise, take any audio-only with highest abr
    if (audioOnly[0]) {
        const audio = audioOnly[0];
        const acodec = (audio.acodec || "").toLowerCase();
        const ext = (audio.ext || "").toLowerCase();
        const container = (audio.container || "").toLowerCase();
        const isOpusWebm = acodec.includes("opus") && (ext.includes("webm") || container.includes("webm"));
        return { chosen: audio, isOpusWebm };
    };

    // 3) SABR fallback: pick a small HLS AV stream (ffmpeg drops video)
    for (const itag of HLS_AV_ITAGS) {
        const fmt = findFormatById(itag);
        if (fmt) {
            return { chosen: fmt, isOpusWebm: false };
        };
    };

      // 4) Last resort: any m3u8 with both A/V present
  const hlsAny = formats.find(f => f?.url && (f.protocol?.includes("m3u8") || f.manifest_url));
  if (hlsAny) {
    return { chosen: hlsAny, isOpusWebm: false };
  }

  throw new LinkNotFound("No playable audio (or HLS) format found for this link.");
}

module.exports = { pickBestAudioFormat };