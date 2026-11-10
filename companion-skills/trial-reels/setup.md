# Setting up trial reels on this Mac

For Claude, walking Ashley through it. Go one step at a time: say what the step is for in a
sentence, do everything you can yourself, and only ask her for the parts that need her (signing
in, a click, a file). Check each step worked before moving on. Plain words, no jargon. When a step
fails, say what happened and what to try; never skip it silently.

At the end, tell her what she can now say to you (the last section). Then offer TikTok
(`tiktok.md`) as the next part.

## 1. Check the studio is current

This skill lives in the studio, which updates itself. Confirm `~/.claude/skills/trial-reels`
exists and `python3 --version` works. If the skill folder is missing, run
`bash scripts/update.sh` from the studio folder and start a new chat.

## 2. Make her Instagram key and connect it (about 10 minutes)

The key is what lets this Mac read CampusAI's Instagram numbers and post trial reels. She makes it
herself in Meta Business Suite (Jacob added her to the CampusAI business portfolio on Nov 9 for
this), and it stays on this Mac only. She does the clicks; you say the next one each time and wait
for her to say done. If Claude in Chrome already works, open the pages for her, but she still does
the clicks and confirms anything Meta asks.

1. **Open** business.facebook.com/settings and pick the business portfolio **Campusai**. In the
   left menu, Users, then **System users**.
   - If she cannot see System users, or the Add button is greyed out, her role is not high enough:
     only an admin (Full control) can make keys. She asks Jacob: "Can you give me Full control on
     the Campusai business portfolio?" (Settings, People, Ashley). Wait, then try again.
2. **Add** a system user. Name: `Ashley`, ONE word (Meta refuses names with spaces). Role:
   Employee.
3. **Assign assets** to the new Ashley system user (the Assign assets button on its page):
   - Instagram account **@campusai_**: Content, Community activity, Insights.
   - Facebook Page **Campusai**: Content, Insights.
   - App **CampusAI Studio**: Develop app.
4. **Generate new token**: app CampusAI Studio, expiry **Never**, and tick the Instagram and Page
   permissions it offers. Meta adds every permission to the key whatever she ticks, and that is
   fine: this skill never deletes and never DMs.
5. **Save the key.** Meta shows it once. Before she copies it, make an empty file and open it:
   `touch ~/Downloads/instagram-key.txt && open -a TextEdit ~/Downloads/instagram-key.txt`.
   She copies the key from Meta, pastes it into that TextEdit window, saves (Cmd+S) and closes it.
   Never ask her to paste the key into this chat, and never open the file yourself.
6. **Connect it:** run
   `python3 ~/.claude/skills/trial-reels/scripts/connect.py ~/Downloads/instagram-key.txt`.
   It checks the key, saves it where the scripts read it, deletes the file in Downloads, and prints
   the account it reached. It never prints the key.
7. It should say `Connected to @campusai_`. If Instagram refused the key, go back to step 4 and
   generate a new one (the old one is useless anyway). If the assets in step 3 were missed, the
   key works but cannot see the account: assign them, then generate again.

If anything in Meta looks different from these steps, describe what she sees back to her in plain
words and find the matching button with her. Meta moves things around.

To switch the key off later (a lost laptop, say): the same System users page, Ashley, **Revoke
tokens**. Then make a new one the same way.

## 3. Connect Base

The playbook (what is working and what to try) lives in Base, note 79. Check whether this Claude
can reach it: call `read_note` with ref 79.

- **It works:** move on.
- **No `read_note` tool, but other Base tools exist** (`whoami`, `my_tasks`): Base gained it on
  Nov 9. Ask her to start a new chat, which loads the new tools, and pick up from this step.
- **No Base tools at all:** she opens base-one-fawn.vercel.app, Settings, Connect Claude, copies
  the message there and pastes it into this chat. Do what it says, then she starts a new chat.

## 4. The first read

Run the daily read from `SKILL.md` once now, so she sees what it does: pull, read the playbook,
compare, comment on note 79 with three ideas, tell her in a few lines. Point her at the note in
Base so she knows where it lives.

## 5. Claude in Chrome

This is how Claude looks at pages the API cannot read: the UMD meme pages, and TikTok's analytics
until TikTok's API is approved. Check whether the Claude in Chrome tools work (open a tab). If not,
she installs the extension from claude.ai/chrome and signs in with her Claude account. Then, in
that Chrome, she makes sure she is signed in to Instagram and to the CampusAI TikTok.

## 6. Run it every day

Ask her what time she wants the daily read (suggest 9 AM). Make it a scheduled task in the Claude
app (the scheduled tasks tool) with the prompt: "Run the trial-reels daily read." Tell her it only
runs while her Mac is awake and the Claude app is open, and she can also just ask any time ("how
are our reels doing?"). If no scheduling tool exists in this Claude, say so and skip; asking works
the same.

## 7. Done

Tell her she can now say:
- "How are our reels doing?" for a read any time.
- "Give me reel ideas" for ideas from what is working, ours and others'.
- "Post this as a trial" with the file and caption, to post through Claude. Or post by hand in the
  app and tell Claude which one it was.
- "Check the meme pages" for the weekly look.

Then: "Next is TikTok. Want to set that up now?" and follow `tiktok.md`.
