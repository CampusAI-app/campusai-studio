---
name: hook-retention-psychology
description: The psychology of the first two seconds and the watch-through. Use when writing or diagnosing a hook, opening line, title, thumbnail text, or the pacing of a short-form video/Reel/TikTok/Short, or when a post is getting reach but people aren't watching or reading past the start. Scores an opening on the real levers of attention (open loop, stakes, specificity, pattern interrupt, callout) and the body on retention (pace, visual change, no dead air, payoff timing). Applies to CampusAI (and any venture) social content. Honest attention only — earn the watch, never bait it. Pairs with content-engine (scoring) and humanizer.
---

# Hook & retention psychology

The single highest-leverage thing in short-form is the first two seconds. Reach is cheap; attention is the whole game. A great idea with a weak opening dies at 1.5 seconds and the algorithm never shows it again. This skill makes the opening earn the next two seconds, and the body keep them — honestly.

## The one rule
**Earn attention, don't bait it.** Every tactic below has an honest version and a cheap version. The cheap version (fake claims, rage bait, "wait for it" with no payoff, misleading thumbnails) buys a first view and burns trust — retention craters, and it poisons the brand. We do the honest version every time: the curiosity is real, the payoff lands, the promise in the hook is kept in the body. This is the honest-product rule applied to attention.

## How attention actually works (the mechanism)
- **The feed is a rhythm.** People scroll in a trance, half-deciding every ~0.8s "keep or flick." You are not competing with other content for a decision; you are trying to break a reflex.
- **Curiosity is a loop that wants closing.** The brain hates an open question. An opening that raises a specific question buys the seconds it takes to answer it. Vague questions don't (the brain shrugs); specific ones do.
- **Prediction is death.** The instant a viewer can predict the rest, they leave. Retention is a series of small "I didn't see that coming" beats that reset the prediction.
- **Relevance is a filter, not a hook.** "This is for me" stops the right people; it doesn't create interest on its own. You still need a reason to watch.

## The hook: five levers (use 1–2, not all)
Write ten openings, keep three, post one. Each opening should pull at least one lever hard.

1. **Open loop** — raise a specific question the video answers. "The one setting every Smith freshman changes in week one" (not "here are some tips"). The loop must be closed later, or retention dies on the next post too.
2. **Stakes / cost of ignoring** — what they lose by scrolling past. "Most people miss the career-fair slot that actually matters." Loss reads louder than gain.
3. **Specificity** — a real number, name, or detail makes it true and un-scrollable. "I checked 40 events this week; 3 are worth your time" beats "check out these events." Specific = credible = watchable.
4. **Pattern interrupt** — break the feed's rhythm in the first frame: an unexpected visual, a mid-motion start, using the app's own UI as the gag (see the burger-shop scroll-stopper). The thumb pauses to figure out what it's looking at. Native beats polished.
5. **Direct callout** — name the exact person. "If you're a junior who still hasn't touched your resume—" The right viewer feels addressed; everyone else is fine to lose.

**First-frame rules:** front-load the payoff-question, not a logo or a slow intro. No "hey guys, welcome back." The first spoken words and the on-screen text should both carry the hook (many watch muted). If the first 3 words are throat-clearing, cut them.

## Retention: keep them past the hook
- **Open fast, mid-motion.** Start on the second sentence. Cut the runway.
- **Change something every ~2–3 seconds** — shot, framing, caption, zoom, b-roll. Visual change resets attention before it drifts.
- **No dead air.** Every beat either advances the point or raises a new mini-question. Cut breaths, "ums," and setup that doesn't pay.
- **Nest loops.** Open a small new question before you fully close the last one, so there's always a reason to stay.
- **Deliver the promise, then a little more.** The hook wrote a check; cash it clearly, then over-deliver by one beat so the ending earns a save/share.
- **Payoff timing.** If the whole thing is a single "wait for it," the wait must be short and the reveal must be worth it. Long teases with thin payoffs are the fastest way to train the algorithm to bury you.
- **End on a reason to act or re-watch**, not a fade. Saves and shares are the strongest signal; give them a line worth saving.

## Hook formulas, tools and the swipe loop (harvested 2026-10-25)

From Jake Schincariol's Instagram agent pack (MIT). Vendored, not installed:
`~/Desktop/Claude/Design/parts-bin/instagram-agent-skill/` (read its `SOURCE.txt` first).

