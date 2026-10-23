#!/usr/bin/env node
/**
 * Beat map for one music track (2026-10-23, the film system's sound half).
 *
 *   node scripts/beats.mjs <track>            measure one track, e.g. `cat-walk` or a path to an mp3
 *   node scripts/beats.mjs --all              every track on the shelf (../shots/audio/bgm and music)
 *   node scripts/beats.mjs <path.mp3> --dry   measure and print only (auditioning a candidate), writes nothing
 *   node scripts/beats.mjs --verify           compare our grid with the hand grids in src/spring and src/flock
 *
 * Writes public/sound/beats/<track>.json, copies the mp3 to public/sound/music/<track>.mp3 (Score plays it from
 * there), and regenerates src/system/sound/tracks.ts, the index Score and soundFromStoryboard read.
 *
 * No install: decoding goes through Remotion's own ffmpeg (`npx remotion ffmpeg`, s16 mono wav at 22.05 kHz), and
 * the analysis is plain JS. The method is the shelf's (shots/method/music-beat-sync.md), done without librosa:
 *   1. onset strength: spectral flux over 48 log bands (centred 2048 window, 256 hop = 11.6 ms), local mean removed
 *   2. tempo: autocorrelation of the onset curve, weighted toward 110 BPM, then the 0.5x / 1x / 2x candidates are
 *      scored by F-measure against the detected onsets (a grid twice too fast hits everything, so precision counts)
 *   3. beats: Ellis dynamic programming (tightness 400), then a least-squares straight line t = t0 + n*T through
 *      them, because "don't trust the tempo scalar, trust the beat sequence" (method §1)
 *   4. attack correction: the flux peaks a little after the sound starts, so t0 is moved by the median distance
 *      from each grid beat to the steepest rise of the low band right before it (the kick's attack)
 *   5. downbeats: of the four bar phases, the one where the sound changes most (harmonic novelty) and where the
 *      big energy jumps land
 *   6. moments: per-beat loudness (RMS in dB), averaged per bar; a "lift" is a bar where the next two bars are
 *      clearly louder than the two before (a drop or a section stepping up), a "breakdown" the reverse, a
 *      "near-silence" a beat far under the track's median, plus where the ending goes quiet
 *   7. loudness: ffmpeg loudnorm's EBU R128 measurement (integrated LUFS, true peak), so Score can set the music
 *      gain that puts a film near -14 LUFS without guessing
 *
 * All times are float seconds into the TRACK; frames happen only in Score (method §1: round at the last step).
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const STUDIO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SHELF = [resolve(STUDIO, "../shots/audio/music"), resolve(STUDIO, "../shots/audio/bgm")];
const OUT_BEATS = join(STUDIO, "public/sound/beats");
const OUT_MUSIC = join(STUDIO, "public/sound/music");
const INDEX = join(STUDIO, "src/system/sound/tracks.ts");

const SR = 22050;
const NFFT = 2048;
const HOP = 256;
const FR = SR / HOP; // onset frames per second

// ---------------------------------------------------------------- decode

function ffmpeg(args, binary = true) {
  const r = spawnSync("npx", ["remotion", "ffmpeg", "-hide_banner", ...args], {
    cwd: STUDIO,
    maxBuffer: 1 << 30,
    encoding: binary ? "buffer" : "utf8",
  });
  return r;
}

function decode(file) {
  const r = ffmpeg(["-v", "error", "-i", file, "-ac", "1", "-ar", String(SR), "-c:a", "pcm_s16le", "-f", "wav", "pipe:1"]);
  if (r.status !== 0) throw new Error(`ffmpeg could not decode ${file}: ${r.stderr}`);
  const buf = r.stdout;
  // find the "data" chunk
  let p = 12;
  while (p < buf.length - 8) {
    const id = buf.toString("ascii", p, p + 4);
    const size = buf.readUInt32LE(p + 4);
    if (id === "data") {
      const n = Math.floor(Math.min(size, buf.length - p - 8) / 2);
      const y = new Float32Array(n);
      for (let i = 0; i < n; i++) y[i] = buf.readInt16LE(p + 8 + 2 * i) / 32768;
      return y;
    }
    p += 8 + size + (size & 1);
  }
  throw new Error("no data chunk in decoded wav");
}

function loudness(file) {
  const r = ffmpeg(["-i", file, "-af", "loudnorm=I=-14:TP=-1:LRA=11:print_format=json", "-f", "null", "-"], false);
  const m = r.stderr.match(/\{[\s\S]*?"input_i"[\s\S]*?\}/);
  if (!m) return null;
  const j = JSON.parse(m[0]);
  return { integratedLufs: +j.input_i, truePeakDb: +j.input_tp, lra: +j.input_lra };
}

// ---------------------------------------------------------------- spectrum

function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2;
        const xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr;
        re[b] = re[a] - xr; im[b] = im[a] - xi;
        re[a] += xr; im[a] += xi;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
}

/** Log-band spectrogram, low-band (40 to 160 Hz) magnitude and per-frame RMS, frames centred on t = i * HOP / SR. */
function analyse(y) {
  const nFrames = Math.floor(y.length / HOP) + 1;
  const win = new Float64Array(NFFT).map((_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / NFFT));
  const NB = 48;
  const edges = [];
  for (let b = 0; b <= NB; b++) edges.push(Math.round((30 * Math.pow(8000 / 30, b / NB) * NFFT) / SR));
  const bands = Array.from({ length: nFrames }, () => new Float32Array(NB));
  const low = new Float32Array(nFrames);
  const rms = new Float32Array(nFrames);
  const lo0 = Math.round((40 * NFFT) / SR), lo1 = Math.round((160 * NFFT) / SR);
  const re = new Float64Array(NFFT), im = new Float64Array(NFFT);
  for (let f = 0; f < nFrames; f++) {
    const c = f * HOP - NFFT / 2;
    let e = 0;
    for (let i = 0; i < NFFT; i++) {
      const s = c + i >= 0 && c + i < y.length ? y[c + i] : 0;
      re[i] = s * win[i]; im[i] = 0;
      if (i >= NFFT / 2 - HOP / 2 && i < NFFT / 2 + HOP / 2) e += s * s;
    }
    rms[f] = Math.sqrt(e / HOP);
    fft(re, im);
    for (let b = 0; b < NB; b++) {
      let s = 0;
      for (let k = Math.max(1, edges[b]); k < Math.max(edges[b] + 1, edges[b + 1]); k++) s += Math.hypot(re[k], im[k]);
      bands[f][b] = Math.log1p(100 * s);
    }
    let l = 0;
    for (let k = lo0; k <= lo1; k++) l += Math.hypot(re[k], im[k]);
    low[f] = l;
  }
  return { bands, low, rms, nFrames };
}

