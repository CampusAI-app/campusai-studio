// Separate Remotion entry for "Ask it like you'd ask a friend" (wave 1), so Root.tsx is not edited.
// npx remotion render src/wave1/ask-friend/entry.ts AskFriend-9x16 out/w1/AskFriend-9x16.mp4 --crf 16 --concurrency=2
import React from "react";
import { Composition, registerRoot } from "remotion";
import { AskFriend, DURATION, FPS, H, W } from "./AskFriend";

const AskFriendRoot: React.FC = () =>
  React.createElement(Composition, { id: "AskFriend-9x16", component: AskFriend, durationInFrames: DURATION, fps: FPS, width: W, height: H });

registerRoot(AskFriendRoot);
