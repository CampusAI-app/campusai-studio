// Separate Remotion entry for the feature graphics, so Root.tsx and entry.ts are not edited.
// npx remotion still src/graphics/entry-features.ts Feature-JobMatch-4x5 out/gfx/jobmatch-4x5.png
// Hero stills need WebGL: add --gl=angle.
import { registerRoot } from "remotion";
import { FeaturesRoot } from "./Features";

registerRoot(FeaturesRoot);
