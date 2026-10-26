// Separate Remotion entry for the Ask CampusAI mini-series, so Root.tsx is not edited.
// npx remotion render src/askseries/entry.ts AskSeries1-9x16 out/ask-series/AskSeries1-9x16.mp4
import { registerRoot } from "remotion";
import { AskSeriesRoot } from "./AskSeries";

registerRoot(AskSeriesRoot);