function flux(bands) {
  const n = bands.length, o = new Float32Array(n);
  for (let f = 1; f < n; f++) {
    let s = 0;
    for (let b = 0; b < bands[f].length; b++) s += Math.max(0, bands[f][b] - bands[f - 1][b]);
    o[f] = s;
  }
  return o;
}

function detrend(x, halfSeconds = 0.25) {
  const w = Math.round(halfSeconds * FR), n = x.length, o = new Float32Array(n);
  let sum = 0;
  const pre = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) pre[i + 1] = pre[i] + x[i];
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - w), b = Math.min(n, i + w + 1);
    o[i] = Math.max(0, x[i] - (pre[b] - pre[a]) / (b - a));
    sum += o[i];
  }
  let sd = 0;
  const mean = sum / n;
  for (let i = 0; i < n; i++) sd += (o[i] - mean) ** 2;
  sd = Math.sqrt(sd / n) || 1;
  for (let i = 0; i < n; i++) o[i] /= sd;
  return o;
}

const at = (env, t) => {
  const x = t * FR, i = Math.floor(x), f = x - i;
  if (i < 0 || i + 1 >= env.length) return 0;
  return env[i] * (1 - f) + env[i + 1] * f;
};

/** Peaks of an envelope above mean + k*sd, with sub-frame parabolic interpolation. */
function peaks(env, k = 1, minGap = 0.07) {
  let m = 0, s = 0;
  for (const v of env) m += v;
  m /= env.length;
  for (const v of env) s += (v - m) ** 2;
  s = Math.sqrt(s / env.length);
  const out = [];
  for (let i = 2; i < env.length - 2; i++) {
    if (env[i] > m + k * s && env[i] >= env[i - 1] && env[i] > env[i + 1] && env[i] >= env[i - 2] && env[i] >= env[i + 2]) {
      const a = env[i - 1], b = env[i], c = env[i + 1];
      const d = (a - c) / (2 * (a - 2 * b + c) || 1);
      const t = (i + (Math.abs(d) < 1 ? d : 0)) / FR;
      if (out.length && t - out[out.length - 1].t < minGap) {
        if (b > out[out.length - 1].s) out[out.length - 1] = { t, s: b };
      } else out.push({ t, s: b });
    }
  }
  return out;
}

// ---------------------------------------------------------------- tempo and beats

