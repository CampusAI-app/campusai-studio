// ─────────────────────────────────────────────────────────────────────────────
// THE SCRIPT. This is the only file that changes between videos.
// Drop a recording in public/footage/, point at it here, describe the beats.
// Everything else is machinery.
// ─────────────────────────────────────────────────────────────────────────────

export type Focus = {
  /** Frame (relative to the start of this scene) where this focus state is reached. */
  at: number;
  /** Horizontal point of interest, 0 = left edge, 1 = right edge. */
  x: number;
  /** Vertical point of interest, 0 = top edge, 1 = bottom edge. */
  y: number;
  /** 1 = whole screen, 2 = twice as close. */
  scale: number;
};

export type Callout = {
  text: string;
  /** Normalised position over the footage. */
  x: number;
  y: number;
  /** Frames, relative to the start of this scene. */
  from: number;
  duration: number;
  /** Which side the connector leaves from. */
  side?: "left" | "right" | "top" | "bottom";
};

export type HighlightRect = {
  /** All four normalised to the CARD's own box, measured off the live DOM. */
  x: number;
  y: number;
  w: number;
  h: number;
};

/**
 * A voiceover clip placed inside a scene. `from` is frames after the scene
 * STARTS, so a line can sit just behind its own caption instead of racing it.
 * A clip is free to run past the scene's end: audio does not have to stop
 * where a picture cuts, and a line that carries a few tenths across the
 * crossfade bridges it rather than breaking it.
 */
export type VoiceClip = { src: string; from?: number; volume?: number };

export type EvidenceBeat = {
  /** Path inside public/. */
  src: string;
  /** Spoken label for this card, offset from the CARD's own start. */
  vo?: VoiceClip;
  durationInFrames: number;
  /** Caption for this beat. The highlight points, this says what it is. */
  label?: string;
  accentWords?: string[];
  /** One rect per line the phrase occupies. */
  rects?: HighlightRect[];
};

export type Caption = {
  text: string;
  from: number;
  duration: number;
  /** Words drawn in the accent colour. Short-form captions carry one. */
  accentWords?: string[];
};

export type Scene =
  | {
      type: "title";
      durationInFrames: number;
      eyebrow?: string;
      title: string;
      subtitle?: string;
    }
  | {
      /** Brand open. Wordmark in, then out while still growing. */
      type: "brand";
      durationInFrames: number;
      logoSrc: string;
      logoWidth?: number;
    }
  | {
      type: "statement";
      durationInFrames: number;
      vo?: VoiceClip;
      /** Several lines in one beat, each with its own offset. */
      vos?: VoiceClip[];
      /** Each line animates in on its own. */
      lines: string[];
      /** Optional word to accent, matched case-sensitively in `lines`. */
      accentWord?: string;
      /**
       * `punch` sets the beat in the short-form caption voice (Montserrat 800,
       * white) instead of the product's Inter. Default is `display`.
       */
      voice?: "display" | "punch";
    }
  | {
      type: "footage";
      /** Number of frames, or "auto" to use the whole clip after trimStart. */
      durationInFrames: number | "auto";
      /** File inside public/footage/ */
      src: string;
      /** Frames to skip at the head of the source clip. */
      trimStart?: number;
      /** Chrome drawn around the recording. */
      frame?: "browser" | "phone" | "none";
      /** Shown in the fake address bar when frame is "browser". */
      url?: string;
      /** How much breathing room around the footage, in px at 1080p. */
      inset?: number;
      focus?: Focus[];
      callouts?: Callout[];
      captions?: Caption[];
      /** Keep the recording's own audio. Off by default, voiceover comes later. */
      audio?: boolean;
    }
  | {
      type: "card";
      durationInFrames: number;
      vo?: VoiceClip;
      /** Several lines in one beat, each with its own offset. */
      vos?: VoiceClip[];
      /** Path inside public/, e.g. "captures/campusai-jobmatch/card-02-jpmorgan.png" */
      src: string;
      /** Breathing room around the artwork, in px at the composition's scale. */
      inset?: number;
      /** Fraction of the stage width the artwork may occupy. 1 = all of it. */
      maxWidth?: number;
      /** Dimmed image held above the main artwork, e.g. the card it opened from. */
      above?: string;
      /** "contain" fits the whole image. "width" fills the width and pans down. */
      fit?: "contain" | "width";
      /** Width / height of the source image. Required when fit is "width". */
      srcAspect?: number;
      focus?: Focus[];
      captions?: Caption[];
    }
  | {
      type: "evidence";
      /** Must equal the sum of the beats. */
      durationInFrames: number;
      vo?: VoiceClip;
      /** Several lines in one beat, each with its own offset. */
      vos?: VoiceClip[];
      /** Persistent goal chip, held above the evidence for the whole scene. */
      chipSrc?: string;
      /** Width / height of the captured card. */
      aspect?: number;
      beats: EvidenceBeat[];
    }
  | {
      type: "wall";
      durationInFrames: number;
      /** Nine paths inside public/, laid out row-major in a 3x3 grid. */
      screens: string[];
      /** Camera path. `target` is a tile index, or "wide" for the whole grid. */
      path: { at: number; target: number | "wide" }[];
      captions?: Caption[];
    }
  | {
      type: "end";
      durationInFrames: number;
      vo?: VoiceClip;
      /** Several lines in one beat, each with its own offset. */
      vos?: VoiceClip[];
      title: string;
      subtitle?: string;
      cta?: string;
      /** Wordmark inside public/, drawn instead of the type-set title. */
      logoSrc?: string;
      logoWidth?: number;
      /**
       * `punch` sizes the subtitle and pill for a feed post, where the end card
       * is a call to action rather than a sign-off. Default keeps the original
       * 16:9 sizes.
       */
      voice?: "display" | "punch";
    };

