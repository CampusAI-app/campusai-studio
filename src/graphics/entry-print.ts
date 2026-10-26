// Separate Remotion entry for the tabling print set, so Root.tsx and the other entries are not edited.
// npx remotion still src/graphics/entry-print.ts Print-Flyer out/print/flyer.png
import { registerRoot } from "remotion";
import { PrintRoot } from "./Print";

registerRoot(PrintRoot);