function tempoCandidates(env) {
  const minLag = Math.floor((60 / 200) * FR), maxLag = Math.ceil((60 / 60) * FR);
  const ac = new Float64Array(maxLag + 2);
  for (let L = minLag - 1; L <= maxLag + 1; L++) {
    let s = 0;
    for (let i = L; i < env.length; i++) s += env[i] * env[i - L];
    ac[L] = s / (env.length - L);
  }
  const scored = [];
  for (let L = minLag; L <= maxLag; L++) {
    if (ac[L] > ac[L - 1] && ac[L] >= ac[L + 1]) {
      const d = (ac[L - 1] - ac[L + 1]) / (2 * (ac[L - 1] - 2 * ac[L] + ac[L + 1]) || 1);
      const lag = L + d;
      const bpm = (60 * FR) / lag;
      const prior = Math.exp(-0.5 * (Math.log2(bpm / 110) / 0.9) ** 2);
      scored.push({ bpm, w: ac[L] * prior });
    }
  }
  scored.sort((a, b) => b.w - a.w);
  return scored;
}

/** Whole-track grid search: the period and phase whose beats collect the most onset strength. Coarse, then fine. */
function gridSearch(env, P, dur) {
  const score = (T, t0) => {
    let s = 0;
    for (let t = t0; t < dur; t += T) s += at(env, t);
    return s;
  };
  let best = { s: -1, T: P, t0: 0 };
  for (let T = P * 0.985; T <= P * 1.015; T += 1e-4)
    for (let t0 = 0; t0 < T; t0 += 0.25 / FR) {
      const s = score(T, t0);
      if (s > best.s) best = { s, T, t0 };
    }
  const c = best;
  for (let T = c.T - 1.2e-4; T <= c.T + 1.2e-4; T += 4e-6)
    for (let t0 = c.t0 - 0.5 / FR; t0 <= c.t0 + 0.5 / FR; t0 += 0.0625 / FR) {
      const s = score(T, t0);
      if (s > best.s) best = { s, T, t0 };
    }
  return best;
}

/**
 * Least-squares line through the onsets that sit on the grid (each grid beat takes the strongest onset within
 * 45 ms), twice, dropping matches more than 25 ms off the first line. This is the method's "fit t = t0 + n*T to
 * the real beat sequence" with the beat sequence read off the onsets rather than a tracker.
 */
function refine(T, t0, onsets, dur) {
  const match = (T, t0, tol) => {
    const pts = [];
    let j = 0;
    for (let n = 0, t = t0; t < dur; n++, t = t0 + n * T) {
      while (j < onsets.length && onsets[j].t < t - tol) j++;
      let best = null;
      for (let k = j; k < onsets.length && onsets[k].t <= t + tol; k++) if (!best || onsets[k].s > best.s) best = onsets[k];
      if (best) pts.push([n, best.t]);
    }
    return pts;
  };
  const fit = (pts) => {
    const n = pts.length;
    let sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (const [i, y] of pts) { sx += i; sy += y; sxx += i * i; sxy += i * y; }
    const T = (n * sxy - sx * sy) / (n * sxx - sx * sx);
    return { T, t0: (sy - T * sx) / n };
  };
  let cur = { T, t0 };
  let pts = match(T, t0, 0.045);
  for (let pass = 0; pass < 3 && pts.length > 16; pass++) {
    cur = fit(pts);
    pts = match(cur.T, cur.t0, 0.045).filter(([n, y]) => Math.abs(y - (cur.t0 + n * cur.T)) < 0.025);
  }
  if (pts.length > 16) cur = fit(pts);
  const residuals = pts.map(([n, y]) => y - (cur.t0 + n * cur.T));
  return { ...cur, matched: pts.length, residuals };
}

/** F-measure of a grid against detected onsets (±40 ms). */
function gridScore(T, t0, onsets, dur) {
  const tol = 0.04;
  const grid = [];
  for (let t = t0; t < dur; t += T) if (t >= 0) grid.push(t);
  let hit = 0, j = 0;
  for (const g of grid) {
    while (j < onsets.length && onsets[j].t < g - tol) j++;
    if (j < onsets.length && Math.abs(onsets[j].t - g) <= tol) hit++;
  }
  let rec = 0, k = 0;
  for (const o of onsets) {
    while (k < grid.length && grid[k] < o.t - tol) k++;
    if (k < grid.length && Math.abs(grid[k] - o.t) <= tol) rec += o.s;
  }
  const precision = hit / (grid.length || 1);
  const recall = rec / (onsets.reduce((a, o) => a + o.s, 0) || 1);
  return { precision, recall, f: (2 * precision * recall) / (precision + recall || 1) };
}

