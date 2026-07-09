# Undead Nightfall — Handover

## Current State
- Active agent: Claude (this turn) — Vividex studio splash bumper feature, complete
- Files changed this turn: `index.html`, `scripts/script-50.js` (new), `service-worker.js`, `scripts/manifest.txt`, `assets/vividex-splash-v.png` (new), `agents.md`, `docs/superpowers/specs/2026-07-09-vividex-splash-bumper-design.md` (new), `docs/superpowers/plans/2026-07-09-vividex-splash-bumper.md` (new)
- Risk level: Low — purely additive overlay, no gameplay/script-01.js changes; browser-verified (see below)
- Next: none required; feature is done. Unrelated to this: the Ghost-enemy
  handover thread below (C1/C2/C3) was already complete before this turn and
  was not touched.

---

## Vividex Splash Bumper — Claude, 2026-07-09

### Context
User (Vividex, the studio) approved an animated version of their blue "V"
mark via an iterative HTML/CSS/canvas prototype (built in a separate repo),
then asked for it to be adapted for mobile/tablet and wired into Undead
Nightfall as a studio bumper that plays once before the game's existing boot
splash/title screen. Design: `docs/superpowers/specs/2026-07-09-vividex-splash-bumper-design.md`.
Plan: `docs/superpowers/plans/2026-07-09-vividex-splash-bumper.md`.

### Files Inspected
| File | Notes |
|------|-------|
| `agents.md` | Collaboration rules; followed the explicit-approval / state-what-you're-modifying / git-status-before-and-after conventions throughout |
| `index.html` | Found `#bootLayoutSplash` (boot layout-mask overlay, amber gothic theme, ~1.77s), `.rotateLock` (`z-index: 999999`, portrait-only prompt) |
| `scripts/script-31.js` | Existing boot-splash timing logic; left untouched, bumper doesn't coordinate with it |
| `scripts/script-37.js` | Spell audio manager; `window.__undeadSpellAudio('lightning', false)` plays `assets/lightning.mp3`; confirmed it requires a prior user gesture to unlock (`pointerdown`/`keydown` listener, line 122-123) |
| `service-worker.js` | Network-first fetch with cache fallback; `APP_SHELL` precache list; versioned `CACHE_NAME` |
| `scripts/manifest.txt` | Noticed `script-48.js`/`script-49.js` exist on disk but aren't registered here (pre-existing gap, not touched — out of scope for this task) |

