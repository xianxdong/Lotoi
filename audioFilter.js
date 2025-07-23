const fs = require('fs');

const data = JSON.parse(fs.readFileSync('formatted.json', 'utf8'));

const title = data.title;
const videoId = data.id;
const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

const bestAudio = data.formats
  .filter(f => f.vcodec === "none" && f.acodec !== "none")
  .sort((a, b) => (b.abr || 0) - (a.abr || 0))[0];

const audioUrl = bestAudio?.url;

console.log("Title:", title);
console.log("Thumbnail:", thumbnail);
console.log("Audio URL:", audioUrl);

// const fs = require('fs');

// // Load the JSON file
// const data = JSON.parse(fs.readFileSync('formatted.json', 'utf8'));

// // Filter for format_id === "249"
// const formats249 = data.formats.filter(f =>
//   f.format_id === "249" &&
//   f.vcodec === "none" &&
//   f.acodec !== "none" &&
//   f.url &&
//   !f.url.includes('.m3u8') && // exclude manifest streams
//   !f.url.includes('.mpd')
// );