/** Zero-phase RBJ band-pass (two passes of a biquad, forward then backward). */
function bandpass(y, lo, hi) {
  const f0 = Math.sqrt(lo * hi), Q = f0 / (hi - lo);
  const w = (2 * Math.PI * f0) / SR, al = Math.sin(w) / (2 * Q), a0 = 1 + al;
  const b0 = al / a0, b2 = -al / a0, a1 = (-2 * Math.cos(w)) / a0, a2 = (1 - al) / a0;
  const run = (x) => {
    const o = new Float32Array(x.length);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < x.length; i++) {
      const v = b0 * x[i] + b2 * x2 - a1 * y1 - a2 * y2;
      x2 = x1; x1 = x[i]; y2 = y1; y1 = v; o[i] = v;
    }
    return o;
  };
  const f = run(y).reverse();
  return run(f).reverse();
}

/**
 * The attack correction, at sample resolution. Flux peaks a frame or two after a drum actually starts, so for
 * every grid beat we find where the kick band (40 to 160 Hz) and the hat band (2 to 8 kHz) envelopes cross half
 * their rise in a window around it, and move t0 by the median gap. That half-rise point is the "beat time" this
 * file means everywhere: the moment a cue should hit.
 */
function attack(y, T, t0, dur) {
  const offs = [];
  for (const [lo, hi] of [[40, 160], [2000, 8000]]) {
    const b = bandpass(y, lo, hi);
    const k = Math.round(0.002 * SR), e = new Float32Array(b.length);
    let acc = 0;
    for (let i = 0; i < b.length; i++) {
      acc += Math.abs(b[i]) - (i >= k ? Math.abs(b[i - k]) : 0);
      e[i] = acc / k;
    }
    for (let t = t0 + 4 * T; t < dur - T; t += T) {
      const a = Math.round((t - 0.12) * SR), z = Math.round((t + 0.08) * SR);
      if (a < 0 || z >= e.length) continue;
      let m = 0;
      for (let i = a; i < z; i++) m = Math.max(m, e[i]);
      const head = Array.from(e.subarray(a, a + Math.round(0.04 * SR))).sort((p, q) => p - q);
      const base = head[Math.floor(head.length / 2)];
      if (m < 4 * base + 1e-4) continue;
      const half = base + 0.5 * (m - base);
      let i = a;
      while (i < z && e[i] < half) i++;
      offs.push(i / SR - t);
    }
  }
  offs.sort((p, q) => p - q);
  if (offs.length < 16) return { shift: 0, n: offs.length, spreadMs: null };
  const q = (f) => offs[Math.floor(f * (offs.length - 1))];
  return { shift: q(0.5), n: offs.length, spreadMs: +(1000 * (q(0.75) - q(0.25))).toFixed(1) };
}

/**
 * ITU-R BS.1770 K-weighting (the high shelf then the high pass that LUFS is built on), designed for any sample
 * rate from the standard's analogue parameters (the same construction pyloudnorm uses).
 */
function kWeight(y) {
  const biquad = (x, b0, b1, b2, a0, a1, a2) => {
    const o = new Float32Array(x.length);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < x.length; i++) {
      const v = (b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
      x2 = x1; x1 = x[i]; y2 = y1; y1 = v; o[i] = v;
    }
    return o;
  };
  let G = 3.999843853973347, Q = 0.7071752369554196, fc = 1681.974450955533;
  let A = Math.pow(10, G / 40), w = (2 * Math.PI * fc) / SR, c = Math.cos(w), al = Math.sin(w) / (2 * Q), sA = Math.sqrt(A);
  const shelf = biquad(y, A * (A + 1 + (A - 1) * c + 2 * sA * al), -2 * A * (A - 1 + (A + 1) * c), A * (A + 1 + (A - 1) * c - 2 * sA * al),
    A + 1 - (A - 1) * c + 2 * sA * al, 2 * (A - 1 - (A + 1) * c), A + 1 - (A - 1) * c - 2 * sA * al);
  Q = 0.5003270373238773; fc = 38.13547087602444;
  w = (2 * Math.PI * fc) / SR; c = Math.cos(w); al = Math.sin(w) / (2 * Q);
  return biquad(shelf, (1 + c) / 2, -(1 + c), (1 + c) / 2, 1 + al, -2 * c, 1 - al);
}

/** Per-beat K-weighted mean square and sample peak, both in dB, so Score can judge the loudness of an excerpt. */
function beatLoudness(y, beatTimes, T) {
  const k = kWeight(y);
  return beatTimes.map((t) => {
    const a = Math.max(0, Math.round(t * SR)), b = Math.min(y.length, Math.round((t + T) * SR));
    let s = 0, p = 0;
    for (let i = a; i < b; i++) { s += k[i] * k[i]; p = Math.max(p, Math.abs(y[i])); }
    return { k: 10 * Math.log10(s / Math.max(1, b - a) + 1e-12), peak: dbOf(p) };
  });
}

// ---------------------------------------------------------------- structure

const dbOf = (x) => 20 * Math.log10(Math.max(1e-6, x));

