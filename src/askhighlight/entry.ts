// Separate Remotion entry for the Ask CampusAI highlighted-answer film, so Root.tsx is not edited.
// npx remotion render src/askhighlight/entry.ts AskHighlight-9x16 out/ask-highlight/AskHighlight-9x16.mp4
import { registerRoot } from "remotion";
import { AskHighlightRoot } from "./AskHighlight";

registerRoot(AskHighlightRoot);
