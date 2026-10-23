// Separate Remotion entry for the kit previews, so Root.tsx is not edited.
// npx remotion render src/kit/shelf-entry.ts Kit-PageCamera out/kit/Kit-PageCamera.mp4
import { registerRoot } from "remotion";
import { KitShelfRoot } from "./shelf";

registerRoot(KitShelfRoot);
