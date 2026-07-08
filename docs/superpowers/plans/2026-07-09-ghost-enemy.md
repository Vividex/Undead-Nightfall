# Ghost Enemy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Ghost enemy that is immune to sword damage (magic-only kill), unlocks one minute after Death Knights, and renders as translucent with a pulsing glow.

**Architecture:** Ghost is a plain data entry in the existing `enemyTypes` array (`scripts/script-01.js`) — no new subsystem. Three independent behaviors plug into three existing choke points: `unlockedEnemyNames()`/`chooseEnemy()` gate when/how often it spawns, `damageEnemy()` gates sword immunity, `drawEnemy()` gates its translucent/glowing look. No new files.

**Tech Stack:** Vanilla JS, HTML5 Canvas, no build step, no bundler, no package.json.

## Global Constraints

- This project has **no automated test framework** (no package.json, no test runner). All verification in this plan is done by serving the static site and driving the live page with a headless browser tool (Playwright's `browser_navigate` / `browser_evaluate` / `browser_take_screenshot` — or equivalent).
- `scripts/script-01.js` is loaded as a plain (non-module) `<script>` tag, so every top-level `function`/`const` in it (`enemyTypes`, `unlockedEnemyNames`, `chooseEnemy`, `damageEnemy`, `drawEnemy`, `game`, `reset`, `swordAttack`, `fireball`) is a `window` global reachable from `page.evaluate`.
- Serve the site before testing: `cd C:\GameForge\Undead-Nightfall && python -m http.server 8934` (background), then navigate to `http://localhost:8934/index.html`. Stop the server after verification (`pkill -f "http.server 8934"` or equivalent).
- Ghost's combat stats mirror Ghoul exactly: `hp:82, atk:12, spd:105, r:19`.
- The `chance` field on `enemyTypes` entries is unused dead data (real spawn weighting lives in `chooseEnemy()`'s `weights` map) — include it only for shape consistency with existing entries, per the design doc.

---

### Task 1: Ghost data entry, unlock timing, spawn weight

**Files:**
- Modify: `scripts/script-01.js:129-134` (`enemyTypes` array)
- Modify: `scripts/script-01.js:147-156` (`unlockedEnemyNames`)
- Modify: `scripts/script-01.js:192-204` (`chooseEnemy`)

**Interfaces:**
- Produces: an `enemyTypes` entry with `name:"Ghost"`, reachable from `unlockedEnemyNames()` once `game.t>=300`, and returnable from `chooseEnemy()` at that point. Task 2 and Task 3 depend on enemy objects carrying `type:"Ghost"` and `ghostly:true`.

- [ ] **Step 1: Add the Ghost entry to `enemyTypes`**

In `scripts/script-01.js`, find:

```js
const enemyTypes=[
 {name:"Skeleton",chance:.52,hp:45,atk:7,spd:80,r:17,body:"#cfc5a8",head:"#ddd2b8"},
 {name:"Ghoul",chance:.26,hp:82,atk:12,spd:105,r:19,body:"#5f9458",head:"#486f43"},
 {name:"Death Knight",chance:.10,hp:185,atk:23,spd:60,r:24,body:"#53495d",head:"#332d3b"},
 {name:"Archer",chance:.12,hp:58,atk:14,spd:78,r:18,body:"#8a7d62",head:"#d9cfb4"}
];
```

Replace with:

```js
const enemyTypes=[
 {name:"Skeleton",chance:.52,hp:45,atk:7,spd:80,r:17,body:"#cfc5a8",head:"#ddd2b8"},
 {name:"Ghoul",chance:.26,hp:82,atk:12,spd:105,r:19,body:"#5f9458",head:"#486f43"},
 {name:"Death Knight",chance:.10,hp:185,atk:23,spd:60,r:24,body:"#53495d",head:"#332d3b"},
 {name:"Archer",chance:.12,hp:58,atk:14,spd:78,r:18,body:"#8a7d62",head:"#d9cfb4"},
 {name:"Ghost",chance:.10,hp:82,atk:12,spd:105,r:19,body:"#cfe8f2",head:"#e8f6fb",ghostly:true}
];
```

- [ ] **Step 2: Gate Ghost's unlock to t>=300**

Find:

```js
function unlockedEnemyNames(){
 const t=game?game.t:0;
 const names=["Skeleton"];
 if(t>=60)names.push("Ghoul");
 if(t>=120)names.push("Archer");
 // Death Knights are deliberately held until 4:00 so the early game stays fair.
 // Boss minutes at 3:00, 6:00 and every 3 minutes after are handled separately.
 if(t>=240)names.push("Death Knight");
 return names;
}
```

Replace with:

```js
function unlockedEnemyNames(){
 const t=game?game.t:0;
 const names=["Skeleton"];
 if(t>=60)names.push("Ghoul");
 if(t>=120)names.push("Archer");
 // Death Knights are deliberately held until 4:00 so the early game stays fair.
 // Boss minutes at 3:00, 6:00 and every 3 minutes after are handled separately.
 if(t>=240)names.push("Death Knight");
 // Ghost is the final regular-enemy introduction, one minute after Death Knight.
 if(t>=300)names.push("Ghost");
 return names;
}
```

- [ ] **Step 3: Add Ghost's spawn weight**

Find:

```js
 const weights={Skeleton:1,Ghoul:.72,Archer:.46,"Death Knight":.24};
```

Replace with:

```js
 const weights={Skeleton:1,Ghoul:.72,Archer:.46,"Death Knight":.24,Ghost:.24};
```

- [ ] **Step 4: Verify via live page — Ghost is absent before t=300, present at/after**

Start the server and navigate:

```bash
cd C:\GameForge\Undead-Nightfall && python -m http.server 8934 &
```

Use the browser tool to navigate to `http://localhost:8934/index.html`, then evaluate:

```js
() => {
  reset();
  game.t = 299;
  const before = unlockedEnemyNames();
  game.t = 300;
  const after = unlockedEnemyNames();
  let sawGhost = false;
  for (let i=0;i<400 && !sawGhost;i++) {
    if (chooseEnemy().name === "Ghost") sawGhost = true;
  }
  return {
    ghostEntryExists: enemyTypes.some(t=>t.name==="Ghost" && t.hp===82 && t.atk===12 && t.spd===105 && t.r===19 && t.ghostly===true),
    beforeIncludesGhost: before.includes("Ghost"),
    afterIncludesGhost: after.includes("Ghost"),
    sawGhostFromChooseEnemy: sawGhost
  };
}
```

Expected: `{ghostEntryExists: true, beforeIncludesGhost: false, afterIncludesGhost: true, sawGhostFromChooseEnemy: true}`.

- [ ] **Step 5: Commit**

```bash
git add scripts/script-01.js
git commit -m "$(cat <<'EOF'
Add Ghost enemy data, unlocking one minute after Death Knight

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Sword immunity (magic-only kill)

**Files:**
- Modify: `scripts/script-01.js:329` (`damageEnemy`)

**Interfaces:**
- Consumes: enemy objects with `type:"Ghost"` from Task 1.
- Produces: `damageEnemy(e,d,src)` now no-ops (returns before any HP change) when `src==="sword"` and `e.type==="Ghost"`. Both `swordAttack()` (script-01.js) and the charged spin attack (`scripts/script-42.js`, which also calls `damageEnemy(e, SPIN_DAMAGE, 'sword')`) route through this one function, so both are covered by this single change.

- [ ] **Step 1: Add the early return**

Find (this is a single long line in the source):

```js
function damageEnemy(e,d,src){if(e.phased)return;const h=game.hero;d*=attackMultiplier();
```

Replace with:

```js
function damageEnemy(e,d,src){if(e.phased)return;if(src==="sword"&&e.type==="Ghost")return;const h=game.hero;d*=attackMultiplier();
```

(Leave the remainder of the line — everything after `d*=attackMultiplier();` — untouched.)

- [ ] **Step 2: Verify via live page — Ghost ignores sword, takes fire/bolt damage; Ghoul unaffected (regression guard)**

With the server still running and the page navigated (or re-navigate if needed), evaluate:

```js
() => {
  reset();
  const ghost = {type:"Ghost", hp:82, maxHp:82, atk:12, r:19, dead:false};
  damageEnemy(ghost, 72, "sword");
  const hpAfterSword = ghost.hp;
  damageEnemy(ghost, 72, "fire");
  const hpAfterFire = ghost.hp;

  const ghoul = {type:"Ghoul", hp:82, maxHp:82, atk:12, r:19, dead:false};
  damageEnemy(ghoul, 72, "sword");
  const ghoulHpAfterSword = ghoul.hp;

  return {
    ghostUnchangedBySword: hpAfterSword === 82,
    ghostDamagedByFire: hpAfterFire < 82,
    ghoulStillDamagedBySword: ghoulHpAfterSword < 82
  };
}
```

Expected: `{ghostUnchangedBySword: true, ghostDamagedByFire: true, ghoulStillDamagedBySword: true}`.

- [ ] **Step 3: Commit**

```bash
git add scripts/script-01.js
git commit -m "$(cat <<'EOF'
Make Ghost immune to sword damage; magic still works

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Translucent, pulsing-glow rendering

**Files:**
- Modify: `scripts/script-01.js:205` (`spawnEnemy`)
- Modify: `scripts/script-01.js:1293-1325` (`drawEnemy`)

**Interfaces:**
- Consumes: `e.ghostly===true` flag from Task 1's `enemyTypes` entry.
- **Important:** `spawnEnemy()` does **not** spread all of `chooseEnemy()`'s fields onto the pushed enemy object — it builds a new object literal listing only `type,x,y,r,hp,maxHp,atk,spd,body,head,cd,slow,hit`. `ghostly` must be added to that list explicitly, or real spawned Ghosts will never carry the flag and the glow code will silently never fire in actual gameplay (it would only appear to work on hand-built test objects). This is Step 1 below.

- [ ] **Step 1: Carry the `ghostly` flag through `spawnEnemy()`**

Find:

```js
function spawnEnemy(){let m=120,side=(Math.random()*4)|0,x,y,c=game.cam;if(side===0){x=c.x-m;y=c.y+Math.random()*H}else if(side===1){x=c.x+W+m;y=c.y+Math.random()*H}else if(side===2){x=c.x+Math.random()*W;y=c.y-m}else{x=c.x+Math.random()*W;y=c.y+H+m}x=Math.max(30,Math.min(world.w-30,x));y=Math.max(30,Math.min(world.h-30,y));const t=chooseEnemy();game.enemies.push({type:t.name,x,y,r:t.r,hp:t.hp,maxHp:t.hp,atk:t.atk,spd:t.spd,body:t.body,head:t.head,cd:0,slow:0,hit:0})}
```

Replace with:

```js
function spawnEnemy(){let m=120,side=(Math.random()*4)|0,x,y,c=game.cam;if(side===0){x=c.x-m;y=c.y+Math.random()*H}else if(side===1){x=c.x+W+m;y=c.y+Math.random()*H}else if(side===2){x=c.x+Math.random()*W;y=c.y-m}else{x=c.x+Math.random()*W;y=c.y+H+m}x=Math.max(30,Math.min(world.w-30,x));y=Math.max(30,Math.min(world.h-30,y));const t=chooseEnemy();game.enemies.push({type:t.name,x,y,r:t.r,hp:t.hp,maxHp:t.hp,atk:t.atk,spd:t.spd,body:t.body,head:t.head,cd:0,slow:0,hit:0,ghostly:t.ghostly})}
```

(`t.ghostly` is `undefined` for every non-Ghost type, which is falsy and harmless wherever `e.ghostly` is checked.)

- [ ] **Step 2: Verify via live page — a Ghost spawned through the real pipeline carries `ghostly:true`**

Start the server and navigate (if not already running from Task 1/2):

```bash
cd C:\GameForge\Undead-Nightfall && python -m http.server 8934 &
```

Navigate to `http://localhost:8934/index.html`, then evaluate:

```js
() => {
  reset();
  game.t = 300;
  let ghost = null;
  for (let i=0;i<500 && !ghost;i++){
    spawnEnemy();
    ghost = game.enemies.find(e=>e.type==="Ghost");
  }
  return {found: !!ghost, ghostly: ghost && ghost.ghostly === true};
}
```

Expected: `{found: true, ghostly: true}`.

- [ ] **Step 3: Wrap the body/head fills with a ghostly glow**

Find:

```js
 ctx.fillStyle=hit?"#fff":e.body;ctx.beginPath();ctx.ellipse(0,2,e.r*.72,e.r*1.05,0,0,6.283);ctx.fill();
 if(e.type==="Skeleton"){ctx.strokeStyle="#514834";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-8,0);ctx.lineTo(8,0);ctx.moveTo(-7,6);ctx.lineTo(7,6);ctx.moveTo(-6,12);ctx.lineTo(6,12);ctx.stroke()}
 if(e.type==="Archer"){ctx.save();ctx.rotate(aim);ctx.strokeStyle="#6b4a24";ctx.lineWidth=3;ctx.beginPath();ctx.arc(18,0,10,-1.1,1.1);ctx.stroke();ctx.strokeStyle="#d8d8d8";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(18,0);ctx.lineTo(34,0);ctx.stroke();ctx.restore();}
 if(e.type==="Death Knight"){ctx.fillStyle="#292530";ctx.fillRect(-13,-10,26,25);ctx.strokeStyle="#9b895f";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-11,-7);ctx.lineTo(11,15);ctx.moveTo(11,-7);ctx.lineTo(-11,15);ctx.stroke()}
 ctx.fillStyle=hit?"#fff":e.head;ctx.beginPath();ctx.ellipse(0,-e.r*.92,e.r*.58,e.r*.56,0,0,6.283);ctx.fill();
 ctx.fillStyle=e.type==="Death Knight"?"#e24444":"#14110e";ctx.beginPath();ctx.arc(4,-e.r*.98,2,0,6.283);ctx.arc(-3,-e.r*.98,1.8,0,6.283);ctx.fill();
```

Replace with:

```js
 if(e.ghostly){ctx.save();ctx.globalAlpha=.62;ctx.shadowColor="#aeeaff";ctx.shadowBlur=10+4*Math.sin(game.t*3);}
 ctx.fillStyle=hit?"#fff":e.body;ctx.beginPath();ctx.ellipse(0,2,e.r*.72,e.r*1.05,0,0,6.283);ctx.fill();
 if(e.type==="Skeleton"){ctx.strokeStyle="#514834";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-8,0);ctx.lineTo(8,0);ctx.moveTo(-7,6);ctx.lineTo(7,6);ctx.moveTo(-6,12);ctx.lineTo(6,12);ctx.stroke()}
 if(e.type==="Archer"){ctx.save();ctx.rotate(aim);ctx.strokeStyle="#6b4a24";ctx.lineWidth=3;ctx.beginPath();ctx.arc(18,0,10,-1.1,1.1);ctx.stroke();ctx.strokeStyle="#d8d8d8";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(18,0);ctx.lineTo(34,0);ctx.stroke();ctx.restore();}
 if(e.type==="Death Knight"){ctx.fillStyle="#292530";ctx.fillRect(-13,-10,26,25);ctx.strokeStyle="#9b895f";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-11,-7);ctx.lineTo(11,15);ctx.moveTo(11,-7);ctx.lineTo(-11,15);ctx.stroke()}
 ctx.fillStyle=hit?"#fff":e.head;ctx.beginPath();ctx.ellipse(0,-e.r*.92,e.r*.58,e.r*.56,0,0,6.283);ctx.fill();
 if(e.ghostly){ctx.restore();}
 ctx.fillStyle=e.type==="Death Knight"?"#e24444":"#14110e";ctx.beginPath();ctx.arc(4,-e.r*.98,2,0,6.283);ctx.arc(-3,-e.r*.98,1.8,0,6.283);ctx.fill();
```

(`ctx.save()`/`ctx.restore()` scopes `globalAlpha` and `shadowBlur`/`shadowColor` to just the body+head fills, so the glow can't bleed into the eyes, health bar, or any other enemy's draw call.)

- [ ] **Step 4: Verify via live page — Ghost renders without errors and looks visually distinct**

With the server running, navigate to `http://localhost:8934/index.html`, then evaluate to force a visible Ghost next to the hero:

```js
() => {
  reset();
  const h = game.hero;
  game.enemies.push({type:"Ghost", x:h.x+60, y:h.y, r:19, hp:82, maxHp:82, atk:12, spd:0, body:"#cfe8f2", head:"#e8f6fb", ghostly:true, cd:0, slow:0, hit:0});
  return "spawned";
}
```

Take a screenshot (`browser_take_screenshot`) and read the resulting image file. Confirm:
- The Ghost is visibly translucent/paler than a normal Skeleton/Ghoul on screen.
- A soft cyan glow is visible around its body/head.
- No console errors appear (`browser_console_messages` with `level: "error"`).

Then stop the server: `pkill -f "http.server 8934"` (or equivalent for your shell).

- [ ] **Step 5: Commit**

```bash
git add scripts/script-01.js
git commit -m "$(cat <<'EOF'
Give Ghost a translucent, pulsing-glow appearance

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```
