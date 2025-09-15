/**
 * Format a duration in seconds as "h:mm:ss" or "m:ss".
 * - Hours are omitted when zero.
 * - Seconds are always zero-padded to 2 digits.
 * - Minutes are zero-padded only when hours are present.
 *
 * Examples:
 *  formatDuration(65)      -> "1:05"
 *  formatDuration(3600)    -> "1:00:00"
 *  formatDuration(0)       -> "0:00"
 *  formatDuration(7322)    -> "2:02:02"
 *
 * @param {number} seconds
 * @returns {string}
 */
function formatDuration(seconds) {
  	const total = Math.max(0, Math.floor(Number(seconds) || 0));
  	const hrs = Math.floor(total / 3600);
  	const mins = Math.floor((total % 3600) / 60);
  	const secs = total % 60;
  	const formattedTime = ""

  	const pad2 = (n) => String(n).padStart(2, "0");

  	if (hrs > 0) {
    	return `${hrs}:${pad2(mins)}:${pad2(secs)}`;
  	};

  	return `${mins}:${pad2(secs)}`;
};


module.exports = { formatDuration };