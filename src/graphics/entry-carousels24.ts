// Separate Remotion entry for the Oct 24 carousels, so Root.tsx and the other graphics entries are not edited.
// npx remotion still src/graphics/entry-carousels24.ts Fit-1 out/c24/fit-1.png
import { registerRoot } from "remotion";
import { Carousels24Root } from "./Carousels24";

registerRoot(Carousels24Root);
