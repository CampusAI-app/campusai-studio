// Separate Remotion entry for the launch transitions clip (Nov 10), so Root.tsx is not edited.
// npx remotion render src/launch-transitions/entry.ts LaunchTransitions-16x9 out/LaunchTransitions-16x9.mp4
import { registerRoot } from "remotion";
import { LaunchTransitionsRoot } from "./LaunchTransitions";

registerRoot(LaunchTransitionsRoot);
