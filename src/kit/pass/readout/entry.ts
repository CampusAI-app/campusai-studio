// Separate Remotion entry for the readout previews, so Root.tsx is not edited.
// npx remotion render src/kit/pass/readout/entry.ts Pass-RoleCard out/pass/Pass-RoleCard.mp4 --concurrency=2
import { registerRoot } from "remotion";
import { ReadoutRoot } from "./preview";

registerRoot(ReadoutRoot);
