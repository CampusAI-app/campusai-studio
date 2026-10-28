---
name: campusai-brand
description: >-
  How CampusAI graphics should look, and how to keep them from looking AI-made. Use for any still
  graphic or brand visual for CampusAI: LinkedIn banners and posts, Instagram and X graphics,
  carousel slides, story frames, posters, thumbnails, profile images, one-pagers, slide visuals,
  event signage. Also use when someone shares an image and says "add this to the brand", "this is a
  good example", "this is what we don't want", or asks why something looks off-brand or generic.
  Holds the logo files, colours, type, the ground and texture, real product screenshots, a library
  of good and bad references that grows over time, and a worked LinkedIn banner.
---

# CampusAI brand for graphics

This file is for making CampusAI graphics that look like a person with taste designed them. It is
not a writing guide. What a post says is the writer's job; this is how it looks.

**The one test, before and after:** could this exact graphic belong to a different company if you
swapped the logo? If yes, it is generic however clean it looks, and the fix is structural (the
composition, the product, the crop), not colour.

## Start here, every time

1. **Look at `references/`.** Open `references/README.md`, then look at the images it lists. The
   `good/` folder shows what we want and the `bad/` folder shows what we keep getting. Each one has a
   line saying what to take from it or what to avoid. Newer notes beat older ones.
2. **Name the job.** What it is, the exact size (table below), and where it will be seen. A
   LinkedIn banner gets seen at full width on a laptop and cropped on a phone. A feed post gets seen
   at thumbnail size first.
3. **Decide the one thing that leads.** One headline, or one piece of the product, or one number.
   Never three equal things.

## The brand

### Logo
- Files in `assets/`: `campusai-logo-white.svg` (on dark, the default), `campusai-logo.svg` (on light),
  `campusai-logo-white.png` and `campusai-logo-black.png` (large transparent PNGs for tools that
  cannot place an SVG, for print, or for sending), `campusai-spark.svg`
  (the four-point spark on its own, for profile pictures, favicons and anywhere the wordmark would
  be under about 24px tall).
- The wordmark is lowercase **campusai** with the red spark over the i. Never retype it in a font,
  never recolour it, never stretch it, never put it in a box, circle or badge you drew.
- **Never let an image model draw the logo or any words.** It will get them wrong. The logo is
  always the real file placed on top.
- In running text, the name is **CampusAI**, one word.

### Colour
Near-black with a red glow. Dark beats light on LinkedIn too: the platform is white, so a dark
graphic is what stops the scroll.

