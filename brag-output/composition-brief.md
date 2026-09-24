# Hyperframes Composition Brief: My Piano Diary

## Objective
Create a short launch-style brag video for My Piano Diary.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 22 seconds

## Source Material
- Project root: `my-piano-diary/`
- Primary files read: `README.md`, `src/app/layout.tsx`, `src/styles/globals.css`, `src/config/app-config.ts`, `src/components/landing/{landing-data.ts,landing-hero.tsx,showcase-studio.tsx,showcase-scoring.tsx}`, `src/components/blossom/blossom.tsx`, `public/logo.png`
- Product name: My Piano Diary
- Tagline / strongest claim: "Every lesson, every blossom, in one soft little diary."
- Key UI moments to recreate: dashboard "today" table with status chips (showcase-studio.tsx `TODAY_ROWS`), "How did that lesson go?" blossom rater (showcase-scoring.tsx `SCORE_STEPS`), "The month, on paper" report with "12 lessons × ₹600"
- Copy that must appear verbatim:
  - "sorry, did I pay you for March?" (from the hero paragraph)
  - "Every lesson, every blossom, in one soft little diary."
  - "Open it and you already know your day"
  - "How did that lesson go?"
  - "Really good — she fixed bar 24 herself."
  - "12 lessons × ₹600"

## Creative Direction
- Tone preset: default
- Creative direction: cosy stationery-shop launch — a diary that happens to do your accounting
- Interpretation: soft slides and crossfades, rounded pastel cards, comfortable holds; humour comes from the parent's text.
- Angle: the "did I pay you for March?" text is the problem; the diary answers it by the end (PAID stamp on the March report).
- Hook: the text message typing in on the hero gradient.
- Outro / punchline: logo + name + tagline, open-source footer.
- Avoid: generic SaaS language, abstract filler, redesigning the brand.

## Visual Identity
- Background: floss `#f0f9f8` + hero gradient (pink → floss → mint)
- Text: ink `oklch(0.328 0.027 203.5)`, ink-soft `oklch(0.524 0.03 193.3)`
- Accent: bubblegum `#f3a2be`, pink-600 `oklch(0.6 0.161 0.2)`, pink-700 `oklch(0.5 0.138 358.5)`, wintergreen `#81bfb7`, mint `#c6e6e3`
- Display font: Gelasio 700 (stand-in for the app's Iowan/Palatino/Georgia serif stack — Gelasio is Georgia-metric), embedded locally
- Body font: Plus Jakarta Sans 600/700/800 (the app's own font), embedded locally
- Visual references: 5-petal blossom SVG, squiggle underline, logo.png, status chips

## Storyboard
See `brag-plan.md`. Scene summary:
1. The text — 3.4s — chat bubble types "sorry, did I pay you for March?"
2. Reveal — 3.0s — logo, name, tagline with squiggle
3. Today — 4.2s — dashboard table, four rows, Meera PENDING → COMPLETE click
4. Blossom scoring — 4.4s — four blossoms fill, final caption held
5. The month, on paper — 4.2s — attendance grid, ₹7,200 total, PAID stamp
6. Outro — 2.8s — logo, name, tagline, GitHub

## Audio
- Audio role: warm bed
- Music: `assets/music/happy-beats-business-moves-vol-9-by-ende-dot-app.mp3`, volume 0.32, fade in 0–0.6s, fade out 20.5–22s
- Music cue guidance: preset `~/.claude/skills/brag/assets/music/cues/happy-beats-business-moves-vol-9-by-ende-dot-app.music-cues.json` (114.8 BPM). Beat-lock title at 3.70s and blossom scene entrance at 10.54s; rows on consecutive beats; PAID stamp on 17.38s beat.
- Audio-reactive: subtle; per-frame RMS (extracted with ffmpeg + node into `assets/audio-data.js`, no Python available) breathes the background blossom blobs.
- SFX: keypress ticks for typing, soft impact on title, card-slide on rows, click on chip, glass taps on blossoms, soft heavy thud on PAID stamp, bell on logo.
