/**
 * Format a duration in milliseconds as "h:mm:ss" or "m:ss".
 * - Hours are omitted when zero.
 * - Seconds are always zero-padded to 2 digits.
 * - Minutes are zero-padded only when hours are present.
 *
 * Examples:
 *  formatDuration(65000)     -> "1:05"     // 65s
 *  formatDuration(3600000)   -> "1:00:00"  // 1h
 *  formatDuration(0)         -> "0:00"
 *  formatDuration(7322000)   -> "2:02:02"  // 2h 2m 2s
 *
 * @param {number} durationMs  // duration in milliseconds
 * @returns {string}
 */
function formatDuration(durationMs) {
    const totalSeconds = Math.max(0, Math.floor((Number(durationMs) || 0) / 1000));
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const pad2 = (n) => String(n).padStart(2, "0");

    if (hrs > 0) {
        return `${hrs}:${pad2(mins)}:${pad2(secs)}`;
    }

    return `${mins}:${pad2(secs)}`;
}

module.exports = { formatDuration };