| Role | Hex | Use |
|---|---|---|
| Ground | `#0b0708` | The background. Warm near-black, never pure `#000`. |
| Surface | `#100b0c` / `#1c1516` | Anything raised above the ground. |
| Ink | `#f7efe6` | Headlines and main text. Warm off-white, never pure `#fff`. |
| Ink soft | `#d7c3b3` | Secondary text. |
| Red | `#D9202E` | The brand red. Glows, washes, the spark, one small mark. |
| Red text | `#FF4050` | Red when it has to be read as text on dark (the product's own on-dark red). |

The red is used like light, not like paint. One wash behind the subject, maybe one small red
detail. If red covers more than about 5% of the frame, it is too much.

**Never blue, navy, purple or teal.** The blue-purple gradient is the most recognisable AI look
there is, and it is not our brand anyway.

### Type
- **Zodiak Bold** for headlines. Short headlines only, roman, one colour, tight tracking
  (`letter-spacing: -0.02em`, line height about 1.05). Load it from
  `https://api.fontshare.com/v2/css?f[]=zodiak@700&display=swap` (free licence).
- **Inter** for everything else: subheads, captions, URLs, labels. Weights 400 and 500.
- Never monospace. Never italic headlines. Never one word in a headline recoloured or italicised
  for emphasis (the two-tone look reads as generated). Never small uppercase labels with wide
  letter spacing. If you need a label, use sentence case at normal spacing.
- No em dashes anywhere. Use a comma or a period.

### The ground
A flat dark fill looks generated. Every dark graphic gets three layers behind the content:
1. One red wash off-centre, strongest behind the subject:
   `radial-gradient(620px 420px at 80% 38%, rgba(217,32,46,.30), transparent 70%)`
2. A weaker wash in the opposite corner, so the frame is never symmetrical.
3. Grain over everything at about 14% (the SVG noise in `templates/linkedin-banner.html`).

### The product
The product is the best image we have. Use it.
- **Real screenshots only**, from the live demo (campusai-demo) in dark mode. `assets/product/` has
  a current one. Never a mockup, never a redrawn UI, never AI-generated screens.
- Crop hard to the one part that makes the point (the daily brief, a job match, a chat answer).
  A whole page shrunk down reads as nothing.
- Real perspective is fine (a 3D tilt in CSS with `perspective`). A light glow behind it and a
  shadow falling away from the light.
- No fake browser bars, window dots or drawn phone frames around it.
- Never show Maryland imagery: no Testudo, no Maryland flag or M, no campus building photos. Crop
  the M out of the sidebar. Never show the Sandy Spring internship from the demo.
- Never put a number on a graphic that is not true in the product.

## What makes it look designed

- **Asymmetry.** Put the type somewhere decided, usually a third of the way in, not dead centre.
- **Something bleeds.** Let the product run off an edge. A frame where everything sits inside
  even margins reads as a template.
- **Big type or no type.** One short headline, set large. If it needs a paragraph, it is the
  wrong format.
- **Fewer things.** Logo, one line, one image. Each extra element costs attention.
- **Not empty either.** A half-empty frame reads as basic, not premium. Fill it with the product
  or the glow, on purpose.
- **Check it at real size.** Look at it at the size people will see it (a phone, a feed
  thumbnail). Small text that read on the big screen usually fails there.

## The AI tells, and what to do instead

| The tell | Do instead |
|---|---|
| Centred headline on a soft gradient | Type off-centre, the product as the image |
| Blue, navy or purple, or a blue-purple gradient | Near-black ground with the red glow |
| A stock or generated photo of a campus, building or smiling students | The real product, cropped hard |
| Generic tagline ("the operating system for...", "the future of...") | A plain, specific line about what the student gets |
| A short accent underline or bar under the headline | Nothing. Hierarchy comes from size |
| Glossy generated lighting: god rays, bokeh, teal and orange | Flat ground, one red wash, grain |
| Text on a busy photo | Text on the plain ground, or a solid panel behind it |
| Icon in a rounded tinted square, three across | Show the real thing once, larger |
| Pill badges and boxed cards everywhere | Hairlines, space, and the product itself |
| Logo or text drawn by an image model | The real logo file and live type on top |
| A big half-empty frame | Fill it with the product or the glow, on purpose |
| Red bars or shapes rising from the bottom | Never. They read as AI |
| Words like seamless, unlock, elevate, empower, revolutionize, cutting-edge | Say the concrete thing |

## How to build one

Build every graphic as **HTML and CSS at the exact pixel size**, with real layers: the logo as the
file, the words as live text, the product as the real screenshot. Then export it as a PNG at 2x.

- **In Claude Code (inside the studio):** copy `templates/linkedin-banner.html`, change it, and run
  `node templates/render.mjs <file.html> <out.png> <width> <height>`.
- **In Claude on the web:** build it as an HTML artifact at the exact size, then screenshot it at
  2x or ask for a PNG export.
- **In ChatGPT or any image tool:** if you use an image model at all, use it only for a background
  texture with no words, no logo, no faces, no hands and no UI. Put the logo, type and real
  product on top yourself (HTML, Figma or Canva).

`templates/linkedin-banner.html` is the worked example. Read its comments before making a new one.

## Sizes

| Format | Size | Watch out for |
|---|---|---|
| LinkedIn profile banner | 1584 x 396 | The profile photo covers the bottom left (about x 40 to 380, y 180 down). Keep it empty. |
| LinkedIn company cover | 1128 x 191 | Very short. Logo and one line, nothing else. |
| LinkedIn or Instagram post | 1080 x 1350 (4:5) | Read at thumbnail size first. |
| Story or Reel cover | 1080 x 1920 | Top 250px and bottom 300px are covered by the app. |
| X header | 1500 x 500 | Profile photo bottom left again. |
| Slide | 1920 x 1080 | |
| YouTube thumbnail | 1280 x 720 | Huge type or none. |
| Profile picture | 400 x 400 | The spark alone, centred on the ground. Never the full wordmark. |

## Before it goes out

1. Look at it at the size people will see it. Is the headline readable?
2. The one test: could it be another company's with the logo swapped?
3. Run down the AI tells table. Any hit gets fixed.
4. Logo is the real file, not retyped or recoloured. Name spelled CampusAI.
5. No blue, no em dashes, no monospace, no Maryland imagery, no invented numbers.
6. Compare it to `references/good/`. Does it sit next to them without looking like it came from
   somewhere else?

## Adding to the brand

The reference library is how this skill gets better. When someone shares an image and says it is a
good or bad example, or "add this to the brand":
1. Save it to `references/good/` or `references/bad/`, named `YYYY-MM-DD-what-it-shows.jpg`.
2. Add one line to `references/README.md`: the date, who it came from, and the one thing to take
   from it (good) or avoid (bad). Be specific. "Looks premium" teaches nothing. "The product
   bleeds off the right edge so the frame feels open" does.
3. If the example shows a rule this file does not have yet, add the rule to the right section here
   with the date, and say so.
4. If it contradicts a rule here, say so and ask before changing anything. Newer direction from
   Jacob wins.

Inside the studio, the change reaches the team only once it is committed and pushed.
