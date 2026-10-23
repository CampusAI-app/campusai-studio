// Separate Remotion entry for the type group's previews, so Root.tsx is not edited.
// npx remotion render src/kit/pass/type/entry.ts Pass-WordSwap out/pass/Pass-WordSwap.mp4 --concurrency=2
import { registerRoot } from "remotion";
import { TypePassRoot } from "./preview";

registerRoot(TypePassRoot);
