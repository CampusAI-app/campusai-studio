// Separate Remotion entry for the Plan my week film (round 2), so Root.tsx is not edited.
// npx remotion render src/planmyweek/entry.ts PlanMyWeek-16x9 out/planmyweek/PlanMyWeek-16x9.mp4
import { registerRoot } from "remotion";
import { PlanMyWeekRoot } from "./PlanMyWeek";

registerRoot(PlanMyWeekRoot);
