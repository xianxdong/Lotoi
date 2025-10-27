const youtubedl = require("youtube-dl-exec");
const { LinkNotFound } = require("./errors");
const { normalizeYtdlpOutput } = require("./ytdlp-output-helper");
const { pickBestAudioFormat } = require("./bestAudioFormatHelper");
const { formatDuration } = require("./AudioLengthFormatHelper");
const fs = require('fs');
// require("dotenv").config(); // Uncomment if using .env file otherwise leave it commented out. env variables should automatically work if server supports env vars. 

// Pick yt-dlp path depending on OS
let ytDlpPath;
if (process.platform === "win32") {
	// On Windows, just let it find yt-dlp in PATH (npm-installed or manually placed)
	ytDlpPath = "yt-dlp";
} else {
	// On Linux server, use the specific installed binary path
	ytDlpPath = process.env.YTDLP_PATH || "yt-dlp"; // Let it find the path of yt-dlp. If path can't be find, manually specify the path here or in .env/env var
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
		this.isHls = false;      // chosen format is HLS (needs pipe mode)
		this.formatId = null;    // chosen itag (used for yt-dlp -f in pipe mode)
		this.httpHeaders = null; // headers for ffmpeg in direct mode
	};

	async loadMetadata() {
		try {
			function cookieOpts() {
				const file = process.env.COOKIE_FILE; // set this to the path of the cookie file or specify the cookie file path in .env/env var
				if (!file) return {};
				try {
					const { size } = fs.statSync(file);
					if (size > 0) return { cookies: file };
				} catch (_) {}
					return {}; // file missing/empty → skip cookies
				}
				
				const ytOutput = await ytdlp(this.songUrl, {
					dumpSingleJson: true,
					noWarnings: true,
					preferFreeFormats: true,
					...cookieOpts(),               // ← include in servers, Should be fine to keep here
			});

			const jsonText = normalizeYtdlpOutput(ytOutput);
			const info = JSON.parse(jsonText);
			if (!info) throw new LinkNotFound("Error! Couldn't process and gather music data. Is the link valid?");

			this.title = info.title || "(untitled)";
			this.thumbnail = info.thumbnail || info.thumbnails?.[0]?.url || "";
			this.duration = formatDuration(info.duration || 0);

			const sel = pickBestAudioFormat(info);
			if (!sel || !sel.chosen || !sel.chosen.url)
				throw new LinkNotFound("No playable audio URL found (audio-only/HLS failed).");

			const { chosen, isOpusWebm } = sel;

			this.streamURL = chosen.url;
			this.isOpusWebm = !!isOpusWebm;
			this.formatId = chosen.format_id || null;

			const proto = (chosen.protocol || "").toLowerCase();
			const manifest = chosen.manifest_url || "";
			const ext = (chosen.ext || "").toLowerCase();
			this.isHls = proto.includes("m3u8") || manifest.includes("m3u8");
			if (!this.isHls && ext === "mp4" && this.formatId && ["91","92","93","94","95","96"].includes(String(this.formatId))) {
				this.isHls = true;
			}

			this.httpHeaders =
				chosen.http_headers ||
				chosen.httpHeaders ||
				info.http_headers ||
				info.httpHeaders ||
				null;

			if (process.env.DEBUG_YTDLP) {
				console.log("[ytdlp] chosen format:", {
					itag: this.formatId,
					acodec: chosen.acodec,
					vcodec: chosen.vcodec,
					ext: chosen.ext,
					isHls: this.isHls,
					isOpusWebm: this.isOpusWebm,
					hasHeaders: !!this.httpHeaders,
					guildId: this.interaction.guild.id,
				});
			}

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
			
			const DEBUG = !!process.env.DEBUG_FFMPEG;

			const baseFfmpegArgs = [
				"-hide_banner",
				"-loglevel", DEBUG ? "warning" : "error",
				"-reconnect", "1",
				"-reconnect_streamed", "1",
				"-reconnect_delay_max", "5",
				"-fflags", "nobuffer",
				"-flags", "low_delay",
				"-max_delay", "0",
				"-vn", "-sn", "-dn",
				"-map", "0:a?",
			];

			let ff;
			let inputType;

			if (this.isHls) {
				const ytdlpArgs = [];
				if (!DEBUG) ytdlpArgs.push("--no-progress", "--quiet");

				const cookieFile = process.env.COOKIE_FILE;
				if (cookieFile) ytdlpArgs.push("--cookies", cookieFile);
				if (this.formatId) ytdlpArgs.push("-f", String(this.formatId));

				ytdlpArgs.push("-o", "-");
				ytdlpArgs.push(this.songUrl);

				const ytdlpProc = spawn(ytDlpPath, ytdlpArgs, { stdio: ["ignore", "pipe", "pipe"] });
				if (DEBUG)
					ytdlpProc.stderr.on("data", d => console.warn(`[yt-dlp] ${String(d).trim()}`));

				const ffArgs = ["-i", "pipe:0", ...baseFfmpegArgs];
				ffArgs.push("-c:a", "libopus", "-b:a", "128k", "-ar", "48000", "-ac", "2", "-f", "ogg", "pipe:1");
				inputType = StreamType.OggOpus;

				ff = spawn("ffmpeg", ffArgs, { stdio: ["pipe", "pipe", "pipe"] });

				ytdlpProc.stdout.pipe(ff.stdin);
				ytdlpProc.on("close", () => { try { ff.stdin.end(); } catch (_) {} });
				ff.on("close", () => { try { ytdlpProc.kill("SIGKILL"); } catch (_) {} });

				if (DEBUG) {
					ff.stderr.on("data", d => console.warn(`[ffmpeg] ${String(d).trim()}`));
					ff.on("close", code => console.log(`[ffmpeg] exited ${code}`));
				}
			} else {
				const args = [
					"-hide_banner",
					"-loglevel", DEBUG ? "warning" : "error",
					"-reconnect", "1",
					"-reconnect_streamed", "1",
					"-reconnect_delay_max", "5",
					"-fflags", "nobuffer",
					"-flags", "low_delay",
					"-max_delay", "0",
				];

				const headers = this.httpHeaders || {};
				const headerLines = Object.entries(headers)
					.filter(([k, v]) => v)
					.map(([k, v]) => `${k}: ${v}`)
					.join("\r\n");
				if (headerLines) {
					args.push("-headers", headerLines);
					if (headers["User-Agent"]) args.push("-user_agent", headers["User-Agent"]);
				}

				args.push("-i", this.streamURL, "-vn", "-sn", "-dn", "-map", "0:a?");

				if (this.isOpusWebm) {
					args.push("-c:a", "copy", "-f", "webm", "pipe:1");
					inputType = StreamType.WebmOpus;
				} else {
					args.push(
						"-c:a", "libopus",
						"-b:a", "128k",
						"-ar", "48000",
						"-ac", "2",
						"-f", "ogg", "pipe:1"
					);
					inputType = StreamType.OggOpus;
				}

				ff = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });

				if (DEBUG) {
					ff.stderr.on("data", d => console.warn(`[ffmpeg] ${String(d).trim()}`));
					ff.on("close", code => console.log(`[ffmpeg] exited ${code}`));
				};
			};
			return createAudioResource(ff.stdout, { inputType });
		} catch (error) {
			console.error(error);
		};
	};
};

module.exports = Song;