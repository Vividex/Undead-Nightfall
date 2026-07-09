# Design: Vividex studio splash bumper

## Context

Undead Nightfall is a vanilla-JS/HTML5-canvas game with no build step and no
test framework. All CSS lives in named `<style id="...">` blocks inside
`index.html`; all game/UI scripts are plain non-module `<script>` tags loaded
in numbered order (`scripts/script-01.js` … `script-49.js`, registered in
`scripts/manifest.txt`). Assets are referenced directly by path and precached
by `service-worker.js`'s `APP_SHELL` list.

The game already shows a brief (~1.77s) `#bootLayoutSplash` overlay on load —
a fixed full-screen div with the app icon and "UNDEAD NIGHTFALL" text in the
game's gothic amber palette (`#d6a041`, Georgia serif) — whose only job is to
mask layout shift while mobile Safari/Chrome settles orientation, safe areas,
and CSS overrides (`scripts/script-31.js`).

The user (Vividex, the studio building this game) has an animated version of
their blue "V" mark — approved via a working HTML/CSS/canvas prototype — that
should now play as a studio bumper before the game's own boot sequence,
matching how a developer/publisher logo precedes a game's title screen.

## Goal

Add a new, self-contained studio bumper (`#vividexBumper`) that:
- Plays once per page load, for roughly 3–4 seconds
- Shows the Vividex V mark with a continuous breathing cyan-to-blue glow
- Releases 2 irregular, organic "energy whip" bursts (jagged, randomized
  midpoint-displacement paths — not a uniform ring) that flare and dissipate
- Plays the game's existing chain-lightning cast sound on each burst
- Sits above everything else — including `.rotateLock` (`z-index: 999999`),
  which otherwise fully occludes the bumper in portrait — then fades out to
  reveal whatever is underneath (the existing boot splash / title screen /
  rotate prompt, already settled)
- Scales correctly across phone portrait, phone landscape, and tablet
- Respects `prefers-reduced-motion`

## Non-goals

- No changes to `#bootLayoutSplash`, `script-31.js`, or any existing
  boot/UI-state logic. The bumper does not coordinate with them.
- No changes to gameplay, scoring, enemies, or any system in `script-01.js`.
- No skip-on-tap interaction (fixed-duration playback, per approved design).
- No audio.

## Architecture

The bumper is a purely presentational overlay, independent of the game's
existing init pipeline:

- It is **static HTML** present in the initial document (same pattern as
  `#bootLayoutSplash`), so it is visible immediately without waiting on any
  script to run.
- It carries its **own fixed timeline** (fade in → glow → burst → burst →
  fade out → remove) driven by a single new script, with no dependency on
  `script-31.js`'s boot-completion timers.
- Because the bumper's total duration (~3.8s) comfortably exceeds the
  existing boot splash's own hide timer (~1.77s), by the time the bumper
  fades away the existing boot splash has already faded and removed itself
  underneath — no explicit handoff/coordination code is needed. This keeps
  the change additive and isolated from existing, working systems.

```
page load
  ├─ #vividexBumper (new, z-index above everything)   [visible 0 → ~4.0s]
  │    0.0s   inserted, opacity 0
  │    0.0–0.4s  fade in; breathing glow starts (CSS, loops)
  │    ~1.0s  burst #1 (canvas whip-crack, random paths)
  │    ~2.0s  burst #2
  │    ~2.9s  burst #3
  │    ~3.4s  begin fade-out
  │    ~4.0s  removed from DOM
  │
  └─ #bootLayoutSplash (existing, unmodified)          [visible 0 → ~1.77s]
       runs its existing timers exactly as today, invisible under the bumper
```

## Components

**`assets/vividex-splash-v.png`** — new, 600×400, ~29KB. Downscaled/optimized
copy of the source mark (matches the same compression approach used for the
other splash art in `assets/`).

