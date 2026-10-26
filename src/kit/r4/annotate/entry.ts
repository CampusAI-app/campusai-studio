// Separate Remotion entry for the annotate group's previews (round 4), so Root.tsx is not edited.
// npx remotion render src/kit/r4/annotate/entry.ts R4-Spotlight out/r4/R4-Spotlight.mp4 --concurrency=2 --crf 16
import { registerRoot } from "remotion";
import { AnnotateRoot } from "./preview";

registerRoot(AnnotateRoot);
