const youtubedl = require("youtube-dl-exec");
const { LinkNotFound } = require("./errors");
const { normalizeYtdlpOutput } = require("./ytdlp-output-helper");
const { pickBestAudioFormat } = require("./bestAudioFormatHelper");

// Pick yt-dlp path depending on OS
let ytDlpPath;
if (process.platform === "win32") {
	// On Windows, just let it find yt-dlp in PATH (npm-installed or manually placed)
	ytDlpPath = "yt-dlp";
} else {
	// On Linux server, use the specific installed binary path
	ytDlpPath = "/usr/local/bin/yt-dlp";
}

const ytdlp = youtubedl.create(ytDlpPath);

class Song {
	constructor(songUrl, interaction) {
		this.songUrl = songUrl;
		this.interaction = interaction;
		this.requestedBy = this.interaction.user.username;
		this.title = "";
		this.streamURL = "";
		this.thumbnail = "";
		this.duration = 0;
		this.isOpusWebm = false; // track if we got webm+opus (StreamType.WebmOpus)
	}

	async loadMetadata() {
		try {
			const ytOutput = await ytdlp(this.songUrl, {
                dumpSingleJson: true,
                noWarnings: true,
                preferFreeFormats: true,
                format: "251/bestaudio[acodec=opus]/bestaudio/best",
                ...(process.platform !== "win32" && { 'cookies-from-browser': 'chromium' })
            });

			
            const jsonText = normalizeYtdlpOutput(ytOutput)
			const info = JSON.parse(jsonText);
			if (!info) throw new LinkNotFound("Error! Couldn't process and gather music data. Is the link valid?");

			this.title = info.title;
			this.thumbnail = info.thumbnail;
			this.duration = info.duration;

			const { chosen, isOpusWebm } = pickBestAudioFormat(info);

			this.streamURL = chosen.url;
			this.isOpusWebm = isOpusWebm

			return true;
		} catch (error) {
			console.log("Error when processing link:", error?.message || error);
			if (error.name === "ChildProcessError") return false;
			throw error;
		}
	}

	async createAudioResource() {
		try {
			const { createAudioResource, StreamType } = require("@discordjs/voice");
			const { spawn } = require("child_process");

			if (!this.streamURL) {
				throw new (require("./errors").LinkNotFound)(
					`Error. streamURL is ${this.streamURL}. Was the metadata loaded?`
				);
			}

			const ff = spawn("ffmpeg", [
				"-hide_banner",
				"-loglevel", "warning",
				"-reconnect", "1",
				"-reconnect_streamed", "1",
				"-reconnect_delay_max", "5",
				"-i", this.streamURL,
				"-vn", "-sn", "-dn",
				"-map", "0:a:0",
				"-c:a", "libopus",
				"-b:a", "128k",
				"-ar", "48000",
				"-ac", "2",
				"-f", "ogg",
				"pipe:1"
			], { stdio: ["ignore", "pipe", "pipe"] });

			ff.stderr.on("data", d => console.warn(`[ffmpeg] ${d}`));
			ff.on("close", code => console.log(`[ffmpeg] exited ${code}`));

			// Tell discord this is Ogg Opus
			return createAudioResource(ff.stdout, { inputType: StreamType.OggOpus });
		} catch (error) {
			console.error(error);
		}
	}
}

module.exports = Song;