// Separate Remotion entry for the graphics starters, so Root.tsx is not edited.
// npx remotion still src/graphics/entry.ts Graphic-Feed out/graphics/feed.png
import { registerRoot } from "remotion";
import { GraphicsRoot } from "./Starters";

registerRoot(GraphicsRoot);
