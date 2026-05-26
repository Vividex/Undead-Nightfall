# Undead Nightfall — Handover

## Current State
- Active agent: Codex
- Files changed: `scripts/script-01.js`
- Risk level: High
- Next: Claude to verify, then Bone Dragon

---

## Files Inspected
| File | Notes |
|------|-------|
| `index.html` | Full HTML shell + all CSS in named `<style>` blocks. 2155 lines. Title video background, gothic UI, portrait/landscape media queries, pause menu, boot splash, attack buttons, HUD bars, joystick, leaderboard overlay. |
| `scripts/manifest.txt` | 48-entry index mapping script numbers to named tags |
| `scripts/script-01.js` | Core game engine: canvas setup, enemy/boss definitions, hero stats, all attack logic, scoring, drop system, rendering loop |
| `scripts/script-02.js` | Title panel toggle helpers (`toggleTitlePanel`, `resetTitleControls`) |
| `agents.md` | Collaboration rules for Claude + Codex |

## Files Changed
| File | Change | Agent | Date |
|------|--------|-------|------|
| `agents.md` | Created — collaboration guide and workflow rules | Claude | 2026-05-26 |
| `HANDOVER.md` | Updated — Ashenveil Twins implementation and verification summary | Codex | 2026-05-26 |

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
- **Bosses**: Every 3 minutes, cycle of 3 types; boss kill = level up
- **Drops**: HP/MP potions + Speed/Attack/God buffs; 20% drop chance on regular kill
- **Scoring**: Time + kills + bosses + level + combo + streak + survival bonus
- **Leaderboard**: Supabase (URL in `script-06.js`)

### Wraith Lord Changes
- Added boss key `wraith` to `bossTypes[]`
- Added `shadowOrbs:[]` to reset state
- Added phase immunity in `damageEnemy()`
- Added Wraith Lord phase logic, shadow orb updates, and render support in the main update loop and draw path
- Suppressed Wraith Lord arrow firing
- Removed redundant `globalAlpha` write in `drawWraithLord()`

### Necromancer Changes
- Added boss key `necromancer` to `bossTypes[]`
- Added Necromancer summon behavior in the boss update block
- Added a dedicated Necromancer draw function
- Wired the Necromancer into the boss render branch
- Suppressed the shared boss arrow-shot path for Necromancer
- Reworked the Necromancer behavior block to use range control, timed summons, and a dedicated projectile attack

### Plague Harbinger Changes
- Added boss key `plague` to `bossTypes[]`
- Added `poisonPools:[]` to reset state
- Added poison pool update and damage logic
- Suppressed Plague Harbinger arrow firing
- Added a dedicated Plague Harbinger draw function
- Rendered poison pools in the ground layer before entities
- Fixed Plague Harbinger behavior block to use the correct boss key

### Ashenveil Twins Changes
- Added boss key `twins` to `bossTypes[]`
- Replaced `spawnBoss()` with twin-aware spawning
- Added twin enrage behavior in `damageEnemy()`
- Added twin behavior block in the boss update loop
- Added `drawFrostTwin()` and `drawAshTwin()`
- Wired the twin render paths into `drawEnemy()`

### CSS Architecture Notes
- Multiple conflicting button-size patches exist in `index.html` (IDs: `attack-buttons-*`) — the last one in document order wins due to equal specificity + `!important`
- Portrait mode hides `#game` and shows `.rotateLock` — game is landscape-only

---

## Tests Performed
- `node --check scripts/script-01.js`

---

## Risk Level
**High** — modified `spawnBoss()` and `damageEnemy()`, plus two new boss entities sharing state

---

## Next Recommended Action
Claude to verify, then Bone Dragon.
