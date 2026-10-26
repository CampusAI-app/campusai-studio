// Separate Remotion entry for the data previews, so Root.tsx is not edited.
// npx remotion render src/kit/r4/data/entry.ts R4-ListReRank out/r4/R4-ListReRank.mp4 --concurrency=2 --crf 16
import { registerRoot } from "remotion";
import { DataRoot } from "./preview";

registerRoot(DataRoot);
