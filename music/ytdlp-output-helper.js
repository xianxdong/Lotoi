/**
 * Normalize whatever yt-dlp returns into a JSON string.
 * Handles string, Buffer, stdout, stdio, or pre-parsed object.
 */
function normalizeYtdlpOutput(rawResult) {
    if (typeof rawResult === "string") {
        return rawResult;
    }

    if (Buffer.isBuffer(rawResult)) {
        return rawResult.toString("utf8");
    }

    if (rawResult && typeof rawResult === "object") {
        if (rawResult.stdout) {
            if (Buffer.isBuffer(rawResult.stdout)) {
                return rawResult.stdout.toString("utf8");
            } else {
                return String(rawResult.stdout);
            }
        }

        if (rawResult.stdio && rawResult.stdio[1]) {
            if (Buffer.isBuffer(rawResult.stdio[1])) {
                return rawResult.stdio[1].toString("utf8");
            } else {
                return String(rawResult.stdio[1]);
            }
        }

        // If yt-dlp already gave us an object instead of raw text
        return JSON.stringify(rawResult);
    }

    throw new Error("Unexpected yt-dlp output type");
}

module.exports = { normalizeYtdlpOutput };
