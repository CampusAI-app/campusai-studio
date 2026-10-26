// Separate Remotion entry for the round 4 type film, so Root.tsx is not edited.
//   npx remotion render src/r4/typefilm/entry.ts R4-TypeFilm-9x16 out/r4/R4-TypeFilm-9x16.mp4 --concurrency=2 --crf 16
//   npx remotion render src/r4/typefilm/entry.ts R4-TypeFilm-16x9 out/r4/R4-TypeFilm-16x9.mp4 --concurrency=2 --crf 16
import { registerRoot } from "remotion";
import { TypeFilmRoot } from "./root";

registerRoot(TypeFilmRoot);
