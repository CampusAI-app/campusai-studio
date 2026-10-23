// Prints the length of a clip in public/footage/, in seconds and in frames.
// Use it when you need exact numbers to cut a long recording into scenes.
//   npm run probe -- my-recording.mov
import { execFileSync } from "node:child_process";

const file = process.argv[2];
if (!file) {
  console.error("Usage: npm run probe -- <filename in public/footage/>");
  process.exit(1);
}

// `ffmpeg -i` with no output file always exits non-zero and writes the stream
// info to stderr, so the throw is the expected path, not a failure.
let info = "";
try {
  info = execFileSync(
    "npx",
    ["remotion", "ffmpeg", "-i", `public/footage/${file}`],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
} catch (e) {
  info = `${e.stdout ?? ""}${e.stderr ?? ""}`;
}

const m = info.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
if (!m) {
  console.error(info);
  console.error(`Could not read a duration from public/footage/${file}`);
  process.exit(1);
}

const seconds = +m[1] * 3600 + +m[2] * 60 + parseFloat(m[3]);
const res = info.match(/,\s(\d{2,5})x(\d{2,5})[\s,]/);

console.log(`\n${file}`);
if (res) console.log(`  ${res[1]}x${res[2]}`);
console.log(`  ${seconds.toFixed(2)} seconds`);
for (const fps of [30, 60]) {
  console.log(`  ${Math.floor(seconds * fps)} frames at ${fps}fps`);
}
console.log("");
