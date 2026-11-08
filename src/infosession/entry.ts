// Separate Remotion entry for the info session film, so Root.tsx is not edited.
// npx remotion render src/infosession/entry.ts InfoSession-9x16 out/infosession/InfoSession-9x16.mp4 --crf 16
import { registerRoot } from "remotion";
import { InfoSessionRoot } from "./InfoSession";

registerRoot(InfoSessionRoot);