function beatEnergy(rms, beatTimes, T) {
  return beatTimes.map((t) => {
    const a = Math.max(0, Math.round(t * FR)), b = Math.min(rms.length, Math.round((t + T) * FR));
    let s = 0;
    for (let i = a; i < b; i++) s += rms[i] * rms[i];
    return dbOf(Math.sqrt(s / Math.max(1, b - a)));
  });
}

function novelty(bands, beatTimes, T) {
  // average band spectrum per beat, then cosine distance between consecutive beats
  const vec = beatTimes.map((t) => {
    const a = Math.max(0, Math.round(t * FR)), b = Math.min(bands.length, Math.round((t + T) * FR));
    const v = new Float64Array(bands[0].length);
    for (let i = a; i < b; i++) for (let k = 0; k < v.length; k++) v[k] += bands[i][k];
    return v;
  });
  return vec.map((v, i) => {
    if (i === 0) return 0;
    const u = vec[i - 1];
    let d = 0, nu = 0, nv = 0;
    for (let k = 0; k < v.length; k++) { d += u[k] * v[k]; nu += u[k] * u[k]; nv += v[k] * v[k]; }
    return 1 - d / (Math.sqrt(nu * nv) || 1);
  });
}

function median(xs) {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
}

// ---------------------------------------------------------------- one track

function resolveTrack(arg) {
  if (existsSync(arg)) return resolve(arg);
  for (const d of SHELF) {
    const p = join(d, arg.endsWith(".mp3") ? arg : `${arg}.mp3`);
    if (existsSync(p)) return p;
  }
  throw new Error(`no track "${arg}" in ${SHELF.join(" or ")}`);
}

function sourceLine(name) {
  const attr = resolve(STUDIO, "../shots/audio/ATTRIBUTION.md");
  if (!existsSync(attr)) return null;
  const line = readFileSync(attr, "utf8").split("\n").find((l) => l.includes(`\`${name}.mp3\``));
  if (!line) return null;
  const url = line.match(/https?:\/\/\S+?(?=\s|\||$)/);
  return { url: url ? url[0] : null, licence: /Mixkit/i.test(line) || /mixkit/.test(url?.[0] ?? "") ? "Mixkit Stock Music Free License" : null };
}

