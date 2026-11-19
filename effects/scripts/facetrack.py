"""Face track at 10 Hz for the kit's FaceLock and PlacedCaptions (2026-11-18).

After Shaan Johari's reel "I filmed this. Claude edited it." (instagram.com/reel/Df4TGYjEZLu): brackets lock on the face
and the readout claims it tracks "10x a second", so we sample the face exactly that often.

Detector: YuNet (models/yunet.onnx) through cv2.FaceDetectorYN, made the same way fx.py's Tracker makes it (score 0.6,
NMS 0.3, top 20) and the same pick (largest box times score). No segmenter fallback here: a missed sample carries the
last good one with conf 0, so the parts can tell a real lock from a held one.

With two people in shot, `--near X` follows one of them instead: it starts on the face nearest source x X, then each
sample takes the face nearest the last one it found (so a pan does not swap people), ignoring faces more than 40% of the
frame width away.

    effects/.venv/bin/python -I effects/scripts/facetrack.py <clip> <out.json> [--rate 10] [--near X]

Writes, in the clip's own pixels:
    { "rate": 10, "width": W, "height": H, "duration": s,
      "samples": [ { "t": s, "x": cx, "y": cy, "w": faceWidth, "h": faceHeight, "conf": score } ] }
"""
import argparse
import json
import os
import sys

import cv2

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('clip')
    ap.add_argument('out')
    ap.add_argument('--rate', type=float, default=10.0)
    ap.add_argument('--near', type=float, help='follow the face nearest this source x (two people in shot)')
    a = ap.parse_args()

    cap = cv2.VideoCapture(a.clip)
    if not cap.isOpened():
        sys.exit(f'facetrack: cannot open {a.clip}')
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fd = cv2.FaceDetectorYN.create(os.path.join(ROOT, 'models', 'yunet.onnx'), '', (W, H), 0.6, 0.3, 20)

    samples, last, i, k = [], None, 0, 0
    # read every frame in order (seeking is not frame exact on every codec) and detect on the frame nearest each sample time
    while True:
        ok, bgr = cap.read()
        if not ok:
            break
        t_frame = i / fps
        t_next = k / a.rate
        if t_frame + 0.5 / fps >= t_next:
            if bgr.shape[1] != W or bgr.shape[0] != H:
                W, H = bgr.shape[1], bgr.shape[0]
                fd.setInputSize((W, H))
            _, faces = fd.detect(bgr)
            if faces is not None and a.near is not None:
                want = last['x'] if last is not None else a.near
                faces = [r for r in faces if abs(r[0] + r[2] / 2 - want) < 0.4 * W]
            if faces is not None and len(faces):
                if a.near is not None:
                    r = min(faces, key=lambda r: abs(r[0] + r[2] / 2 - want))
                else:
                    r = max(faces, key=lambda r: r[2] * r[3] * r[-1])
                last = {'x': float(r[0] + r[2] / 2), 'y': float(r[1] + r[3] / 2), 'w': float(r[2]), 'h': float(r[3])}
                conf = float(r[-1])
            else:
                conf = 0.0
            if last is not None:
                samples.append({'t': round(t_next, 3), **{q: round(v, 1) for q, v in last.items()}, 'conf': round(conf, 3)})
            else:
                samples.append({'t': round(t_next, 3), 'x': None, 'y': None, 'w': None, 'h': None, 'conf': 0.0})
            k += 1
        i += 1
    cap.release()

    # samples before the first detection take the first good one, still at conf 0
    first = next((s for s in samples if s['x'] is not None), None)
    if first is None:
        sys.exit('facetrack: no face found in the whole clip')
    for s in samples:
        if s['x'] is None:
            s.update({q: first[q] for q in ('x', 'y', 'w', 'h')})

    out = {'rate': a.rate if a.rate != int(a.rate) else int(a.rate), 'width': W, 'height': H,
           'duration': round((n or i) / fps, 3), 'source': os.path.basename(a.clip), 'samples': samples}
    with open(a.out, 'w') as fh:
        json.dump(out, fh, indent=1)
    held = sum(1 for s in samples if s['conf'] == 0)
    print(f'facetrack: {len(samples)} samples at {a.rate} Hz, {held} held, {W}x{H} -> {a.out}')


if __name__ == '__main__':
    main()
