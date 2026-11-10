#!/usr/bin/env python3
"""Put the Instagram key where the other scripts read it, and check it works.

    python3 connect.py <file the key came in>

Moves the key to ~/.campusai/instagram-token (only this Mac's user can read it), deletes the file
it came in, and checks it reaches @campusai_. It never prints the key.
"""
import json
import pathlib
import sys
import urllib.error
import urllib.parse
import urllib.request

HOME = pathlib.Path.home() / ".campusai"
TOKEN_FILE = HOME / "instagram-token"
IG_ID = "17841476109196417"


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    src = pathlib.Path(sys.argv[1]).expanduser()
    if not src.is_file():
        sys.exit(f"No file at {src}")
    key = src.read_text().strip().split()[0] if src.read_text().strip() else ""
    if len(key) < 50:
        sys.exit("That file does not look like an Instagram key. Nothing was changed.")

    q = urllib.parse.urlencode({"fields": "username,followers_count", "access_token": key})
    try:
        with urllib.request.urlopen(f"https://graph.facebook.com/v23.0/{IG_ID}?{q}", timeout=30) as r:
            acct = json.load(r)
    except urllib.error.HTTPError as e:
        msg = json.load(e).get("error", {}).get("message", "")
        sys.exit(f"Instagram did not accept that key: {msg}. Nothing was changed.")

    HOME.mkdir(mode=0o700, exist_ok=True)
    TOKEN_FILE.write_text(key + "\n")
    TOKEN_FILE.chmod(0o600)
    src.unlink()
    print(f"Connected to @{acct.get('username')} ({acct.get('followers_count')} followers). "
          f"Key saved for this Mac only; the file it came in is deleted.")


if __name__ == "__main__":
    main()