export function measure(file) {
  const name = basename(file).replace(/\.mp3$/i, "");
  const y = decode(file);
  const dur = y.length / SR;
  const { bands, low, rms } = analyse(y);
  const env = detrend(flux(bands));
  const lowEnv = detrend(flux(Array.from(low, (v) => new Float32Array([Math.log1p(v)]))));
  const onsets = peaks(env, 0.8);

  // tempo: best autocorrelation peak, then 0.5x / 1x / 2x, each fitted as a whole-track grid
  const comb = env.map((v, i) => v + lowEnv[i]);
  const cands = tempoCandidates(env);
  const base = cands[0]?.bpm ?? 120;
  const tried = [];
  for (const mult of [0.5, 1, 2]) {
    const bpm = base * mult;
    if (bpm < 60 || bpm > 200) continue;
    const g = gridSearch(comb, 60 / bpm, dur);
    let r = refine(g.T, g.t0, onsets, dur);
    // on-beat or off-beat: house hats sit between the kicks and can win the flux search, so the grid takes the
    // phase where the kick band is stronger (method §1: with the right grid the kicks land on whole beats)
    const lowSum = (t0) => { let s = 0; for (let t = t0; t < dur; t += r.T) s += at(lowEnv, t); return s; };
    if (lowSum(r.t0 + r.T / 2) > 1.1 * lowSum(r.t0)) r = refine(r.T, r.t0 + r.T / 2, onsets, dur);
    const score = gridScore(r.T, r.t0, onsets, dur);
    tried.push({ mult, bpm: 60 / r.T, ...r, ...score });
  }
  // octave choice. F-measure favours the denser grid whenever the track has eighth-note onsets, so it cannot
  // decide between 90 and 180. Precision can: a grid at the right tempo or half of it lands on onsets nearly every
  // beat. Of the candidates within 0.1 of the best precision, take the one nearest 110 BPM, the octave a film is
  // cut in (a 180 BPM reading of a 90 BPM chill track is the same grid with a beat between every pair).
  tried.sort((a, b) => b.f - a.f);
  const topP = Math.max(...tried.map((c) => c.precision));
  const pick = tried.filter((c) => c.precision >= topP - 0.1)
    .sort((a, b) => Math.abs(Math.log2(a.bpm / 110)) - Math.abs(Math.log2(b.bpm / 110)))[0];
  let { T, t0 } = pick;
  const fluxT0 = t0;
  const att = attack(y, T, t0, dur);
  const shift = att.shift;
  t0 += shift;
  // first grid beat at or after 0
  while (t0 - T >= -0.02) t0 -= T;
  while (t0 < -0.02) t0 += T;

  const beats = [];
  for (let t = t0; t < dur - 0.05; t += T) beats.push(+t.toFixed(4));
  const energy = beatEnergy(rms, beats, T);
  const bl = beatLoudness(y, beats, T);
  const nov = novelty(bands, beats, T);

  // bar phase: harmonic change plus where the loudness steps happen
  const step = energy.map((e, i) => (i >= 4 && i + 4 <= energy.length ? energy.slice(i, i + 4).reduce((a, b) => a + b) / 4 - energy.slice(i - 4, i).reduce((a, b) => a + b) / 4 : 0));
  const lowAt = beats.map((t) => at(lowEnv, t));
  const phaseScore = [0, 1, 2, 3].map((p) => {
    let n = 0, s = 0, l = 0, k = 0;
    for (let i = p; i < beats.length; i += 4) { n++; s += nov[i]; l += Math.abs(step[i]); k += lowAt[i]; }
    return { p, novelty: s / n, step: l / n, low: k / n };
  });
  const norm = (key) => {
    const m = Math.max(...phaseScore.map((x) => x[key])) || 1;
    return phaseScore.map((x) => x[key] / m);
  };
  const nN = norm("novelty"), nS = norm("step"), nL = norm("low");
  const combined = phaseScore.map((x, i) => ({ p: x.p, score: nN[i] + nS[i] + 0.5 * nL[i] }));
  combined.sort((a, b) => b.score - a.score);
  const barPhase = combined[0].p;
  const downbeats = beats.filter((_, i) => i % 4 === barPhase);

  // bars: mean energy per bar
  const bars = [];
  for (let i = barPhase; i + 4 <= beats.length; i += 4) bars.push({ beat: i, t: beats[i], db: energy.slice(i, i + 4).reduce((a, b) => a + b) / 4 });
  const med = median(energy);
  const moments = [];
  for (let b = 2; b + 2 <= bars.length; b++) {
    const before = (bars[b - 1].db + bars[b - 2].db) / 2;
    const after = (bars[b].db + bars[b + 1].db) / 2;
    const d = after - before;
    if (bars[b].t > dur - 2) continue;
    if (d >= 2.5) moments.push({ kind: "lift", t: bars[b].t, beat: bars[b].beat, strength: +d.toFixed(2) });
    if (d <= -3) moments.push({ kind: "breakdown", t: bars[b].t, beat: bars[b].beat, strength: +Math.min(40, -d).toFixed(2) });
  }
  // keep the strongest of any moments within two bars of each other
  moments.sort((a, b) => b.strength - a.strength);
  const kept = [];
  for (const m of moments) if (!kept.some((k) => Math.abs(k.beat - m.beat) < 8)) kept.push(m);
  // near-silences: a beat or more 12 dB under the median while the music around it (two bars either side) is
  // playing, i.e. a real gap before a turn, not the sparse intro or the tail
  const around = (i) => {
    const a = energy.slice(Math.max(0, i - 8), i), b = energy.slice(i + 1, i + 9);
    const m = (x) => (x.length ? x.reduce((p, q) => p + q, 0) / x.length : -99);
    return Math.max(m(a), m(b));
  };
  for (let i = 0; i < energy.length; i++) {
    if (energy[i] < med - 12 && beats[i] < dur - 4 && beats[i] > 2) {
      let j = i;
      while (j + 1 < energy.length && energy[j + 1] < med - 12) j++;
      if (around(i) > med - 4 || j - i + 1 >= 4)
        kept.push({ kind: "near-silence", t: beats[i], beat: i, beats: j - i + 1, strength: +Math.min(40, med - energy[i]).toFixed(2) });
      i = j;
    }
  }
  // the ending: from the last loud bar, how long until it is 20 dB down
  let lastLoud = bars.length - 1;
  while (lastLoud > 0 && bars[lastLoud].db < med - 6) lastLoud--;
  const tail = bars[lastLoud] ? bars[lastLoud].t + 4 * T : dur;
  const ending = { lastFullBar: bars[lastLoud]?.t ?? null, quietFrom: +Math.min(dur, tail).toFixed(3), seconds: +(dur - Math.min(dur, tail)).toFixed(2) };
  kept.sort((a, b) => a.t - b.t);
  const strong = [...kept].filter((m) => m.kind === "lift").sort((a, b) => b.strength - a.strength).slice(0, 3).map((m) => m.t);
  for (const m of kept) if (m.kind === "lift" && strong.includes(m.t)) m.big = true;

  const sections = [];
  for (const b of bars) {
    const level = b.db > med - 2 ? "full" : b.db > med - 8 ? "mid" : "quiet";
    const last = sections[sections.length - 1];
    if (last && last.level === level) last.to = +(b.t + 4 * T).toFixed(3);
    else sections.push({ from: b.t, to: +(b.t + 4 * T).toFixed(3), level });
  }
  // merge sections shorter than two bars into their neighbour
  for (let i = sections.length - 2; i > 0; i--) if (sections[i].to - sections[i].from < 8 * T - 0.01) { sections[i - 1].to = sections[i].to; sections.splice(i, 1); }
  for (let i = sections.length - 1; i > 0; i--) if (sections[i].level === sections[i - 1].level) { sections[i - 1].to = sections[i].to; sections.splice(i, 1); }

  const absRes = pick.residuals.map(Math.abs);
  return {
    track: name,
    file: `sound/music/${name}.mp3`,
    shelf: file.replace(resolve(STUDIO, "..") + "/", ""),
    source: sourceLine(name),
    measuredOn: new Date().toISOString().slice(0, 10),
    method: "scripts/beats.mjs (spectral flux, Ellis DP, least-squares grid, low-band attack correction)",
    duration: +dur.toFixed(3),
    bpm: +(60 / T).toFixed(3),
    period: +T.toFixed(5),
    t0: +t0.toFixed(4),
    barPhase,
    fit: {
      beatsMatched: pick.matched,
      attackHits: att.n,
      attackSpreadMs: att.spreadMs,
      residualMs: { mean: +(1000 * absRes.reduce((a, b) => a + b, 0) / absRes.length).toFixed(1), p90: +(1000 * [...absRes].sort((a, b) => a - b)[Math.floor(absRes.length * 0.9)]).toFixed(1) },
      attackShiftMs: +(1000 * shift).toFixed(1),
      fluxT0: +fluxT0.toFixed(4),
      onsetPrecision: +pick.precision.toFixed(3),
      candidates: tried.map((c) => ({ mult: c.mult, bpm: +c.bpm.toFixed(2), f: +c.f.toFixed(3), precision: +c.precision.toFixed(3), recall: +c.recall.toFixed(3) })),
      phase: combined.map((c) => ({ phase: c.p, score: +c.score.toFixed(3) })),
    },
    loudness: loudness(file),
    beats,
    downbeats,
    energy: energy.map((e) => +e.toFixed(1)),
    // per beat: K-weighted mean square (dB, the LUFS building block, mono) and sample peak (dBFS, mono)
    kLoud: bl.map((x) => +x.k.toFixed(2)),
    peak: bl.map((x) => +x.peak.toFixed(1)),
    moments: kept,
    sections,
    ending,
  };
}

