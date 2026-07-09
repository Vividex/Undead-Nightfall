# Task: Add Ghost enemy (sword-immune, magic-only, translucent glow)

## Context
Undead Nightfall is a vanilla-JS/HTML5-canvas survivor-style game with **no build step and no automated test framework** (no package.json, no test runner). All game logic lives in `scripts/script-01.js`, loaded as a plain non-module `<script>` tag, so every top-level `function`/`const` in it (`enemyTypes`, `unlockedEnemyNames`, `chooseEnemy`, `damageEnemy`, `drawEnemy`, `spawnEnemy`, `game`, `reset`, `swordAttack`) is a `window` global reachable from a headless-browser `page.evaluate`. There is no way to "run a test suite" here — verification means serving the static site (`python -m http.server 8934` from the repo root, then `http://localhost:8934/index.html`) and driving the live page with a headless browser tool (e.g. Playwright's `browser_navigate`/`browser_evaluate`/`browser_take_screenshot`).

Full design and step-by-step code diffs already exist:
- Design: `docs/superpowers/specs/2026-07-09-ghost-enemy-design.md`
- Plan (authoritative — follow its exact find/replace snippets): `docs/superpowers/plans/2026-07-09-ghost-enemy.md`

The plan's Task 1/2/3 map directly to the checklist items below (same file locations, same code). Follow the plan's exact "Find" / "Replace with" snippets — don't improvise different code.

**Known gotcha already caught during planning:** `spawnEnemy()` (script-01.js:205) builds its pushed enemy object from an explicit field list (`type,x,y,r,hp,maxHp,atk,spd,body,head,cd,slow,hit`) — it does **not** spread all of `chooseEnemy()`'s fields. `ghostly:t.ghostly` must be added to that list explicitly (see plan Task 3, Step 1), or real spawned Ghosts will never carry the flag and the glow render code will silently never fire in actual gameplay.

## Acceptance checklist
- [x] C1: Ghost added to `enemyTypes` (hp:82, atk:12, spd:105, r:19, body:"#cfe8f2", head:"#e8f6fb", ghostly:true), unlocked in `unlockedEnemyNames()` at `t>=300` (one minute after Death Knight's `t>=240`), and given weight `.24` in `chooseEnemy()`'s weights map. (Plan Task 1.)
- [x] C2: `damageEnemy(e,d,src)` no-ops (returns before any HP change) when `src==="sword"` and `e.type==="Ghost"`; fire/bolt damage sources are unaffected; other enemy types (e.g. Ghoul) still take sword damage as before. (Plan Task 2.)
- [ ] C3: `spawnEnemy()` carries `ghostly:t.ghostly` onto spawned enemy objects, and `drawEnemy()` renders any `e.ghostly===true` enemy with `globalAlpha≈.62` and a pulsing cyan glow (`shadowColor="#aeeaff"`, `shadowBlur=10+4*Math.sin(game.t*3)`) scoped via `ctx.save()`/`ctx.restore()` around just the body+head fills. (Plan Task 3.)

## Verification
For each item, use the exact `page.evaluate` scripts already written in `docs/superpowers/plans/2026-07-09-ghost-enemy.md` (Task 1 Step 4, Task 2 Step 2, Task 3 Steps 2 and 4) against the locally served page. Report the exact returned object for each. For C3's rendering check, also take a screenshot and confirm no console errors (`browser_console_messages`, `level: "error"`).

## Out of scope
- No changes to boss spawning/rotation or any boss type.
- No new sound effects or visual feedback when a sword swing is blocked by Ghost immunity (health bar simply doesn't move — this was an explicit user decision).
- No changes to drop tables — Ghosts drop items through the existing non-boss kill path unchanged.
- No custom Ghost silhouette/animation (no legs removed, no bob/sway) — reuse the existing Skeleton/Ghoul-style body+head+limb draw path exactly, per the approved design.
