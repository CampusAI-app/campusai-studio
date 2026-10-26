// Separate Remotion entry for motion pass 2, so Root.tsx is not edited.
// npx remotion render src/motionpass2/entry.ts MP2-LogoLock-1x1 out/mp2/MP2-LogoLock-1x1.mp4 --crf 16
import { registerRoot } from "remotion";
import { MotionPass2Root } from "./MotionPass2";

registerRoot(MotionPass2Root);
