// Separate Remotion entry for the chat group's previews, so Root.tsx is not edited.
// npx remotion render src/kit/pass/chat/entry.ts Pass-HonestTyping out/pass/Pass-HonestTyping.mp4 --concurrency=2
import { registerRoot } from "remotion";
import { ChatPassRoot } from "./preview";

registerRoot(ChatPassRoot);
