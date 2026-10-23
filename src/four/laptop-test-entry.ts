// Separate Remotion entry for the RealLaptop proofs, so Root.tsx is not edited.
// npx remotion still src/four/laptop-test-entry.ts LaptopTest-9x16 out.png --frame=N --gl=angle
import { registerRoot } from "remotion";
import { LaptopTestRoot } from "./laptop-test-root";

registerRoot(LaptopTestRoot);
