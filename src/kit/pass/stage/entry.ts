// Separate Remotion entry for the stage group's previews, so Root.tsx is not edited.
// npx remotion render src/kit/pass/stage/entry.ts Pass-LaptopRoom out/pass/Pass-LaptopRoom.mp4 --concurrency=2 --gl=angle
import { registerRoot } from "remotion";
import { StageRoot } from "./preview";

registerRoot(StageRoot);
