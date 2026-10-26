/**
 * The kit: every shared part, one import. A film takes parts from here and never redefines one a
 * film already has (2026-10-22). A part a film needs that is not here gets built HERE, then imported.
 *
 *   import { brand, useBrandFonts, PageView, camAlong, PointerAt, LogoOpen, LogoEnd } from "../kit";
 *
 * Browse them moving on the Studio page; render the kit's own previews with
 *   npx remotion render src/kit/shelf-entry.ts <PreviewId> out/kit/<PreviewId>.mp4
 */
export * from "./brand";
export * from "./camera";
export * from "./PageView";
export * from "./Pointer";
export * from "./LogoMoment";
export * from "./ChatRecording";
export * from "./FlowRecording";
export * from "./parts";
export { EASE, EASE_CAMERA, enter, exit, envelope, keyframes } from "../lib/anim";
export { safeLayout } from "../lib/safeArea";
export type { SafeLayout } from "../lib/safeArea";
export * from "./pass";
