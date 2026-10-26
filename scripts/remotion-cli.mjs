// The studio's own Remotion CLI, run with `spawnSync(process.execPath, [REMOTION, ...args])`.
// Same call on Mac and Windows: Windows cannot start `npx` without a shell, and a shell splits
// paths with spaces in them ("CampusAI Studio").
import { fileURLToPath } from "node:url";

export const REMOTION = fileURLToPath(new URL("../node_modules/@remotion/cli/remotion-cli.js", import.meta.url));
