# Effects: 51 draft effects for talking-head clips

Type one command and a real clip comes back with the effect on it, about 7 seconds per effect, face tracked, with
anything that would cover the face moved behind the head. Use it to try a look on real footage before building the
keeper properly in `src/kit/`.

```bash
npm run effects -- --list
npm run effects -- glass-widgets clip.mp4 clip_fx.mp4 --start 1 --end 4 --opt stat=1,000 --opt stat_label=Downloads
npm run effects -- --plan plan.json clip.mp4 clip_fx.mp4
```

Every effect, its options and the plan format: `EFFECTS.md`. Previews of all 51 on real footage are on the Studio site.

**Pass your own words and numbers.** Several effects carry sample text when you leave options out (the bento graph's
29% and 672K, glass widgets' 38 and 197K, match-cut's page text, tier-list's rows, place-in-grid's view counts).
Only true numbers go in a CampusAI film.

From Vibha Ramprakash's free repo (github.com/Vibha-Ramprakash/claude-video-effects, commit 60840ac, MIT, see
`LICENSE`), checked 2026-11-18: no network calls, it only runs ffmpeg and ffprobe. Our changes: the default handle and
name are ours instead of the author's, the glass widgets stat card takes `stat` and `stat_label`, `run.sh` replaces
her setup script, and her promo image is left out. Fonts and models keep their own licences (`fonts/*.txt`,
`models/NOTICE.md`).
