#!/bin/bash
# Draft effects on a talking-head clip in seconds: `npm run effects -- <effect> in.mp4 out.mp4 --start 1 --end 4`.
# `npm run effects -- --list` names all 51. Every effect and option is in effects/EFFECTS.md.
# The first run builds a Python venv here (about 2 minutes). It uses your ffmpeg if you have one; if not, it uses
# the ffmpeg from the imageio-ffmpeg package and the ffprobe that ships with Remotion in node_modules.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
PY="$HERE/.venv/bin/python"
if ! "$PY" -c "import mediapipe, cv2, PIL, numpy, imageio_ffmpeg" 2>/dev/null; then
  echo "Setting up the effects renderer (one time)..." >&2
  if command -v uv >/dev/null 2>&1; then uv venv -q -p 3.11 "$HERE/.venv" && uv pip install -q -p "$PY" -r "$HERE/requirements.txt" imageio-ffmpeg
  else
    for v in python3.12 python3.11 python3.13 python3.10 python3; do command -v "$v" >/dev/null 2>&1 && SYS="$v" && break; done
    "$SYS" -m venv "$HERE/.venv" && "$PY" -m pip install -q --upgrade pip && "$PY" -m pip install -q -r "$HERE/requirements.txt" imageio-ffmpeg
  fi
fi
B="$HERE/.bin"; mkdir -p "$B"
if ! command -v ffmpeg >/dev/null 2>&1; then
  printf '#!/bin/bash\nexec "%s" "$@"\n' "$("$PY" -c 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())')" > "$B/ffmpeg"; chmod +x "$B/ffmpeg"
fi
if ! command -v ffprobe >/dev/null 2>&1; then
  C=$(ls -d "$HERE"/../node_modules/@remotion/compositor-*/ 2>/dev/null | head -1)
  [ -n "$C" ] || { echo "No ffprobe found. Run npm install in the studio first." >&2; exit 1; }
  printf '#!/bin/bash\nexport DYLD_LIBRARY_PATH="%s"\nexport LD_LIBRARY_PATH="%s"\nexec "%sffprobe" "$@"\n' "$C" "$C" "$C" > "$B/ffprobe"; chmod +x "$B/ffprobe"
fi
export PATH="$B:$PATH"
exec "$PY" -I "$HERE/scripts/fx.py" "$@" </dev/null