### Files Changed
| File | Change |
|------|--------|
| `assets/vividex-splash-v.png` | New, 600×400, ~29KB — optimized copy of the Vividex mark |
| `index.html` | New `#vividexBumper` markup (before `#bootLayoutSplash`), new `#vividex-bumper-style` block, new `<script src="scripts/script-50.js">` tag |
| `scripts/script-50.js` | New — canvas whip-burst renderer (midpoint-displacement lightning paths from random points along the V's strokes), breathing-glow CSS hook, 3-flash timeline (1.0s/2.0s/2.9s), fade out 3.4s→4.0s, reduced-motion fallback, best-effort chain-lightning SFX per flash |
| `service-worker.js` | `CACHE_NAME` bumped to `-v4-vividex-bumper`; new asset added to `APP_SHELL` |
| `scripts/manifest.txt` | Added `50 \| vividex-splash-bumper \| (function(){` |
| `agents.md` | Change Log entry prepended |

### Summary of Findings / Bugs Caught During Verification
Two real bugs were found and fixed via live Playwright verification (not
just code review):
1. **Canvas/image coordinate mismatch** ("lightning from nowhere") — the
   canvas's pixel buffer was sized to the full-screen `#vividexBumper` while
   its actual on-screen box is the smaller `.vividexBumperInner`, so whip
   origins computed relative to the image were drawn into the wrong
   scale/position. Fixed by sizing the canvas buffer and computing image
   coordinates against the same element (`.vividexBumperInner`).
2. **Opacity clobbered on every flash** ("the V faded out") — `.vividexFlash`
   replaced the entire `animation` shorthand, dropping the fade-in animation
   from the list; since nothing else held opacity at 1, the mark snapped
   back to its base `opacity: 0` on every burst. Fixed by moving
   opacity/transform to a plain `.vividexVisible` class + CSS transition,
   fully decoupled from the `animation` shorthand used for breathe/flash.
3. **z-index** — `.rotateLock` uses `z-index: 999999` and fully occludes
   anything below it in portrait. Bumper's z-index raised to `1000000` so it
   still shows before the rotate prompt.

### Known constraint (not a bug)
The chain-lightning SFX call is best-effort: browsers (and this game's own
audio manager) block audio until a user gesture unlocks the `AudioContext`,
so the sound will not be audible on a genuine cold first load — only once
the page's audio has already been unlocked in that tab. Documented in the
design doc; no code can override this.

### Tests Performed
- Served locally (`python -m http.server 8934`), driven with Playwright.
- Verified at phone portrait (390×844), phone landscape (844×390), and
  tablet portrait (820×1180): mark renders centered/sized correctly via
  `min(46vmin, 380px)`, sits above `.rotateLock`, whip bursts render as
  jagged/organic paths originating from the V's edges, mark stays visible
  (no opacity drop) through flashes.
- Confirmed `#vividexBumper` is removed from the DOM after the timeline
  completes and the underlying screen (rotate prompt or title) is reachable.
- Console check at each viewport: zero errors attributable to this change
  (only a pre-existing, unrelated `favicon.ico` 404).
- Confirmed via `git log`/`git diff --stat` that this turn's changes don't
  touch `scripts/script-01.js`, so the two fixes shipped just before this
  turn (sword-spin-stuck fix `e12a1ef`, enemy-separation spatial-grid fix
  `3d0124c`) are untouched and intact.

### Risk Level
**Low.** Purely additive: new file, new asset, new isolated overlay +
script, small edits to `service-worker.js`/`manifest.txt`. No gameplay code
touched. Verified live in-browser at three viewport sizes with no console
errors.

### Next Recommended Action
None required for this feature. If picking this up again: the only
un-verified path is the `prefers-reduced-motion: reduce` branch (not
practical to force via Playwright without CDP emulation) — a quick manual
check with an OS-level "reduce motion" setting would close that out, but the
code path is small and isolated (early return, static fade, no canvas).

---

## Files Inspected
| File | Notes |
|------|-------|
| `.handover/inbox/to-codex.md` | Turn instruction: implement C2 only for Ghost sword immunity in `damageEnemy()`. |
| `.handover/spec.md` | Full Ghost enemy plan and checklist used as context only. |
| `docs/superpowers/plans/2026-07-09-ghost-enemy.md` | Authoritative exact snippets for Task 1 and Task 2. |
| `index.html` | Full HTML shell + all CSS in named `<style>` blocks. 2155 lines. Title video background, gothic UI, portrait/landscape media queries, pause menu, boot splash, attack buttons, HUD bars, joystick, leaderboard overlay. |
| `scripts/manifest.txt` | 48-entry index mapping script numbers to named tags |
| `scripts/script-01.js` | Core game engine: canvas setup, enemy/boss definitions, hero stats, all attack logic, scoring, drop system, rendering loop |
| `scripts/script-02.js` | Title panel toggle helpers (`toggleTitlePanel`, `resetTitleControls`) |
| `agents.md` | Collaboration rules for Claude + Codex |

## Files Changed
| File | Change | Agent | Date |
|------|--------|-------|------|
| `scripts/script-01.js` | Made Ghost enemies return early from `damageEnemy()` when source is `"sword"` for C2. | Codex | 2026-07-09 |
| `.handover/inbox/to-claude.md` | Wrote handover report for C2. | Codex | 2026-07-09 |
| `HANDOVER.md` | Updated after C2 handover turn. | Codex | 2026-07-09 |
| `scripts/script-01.js` | Added Ghost regular-enemy data entry, unlock at `t>=300`, and spawn weight `.24` for C1. | Codex | 2026-07-09 |
| `.handover/inbox/to-claude.md` | Wrote handover report for C1. | Codex | 2026-07-09 |
| `HANDOVER.md` | Updated after C1 handover turn. | Codex | 2026-07-09 |
| `agents.md` | Created — collaboration guide and workflow rules | Claude | 2026-05-26 |
| `scripts/script-01.js` | Added Wraith Lord, Necromancer, Plague Harbinger, Ashenveil Twins, Bone Dragon bosses | Claude + Codex | 2026-05-26 |
| `HANDOVER.md` | Updated — all 5 bosses complete | Claude | 2026-05-26 |

---

## Summary of Findings

### Architecture
- All game logic lives in `script-01.js` (the largest and most critical file)
- Scripts load in numbered order; load order matters — do not reorder
- New scripts should be added as `script-50.js`, `script-51.js`, etc. and registered in `manifest.txt`
- CSS patches are stacked as sequential named `<style id="...">` blocks in `index.html` — some override earlier rules with `!important`

### Key Systems (script-01.js)
- **World**: 3800×3800, camera follows hero
- **Hero**: HP 165, MP 170, Speed 255, scales +5% per level
- **Attacks**: Sword (melee arc), Fireball (projectile, 3 MP), Lightning (chain 8 targets, 28 MP)
- **Berserk**: 25 consecutive sword kills → 15s spin mode
- **Enemies**: Skeleton → Ghoul → Archer → Death Knight, unlocked by elapsed time
- **Bosses**: Every 3 minutes, cycle of 8 types; boss kill = level up
- **Drops**: HP/MP potions + Speed/Attack/God buffs; 20% drop chance on regular kill
- **Scoring**: Time + kills + bosses + level + combo + streak + survival bonus
- **Leaderboard**: Supabase (URL in `script-06.js`)
- **Draw pipeline**: `draw()` applies global `ctx.translate(-cam.x,-cam.y)`; `drawEnemy()` applies `ctx.translate(e.x,e.y)` — boss draw functions draw at local origin

### Ghost Enemy C1
- `enemyTypes` now includes `{name:"Ghost",chance:.10,hp:82,atk:12,spd:105,r:19,body:"#cfe8f2",head:"#e8f6fb",ghostly:true}`.
- `unlockedEnemyNames()` now pushes `"Ghost"` at `t>=300`, one minute after Death Knight.
- `chooseEnemy()` weights map now includes `Ghost:.24`.
- `spawnEnemy()` and `drawEnemy()` were intentionally not changed for this C2 turn.

### Ghost Enemy C2
- `damageEnemy(e,d,src)` now returns before HP changes when `src==="sword"` and `e.type==="Ghost"`.
- Fire and bolt sources still follow the existing damage path.
- Other enemy types still follow the existing sword damage path.

### Boss System Architecture
- `bossTypes[]` at line 136 — 8 entries (bone, lich, warlord, wraith, necromancer, plague, twins, dragon)
- `spawnBoss()` at line 207 — twin-aware; checks `t.twin` flag, spawns two entities, early `return`
- `damageEnemy()` at line 328 — `if(e.phased)return` at top; twin enrage trigger in boss death block
- Boss update chain (inside `for(const e of game.enemies)` loop):
  - `if(e.bossKey==="wraith")` — phase timer, teleport, shadow orbs; `continue` when phased
  - `else if(e.bossKey==="necromancer")` — range-keep 340–440px, summon 3 near hero every 12s, necrotic bolt every 2.8s; `continue`
  - `else if(e.bossKey==="plague")` — poison pool every 4s; falls through to shared movement
  - `else if(e.bossKey==="twins")` — speed×1.4 enraged, 1→3 spread shots, melee CD 1.15→0.7s; `continue`
  - `else if(e.bossKey==="dragon")` — charge 3× speed every 8s for 1.5s, breath 5-shot cone every 3s; `continue`
  - Shared code (bosses without `continue`): movement, arrow fire (suppressed for wraith/necromancer/plague)
- Arrow suppression line (line 858): `if(e.bossKey!=="wraith"&&e.bossKey!=="necromancer"&&e.bossKey!=="plague"&&...)`
- Global state arrays: `shadowOrbs:[]` (Wraith Lord), `poisonPools:[]` (Plague Harbinger)

### Wraith Lord
- Phase immunity in `damageEnemy()`, teleport + shadow orbs on phase trigger, 2s invulnerable window

### Necromancer
- Range-keeping at 340–440px from hero; summons 3 random enemies near hero every 12s; necrotic bolt every 2.8s

### Plague Harbinger
- Drops poison pools (r=52, 8 HP/tick, 12s life) every 4s; uses shared direct movement

### Ashenveil Twins
- Two bosses spawned simultaneously (Frost + Ash) with shared `twinId`; surviving twin enrages on partner death; enraged: speed×1.4, 3-shot spread, faster cooldowns

### Bone Dragon
- Charges at 3× speed toward hero every 8s for 1.5s; breath: 5-projectile cone every 3s; largest boss (r=72, HP 1400)

### CSS Architecture Notes
- Multiple conflicting button-size patches exist in `index.html` (IDs: `attack-buttons-*`) — the last one in document order wins due to equal specificity + `!important`
- Portrait mode hides `#game` and shows `.rotateLock` — game is landscape-only

---

## Tests Performed
- `node --check scripts/script-01.js` — passed during prior work; not runnable in this C2 sandbox turn.
- `node -e "require('fs').readFileSync('scripts/script-01.js','utf8').length"` — attempted, but the sandbox failed to start Node with `CreateProcessAsUserW failed: 5`.
- `node --check scripts/script-01.js` — attempted, but the sandbox failed to start Node with `CreateProcessAsUserW failed: 5`.
- `git diff -- scripts/script-01.js` — confirmed only the C2 early return was added to `damageEnemy()`.

---

## Risk Level
**Low/Medium** — C2 is a small early-return change, but Node syntax checks could not be executed in this sandbox; no browser verification performed by Codex.

---

## Next Recommended Action
Run the Task 2 browser verification from `docs/superpowers/plans/2026-07-09-ghost-enemy.md`, then continue with C3 if C2 is accepted.

## Known Codex Risks
- Codex sometimes attaches new boss behavior to the wrong `bossKey` — always grep for the new key after implementation
- Codex sometimes clobbers adjacent `else if` blocks when inserting new ones — read the full boss chain after each implementation
- Codex sometimes reports completion without making changes — verify with grep before proceeding
