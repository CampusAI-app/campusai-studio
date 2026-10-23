// Separate Remotion entry for "What it picked for you today", so Root.tsx is not edited.
// npx remotion render src/wave1/picked-today/entry.ts Picked-9x16 out/w1/Picked-9x16.mp4 --crf 16 --concurrency=2
import { registerRoot } from "remotion";
import { PickedRoot } from "./PickedRoot";

registerRoot(PickedRoot);
