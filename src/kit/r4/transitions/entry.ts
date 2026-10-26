// Separate Remotion entry for the r4 transitions group's previews, so Root.tsx is not edited.
// npx remotion render src/kit/r4/transitions/entry.ts R4-CardOpensPage out/r4/R4-CardOpensPage.mp4 --concurrency=2 --crf 16
import { registerRoot } from "remotion";
import { TransitionsRoot } from "./preview";

registerRoot(TransitionsRoot);
