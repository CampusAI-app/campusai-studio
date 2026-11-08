// Separate Remotion entry for the generated-look cartoon films, so Root.tsx is not edited.
// npx remotion render src/cartoon/entry.ts CartoonDelusional-9x16 out/cartoon/CartoonDelusional-9x16.mp4
import { registerRoot } from "remotion";
import { CartoonRoot } from "./Delusional";

registerRoot(CartoonRoot);
