/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";
import { enableTailwind } from '@remotion/tailwind-v4';

Config.setRspack(true);
// OFF, deliberately. "angle" turns on WebGL2, which every GL-backed transition
// in @remotion/transitions (linear-blur, cross-zoom, dissolve, dreamy-zoom,
// film-burn, ripple, zoom-blur) needs or it fails with "Failed to create WebGL2
// context". But under that renderer this project dropped whole layers from
// individual frames: the page gradient, then the message card, then the lead
// line, on a few frames after every layout change in the chat beats. It read as
// the red "switching off between gray and not gray". Nothing in the markup
// caused it and nothing in the markup fixed it; turning ANGLE off did, on the
// first try, with every frame complete.
//
// The cost is real: no GL transitions. ChatVideo's within-screen cuts use a
// fade instead of linearBlur. If a future film needs GL transitions, turn this
// back on for THAT composition and check every frame of any beat that changes
// layout mid-shot.
// Config.setChromiumOpenGlRenderer("angle");
// PNG, not JPEG. Remotion pipes frames to the encoder as JPEG at quality 80 by
// default, which lays compression artefacts onto fine text and screenshots
// BEFORE h264 ever sees them — a loss that no bitrate downstream can undo.
// Every film in this studio is type-led at film scale, which is precisely the
// worst case for it. PNG frames cost render time and disk, nothing else.
// Source: Nutlope/inspo teaser/RENDER.md, reading its reasoning rather than
// copying its numbers. Everything else about export lives in scripts/render.mjs.
Config.setVideoImageFormat("png");
Config.setOverwriteOutput(true);
Config.overrideBundlerConfig(enableTailwind);