// ---------------------------------------------------------------- index

function writeIndex() {
  const files = existsSync(OUT_BEATS) ? readdirSync(OUT_BEATS).filter((f) => f.endsWith(".json")).sort() : [];
  const id = (f) => f.replace(/\.json$/, "").replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase()).replace(/^[^a-zA-Z]/, "_$&");
  const lines = [
    "// GENERATED by scripts/beats.mjs. Do not edit: run `node scripts/beats.mjs <track>` to add or refresh a track.",
    "import type { BeatMap } from \"./beats\";",
    ...files.map((f) => `import ${id(f)} from "../../../public/sound/beats/${f}";`),
    "",
    "/** Every measured track, by name (the mp3's file name without .mp3). */",
    "export const TRACKS: Record<string, BeatMap> = {",
    ...files.map((f) => `  ${JSON.stringify(f.replace(/\.json$/, ""))}: ${id(f)} as unknown as BeatMap,`),
    "};",
    "",
  ];
  writeFileSync(INDEX, lines.join("\n"));
}

// ---------------------------------------------------------------- verify

function handGrid(path) {
  const s = readFileSync(join(STUDIO, path), "utf8");
  const t0 = +s.match(/MUSIC_T0\s*=\s*([\d.]+)/)[1];
  const tm = s.match(/MUSIC_T\s*=\s*([^;]+);/)[1].trim();
  const T = tm.includes("/") ? eval(tm) : +tm; // "60 / 105" or "0.4616"
  const track = s.match(/audio\/([a-z0-9-]+)\.mp3|"([A-Z][a-z]+ ?[A-Za-z]*)"/);
  return { t0, T };
}