export type VideoScript = {
  theme: keyof typeof import("./theme").THEMES | string;
  fps: number;
  width: number;
  height: number;
  /** Frames of crossfade between scenes. 0 disables transitions. */
  transitionFrames: number;
  /** Used when a footage duration is "auto" but the clip can't be probed. */
  fallbackFootageFrames: number;
  /**
   * Background bed, a file inside public/audio/. Faded in at the top and out
   * over the end card so it never cuts off hard.
   */
  music?: { src: string; volume?: number };
  /**
   * A mark held in the corner for the whole film, above every scene so it never
   * crossfades. Replaces the brand-open scene: on a feed post a logo that owns
   * its own beat is a beat the hook is not on screen.
   */
  watermark?: { src: string; widthRatio?: number; opacity?: number };
  scenes: Scene[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Default script. This is a working placeholder that renders today with the
// bundled sample clip, so the pipeline is verifiable before real footage lands.
// ─────────────────────────────────────────────────────────────────────────────

export const SCRIPT: VideoScript = {
  theme: "campusai",
  fps: 30,
  width: 1920,
  height: 1080,
  transitionFrames: 12,
  fallbackFootageFrames: 150,
  scenes: [
    {
      type: "title",
      durationInFrames: 60,
      eyebrow: "CampusAI",
      title: "Advising that scales",
      subtitle: "A look at what a student sees on day one",
    },
    {
      type: "footage",
      durationInFrames: "auto",
      src: "sample.mp4",
      trimStart: 0,
      frame: "browser",
      url: "campusai.app/today",
      inset: 90,
      focus: [
        { at: 0, x: 0.5, y: 0.5, scale: 1 },
        { at: 40, x: 0.5, y: 0.5, scale: 1 },
        { at: 70, x: 0.32, y: 0.4, scale: 1.6 },
        { at: 120, x: 0.32, y: 0.4, scale: 1.6 },
        { at: 150, x: 0.5, y: 0.5, scale: 1 },
      ],
      callouts: [
        { text: "Ranked from the student's own record", x: 0.34, y: 0.36, from: 75, duration: 60, side: "right" },
      ],
      captions: [{ text: "Every recommendation carries its reason", from: 20, duration: 70 }],
    },
    {
      type: "statement",
      durationInFrames: 75,
      lines: ["Reach every student.", "Not just the ones who book."],
      accentWord: "Reach",
    },
    {
      type: "end",
      durationInFrames: 75,
      title: "CampusAI",
      subtitle: "Built for advising teams",
      cta: "campusai.app",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// POST 1 — Job Match: what it takes into account.
//
// Every beat is a still captured out of the running demo (see
// public/captures/campusai-jobmatch/), not a screen recording, because nothing
// here is clicked. The point of the post is that each reason line cites a
// DIFFERENT part of the same student's record, so the product does the
// explaining and the captions only name the source.
//
// Evercore is deliberately absent: its reason line contains an em dash, which
// is banned in our copy, and a video would freeze that into an asset. Same
// reason the "Roles matching your skills…" section line never appears.
// ─────────────────────────────────────────────────────────────────────────────

const C = "captures/campusai-jobmatch";

const BEAT = 70;

/** One beat of the carousel, so the two evidence runs stay identical in feel. */
const ev = (
  src: string,
  label: string,
  accent: string,
  rects: HighlightRect[],
  /** Overrides BEAT. The first card needs longer, it teaches the format. */
  frames = BEAT,
  /** This card's spoken label. Placed relative to the CARD, not the scene. */
  vo?: VoiceClip,
): EvidenceBeat => ({
  src: `${C}/${src}`,
  durationInFrames: frames,
  label,
  accentWords: [accent],
  rects,
  vo,
});

const JOB_MATCH_SCENES: Scene[] = [
  {
    // Establish the SURFACE before the mechanism. Opens on the real Job Match
    // view, then pushes in on the North Star chip at the top right, which is
    // what the next beat opens.
    //
    // focus x/y are IMAGE coordinates, measured off the live page with
    // getBoundingClientRect (chip centre 0.696 / 0.238 of the viewport), not
    // eyeballed. CardScene maps them through the letterbox.
    //
    // 88 frames: the hard floor. v01 is 2.77s = 84 frames, and it now starts at
    // 4 instead of 8, so the open reaches the words sooner. Anything shorter
    // clips the line.
    type: "card",
    durationInFrames: 92,
    src: `${C}/view-jobs.png`,
    srcAspect: 1440 / 900,
    inset: 56,
    vo: { src: "audio/vo/v01-brand.mp3", from: 4 },
    focus: [
      { at: 0, x: 0.696, y: 0.238, scale: 1 },
      { at: 29, x: 0.696, y: 0.238, scale: 1.1 },
      { at: 88, x: 0.696, y: 0.238, scale: 2.8 },
    ],
    captions: [
      { text: "This is Job Match.", from: 4, duration: 32, accentWords: ["Job", "Match"] },
      { text: "We built it at Campus AI.", from: 40, duration: 48, accentWords: ["built"] },
    ],
  },
  {
    // The chip, opened. Holds on "Aim at" with the goal checked, then pans down
    // to "Actively looking" so the second half of the decision is on screen
    // too. The pan now happens UNDER the second line, so the picture reveals
    // "say yes to" half at the moment the voice says it.
    type: "card",
    durationInFrames: 128,
    src: `${C}/northstar-picker.png`,
    fit: "width",
    srcAspect: 1692 / 2856,
    inset: 56,
    focus: [
      { at: 0, x: 0.5, y: 0, scale: 0.93 },
      { at: 16, x: 0.5, y: 0, scale: 1 },
      { at: 62, x: 0.5, y: 0, scale: 1 },
      { at: 122, x: 0.5, y: 1, scale: 1 },
    ],
    captions: [
      { text: "First you tell it what you're going for", from: 4, duration: 67, accentWords: ["going"] },
      { text: "And what you'd say yes to", from: 75, duration: 51, accentWords: ["yes"] },
    ],
    // v02 is 2.22s = 67f from frame 4, ending at 71, so v03 sits at 75 and keeps
    // the same 4-frame breath between the two lines.
    vos: [
      { src: "audio/vo/v02-pick.mp3", from: 4 },
      { src: "audio/vo/v03-open-to.mp3", from: 75 },
    ],
  },
  {
    // The turn. Everything before this is you telling it what you want;
    // everything after is it telling you what it already knows. A mid-roll text
    // beat is a chapter break, not a hook.
    //
    // 90 frames. v04 is 2.64s = 79f from frame 6, ending at 85. The two lines on
    // screen are the two sentences being spoken, in order.
    type: "statement",
    durationInFrames: 90,
    voice: "punch",
    lines: ["Now the part that matters.", "It already knows you."],
    accentWord: "knows",
    vo: { src: "audio/vo/v04-turn.mp3", from: 6 },
  },
  {
    // First match. Held long because it is the first job card the viewer sees
    // and has to teach the whole format: the card, the reason line, the
    // highlight.
    type: "evidence",
    durationInFrames: 78,
    chipSrc: `${C}/northstar-chip.png`,
    vo: { src: "audio/vo/v05-experience.mp3", from: 28 },
    beats: [
      ev(
        "card-07-pwc.png",
        "What you've actually done",
        "done",
        [{ x: 0.1288, y: 0.411, w: 0.4682, h: 0.0685 }],
        78,
      ),
    ],
  },
  {
    // Everything else Job Match is drawing on, one source per card. BEAT is now
    // 70 frames. The binding constraint is v06 "The skills you've proven" at
    // 1.49s = 45f starting at frame 22, which lands at 67: any shorter and one
    // card's label is still being spoken when the next card's label starts.
    type: "evidence",
    durationInFrames: 280,
    chipSrc: `${C}/northstar-chip.png`,
    beats: [
      ev("card-08-capitalone.png", "The skills you've proven", "proven", [
        { x: 0.0421, y: 0.411, w: 0.5899, h: 0.0685 },
      ], BEAT, { src: "audio/vo/v06-skills.mp3", from: 22 }),
      ev("card-03-marriott.png", "The orgs you run", "orgs", [
        { x: 0.686, y: 0.411, w: 0.0976, h: 0.0685 },
        { x: 0.0421, y: 0.4861, w: 0.2822, h: 0.0685 },
      ], BEAT, { src: "audio/vo/v07-orgs.mp3", from: 22 }),
      ev("card-02-jpmorgan.png", "What you learned there", "learned", [
        { x: 0.1288, y: 0.411, w: 0.7364, h: 0.0685 },
      ], BEAT, { src: "audio/vo/v08-learned.mp3", from: 22 }),
      ev("card-04-trowe.png", "Even your classes", "classes", [
        { x: 0.208, y: 0.411, w: 0.4769, h: 0.0685 },
      ], BEAT, { src: "audio/vo/v09-classes.mp3", from: 22 }),
    ],
  },
  {
    // Opened AFTER the run of sources, so the story is: it knows you, here is
    // everything it knows, and any one of them opens into the full argument.
    // Still not the finale; the skills gap and the ask follow.
    //
    // "Open ANY ONE", not "open it": four other cards have played since PwC.
    // 112 frames: v10 is 2.53s = 76f from frame 30, landing at 106 with tail.
    type: "card",
    durationInFrames: 112,
    src: `${C}/detail-full-pwc.png`,
    fit: "width",
    srcAspect: 720 / 921,
    inset: 44,
    vo: { src: "audio/vo/v10-open-any.mp3", from: 30 },
    focus: [
      { at: 0, x: 0.5, y: 0, scale: 0.9 },
      { at: 18, x: 0.5, y: 0, scale: 1 },
      { at: 44, x: 0.5, y: 0, scale: 1 },
      { at: 112, x: 0.5, y: 1, scale: 1 },
    ],
    captions: [
      { text: "Open any one and it shows its work", from: 26, duration: 80, accentWords: ["shows"] },
    ],
  },
  {
    // What you should actually go learn. The only forward-looking beat, and the
    // gaps name the very jobs shown above: live-deal on PwC, FP&A on Marriott
    // and Capital One.
    //
    // Two caption cards, because at 13 words a single card wraps to four lines
    // and runs off the bottom of the 4:5 frame. Both halves are spoken, so this
    // does not repeat the old defect (captions with words the voice never said).
    //
    // The split point is MEASURED, not guessed: inside v11 the first sentence
    // ends at 1.98s and the second starts at 2.64s = frame 79 of the clip, so
    // the second card sits at 16 + 79 = 95.
    //
    // 158 frames: v11 is 4.57s = 137f from frame 16, ending at 153.
    type: "card",
    durationInFrames: 158,
    src: `${C}/skills-section.png`,
    fit: "width",
    srcAspect: 934 / 1438,
    inset: 44,
    vo: { src: "audio/vo/v11-go-learn.mp3", from: 16 },
    focus: [
      { at: 0, x: 0.5, y: 0, scale: 0.92 },
      { at: 18, x: 0.5, y: 0, scale: 1 },
      { at: 40, x: 0.5, y: 0, scale: 1 },
      { at: 158, x: 0.5, y: 1, scale: 1 },
    ],
    captions: [
      { text: "It'll also tell you what to go learn", from: 12, duration: 62, accentWords: ["learn"] },
      { text: "For the exact jobs you're chasing", from: 95, duration: 60, accentWords: ["exact"] },
    ],
  },
  {
    // The ask, pointed at the FEATURE rather than at procurement. Not
    // "download the app": CampusAI is sold to universities and gated at login,
    // so there is nothing to download.
    type: "end",
    durationInFrames: 108,
    voice: "punch",
    title: "CampusAI",
    logoSrc: "brand/campusai-logo-white.svg",
    logoWidth: 560,
    subtitle: "Go open Job Match and see yours",
    cta: "campusai.app",
    vo: { src: "audio/vo/v12-cta.mp3", from: 10 },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Resume Coach. Same grammar as the Job Match cut so the two read as a series,
// with one structural difference: there is NO voiceover, so every beat is timed
// to its caption's reading time rather than to an audio clip.
//
// Structure is Jacob's (2026-08-28): name the surface, then show the FORK
// early — a general review, or aimed at one job — then walk each branch. The
// fork gets one beat, not two, because the product already puts both on a
// single row: "Tailor to a specific job" sits on the AI-suggestions header.
// That also let the Tailor picker beat go: the coverage screen's own header
// names the job, so nothing is lost by not showing it being picked.
//
// Every pixel is a capture of the live demo at /career?view=resume. Nothing is
// rebuilt, for the same reason Flow and Figma Make were killed: a marketing
// video showing a product that does not exist is the failure that costs a
// university.
// ─────────────────────────────────────────────────────────────────────────────

const R = "captures/campusai-resume";

const RESUME_COACH_SCENES: Scene[] = [
  {
    // Establish the surface, then push toward the 74/100 score ring, which is
    // the Resume Coach's visual anchor.
    //
    // The ring measures to x 0.9375 of the viewport, too close to the edge to
    // sit at the centre of a 2x zoom without the frame running off the image.
    // Anchoring at 0.75 puts the right-hand column — file, date, score — in
    // frame with the zoom ending exactly at the image edge.
    type: "card",
    durationInFrames: 104,
    src: `${R}/view-resume.png`,
    srcAspect: 1440 / 900,
    inset: 56,
    focus: [
      { at: 0, x: 0.75, y: 0.32, scale: 1 },
      { at: 30, x: 0.75, y: 0.32, scale: 1.08 },
      { at: 100, x: 0.75, y: 0.32, scale: 2 },
    ],
    captions: [
      { text: "Resume Coach, from Campus AI", from: 6, duration: 84, accentWords: ["Resume", "Coach"] },
    ],
  },
  {
    // THE FORK, and the reason it is beat 2 rather than beat 6. One row carries
    // both halves: the generic suggestions on the left, "Tailor to a specific
    // job" outlined in red on the right. Push in toward the button so the
    // second half of the sentence has something to land on.
    type: "card",
    durationInFrames: 126,
    src: `${R}/suggestions-row.png`,
    fit: "width",
    srcAspect: 1136 / 630,
    inset: 48,
    // x stays 0.5 on every fit="width" beat. The image is already pinned to the
    // frame width, so any other x slides it sideways and guillotines the left
    // edge of the rows — caught on a still at frame 440, where three suggestion
    // titles were cut mid-word.
    focus: [
      { at: 0, x: 0.5, y: 0, scale: 0.94 },
      { at: 18, x: 0.5, y: 0, scale: 1 },
      { at: 126, x: 0.5, y: 0.25, scale: 1.08 },
    ],
    captions: [
      { text: "Review the whole resume,", from: 8, duration: 52, accentWords: ["whole"] },
      { text: "or aim it at one job", from: 62, duration: 58, accentWords: ["one", "job"] },
    ],
  },
  {
    // The recruiter read. Status bar and the band captured as one image: the
    // band on its own is 1136x200, a 5.3:1 strip that reads as a sliver in a
    // vertical frame.
    type: "card",
    durationInFrames: 116,
    src: `${R}/coach-head.png`,
    fit: "width",
    srcAspect: 1136 / 560,
    inset: 48,
    focus: [
      { at: 0, x: 0.5, y: 0, scale: 0.95 },
      { at: 18, x: 0.5, y: 0, scale: 1.02 },
      { at: 116, x: 0.5, y: 1, scale: 1.1 },
    ],
    captions: [
      { text: "It reads your resume the way a recruiter does", from: 10, duration: 92, accentWords: ["recruiter"] },
    ],
  },
  {
    // The profile branch. The "From your profile" row is the only purple-marked
    // suggestion in the list, so the push-in lands on something visually
    // distinct rather than on one grey row among five.
    //
    // Its OWN crop, not beat 2's. Beat 2 frames the whole suggestions block to
    // show the fork; reusing that image here would play the same picture twice
    // with a different caption over it. This is three rows with the profile one
    // in the middle.
    type: "card",
    durationInFrames: 146,
    src: `${R}/profile-rows.png`,
    fit: "width",
    srcAspect: 1110 / 400,
    inset: 48,
    focus: [
      { at: 0, x: 0.5, y: 0.5, scale: 0.96 },
      { at: 22, x: 0.5, y: 0.5, scale: 1.04 },
      { at: 146, x: 0.5, y: 0.5, scale: 1.14 },
    ],
    captions: [
      { text: "It tells you what to add,", from: 10, duration: 58, accentWords: ["add"] },
      { text: "from what it knows about you", from: 72, duration: 66, accentWords: ["knows"] },
    ],
  },
  {
    // The courses branch. The reason lines cite the actual class by name —
    // "Business Finance gave you the foundation", measured at y 0.426 of this
    // crop — which is the whole point of the caption. The push-in stops there.
    type: "card",
    durationInFrames: 116,
    src: `${R}/skills-add.png`,
    fit: "width",
    srcAspect: 1136 / 630,
    inset: 48,
    focus: [
      { at: 0, x: 0.5, y: 0, scale: 0.96 },
      { at: 20, x: 0.5, y: 0.15, scale: 1.05 },
      { at: 116, x: 0.5, y: 0.34, scale: 1.12 },
    ],
    captions: [
      { text: "Down to the classes you've taken", from: 8, duration: 92, accentWords: ["classes"] },
    ],
  },
  {
    // The specific-job branch paying off. "Aim it at one job" deliberately
    // echoes beat 2 — that echo is what tells the viewer which of the two
    // branches they are now watching.
    //
    // Panned rather than zoomed: the value here is the whole two-column table,
    // three rows of "Nothing on your resume covers this" against one "Already
    // covered", and a zoom would show one row of it.
    type: "card",
    durationInFrames: 156,
    src: `${R}/tailor-coverage.png`,
    fit: "width",
    srcAspect: 1136 / 900,
    inset: 48,
    focus: [
      { at: 0, x: 0.5, y: 0, scale: 0.94 },
      { at: 20, x: 0.5, y: 0, scale: 1.04 },
      { at: 46, x: 0.5, y: 0, scale: 1.04 },
      { at: 156, x: 0.5, y: 1, scale: 1.04 },
    ],
    captions: [
      { text: "Aim it at one job,", from: 10, duration: 54, accentWords: ["one", "job"] },
      { text: "and it checks the posting line by line", from: 68, duration: 80, accentWords: ["line", "by", "line"] },
    ],
  },
  {
    // The ask, pointed at the feature. Same reasoning as the Job Match end
    // card: CampusAI is sold to universities and gated at login, so there is
    // nothing to download.
    type: "end",
    durationInFrames: 96,
    voice: "punch",
    title: "CampusAI",
    logoSrc: "brand/campusai-logo-white.svg",
    logoWidth: 560,
    subtitle: "Open Resume Coach and see yours",
    cta: "campusai.app",
  },
];

const RESUME_COACH_BASE = {
  theme: "campusaiProduct",
  fps: 30,
  transitionFrames: 10,
  fallbackFootageFrames: 150,
  watermark: { src: "brand/campusai-logo-white.svg", widthRatio: 0.19, opacity: 0.72 },
  scenes: RESUME_COACH_SCENES,
};

/** Instagram Reels. The primary cut. */
export const RESUME_COACH_916: VideoScript = {
  ...RESUME_COACH_BASE,
  width: 1080,
  height: 1920,
};

/** Instagram feed as a standalone post. */
export const RESUME_COACH_45: VideoScript = {
  ...RESUME_COACH_BASE,
  width: 1080,
  height: 1350,
};

/** Site, LinkedIn, YouTube. */
export const RESUME_COACH_169: VideoScript = {
  ...RESUME_COACH_BASE,
  width: 1920,
  height: 1080,
};

const JOB_MATCH_BASE = {
  theme: "campusaiProduct",
  fps: 30,
  transitionFrames: 10,
  fallbackFootageFrames: 150,
  // Sits ABOVE the chip in the carousel beats, not beside it: the chip is
  // centred at 8.5% of frame height and 62% of frame width, so anything level
  // with it collides.
  watermark: { src: "brand/campusai-logo-white.svg", widthRatio: 0.19, opacity: 0.72 },
  scenes: JOB_MATCH_SCENES,
};

/**
 * Caption-free copy of the scene list, for exporting reference FRAMES to hand an
 * AI video tool. Captions are composited after generation, so a frame with type
 * burned into it would only give the model text to garble.
 */
const stripCaptions = (scenes: Scene[]): Scene[] =>
  scenes.map((sc) => ("captions" in sc ? { ...sc, captions: [] } : sc));

/**
 * 9:16, caption-free. Not a deliverable. This exists only to render exact first
 * and last frames for Veo, which offers 16:9 and 9:16 but no 4:5.
 */
export const JOB_MATCH_916_FRAMES: VideoScript = {
  ...JOB_MATCH_BASE,
  scenes: stripCaptions(JOB_MATCH_SCENES),
  width: 1080,
  height: 1920,
};

/**
 * Instagram Reels / Stories. THE cut to post on Instagram: Reels is 9:16 and a
 * 4:5 upload gets padded with black top and bottom, which is exactly what Jacob
 * saw. Layout is shifted into the Reels safe band by `safeLayout`, so the
 * captions clear Instagram's own bottom UI and everything survives the centre
 * 4:5 crop the feed applies to a Reel.
 */
export const JOB_MATCH_916: VideoScript = {
  ...JOB_MATCH_BASE,
  width: 1080,
  height: 1920,
};

/** Instagram feed as a standalone post, and the source of the 4:5 grid crop. */
export const JOB_MATCH_45: VideoScript = {
  ...JOB_MATCH_BASE,
  width: 1080,
  height: 1350,
};

/** Site, LinkedIn, YouTube. Same script, same assets, wider ground. */
export const JOB_MATCH_169: VideoScript = {
  ...JOB_MATCH_BASE,
  width: 1920,
  height: 1080,
};

/** Square, if a grid ever needs it. */
export const JOB_MATCH_11: VideoScript = {
  ...JOB_MATCH_BASE,
  width: 1080,
  height: 1080,
};