**Formulas.** `ig-reel/hooks.json` holds 26 hook formulas, each with a template, an example, the
on-screen version, what it is for and how it gets ruined. Use them to fill the levers above, never
instead of them. Rough map: specificity is 1 Cost Confession, 4 Replacement, 5 Time Collapse,
6 Receipt, 17 Head To Head, 23 Statistic. Stakes is 15 Flop Record, 19 Deadline. Open loop is
3 Nobody Tells You, 8 Insider Leak, 11 Numbered With A Favourite, 21 Mid-Sentence Start, 25 Someone
Else's Result. Pattern interrupt is 2 Negative Command, 13 Before And After, 18 Cold Open Demo,
20 Permission, 22 Contrarian Flip. Callout is 10 If This Then Watch, 12 Objection, 14 Callout,
16 Verbatim Question. 24 Reveal and 26 Superlative only when literally true today; on CampusAI a
superlative is a claim that has to be in the facts.

Three rules from the pack worth keeping:
- **Write the spoken hook and the on-screen hook separately.** On screen is shorter and blunter, six
  words or fewer, up at frame one, never in the bottom band where the caption covers it.
- **If the hook would work for anyone else in the niche, it is not your hook.** Put the thing only
  we can say in it.
- **Draft three hooks off three different formulas**, not three rewrites of one.

**Tools** (run isolated, paths as arguments, from any folder but that one):
- `python3 -I <pack>/ig-reel/hookscore.py hooks.txt` ranks the options. It kills weak hooks well and
  does NOT pick between two decent ones (its author measured a coin flip). Under 50 means no hook yet.
- `python3 -I <pack>/ig-reel/beats.py script.txt --target 30` times a spoken script: hook under 3 s
  (about 8 words), no beat over 4 s, something concrete in every run of beats, and the last line
  echoes a word from the hook so the loop lands. Our studio times music beats; this times speech.

**The swipe loop** (when the question is "what is working right now"):
1. Pick 6 to 12 accounts within about 10x our size: 4 in the niche, 4 adjacent with the same
   audience, 2 to 4 much bigger for format only. Jacob's own Saved collection counts first.
2. Read, do not scrape: his logged-in browser at human speed, never a login or password from us,
   never a crawler. Per reel: account, followers, the account's median of its last 12, views, the
   first line verbatim.
3. Rank by **outlier multiple**, views over that account's own median, not raw views. Over 3x is a
   signal, under 1.5x is a normal day. `python3 -I <pack>/ig-viral/swipe.py captured.tsv` does the
   maths, names each formula and scores each hook.
4. Report three things: formulas that over-index in the top third (with counts), what the top third
   share structurally, and the hooks it could not name (read those by hand, a new formula hides
   there). State the sample: forty reels across six accounts supports a claim, twelve does not.
5. Copy the formula, never the video. Every row attributed. The output is OUR version of the top
   three: our story, our real number, in the shape that is working.

## Diagnose a struggling post
- **Reach but no watch-through →** the hook is the problem. Rewrite the first 2 seconds; test 3 new openings.
- **Drop at ~3s →** the first frame raised no question, or the promise felt generic. Add specificity or stakes.
- **Drop in the middle →** it got predictable or slow. Add a loop or a visual change where the graph dips.
- **Watched but no saves/shares →** the payoff was fine but forgettable. Sharpen the ending into one quotable/savable line.
- **Good on one platform, dead on another →** native mismatch. Re-cut the opening to that feed's rhythm.

## Scoring rubric (0–2 each; a post ships at strong on hook)
- **Hook — specific question or stake in the first 2s?** (0 none / 1 vague / 2 sharp and specific)
- **First frame — stops the scroll on its own, muted?** (visual + text both carry it)
- **Honesty — is the curiosity real and the promise kept?** (any bait = automatic fail, rewrite)
- **Retention — change/beat every 2–3s, no dead air?**
- **Payoff — promise cashed, plus one, savable ending?**
- **Relevance — right viewer feels addressed without narrowing to nothing?**

Any bait/misleading element fails the whole post regardless of other scores.

## How this plugs into our system
- **content-engine** runs plan → research → copy → render → **score**; this skill is the depth behind the hook/retention part of that score. Run it on the opening before rendering, and again on the near-final cut.
- **humanizer** cleans the language so the hook doesn't read as AI. Order: draft → hook-retention pass → humanizer → anti-slop check.
- **content-engine** `reference/copy-levers.md` carries the caption rules and the scripted clean pass from the same harvest.
- Human reference to study: Jonathan Maxim (content & retention psychology). Craft reference for scroll-stopping first frames: the burger-shop feed-glitch Reel.
- Never invent a stat, credential, or claim to strengthen a hook. If the specific detail isn't true, find one that is — there's always a real, specific angle.
