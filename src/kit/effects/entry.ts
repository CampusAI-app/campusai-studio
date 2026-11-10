// Separate Remotion entry for the four effect samples (Nov 10), so Root.tsx is not edited.
// npx remotion render src/kit/effects/entry.ts Effect-Checklist out/effects/Effect-Checklist.mp4
import { registerRoot } from "remotion";
import { EffectSamples } from "./samples";

registerRoot(EffectSamples);
