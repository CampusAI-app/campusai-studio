// Round 2 of the daily brief film (Nov 10): the three fixes from the "Video or slideshow" test.
// npx remotion render src/dailybrief/entry2.ts DailyBrief-r2-16x9 out/dailybrief/DailyBrief-r2-16x9.mp4 --crf 16
import { registerRoot } from "remotion";
import { DailyBrief2Comp } from "./DailyBrief2";

registerRoot(DailyBrief2Comp);
