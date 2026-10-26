// Feature loops (round 4, 2026-10-25). Own entry, so Root.tsx is not edited:
// npx remotion render src/r4/loops/entry.ts Loop-Calendar-1x1 out/r4/Loop-Calendar-1x1.mp4 --concurrency=2 --crf 16
import { registerRoot } from "remotion";
import { LoopsRoot } from "./Root";

registerRoot(LoopsRoot);
