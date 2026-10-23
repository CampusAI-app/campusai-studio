#!/usr/bin/env python3
"""
Sound check for a render made with Score (2026-10-23). Measures, does not trust the plan.

    python3 scripts/sound-check.py out/sound/SoundPreview.mp4 out/sound/SoundPreview-cues.mp4 [src/system/sound/preview.json]

1. Loudness of the full mix: ffmpeg loudnorm's EBU R128 pass (integrated LUFS, true peak, LRA). Target -14 LUFS, TP < -1.
2. Cue sync: recomputes each event's frame on its own (snaps from the beat map, independently of beats.ts), then
   finds where each cue file actually sits in the cues-only render by cross-correlation, and reports
   (measured hit - intended frame) in ms and frames. 30 fps means anything within +-16.7 ms is the nearest frame.
3. Output audio offset: cross-correlates the music source against the full mix to find any constant delay the
   encoder adds (AAC priming), the number OUTPUT_AUDIO_OFFSET_F in Score.tsx should hold.
4. Duck and end fade: music level (full minus cues) inside the duck against just before it, and the last frames.
Needs numpy and scipy (both on this Mac's system python); decoding is Remotion's own ffmpeg.
"""
import glob, json, os, re, subprocess, sys, wave
import numpy as np
from scipy.signal import fftconvolve

STUDIO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000


def ff(args, text=True):
    return subprocess.run(["npx", "remotion", "ffmpeg", "-hide_banner", *args], cwd=STUDIO, capture_output=True, text=text)


def decode(path, start=None, dur=None):
    tmp = os.path.join(os.environ.get("TMPDIR", "/tmp"), "sc-" + re.sub(r"\W", "_", path) + f"-{start}-{dur}.wav")
    a = ["-v", "error", "-y"]
    if start is not None:
        a += ["-ss", str(start)]
    a += ["-i", path]
    if dur is not None:
        a += ["-t", str(dur)]
    ff(a + ["-ac", "1", "-ar", str(SR), "-c:a", "pcm_s16le", tmp])
    w = wave.open(tmp)
    y = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
    os.remove(tmp)
    return y


def loudness(path):
    r = ff(["-i", path, "-vn", "-af", "loudnorm=I=-14:TP=-1:LRA=11:print_format=json", "-f", "null", "-"])
    j = json.loads(re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", r.stderr).group(0))
    return float(j["input_i"]), float(j["input_tp"]), float(j["input_lra"])


def hit_of(y):
    k = int(0.005 * SR)
    env = np.sqrt(np.convolve(y * y, np.ones(k) / k, "same"))
    return env.argmax() / SR


def locate(needle, hay, around, span=0.12):
    """Start time (s) of `needle` in `hay`, searched within +-span of `around`."""
    a = max(0, int((around - span) * SR))
    n = needle[: min(len(needle), int(0.25 * SR))]
    b = min(len(hay), int((around + span) * SR) + len(n))
    seg = hay[a:b]
    c = fftconvolve(seg, n[::-1], mode="valid")
    e = np.sqrt(np.maximum(1e-12, fftconvolve(seg * seg, np.ones(len(n)), mode="valid")))
    score = c / (e * np.sqrt((n * n).sum()) + 1e-12)
    i = int(np.argmax(score))
    return (a + i) / SR, float(score[i])


def snap(frame, to, m, start_frame, fps):
    s = start_frame / fps
    step = {"downbeat": 4 * m["period"], "half": m["period"] / 2}.get(to, m["period"])
    origin = m["downbeats"][0] if to == "downbeat" else m["t0"]
    t = s + frame / fps
    k = round((t - origin) / step)
    return max(0, round((origin + k * step - s) * fps))


def main():
    full, cues_only = sys.argv[1], sys.argv[2]
    spec = json.load(open(sys.argv[3] if len(sys.argv) > 3 else os.path.join(STUDIO, "src/system/sound/preview.json")))
    fps = spec["fps"]
    m = json.load(open(os.path.join(STUDIO, "public/sound/beats", spec["music"]["track"] + ".json")))
    start_frame = round(spec["music"]["startAt"] * fps)

    I, TP, LRA = loudness(full)
    print(f"loudness  full mix: {I:.1f} LUFS integrated, true peak {TP:.1f} dBTP, LRA {LRA:.1f} LU  (target -14, TP < -1)")
    Ic, TPc, _ = loudness(cues_only)
    print(f"          cues only: {Ic:.1f} LUFS, true peak {TPc:.1f} dBTP")

    yf, yc = decode(full), decode(cues_only)
    music = yf[: len(yc)] - yc[: len(yf)]

    # output offset: the music source from the film's start against the music in the render
    src = decode(os.path.join(STUDIO, m["file"].replace("sound/", "public/sound/", 1)), start=start_frame / fps, dur=4)
    probe = src[int(1.0 * SR): int(3.0 * SR)]
    t, sc = locate(probe, music, 1.0, span=0.25)
    off_ms = (t - 1.0) * 1000
    print(f"music     against the picture's beat grid: {off_ms:+.1f} ms ({off_ms / 1000 * fps:+.2f} frames, match {sc:.2f}); "
          f"Score already starts the track {round(1.28)} frame later to absorb the encoder delay, so this is what is left")

    print("cues      event                          intended  measured hit   error")
    errs = []
    for e in spec["events"]:
        frame = snap(e["frame"], e["snap"], m, start_frame, fps) if e.get("snap") else e["frame"]
        kind = e["kind"]
        alt = kind == "type" and e.get("index", 0) % 2 == 1
        f = glob.glob(os.path.join(STUDIO, "public/sound/cues", ("type-alt" if alt else kind) + "-*.wav"))
        f = [x for x in f if alt or "type-alt" not in x][0]
        y = decode(f)
        h = hit_of(y)
        start, score = locate(y, yc, frame / fps - h)
        meas = start + h
        err = (meas - frame / fps) * 1000
        errs.append(err)
        snapped = f" (snapped from {e['frame']})" if e.get("snap") and frame != e["frame"] else ""
        print(f"          {e['name'][:30]:30s} f{frame:<4d}{snapped:18s} {meas:7.3f}s  {err:+6.1f} ms  {err / 1000 * fps:+.2f} f  (match {score:.2f})")
    a = np.abs(errs)
    print(f"          mean |error| {a.mean():.1f} ms, max {a.max():.1f} ms; on the nearest frame (within {500 / fps:.1f} ms): {int((a <= 500 / fps).sum())}/{len(a)}")

    def rms_db(y, f0, f1):
        seg = y[int(f0 / fps * SR): int(f1 / fps * SR)]
        return 20 * np.log10(np.sqrt(np.mean(seg * seg)) + 1e-9)

    for d in spec.get("duck", []):
        before = rms_db(music, d["from"] - 26, d["from"] - 8)
        inside = rms_db(music, d["from"] + 8, d["to"] - 4)
        print(f"duck      '{d['name']}': music {inside - before:+.1f} dB inside against just before (asked -{d.get('db', 7)} dB; the music itself also moves)")
    endf = spec["end"]["from"]
    n = spec["durationInFrames"]
    third = (n - endf) // 3
    parts = [rms_db(yf, endf - 20, endf)] + [rms_db(yf, endf + i * third, endf + (i + 1) * third) for i in range(3)]
    print("end fade  full mix before the card {:.1f} dB, then the card in thirds {:.1f} / {:.1f} / {:.1f} dB "
          "(equal-power fade: holds through the first third, silent at the last frame)".format(*parts))

main()
