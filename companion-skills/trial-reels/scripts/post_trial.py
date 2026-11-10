#!/usr/bin/env python3
"""Post one reel to CampusAI's Instagram as a TRIAL reel (shown to non-followers first).

    python3 post_trial.py <video.mp4> --caption "..."            # post it as a trial
    python3 post_trial.py <video.mp4> --caption "..." --check    # upload and stop before posting
    python3 post_trial.py <video.mp4> --caption "..." --manual   # never share it to followers on its own

Only run this after the person said, in this conversation, which file and which caption.
`--check` is the safe test: Instagram takes the video and gets it ready, nothing is posted,
and the upload expires on its own within a day.

Sharing: by default Instagram shares the trial to followers by itself if it does well
(SS_PERFORMANCE). `--manual` keeps it with non-followers until someone shares it by hand in the
Instagram app. Meta's API cannot share a trial later and cannot delete one, and this script
never tries to delete anything.
"""
import argparse
import json
import pathlib
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

TOKEN_FILE = pathlib.Path.home() / ".campusai" / "instagram-token"
VERSION = "v23.0"
GRAPH = f"https://graph.facebook.com/{VERSION}"
IG_ID = "17841476109196417"  # @campusai_


def call(method, url, token, params=None, data=None, headers=None):
    if params:
        url = f"{url}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, data=data, method=method, headers=headers or {})
    if not headers or "Authorization" not in headers:
        req.add_header("Authorization", f"OAuth {token}")
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        try:
            return json.loads(body)
        except ValueError:
            return {"error": {"message": body[:300]}}


def stop(step, reply):
    msg = reply.get("error", {}).get("message", reply)
    sys.exit(f"Stopped at {step}: {msg}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--caption", required=True)
    ap.add_argument("--check", action="store_true", help="upload and get it ready, do not post")
    ap.add_argument("--manual", action="store_true", help="never auto-share to followers")
    ap.add_argument("--not-trial", action="store_true", help="a normal reel, straight to followers")
    a = ap.parse_args()

    video = pathlib.Path(a.video).expanduser()
    if not video.is_file():
        sys.exit(f"No file at {video}")
    if not TOKEN_FILE.exists():
        sys.exit("No Instagram key on this Mac yet. Follow setup.md, step 2.")
    token = TOKEN_FILE.read_text().strip()

    # 1. A container: Instagram's holding slot for one post.
    params = {"media_type": "REELS", "upload_type": "resumable", "caption": a.caption}
    if not a.not_trial:
        params["trial_params"] = json.dumps(
            {"graduation_strategy": "MANUAL" if a.manual else "SS_PERFORMANCE"})
    made = call("POST", f"{GRAPH}/{IG_ID}/media", token, params=params)
    if "id" not in made:
        stop("making the post", made)
    container = made["id"]
    upload_url = made.get("uri") or f"https://rupload.facebook.com/ig-api-upload/{VERSION}/{container}"

    # 2. The video's bytes, straight from this Mac.
    size = video.stat().st_size
    sent = call("POST", upload_url, token, data=video.read_bytes(), headers={
        "Authorization": f"OAuth {token}", "offset": "0", "file_size": str(size)})
    if not sent.get("success"):
        stop("uploading the video", sent)

    # 3. Wait for Instagram to finish processing it.
    for _ in range(60):
        st = call("GET", f"{GRAPH}/{container}", token, params={"fields": "status_code,status"})
        code = st.get("status_code")
        if code == "FINISHED":
            break
        if code in ("ERROR", "EXPIRED"):
            stop("processing", {"error": {"message": st.get("status", code)}})
        time.sleep(5)
    else:
        sys.exit("Instagram is still processing after 5 minutes. Try again later; nothing was posted.")

    kind = "normal reel" if a.not_trial else ("trial reel, shared by hand only" if a.manual
                                               else "trial reel, Instagram shares it if it does well")
    if a.check:
        print(f"Check passed: Instagram accepted the video as a {kind}. Nothing was posted.")
        return

    # 4. Post it.
    done = call("POST", f"{GRAPH}/{IG_ID}/media_publish", token, params={"creation_id": container})
    if "id" not in done:
        stop("posting", done)
    link = call("GET", f"{GRAPH}/{done['id']}", token, params={"fields": "permalink"}).get("permalink")
    print(f"Posted as a {kind}. Media id {done['id']}. {link or ''}")


if __name__ == "__main__":
    main()
