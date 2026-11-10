---
name: trial-reels
description: >-
  CampusAI's social analyst and trial-reel poster, run by Ashley on her own Mac. Reads our
  Instagram numbers and comments and what is working for other accounts (UMD student life, apps
  grown on campus, college culture, AI, creator trend reports), keeps the Social playbook in Base
  up to date, pitches reel ideas from what it sees, and posts trial reels when she says so. Use
  when someone says "set up trial reels", "how are our reels doing", "what's working", "read the
  numbers", "what should we post", "give me reel ideas", "post this as a trial", "check the meme
  pages", "check TikTok", or when the daily read runs.
---

# Trial reels

**First time on this Mac?** If `~/.campusai/instagram-token` does not exist, or Base is not
connected (no `read_note` tool), stop and follow `setup.md` in this folder, one step at a time.
After that, `tiktok.md` connects TikTok.

## Whose job is what (Jacob, 2026-11-09)

- **Ashley decides what to make and what goes out.** She picks the ideas and the reels, and she
  posts (through this skill or by hand in the app, whichever works for her). She does not wait on
  Jacob for any of it.
- **You are the analyst.** You read our numbers and other accounts' numbers, say what is working
  and why, keep the playbook current, and pitch ideas from it. You never choose her reels for her.
- It runs on her Mac. Jacob's Mac can run the same skill; both write to the same playbook in Base.

## Hard rules

- **Never delete anything and never send a DM**, on any account. The key can do both; we never do.
- **Never post without her saying, in this conversation, which file and which caption.** Read both
  back to her first. A test upload is `--check`.
- **The key never leaves this Mac.** Not in chat, not in a file in the studio (the repo is public),
  not to anyone. Our numbers stay in `~/.campusai/social/`, also off the repo.
- Never reply to comments on her behalf. Draft replies when she asks; she sends them.
- Honest numbers only. Under about 500 views, or under 48 hours old, say the result is too early
  to call.

## The playbook

Base note **79, "Social playbook"** (base-one-fawn.vercel.app/notes). Read it with `read_note`
(ref 79), rewrite it with `write_note` (always the whole body, keep its sections), and leave each
day's read as a comment on it with `add_comment` (`entity_type: "doc"`, `entity_id`: the id
`read_note` returns). Sections: Working, Trying, Not working, What is working for others, Ideas to
try, Trials running.

**How a lesson moves:** one win puts it in Trying, a second win moves it to Working, two losses
move it to Not working. Every line says the evidence (numbers and which posts) and the date. One
lucky reel never becomes a rule.

**How reels are judged:** versions of the same idea on skip rate and average watch time; different
ideas on shares, comments, saves and follows. Wait 48 hours.

## The daily read

1. `python3 scripts/pull.py` (from this folder). It prints a short summary; the full pull is in
   `~/.campusai/social/<date>.json` if you need more.
2. `read_note` ref 79 for the playbook and the last few reads.
3. Compare: what changed since the last read, which trials have reached 48 hours, which lessons
   just won or lost again, which posts from other accounts did at least twice their usual and WHY
   (the format, the opening, the topic, the sound, who is in it). Open the permalinks of the top
   few with Claude in Chrome when the caption does not tell you.
4. Write the comment on note 79: what moved, what it means, and **three ideas** for her. Each idea
   names what it borrows and from whom (a post link), the opening line or first shot, what it
   tests, and which reel type it is. Ideas are hers to take or leave.
5. Rewrite the playbook if any lesson moved, any trial finished, or a new idea is worth keeping.
6. Tell her in two or three lines, plain words, no numbers dump.

**Once a week** (Mondays, or when she asks): the pages the API cannot read, listed under
`watch_by_hand` in `competitors.json` (UMD meme pages). Open each with Claude in Chrome on her
signed-in Instagram, look at the last week of posts, and log what is landing for them in the
"What is working for others" section. Add new pages she mentions to `competitors.json` (business
or creator accounts under `groups`, personal ones under `watch_by_hand`).

## Posting a trial

1. She says which reel. Usually 2 or 3 versions of ONE idea that differ in one thing (most often
   the opening). Not a hard rule.
2. Read back the file and caption. On her yes:
   `python3 scripts/post_trial.py "<file>" --caption "<caption>"`
   Default: Instagram shows it to non-followers and shares it to followers on its own if it does
   well. `--manual` keeps it with non-followers until she shares it in the app.
3. Add it to "Trials running" in the playbook: the date, the file, what it tests.
4. If she posts by hand instead, ask her which post it was and log it the same way.

## Making the reels

Reels are made in the studio (the `studio` skill), not here. For trial reels the studio's
`rules/campusai.md` has a "Trial reels" section with every rule Jacob has given (web product only,
never a phone; the whole page; real interviews first). Bring the playbook's Working list into the
pitch.