function verify() {
  const pairs = [
    { hand: "src/spring/beats.ts", track: "tonight-hiphop", notes: "step up into the full section on hand beats 88 and 89" , event: { beat: 88, kind: "lift" } },
    { hand: "src/flock/beats.ts", track: "cat-walk", notes: "kick enters at hand beat 30, the big drop lands on hand beat 62 (29.327 s)", event: { beat: 62, kind: "lift" } },
  ];
  const report = [];
  for (const p of pairs) {
    const g = handGrid(p.hand);
    const mapPath = join(OUT_BEATS, `${p.track}.json`);
    const m = existsSync(mapPath) ? JSON.parse(readFileSync(mapPath, "utf8")) : measure(resolveTrack(p.track));
    const errs = m.beats.map((t) => {
      const n = Math.round((t - g.t0) / g.T);
      return { n, e: t - (g.t0 + n * g.T) };
    });
    // if the two grids agree on tempo but sit half a beat apart, one of them is on the off-beat: say so and
    // report the error after folding by half a beat, which is the timing error once the phase is settled
    const halfApart = Math.abs(Math.abs(errs.reduce((a, x) => a + x.e, 0) / errs.length) - g.T / 2) < g.T / 6;
    const folded = errs.map((x) => (x.e > 0 ? x.e - g.T / 2 : x.e + g.T / 2));
    const abs = errs.map((x) => Math.abs(x.e) * 1000);
    const signed = errs.reduce((a, x) => a + x.e, 0) / errs.length * 1000;
    const first = errs[0], last = errs[errs.length - 1];
    // downbeat agreement: which hand-grid phase our downbeats sit on
    const handPhases = m.downbeats.map((t) => ((Math.round((t - g.t0) / g.T) % 4) + 4) % 4);
    const phase = median(handPhases);
    const ev = g.t0 + p.event.beat * g.T;
    const nearest = m.moments.filter((x) => x.kind === p.event.kind).sort((a, b) => Math.abs(a.t - ev) - Math.abs(b.t - ev))[0];
    report.push({
      track: p.track,
      hand: `${(60 / g.T).toFixed(2)} BPM, t0 ${g.t0}s (${p.hand})`,
      ours: `${m.bpm} BPM, t0 ${m.t0}s`,
      bpmDiff: +(m.bpm - 60 / g.T).toFixed(3),
      beatErrorMs: { mean: +(abs.reduce((a, b) => a + b, 0) / abs.length).toFixed(1), max: +Math.max(...abs).toFixed(1), signedMean: +signed.toFixed(1), firstBeat: +(first.e * 1000).toFixed(1), lastBeat: +(last.e * 1000).toFixed(1) },
      ...(halfApart ? {
        halfBeatApart: "same tempo, half a beat apart: one grid is on the off-beat (see the report for which)",
        foldedErrorMs: { mean: +(1000 * folded.reduce((a, b) => a + Math.abs(b), 0) / folded.length).toFixed(1), max: +(1000 * Math.max(...folded.map(Math.abs))).toFixed(1), signedMean: +(1000 * folded.reduce((a, b) => a + b, 0) / folded.length).toFixed(1) },
      } : {}),
      downbeatsOnHandPhase: phase,
      expectedEvent: `${p.notes}: hand time ${ev.toFixed(3)}s`,
      nearestMoment: nearest ? `${nearest.kind} at ${nearest.t}s (${((nearest.t - ev) * 1000).toFixed(0)} ms off, +${nearest.strength} dB)` : "none",
    });
  }
  console.log(JSON.stringify(report, null, 2));
}

// ---------------------------------------------------------------- main

const args = process.argv.slice(2);
if (!args.length) {
  console.error("usage: node scripts/beats.mjs <track | path.mp3> | --all | --verify");
  process.exit(2);
}
if (args[0] === "--verify") {
  verify();
} else {
  const dry = args.includes("--dry"); // measure and print only, write nothing (auditioning candidates)
  args.splice(0, args.length, ...args.filter((a) => a !== "--dry"));
  const list = args[0] === "--all" ? SHELF.filter(existsSync).flatMap((d) => readdirSync(d).filter((f) => f.endsWith(".mp3")).map((f) => join(d, f))) : args.map(resolveTrack);
  mkdirSync(OUT_BEATS, { recursive: true });
  mkdirSync(OUT_MUSIC, { recursive: true });
  for (const file of list) {
    const t = Date.now();
    const m = measure(file);
    if (!dry) {
      writeFileSync(join(OUT_BEATS, `${m.track}.json`), JSON.stringify(m, null, 1));
      copyFileSync(file, join(OUT_MUSIC, `${m.track}.mp3`));
    }
    if (dry) console.log("  candidates", JSON.stringify(m.fit.candidates));
    const big = m.moments.filter((x) => x.big).map((x) => `${x.t.toFixed(2)}s`).join(", ");
    console.log(`${m.track}: ${m.bpm} BPM, t0 ${m.t0}s, ${m.beats.length} beats, residual ${m.fit.residualMs.mean} ms, ` +
      `${m.loudness?.integratedLufs} LUFS, lifts ${big || "none"}, quiet ending ${m.ending.seconds}s  (${((Date.now() - t) / 1000).toFixed(1)}s)`);
  }
  if (!dry) writeIndex();
}
