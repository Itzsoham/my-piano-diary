# Brag Plan: My Piano Diary

## What is this app?
A soft, paper-diary-styled studio app for one piano teacher: schedule lessons, mark attendance, score each lesson in 1–5 blossoms, track tuition at the rate it was booked at, and print a monthly report for the parents.

## The angle
The site's own best line is the villain: the *"sorry, did I pay you for March?"* text. Every piano teacher has received it. The video opens on that message, then shows the diary quietly making it impossible — today's lessons, a lesson scored in blossoms, and the month printed on paper with the tuition already added up. Warm and cute, not corporate: the product is pink, has a cat, and rates lessons in flowers. Let that be the charm.

## Hook (first 2-3 seconds)
A phone-style chat bubble types in on the soft floss background: **"sorry, did I pay you for March? 🙈"** — a second, tiny grey line under it: *"— every piano parent, ever"*. Typing ticks, then a gentle beat of silence before the reveal.

## Key moments (the middle)
- **Today, at a glance** — the dashboard greeting band ("4 lessons today · ₹4,800 expected") and today's four rows (Aarav, Ishita, Meera, Kabir) with teal/sand/pink status chips. A cursor clicks Meera's PENDING chip and it flips to COMPLETE.
- **Blossom scoring** — the "How did that lesson go?" card. A cursor sweeps across the five blossoms; the caption updates beneath each; it lands on 4: *"Really good — she fixed bar 24 herself."*
- **The month, on paper** — the printable report: a weekly attendance grid ticking in, then "12 lessons × ₹600" → **₹7,200** total, with a "Paid" stamp landing. The March question is answered.

## Outro / punchline
The logo (the smiling pink piano-diary) pops in with a blossom sparkle. **My Piano Diary** in serif. Line: *"Every lesson, every blossom, in one soft little diary."* Small: open source · github.com/Itzsoham/my-piano-diary.

## User flow worth showing
Open the dashboard and see today's lessons → mark a lesson complete and score it in blossoms → print the month's report with tuition totalled.

## Tone
- Preset: default
- Creative direction: cosy stationery-shop launch — a diary that happens to do your accounting
- Interpretation: comfortable pacing, soft slides and crossfades, rounded cards with pastel shadows, playful but never loud; the humour is the parent's text, not jokes on top.

## Format: landscape — 1920x1080
## Duration: 22s

## Visual identity (from the project)
- Background: floss `#f0f9f8` with the hero gradient (pink `oklch(0.93 0.045 356)` → floss → mint `oklch(0.92 0.04 187)`)
- Accent: bubblegum `#f3a2be`, cotton `#ffd3dd`, pink-600 `oklch(0.6 0.161 0.2)` / pink-700 `oklch(0.5 0.138 358.5)` for text; wintergreen `#81bfb7`, mint `#c6e6e3`
- Text: ink `oklch(0.328 0.027 203.5)`, ink-soft `oklch(0.524 0.03 193.3)`
- Status chips: COMPLETE teal (ok-bg `oklch(0.942 0.022 179.2)` / teal-700), PENDING sand (sand-100 / sand-700), CANCELLED pink (no-bg / pink-700)
- Display font: serif stack — Iowan Old Style / Palatino / Georgia (headings, greetings, report paper)
- Body font: Plus Jakarta Sans 600/700
- Strongest visual element: the hand-drawn blossom ornaments + the smiling pink piano-diary logo (`public/logo.png`), pink gradient text on "in one soft little diary."

## Share copy (draft)
Built My Piano Diary — a soft little diary for piano teachers that scores every lesson in blossoms and prints the month, so nobody has to ask "did I pay you for March?" again. 🌸🎹

## Audio direction
- Role: warm bed
- Music: `happy-beats-business-moves-vol-9-by-ende-dot-app.mp3` (mid-energy, laid-back)
- Music treatment: start at 0, volume ~0.32, short fade-in, fade out over the last ~1.5s under the logo
- Music cue guidance: preset `assets/music/cues/happy-beats-business-moves-vol-9-by-ende-dot-app.music-cues.json`, ~114.8 BPM. Strong cues: **3.70s** (title reveal), **10.54s** (blossom scoring scene), **18.96-ish / 23.17** — use a beat near the report total (~16.34) for the "Paid" stamp only if it doesn't rush reading. Beat grid ~0.53s apart: today's four rows arrive every other beat (≈7.40, 8.44, 9.50…) with the set held afterward.
- Audio-reactive treatment: subtle; music RMS gently breathes the pastel background blobs / card shadow glow. No waveform or note graphics.
- SFX posture: moderate, soft; motion-matched
- Audio-coupled moments: key ticks on the typed hook; soft drop on the title reveal; click on Meera's status chip; rising soft taps as the cursor crosses the blossoms; a stamp thud on "Paid"; one bell on the logo
- Restraint rule: no harsh/bright repeated clicks; nothing louder than the music's warmth; no cartoon boings

