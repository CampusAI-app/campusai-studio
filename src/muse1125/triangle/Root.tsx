import React from "react";
import { Composition } from "remotion";
import { TRIANGLE_FILM_FRAMES, TriangleNetwork } from "./film";
import { SHELF_FRAMES, TriangleParts } from "./shelf";
import { PACK, PACK_FRAMES, SaasPackReel } from "./saas";

const SHAPES = [
  { tag: "16x9", width: 1920, height: 1080 },
  { tag: "9x16", width: 1080, height: 1920 },
];

// Muse pass 2026-11-25, triangle. Register this folder's compositions here only.
export const MuseTriangleRoot: React.FC = () => (
  <>
    <Composition id="TriangleNetwork-9x16" component={TriangleNetwork} durationInFrames={TRIANGLE_FILM_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="TriangleParts-9x16" component={TriangleParts} durationInFrames={SHELF_FRAMES} fps={30} width={1080} height={1920} />
    {SHAPES.map((s) => (
      <React.Fragment key={s.tag}>
        <Composition id={`SaasPack-Reel-${s.tag}`} component={SaasPackReel} durationInFrames={PACK_FRAMES} fps={30} width={s.width} height={s.height} />
        {PACK.map((p) => (
          <Composition key={p.id} id={`SaasPack-${p.id}-${s.tag}`} component={() => <>{p.node}</>} durationInFrames={p.frames} fps={30} width={s.width} height={s.height} />
        ))}
      </React.Fragment>
    ))}
  </>
);
