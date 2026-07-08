# Ghost Enemy — Design

## Summary
Add a new regular (non-boss) enemy, **Ghost**, that is immune to sword damage (including the charged spin attack) and can only be killed with magic (fireball, lightning). It is the final regular-enemy introduction, unlocking one minute after Death Knights.

## Stats
Reuses Ghoul's combat stats as baseline, with a distinct palette:

```js
{name:"Ghost", chance:.10, hp:82, atk:12, spd:105, r:19, body:"#cfe8f2", head:"#e8f6fb", ghostly:true}
```

Added to the `enemyTypes` array in `scripts/script-01.js`.

Note: the `chance` field on `enemyTypes` entries is unused dead data — actual spawn frequency comes from the separate weights map in `chooseEnemy()` (see Spawn frequency below). It's included here only to match the existing entries' shape; its value has no effect on behavior.

## Unlock timing
`unlockedEnemyNames()` (script-01.js) currently unlocks:
- Skeleton: t≥0
- Ghoul: t≥60
- Archer: t≥120
- Death Knight: t≥240

Add: `if(t>=300)names.push("Ghost")` — one minute after Death Knight, making Ghost the last regular creature introduced (boss introductions are handled separately and are out of scope here).

## Spawn frequency
`chooseEnemy()`'s weights map currently has `{Skeleton:1, Ghoul:.72, Archer:.46, "Death Knight":.24}`. Add `Ghost:.24` — same rarity as Death Knight.

## Sword immunity
In `damageEnemy(e,d,src)` (script-01.js), add an early return when `src==="sword"` and `e.type==="Ghost"`, before any HP subtraction or kill logic. This is the single choke point both the normal `swordAttack()` swing and the charged spin attack (script-42.js, which also passes `src:"sword"`) funnel through, so both are covered without duplicating logic.

Fire (`fireball()`, `src:"fire"`) and lightning (`lightning()`, `src:"bolt"`) are untouched — both continue to work normally against Ghosts.

No visual/audio feedback is added for a blocked sword swing — a Ghost's health bar simply doesn't move. The player is expected to infer immunity from that.

## Behavior / AI
No special ability or movement pattern. Ghost falls through to the same generic chase-and-melee branch every other non-Archer, non-boss enemy already uses. No new code path in the enemy-update loop.

## Rendering
`drawEnemy()` (script-01.js) reuses the existing Skeleton/Ghoul-style body+head+limb draw path — no custom shape or animation. For enemies with `e.ghostly===true`:
- **Translucency:** reduce `ctx.globalAlpha` to ~0.62 on the body/head fills to read as ghostly.
- **Pulsing glow:** before those fills, set `ctx.shadowColor="#aeeaff"` and `ctx.shadowBlur = 10 + 4*Math.sin(game.t*3)` (same sine-pulse technique already used for the boss aura ring), then reset `ctx.shadowBlur=0` immediately after so the glow doesn't bleed into the health bar or other draw calls.

## Out of scope
- No changes to boss spawning/rotation.
- No new sound effects.
- No changes to drop tables — Ghosts drop items through the existing non-boss kill path unchanged.
