#!/usr/bin/env python3
"""Read CampusAI's Instagram numbers, comments and other accounts' posts. READ ONLY.

    python3 pull.py            # pull today, save it, print the short summary
    python3 pull.py --summary  # print the summary of the last pull again, no network

Saves one file per day to ~/.campusai/social/YYYY-MM-DD.json, on this Mac only. Our numbers
never go into the studio repo, which is public. Every request goes through get(), which is
GET only: this script cannot post, reply, delete or message anyone.
"""
import datetime as dt
import json
import pathlib
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

HERE = pathlib.Path(__file__).resolve().parent
HOME = pathlib.Path.home() / ".campusai"
TOKEN_FILE = HOME / "instagram-token"
DATA = HOME / "social"
GRAPH = "https://graph.facebook.com/v23.0"
IG_ID = "17841476109196417"  # @campusai_
POSTS_WITH_STATS = 30
COMMENT_WINDOW_DAYS = 14
COMPETITOR_POSTS = 12
# A post's likes + comments over the account's usual post. Below this many, the usual is too
# small to compare against (a 3-like median made one Partiful post read as 618 times usual).
MIN_USUAL = 20

REEL_METRICS = ["views", "reach", "ig_reels_avg_watch_time", "reels_skip_rate", "likes",
                "comments", "shares", "saved", "total_interactions", "profile_visits", "follows"]
FEED_METRICS = ["views", "reach", "likes", "comments", "shares", "saved",
                "total_interactions", "profile_visits", "follows"]


def token():
    if not TOKEN_FILE.exists():
        sys.exit("No Instagram key on this Mac yet. Follow setup.md, step 2.")
    return TOKEN_FILE.read_text().strip()


def get(path, **params):
    params["access_token"] = token()
    url = f"{GRAPH}/{path}?{urllib.parse.urlencode(params)}"
    try:
        with urllib.request.urlopen(url, timeout=30) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        return json.load(e)


def post_insights(media_id, kind):
    """Ask for every metric; drop any Meta says it does not support for this post and retry."""
    metrics = list(REEL_METRICS if kind == "REELS" else FEED_METRICS)
    while metrics:
        d = get(f"{media_id}/insights", metric=",".join(metrics))
        if "data" in d:
            return {m["name"]: m["values"][0]["value"] for m in d["data"]}
        msg = d.get("error", {}).get("message", "")
        bad = [m for m in metrics if re.search(rf"\b{m}\b", msg)]
        if "does not support" in msg and bad:
            metrics = [m for m in metrics if m not in bad]
            continue
        return {"error": msg}
    return {}


def own_account():
    acct = get(IG_ID, fields="username,followers_count,media_count")
    if "error" in acct:
        sys.exit(f"Instagram said no: {acct['error'].get('message')}")
    posts = get(f"{IG_ID}/media", limit=POSTS_WITH_STATS,
                fields="id,media_product_type,timestamp,caption,permalink,comments_count,like_count")
    cutoff = dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=COMMENT_WINDOW_DAYS)
    out = []
    for p in posts.get("data", []):
        p["stats"] = post_insights(p["id"], p.get("media_product_type"))
        posted = dt.datetime.fromisoformat(p["timestamp"].replace("+0000", "+00:00"))
        if posted >= cutoff and p.get("comments_count"):
            c = get(f"{p['id']}/comments", limit=50,
                    fields="id,text,timestamp,username,like_count,replies{text,username,timestamp}")
            p["comment_list"] = c.get("data", [])
        out.append(p)
    return {"account": acct, "posts": out}


def others():
    groups = json.loads((HERE.parent / "competitors.json").read_text())["groups"]
    out = {}
    for group, handles in groups.items():
        for h in handles:
            f = (f"business_discovery.username({h}){{followers_count,media_count,"
                 f"media.limit({COMPETITOR_POSTS}){{media_product_type,timestamp,like_count,"
                 f"comments_count,caption,permalink}}}}")
            d = get(IG_ID, fields=f).get("business_discovery")
            if not d:
                out[h] = {"group": group, "error": "not readable"}
                continue
            media = d.get("media", {}).get("data", [])
            eng = [(m.get("like_count") or 0) + (m.get("comments_count") or 0) for m in media]
            usual = sorted(eng)[len(eng) // 2] if eng else 0
            for m, e in zip(media, eng):
                m["vs_usual"] = round(e / usual, 2) if usual >= MIN_USUAL else None
            out[h] = {"group": group, "followers": d.get("followers_count"), "usual": usual,
                      "posts": media}
    return out


def summary(snap):
    """The short version Claude reads first. The full file is there for anything deeper."""
    lines = [f"Pulled {snap['pulled_at']}. @{snap['account'].get('username')}, "
             f"{snap['account'].get('followers_count')} followers."]
    lines.append("\nOUR POSTS (newest first)")
    for p in snap["posts"][:15]:
        s = p.get("stats", {})
        cap = (p.get("caption") or "").split("\n")[0][:70]
        if p.get("media_product_type") == "REELS":
            watch = s.get("ig_reels_avg_watch_time")
            watch = f"{watch / 1000:.1f}s" if isinstance(watch, (int, float)) else "?"
            lines.append(f"- {p['timestamp'][:10]} reel | views {s.get('views')} | skip {s.get('reels_skip_rate')}% "
                         f"| watch {watch} | shares {s.get('shares')} | saves {s.get('saved')} "
                         f"| comments {s.get('comments')} | follows {s.get('follows')} | {cap}")
        else:
            lines.append(f"- {p['timestamp'][:10]} {p.get('media_product_type', '').lower()} | views {s.get('views')} "
                         f"| shares {s.get('shares')} | saves {s.get('saved')} | profile visits "
                         f"{s.get('profile_visits')} | follows {s.get('follows')} | {cap}")
        for c in p.get("comment_list", [])[:5]:
            lines.append(f"    comment @{c.get('username')}: {(c.get('text') or '')[:100]}")
    hits = []
    for h, acct in snap.get("others", snap.get("competitors", {})).items():
        for m in acct.get("posts", []):
            if (m.get("vs_usual") or 0) >= 2:
                hits.append((m["vs_usual"], h, acct["group"], m))
    hits.sort(key=lambda x: -x[0])
    lines.append("\nOTHERS: POSTS DOING AT LEAST TWICE THEIR USUAL")
    for v, h, g, m in hits[:20]:
        cap = (m.get("caption") or "").split("\n")[0][:80]
        lines.append(f"- {v}x @{h} ({g}) {m.get('media_product_type', '').lower()} {m['timestamp'][:10]} "
                     f"{m.get('permalink')} | {cap}")
    unread = [h for h, a in snap.get("others", {}).items() if a.get("error")]
    if unread:
        lines.append(f"\nCould not read (personal accounts or renamed): {', '.join(unread)}")
    return "\n".join(lines)


def main():
    DATA.mkdir(parents=True, exist_ok=True)
    if "--summary" in sys.argv:
        files = sorted(DATA.glob("*.json"))
        if not files:
            sys.exit("No pulls yet. Run without --summary first.")
        print(summary(json.loads(files[-1].read_text())))
        return
    snap = {"pulled_at": dt.datetime.now().isoformat(timespec="seconds"),
            **own_account(), "others": others()}
    out = DATA / f"{dt.date.today().isoformat()}.json"
    out.write_text(json.dumps(snap, indent=1))
    print(summary(snap))
    print(f"\nFull pull saved to {out}")


if __name__ == "__main__":
    main()
