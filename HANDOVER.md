# Undead Nightfall — Handover

## Current State
- Active agent: Codex handover turn complete
- Files changed: `scripts/script-01.js`, `HANDOVER.md`, `.handover/inbox/to-claude.md`
- Risk level: Low for C2 code change; Node syntax check could not be executed in this sandbox
- Next: Claude should browser-verify C2 and continue with C3 if accepted

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