**`index.html`**
- New markup block, inserted immediately before the existing
  `#bootLayoutSplash` div: a container div, the `<img>`, and a `<canvas>` for
  the burst effect.
- New named style block (`#vividex-bumper-style`), following the existing
  convention of one `<style id="...">` block per feature. Sizing uses the
  same `min(46vmin, 380px)` vmin-clamp technique already used for
  `#bootLayoutSplash img` — this is what makes it scale consistently across
  phone portrait, phone landscape, and tablet without new breakpoints, since
  `vmin` tracks whichever viewport dimension is smaller regardless of
  orientation. Breathing-glow keyframes and a fade-out transition class live
  in the same block.

**`scripts/script-50.js`** (next free script number; `script-49.js` is the
current highest)
- Ports the midpoint-displacement whip-burst renderer from the approved
  prototype: canvas overlay, jagged lightning-style paths spawned from random
  points along the V's two strokes, glow via `shadowBlur` + a wide blurred
  underlay pass plus a bright core pass, alpha fade in/out per tendril,
  occasional forked branch.
- Drives the fixed timeline above via `setTimeout`, independent of any other
  script.
- On `prefers-reduced-motion: reduce`: skips the canvas entirely, shows a
  static (non-pulsing) logo for ~0.8s, fades out over ~0.4s, removes itself —
  no forced long hold, no bursts.
- On each burst, best-effort calls `window.__undeadSpellAudio('lightning', false)`
  (from `scripts/script-37.js`) — the same buffered `assets/lightning.mp3`
  played when a player casts chain lightning in-game. Guarded in a `try/catch`
  since the hook may not be defined yet depending on script load timing.
- Registered in `scripts/manifest.txt`.

**Known constraint — audio autoplay.** Browsers (and this game's own audio
manager, `script-37.js:122-123`) require a user gesture before an
`AudioContext` will actually produce sound; `script-37.js` explicitly waits
for a `pointerdown`/`keydown` to "unlock" it. Because the bumper plays
immediately on a cold page load, before any such gesture, the chain-lightning
sound will almost always be silent on a genuine first visit — this is a
browser policy, not a bug, and is not something the bumper's code can
override. It becomes audible once the page's audio has already been
unlocked (e.g. a second load in the same tab after prior interaction). The
call is best-effort and fails silently, consistent with how the rest of the
game's audio already degrades when locked.

**`service-worker.js`**
- `vividex-splash-v.png` added to `APP_SHELL`.
- `CACHE_NAME` bumped with a new descriptive suffix (matching the existing
  `-v3-loudness-normalized`-style naming) so returning/offline players fetch
  the new asset instead of serving a stale cache.

## Error handling / edge cases

- If the image fails to load, the container still occupies space and still
  fades out on schedule — playback never blocks on the image.
- If `requestAnimationFrame`/canvas is unavailable (extremely old browser),
  the breathing glow (pure CSS) and the fade-in/out (pure CSS) still work;
  only the whip bursts are skipped, degrading gracefully.
- The bumper removes itself from the DOM after fade-out (not just
  hidden/opacity:0), matching `#bootLayoutSplash`'s own cleanup pattern, so
  it leaves no lingering full-screen fixed element behind.

## Testing

No build step or test framework exists for this project; verification is
manual, via a locally served static site driven by Playwright (the same
approach already used for the in-flight Ghost-enemy work):

1. `python -m http.server 8934` from the repo root
2. Navigate to `http://localhost:8934/index.html` at three viewport presets:
   phone portrait (390×844), phone landscape (844×390), tablet (820×1180)
3. Screenshot mid-burst (~1.5s after load) at each size
4. Confirm no console errors (`browser_console_messages`, `level: "error"`)
5. Confirm the bumper is gone and the title screen is interactive by ~4s
6. Confirm the best-effort `__undeadSpellAudio('lightning', false)` call on
   each burst does not throw even when the audio context is locked (expected
   on a cold load with no prior user gesture)