## Storyboard

### Scene 1 — The text — 3.4s
Soft hero gradient. A white chat bubble (rounded, pink tail) types: "sorry, did I pay you for March? 🙈". Timestamp "Tue 9:41 PM" tiny above. At ~2.1s a small ink-soft caption fades in below: "— every piano parent, ever". Both held to 3.4s.
Sequential/interaction: yes — hook types character by character
Audio intent: intimate, a little comic
Audio-coupled idea: keyboard ticks per character (quiet)
Music: warm bed fades in
Transition mood: soft — bubble slides up and out, title rises in → Scene 2

### Scene 2 — Reveal — 3.0s (3.4–6.4)
Logo-mark + "My Piano Diary" in serif ink, then "Every lesson, every blossom, / in one soft little diary." with the second line in pink gradient; a squiggle underline draws. Blossom ornaments drift in the corners.
Sequential/interaction: none
Audio intent: warm arrival
Audio-coupled idea: soft drop / impactSoft on the title (lock near 3.70s strong cue)
Transition mood: clean slide → Scene 3

### Scene 3 — Today — 4.2s (6.4–10.6)
Dashboard card (white, rounded, pastel shadow). Serif greeting "Good evening 🌸" and band "4 lessons today · ₹4,800 expected". Four rows slide in one by one: Aarav M. 4:00 PM COMPLETE, Ishita R. 5:00 PM COMPLETE, Meera S. 6:15 PM PENDING, Kabir T. 7:30 PM CANCELLED. Cursor moves to Meera's PENDING chip, clicks; it flips to COMPLETE (teal) with a tiny sparkle.
Sequential/interaction: yes — rows arrive on every other beat, then set holds ≥1.5s; simulated click
Audio intent: tidy, satisfying
Audio-coupled idea: soft card sounds on rows (accent first/last), click on chip
Transition mood: clean → Scene 4

### Scene 4 — Blossom scoring — 4.4s (10.6–15.0)
Card titled "How did that lesson go?" with "Meera S. · Für Elise". Five outlined blossoms. Cursor sweeps left→right; blossoms fill pink one by one; caption under them updates (show 3: "Solid. The scales are landing." briefly), then settles on **4 blossoms**: "Really good — she fixed bar 24 herself." — held ≥1.6s. Eyebrow text left of card: "Rate the lesson."
Sequential/interaction: yes — blossoms fill one by one; final caption held
Audio intent: playful rising phrase
Audio-coupled idea: soft rising taps per blossom; lock scene entrance near 10.54s strong cue
Transition mood: soft slide → Scene 5

### Scene 5 — The month, on paper — 4.2s (15.0–19.2)
Report paper (cream, serif): "Meera S. — March 2026". Weekly attendance grid, 4 weeks × 3 dots ticking in teal. Lines: "12 lessons × ₹600" → "Total ₹7,200". A pink round "PAID" stamp thuds on at the corner. Eyebrow left: "Print the month."
Sequential/interaction: yes — grid dots tick in quickly, then total + stamp hold ≥1.5s
Audio intent: resolution — the March question answered
Audio-coupled idea: stamp thud on PAID (impactSoft heavy / wood)
Transition mood: soft crossfade → Scene 6

### Scene 6 — Outro — 2.8s (19.2–22.0)
Logo pops in centred with sparkle + blossoms, "My Piano Diary" serif, "Every lesson, every blossom, in one soft little diary." Small footer: "Open source · github.com/Itzsoham/my-piano-diary". Hold, music fades.
Sequential/interaction: none
Audio intent: warm button
Audio-coupled idea: one bell on logo landing
Transition mood: end

**Music mood for this video:** upbeat, warm, cosy
**Audio summary:** a laid-back warm bed that starts under the typed text, lifts at the title, ticks along with tidy UI sounds, and fades under the logo with a single bell.

## Revision — louder mix
- Music bed set to 0.4 in the volume automation lane (the lane overrides data-volume, so the bed had been at full level and masked the SFX). Added typing ticks on every other character, scene-change slides, attendance ticks and a counter sound. Final audio is loudness-normalized to -14 LUFS.
