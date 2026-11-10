# Connecting TikTok

For Claude, walking Ashley through it, same way as `setup.md`. Two parts: one that works today, and
one that takes TikTok a few weeks to approve. Do part 1 now and start part 2 in the same sitting.

## Part 1: works today (about 5 minutes)

TikTok's own numbers are in TikTok Studio, which Claude reads through Chrome on her signed-in
account. Posting is by hand, with the same file as the Instagram reel.

1. In the Chrome with Claude in Chrome, she is signed in to the CampusAI TikTok. Open
   tiktok.com/tiktokstudio and confirm it shows the CampusAI account.
2. Read the analytics once with her watching: for the last 10 posts, views, average watch time,
   watched full video, shares, comments, saves, and new followers. TikTok calls these by their own
   names on the page; use what it shows.
3. From now on the daily read in `SKILL.md` includes TikTok: open TikTok Studio, read the posts
   from the last two weeks, and log them in the same comment on note 79 under a TikTok line. Judge
   TikTok against TikTok, never against Instagram.
4. Posting: she posts in the TikTok app herself and tells Claude which post it was, so it can be
   logged under "Trials running". TikTok has no trial-reel option like Instagram's, so testing
   versions means posting them a day or two apart.

## Part 2: TikTok's API (she starts it today, TikTok approves it over days to weeks)

This is what lets Claude read the numbers and post without a browser. TikTok has to approve the
app twice: once to allow the features, then an audit before posts can be public. Until the audit
passes, anything posted through the API can only be private.

1. **Make the account a Business account** if it is not already: TikTok app, Profile, the menu,
   Settings and privacy, Account, Switch to Business account. Watch-time numbers in the API need
   a Business account, and TikTok only gives them once the account has 100 followers.
2. **Make the developer app.** She signs in at developers.tiktok.com with the CampusAI TikTok,
   opens Manage apps, Connect an app, and names it "CampusAI Studio". It asks for:
   - an app icon (the CampusAI logo, from the studio's `public/` brand files),
   - a description: "Posts CampusAI's own videos to the CampusAI account and reads their
     performance for our team. Used only by the CampusAI social team.",
   - a website, terms of service and privacy policy link (campusai.app and its own terms and
     privacy pages; if she cannot find them, ask Jacob for the links).
3. **Add the products:** Login Kit, and Content Posting API with Direct Post turned on. Scopes:
   `user.info.basic`, `video.list`, `video.upload`, `video.publish`.
4. **Submit for review.** TikTok asks how the app is used; the description above is the answer,
   plus a short screen recording if it asks (Claude can help make one in the studio).
5. **After it is approved,** apply for the Content Posting audit from the same page, so posts can
   be public.
6. Write down where it stands in note 79 under "Trials running" ("TikTok API: submitted Nov 10",
   and so on), so whoever reads next knows.

**When TikTok approves it:** she tells Claude "TikTok approved the app". The connect, pull and post
scripts for TikTok are not built yet (they get built once there is an approved app to test them
against). Claude builds them in this folder the same way as the Instagram ones, keeping the same
rules: the key stays on this Mac, read only except posting, never delete, never DM.
