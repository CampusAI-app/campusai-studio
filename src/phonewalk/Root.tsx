// Nov 26 Muse pass: the phone walkthrough post and the three proof clips (PhoneMove, PillType, InlineIcon, FrostDepth).
import React from "react";
import { Composition } from "remotion";
import { PhoneWalk, PW } from "./PhoneWalk";
import { InlineIconProof, FrostDepthProof, PillTypeProof, PROOF } from "./Proofs";

export const PhoneWalkRoot: React.FC = () => (
  <>
    <Composition id="InlineIcon-Proof-9x16" component={InlineIconProof} durationInFrames={PROOF.inline} fps={PROOF.fps} width={PROOF.w} height={PROOF.h} />
    <Composition id="FrostDepth-Proof-9x16" component={FrostDepthProof} durationInFrames={PROOF.frost} fps={PROOF.fps} width={PROOF.w} height={PROOF.h} />
    <Composition id="PillType-Proof-9x16" component={PillTypeProof} durationInFrames={PROOF.pill} fps={PROOF.fps} width={PROOF.w} height={PROOF.h} />
    <Composition id="PostPhoneWalk-9x16" component={PhoneWalk} durationInFrames={PW.frames} fps={PW.fps} width={PW.w} height={PW.h} />
  </>
);
