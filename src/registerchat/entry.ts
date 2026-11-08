// Separate Remotion entry for "Registration in three questions", so Root.tsx is not edited.
// npx remotion render src/registerchat/entry.ts RegisterChat-9x16 out/register-chat/RegisterChat-9x16.mp4
import { registerRoot } from "remotion";
import { RegisterChatRoot } from "./RegisterChat";

registerRoot(RegisterChatRoot);
