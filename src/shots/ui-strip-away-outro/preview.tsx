import React from "react";
import { AbsoluteFill, Composition, Img, registerRoot, staticFile, useCurrentFrame } from "remotion";
import { useZodiak } from "../../kit/parts";
import { StripAwayToLogo, STRIP_AWAY_TO_LOGO_DURATION } from "./StripAwayToLogo";

const VIEW = { x: 24, y: 340, w: 1032, h: 1270 };
const AP = { x: 741.671875, y: 345.6875, w: 189.453125, h: 35.5 };
const SRC = staticFile("howto/run/f01674.jpg");

// The film's last camera: 470 screen px wide, centred at Apply + (60, 80), clamped to the 1440x900 page.
const CW = 470;
const CH = CW * (VIEW.h / VIEW.w);
const CX = Math.min(1440 - CW / 2, Math.max(CW / 2, AP.x + AP.w / 2 + 60));
const CY = Math.min(900 - CH / 2, Math.max(CH / 2, AP.y + AP.h / 2 + 80));
const S = VIEW.w / CW;
const OX = VIEW.w / 2 - CX * S;
const OY = VIEW.h / 2 - CY * S;

const Scene: React.FC = () => {
  useZodiak();
  const f = useCurrentFrame();
  const page = (
    <div style={{ position: "absolute", left: 0, top: 0, width: VIEW.w, height: VIEW.h, overflow: "hidden", borderRadius: 34, background: "#0b0708",
      boxShadow: "0 0 0 1.5px rgba(255,255,255,.08), 0 40px 120px rgba(0,0,0,.6), 0 0 140px #E8293B22" }}>
      <Img src={SRC} style={{ position: "absolute", left: OX, top: OY, width: 1440 * S, height: 900 * S, maxWidth: "none" }} />
    </div>
  );
  const rect = { x: VIEW.x + OX + AP.x * S, y: VIEW.y + OY + AP.y * S, w: AP.w * S, h: AP.h * S };
  const node = (
    <div style={{ position: "relative", width: rect.w, height: rect.h, overflow: "hidden", borderRadius: 7 * S }}>
      <Img src={SRC} style={{ position: "absolute", left: -AP.x * S, top: -AP.y * S, width: 1440 * S, height: 900 * S, maxWidth: "none" }} />
    </div>
  );
  return (
    <AbsoluteFill style={{ background: "#0b0708" }}>
      <StripAwayToLogo f={f} dur={STRIP_AWAY_TO_LOGO_DURATION} view={VIEW} page={page} button={{ rect, node }}
        logoSrc={staticFile("brand/campusai-logo-white.svg")} />
    </AbsoluteFill>
  );
};

const Root: React.FC = () => (
  <Composition id="Preview-StripAwayToLogo" component={Scene} width={1080} height={1920} fps={30} durationInFrames={STRIP_AWAY_TO_LOGO_DURATION} />
);

registerRoot(Root);
