// Separate Remotion entry for the camera group's previews, so Root.tsx is not edited.
// npx remotion render src/kit/pass/camera/entry.ts Pass-SlowGlide out/pass/Pass-SlowGlide.mp4 --concurrency=2
import { registerRoot } from "remotion";
import { CameraPassRoot } from "./preview";

registerRoot(CameraPassRoot);
