/**
 * Colour math for the snapcn parts, written for the studio on 2026-11-06.
 *
 * snapcn's own `color.ts` leans on the `culori` package, which the studio does not have. Rather than add
 * a dependency for five functions, this file keeps snapcn's exported names and behaviour (parse a colour,
 * mix two colours through OKLCH, clamp chroma back into sRGB, format as `rgb()`/`rgba()`) with the maths
 * inline. Input it understands: `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()`/`rgba()`, `oklch()`,
 * and `white`, `black`, `transparent`. Anything else falls back to black, as snapcn's did.
 */

export type Rgb = { mode: "rgb"; r: number; g: number; b: number; alpha?: number };
export type Oklch = { mode: "oklch"; l: number; c: number; h: number; alpha?: number };

const BLACK: Rgb = { mode: "rgb", r: 0, g: 0, b: 0, alpha: 1 };

const NAMED: Record<string, Rgb> = {
  white: { mode: "rgb", r: 1, g: 1, b: 1, alpha: 1 },
  black: { ...BLACK },
  transparent: { mode: "rgb", r: 0, g: 0, b: 0, alpha: 0 },
};

const num = (s: string, scale: number) => {
  const t = s.trim();
  if (t.endsWith("%")) return parseFloat(t) / 100;
  return parseFloat(t) / scale;
};

/** sRGB transfer, both ways. */
const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const fromLinear = (v: number) => (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055);

function oklchToRgbRaw(l: number, c: number, h: number): Rgb {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const L = l_ ** 3;
  const M = m_ ** 3;
  const S = s_ ** 3;
  return {
    mode: "rgb",
    r: fromLinear(4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S),
    g: fromLinear(-1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S),
    b: fromLinear(-0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S),
  };
}

const inGamut = (c: Rgb, eps = 1e-6) =>
  c.r >= -eps && c.r <= 1 + eps && c.g >= -eps && c.g <= 1 + eps && c.b >= -eps && c.b <= 1 + eps;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function parse(s: string): Rgb | null {
  const t = s.trim().toLowerCase();
  if (NAMED[t]) return { ...NAMED[t] };
  if (t.startsWith("#")) {
    let hex = t.slice(1);
    if (hex.length === 3 || hex.length === 4) hex = hex.split("").map((ch) => ch + ch).join("");
    if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/.test(hex)) return null;
    const v = (i: number) => parseInt(hex.slice(i, i + 2), 16) / 255;
    return { mode: "rgb", r: v(0), g: v(2), b: v(4), alpha: hex.length === 8 ? v(6) : 1 };
  }
  const fn = /^(rgba?|oklch)\(([^)]*)\)$/.exec(t);
  if (!fn) return null;
  const parts = fn[2].replace(/\s*\/\s*/, " / ").split(/[\s,]+/).filter(Boolean);
  const slash = parts.indexOf("/");
  const body = slash >= 0 ? parts.slice(0, slash) : parts.slice(0, 3);
  const alphaRaw = slash >= 0 ? parts[slash + 1] : parts[3];
  if (body.length < 3) return null;
  const alpha = alphaRaw === undefined ? 1 : num(alphaRaw, 1);
  if (fn[1] === "oklch") {
    const l = body[0].endsWith("%") ? parseFloat(body[0]) / 100 : parseFloat(body[0]);
    const c = body[1].endsWith("%") ? (parseFloat(body[1]) / 100) * 0.4 : parseFloat(body[1]);
    const h = parseFloat(body[2]) || 0;
    const rgb = oklchToRgb(l, c, h);
    return { ...rgb, alpha };
  }
  const [r, g, b] = body.map((x) => num(x, 255));
  if ([r, g, b, alpha].some((x) => Number.isNaN(x))) return null;
  return { mode: "rgb", r, g, b, alpha };
}

export function parseColor(c: string): Rgb {
  const s = c.trim();
  if (s.startsWith("var(")) return { ...BLACK };
  const rgb = parse(s);
  if (!rgb) return { ...BLACK };
  return { mode: "rgb", r: rgb.r, g: rgb.g, b: rgb.b, alpha: rgb.alpha ?? 1 };
}

/** OKLCH to sRGB, with chroma reduced until the colour fits (what culori's clampChroma does). */
export function oklchToRgb(l: number, c: number, h: number): Rgb {
  let rgb = oklchToRgbRaw(l, c, h);
  if (!inGamut(rgb)) {
    let lo = 0;
    let hi = c;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToRgbRaw(l, mid, h))) lo = mid;
      else hi = mid;
    }
    rgb = oklchToRgbRaw(l, lo, h);
  }
  return { mode: "rgb", r: clamp01(rgb.r), g: clamp01(rgb.g), b: clamp01(rgb.b), alpha: 1 };
}

export function rgbToOklch(rgb: Rgb): Oklch {
  const r = toLinear(rgb.r);
  const g = toLinear(rgb.g);
  const b = toLinear(rgb.b);
  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  const c = Math.sqrt(A * A + B * B);
  let h = (Math.atan2(B, A) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { mode: "oklch", l: L, c, h: c < 1e-4 || !Number.isFinite(h) ? 0 : h };
}

/** Mix two colours through OKLCH (shorter hue arc; an achromatic end borrows the other's hue). */
export function mixOklch(a: string, b: string, t: number): string {
  const ca = parseColor(a);
  const cb = parseColor(b);
  const A = rgbToOklch(ca);
  const B = rgbToOklch(cb);
  let ha = A.h;
  let hb = B.h;
  if (A.c < 1e-4) ha = hb;
  if (B.c < 1e-4) hb = ha;
  let dh = hb - ha;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  const l = A.l + (B.l - A.l) * t;
  const c = A.c + (B.c - A.c) * t;
  const h = (ha + dh * t + 360) % 360;
  const rgb = oklchToRgb(l, c, h);
  const alpha = (ca.alpha ?? 1) + ((cb.alpha ?? 1) - (ca.alpha ?? 1)) * t;
  return toCss({ ...rgb, alpha });
}

export function toCss(color: Rgb): string {
  const to255 = (v: number) => Math.round(clamp01(v) * 255);
  const a = color.alpha ?? 1;
  return a >= 1
    ? `rgb(${to255(color.r)}, ${to255(color.g)}, ${to255(color.b)})`
    : `rgba(${to255(color.r)}, ${to255(color.g)}, ${to255(color.b)}, ${+a.toFixed(4)})`;
}

/** A colour at partial opacity, for scrims and washes. */
export function withAlpha(color: string, alpha: number): string {
  const { r, g, b } = parseColor(color);
  return toCss({ mode: "rgb", r, g, b, alpha });
}
