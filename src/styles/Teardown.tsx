/**
 * /teardown: a real page comes apart into labelled plates, then closes. Kit ExplodedPage (Jacob's favorite),
 * itself a port of shelf shot `space-camera-moves`. Every label is a heading from the capture.
 */
import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { ExplodedPage, markCover, type ExplodeLayer } from "../kit/pass/stage/ExplodedPage";
import type { Size } from "../kit/camera";
import { B, Clip, Cue, Title } from "./common";

export type TeardownProps = { src: string; page: Size; layers: ExplodeLayer[]; title: string };
export const TEARDOWN_END = 255;

export const Teardown: React.FC<TeardownProps> = ({ src, page, layers, title }) => (
  <Clip endAt={TEARDOWN_END}>
    <ExplodedPage
      src={staticFile(src)}
      page={page}
      layers={layers}
      cover={[markCover("rgb(29, 20, 21)")]}
      brand={B}
      view={{ x: -1000, y: 330, w: 2240, h: 1400 }}
      focus={{ x: 752, y: 1110, width: 640 }}
      turn={{ rx: 24, ry: 16 }}
      timing={{ apart: 4 }}
      lineSize={32}
    />
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${B.color.bgDeep} 14%, transparent 26%, transparent 76%, ${B.color.bgDeep} 92%)` }} />
    <Title out={TEARDOWN_END}>{title}</Title>
    <Cue at={18} name="air-woosh-quick" volume={0.5} />
    {layers.map((_, i) => <Cue key={i} at={30 + i * 8} name="switch-tap" volume={0.3} />)}
    <Cue at={205} name="hit-weak" volume={0.5} />
  </Clip>
);
