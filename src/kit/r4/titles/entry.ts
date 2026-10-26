// Separate Remotion entry for the round 4 titles previews, so Root.tsx is not edited.
// npx remotion render src/kit/r4/titles/entry.ts R4-FeatureTag out/r4/R4-FeatureTag.mp4 --concurrency=2 --crf 16
import { registerRoot } from "remotion";
import { TitlesR4Root } from "./preview";

registerRoot(TitlesR4Root);
