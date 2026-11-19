// Separate Remotion entry for the floating chat film (Nov 18), so Root.tsx is not edited.
// npx remotion render src/floatingchat/entry.ts FloatingChat-16x9 out/FloatingChat-16x9.mp4
import { registerRoot } from "remotion";
import { FloatingChatRoot } from "./FloatingChat";

registerRoot(FloatingChatRoot);
