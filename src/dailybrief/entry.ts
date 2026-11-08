// Separate Remotion entry for the daily brief film, so Root.tsx is not edited.
// npx remotion render src/dailybrief/entry.ts DailyBrief-16x9 out/dailybrief/DailyBrief-16x9.mp4 --crf 16
import { registerRoot } from "remotion";
import { DailyBriefRoot } from "./DailyBrief";

registerRoot(DailyBriefRoot);
