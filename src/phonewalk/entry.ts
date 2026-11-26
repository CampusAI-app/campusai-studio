// Separate entry for the Nov 26 phone walkthrough and its proofs, so a render never waits on the rest of Root.tsx.
import { registerRoot } from "remotion";
import { PhoneWalkRoot } from "./Root";

registerRoot(PhoneWalkRoot);
