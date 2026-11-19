/**
 * What each short-video platform draws over a 9:16 frame, and the rectangles left free for our own type (2026-11-18,
 * for PlacedCaptions, after Shaan Johari's reel "I filmed this. Claude edited it." instagram.com/reel/Df4TGYjEZLu, where
 * every caption line lands in an open spot and never under the app's buttons).
 *
 * The numbers are APPROXIMATE and dated 2026-11-18. They follow the widely published safe-zone templates for a 1080 x 1920
 * frame (the apps change their chrome often and no platform publishes exact pixels), rounded a little toward caution:
 *   - a top header (Reels / Following / Shorts tabs, camera, search),
 *   - a bottom strip (username, caption, audio line, and on TikTok the progress bar),
 *   - a right rail of buttons (like, comment, share, save, the audio disc), which starts lower than the header ends.
 * Instagram's FEED shows a Reel cropped to the centre 4:5 band, y 285 to 1635 of 1920: the same numbers safeArea.ts
 * documents (src/lib/safeArea.ts), reused here. Ask for `feedCrop` to keep type inside it as well.
 *
 * Every rectangle is defined at 1080 x 1920 and scaled to the frame asked for (x by width / 1080, y by height / 1920). On a
 * frame that is not 9:16 that scaling is only a rough guide; these apps only draw this chrome on 9:16.
 */
export type Platform = "instagram" | "tiktok" | "shorts";
export type Rect = { x: number; y: number; w: number; h: number };
export type Zone = Rect & { name: "top" | "bottom" | "rail" };

const BASE_W = 1080;
const BASE_H = 1920;

/** The covered zones at 1080 x 1920. */
const ZONES: Record<Platform, Zone[]> = {
  // Reels: header ~220, bottom strip ~420 (safeArea.ts uses the same ~420), rail ~140 wide from y ~1080 down.
  instagram: [
    { name: "top", x: 0, y: 0, w: 1080, h: 220 },
    { name: "bottom", x: 0, y: 1500, w: 1080, h: 420 },
    { name: "rail", x: 940, y: 1080, w: 140, h: 420 },
  ],
  // TikTok: Following / For You tabs ~160, caption and sound ~440 at the bottom, a wider rail (~180) that starts higher.
  tiktok: [
    { name: "top", x: 0, y: 0, w: 1080, h: 160 },
    { name: "bottom", x: 0, y: 1480, w: 1080, h: 440 },
    { name: "rail", x: 900, y: 640, w: 180, h: 840 },
  ],
  // YouTube Shorts: header ~160, title, channel and subscribe ~420 at the bottom, a ~130 rail from y ~900.
  shorts: [
    { name: "top", x: 0, y: 0, w: 1080, h: 160 },
    { name: "bottom", x: 0, y: 1500, w: 1080, h: 420 },
    { name: "rail", x: 950, y: 900, w: 130, h: 600 },
  ],
};

/** Instagram's 4:5 feed crop of a 9:16 Reel, from safeArea.ts: y 285 to 1635 of 1920. */
export const IG_FEED_BAND = { top: 285, bottom: 1635 } as const;

/** A side margin type keeps from the frame edge, at 1080 wide. */
export const EDGE_MARGIN = 40;

export type FreeOptions = { feedCrop?: boolean; margin?: number };

const scaleRect = <T extends Rect>(r: T, W: number, H: number): T => ({
  ...r, x: (r.x * W) / BASE_W, y: (r.y * H) / BASE_H, w: (r.w * W) / BASE_W, h: (r.h * H) / BASE_H,
});

/** The zones the platform draws over, scaled to W x H. With `feedCrop` (Instagram only) the parts outside the 4:5 band join them. */
export const platformZones = (p: Platform, W = BASE_W, H = BASE_H, opts: FreeOptions = {}): Zone[] => {
  const z = ZONES[p].map((r) => scaleRect(r, W, H));
  if (opts.feedCrop && p === "instagram") {
    z.push(scaleRect({ name: "top", x: 0, y: 0, w: BASE_W, h: IG_FEED_BAND.top }, W, H));
    z.push(scaleRect({ name: "bottom", x: 0, y: IG_FEED_BAND.bottom, w: BASE_W, h: BASE_H - IG_FEED_BAND.bottom }, W, H));
  }
  return z;
};

/**
 * The free rectangles for a platform at W x H: the frame inside its side margins, minus the header, the bottom strip and
 * the rail. Returned as up to two rectangles that tile the free area: the full-width band above the rail, and the band
 * beside it (left of the rail) down to the bottom strip.
 */
export const freeRects = (p: Platform, W = BASE_W, H = BASE_H, opts: FreeOptions = {}): Rect[] => {
  const m = ((opts.margin ?? EDGE_MARGIN) * W) / BASE_W;
  const zones = platformZones(p, W, H, opts);
  const top = Math.max(0, ...zones.filter((z) => z.name === "top").map((z) => z.y + z.h));
  const bottom = Math.min(H, ...zones.filter((z) => z.name === "bottom").map((z) => z.y));
  const rail = zones.find((z) => z.name === "rail");
  if (!rail || rail.y >= bottom) return [{ x: m, y: top, w: W - 2 * m, h: bottom - top }];
  const out: Rect[] = [];
  if (rail.y > top) out.push({ x: m, y: top, w: W - 2 * m, h: rail.y - top });
  const railTop = Math.max(top, rail.y);
  out.push({ x: m, y: railTop, w: Math.min(W - m, rail.x) - m, h: bottom - railTop });
  return out;
};

export const intersects = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
export const overlapArea = (a: Rect, b: Rect) =>
  Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

/** True when `r` sits wholly inside the free area (inside the side margins, touching no zone). */
export const clearOfPlatform = (r: Rect, p: Platform, W = BASE_W, H = BASE_H, opts: FreeOptions = {}) => {
  const m = ((opts.margin ?? EDGE_MARGIN) * W) / BASE_W;
  if (r.x < m - 0.5 || r.x + r.w > W - m + 0.5 || r.y < 0 || r.y + r.h > H) return false;
  return !platformZones(p, W, H, opts).some((z) => intersects(r, z));
};
