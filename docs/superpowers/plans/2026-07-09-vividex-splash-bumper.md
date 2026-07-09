# Plan: Vividex studio splash bumper

Design: `docs/superpowers/specs/2026-07-09-vividex-splash-bumper-design.md`

No build step, no test framework. Verify by serving the repo root
(`python -m http.server 8934`) and driving `http://localhost:8934/index.html`
with Playwright at phone-portrait (390×844), phone-landscape (844×390), and
tablet (820×1180) viewports.

## Task 1 — Asset

**Status:** done (`assets/vividex-splash-v.png`, 600×400, ~29KB, created
before this plan was written).

## Task 2 — Markup

File: `index.html`

**Find** (immediately before the existing boot splash div):
```html
<div id="bootLayoutSplash" aria-hidden="true">
  <img src="./assets/bootLayoutSplash.png" alt="">
  <div class="bootText">UNDEAD NIGHTFALL</div>
</div>
```

**Replace with:**
```html
<div id="vividexBumper" aria-hidden="true">
  <div class="vividexBumperInner">
    <img id="vividexBumperImg" src="./assets/vividex-splash-v.png" alt="">
    <canvas id="vividexBumperFx"></canvas>
  </div>
</div>


<div id="bootLayoutSplash" aria-hidden="true">
  <img src="./assets/bootLayoutSplash.png" alt="">
  <div class="bootText">UNDEAD NIGHTFALL</div>
</div>
```

## Task 3 — Styles

File: `index.html`

**Find** (the boot-splash style block's opening):
```html
<style id="boot-splash-layout-wait-patch">
```

**Insert immediately before it:**
```html
<style id="vividex-bumper-style">
#vividexBumper {
  position: fixed;
  inset: 0;
  z-index: 1000000;
  background: #05070b;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 1;
  transition: opacity .6s ease;
  pointer-events: none;
}

#vividexBumper.vividexHide {
  opacity: 0;
}

.vividexBumperInner {
  position: relative;
  width: min(90vmin, 640px);
  aspect-ratio: 3 / 2;
  display: flex;
  align-items: center;
  justify-content: center;
}

#vividexBumperImg {
  position: relative;
  width: min(46vmin, 380px);
  height: auto;
  z-index: 2;
  opacity: 0;
  transform: scale(.92);
  transition: opacity .5s ease, transform .5s ease;
  animation: vividexBreathe 3.6s ease-in-out .5s infinite;
}

/* Opacity/transform live on this class (plain properties + transition), kept
   deliberately separate from the `animation` shorthand below — swapping which
   keyframe animations are active (breathe vs. flash) must never affect
   whether the mark is visible. */
#vividexBumperImg.vividexVisible {
  opacity: 1;
  transform: scale(1);
}

#vividexBumperImg.vividexFlash {
  animation: vividexBreathe 3.6s ease-in-out infinite, vividexFlash .32s ease-out;
}

@keyframes vividexBreathe {
  0%, 100% {
    filter: drop-shadow(0 0 6px rgba(120,210,255,.45)) drop-shadow(0 0 22px rgba(47,125,255,.35));
  }
  50% {
    filter: drop-shadow(0 0 12px rgba(150,225,255,.85)) drop-shadow(0 0 42px rgba(60,140,255,.65));
  }
}

@keyframes vividexFlash {
  0% { filter: brightness(1) drop-shadow(0 0 10px rgba(150,225,255,.7)) drop-shadow(0 0 30px rgba(60,140,255,.5)); }
  35% { filter: brightness(1.55) drop-shadow(0 0 20px rgba(200,240,255,1)) drop-shadow(0 0 70px rgba(90,170,255,.9)); }
  100% { filter: brightness(1) drop-shadow(0 0 10px rgba(150,225,255,.7)) drop-shadow(0 0 30px rgba(60,140,255,.5)); }
}

#vividexBumperFx {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 3;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  #vividexBumperImg {
    animation: none !important;
  }
}
</style>


```

## Task 4 — Script

New file: `scripts/script-50.js`. Full contents:

```js
// source: vividex-splash-bumper
(function(){
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var bumper = document.getElementById('vividexBumper');
  var img = document.getElementById('vividexBumperImg');
  var canvas = document.getElementById('vividexBumperFx');
  if (!bumper || !img || !canvas) return;

  function removeBumper(){
    try { bumper.remove(); } catch(e) {}
  }

  // Double rAF so the initial opacity:0/scale(.92) actually paints before we
  // flip to the visible state — otherwise the browser can coalesce both
  // states into one frame and skip the transition entirely.
  function revealImg(){
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        img.classList.add('vividexVisible');
      });
    });
  }

  if (reduceMotion) {
    revealImg();
    setTimeout(function(){
      bumper.classList.add('vividexHide');
      setTimeout(removeBumper, 450);
    }, 800);
    return;
  }

  revealImg();

  var inner = bumper.querySelector('.vividexBumperInner');
  var ctx = canvas.getContext('2d');
  var dpr = Math.max(1, window.devicePixelRatio || 1);
  var tendrils = [];

  function resize(){
    // Canvas's on-screen box is .vividexBumperInner (not the full-screen
    // #vividexBumper), so the pixel buffer must be sized to match it —
    // otherwise coordinates computed relative to the image get drawn into
    // the wrong scale/position ("lightning from nowhere").
    var rect = inner.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  // Approximate V geometry as fractions of the logo image's own box.
  var topLeft  = { x: 0.27, y: 0.205 };
  var apex     = { x: 0.49, y: 0.73 };
  var topRight = { x: 0.685, y: 0.21 };
  var centroid = { x: 0.49, y: 0.42 };

  function imgRect(){
    var b = inner.getBoundingClientRect();
    var l = img.getBoundingClientRect();
    return { x: l.left - b.left, y: l.top - b.top, w: l.width, h: l.height };
  }

  function lerp(a, b, t){ return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; }
  function rand(min, max){ return min + Math.random() * (max - min); }

  // Midpoint-displacement lightning path between two points.
  function jaggedPath(p0, p1, displace, depth){
    if (depth <= 0) return [p0, p1];
    var mx = (p0.x + p1.x) / 2 + rand(-1, 1) * displace;
    var my = (p0.y + p1.y) / 2 + rand(-1, 1) * displace;
    var mid = { x: mx, y: my };
    var left = jaggedPath(p0, mid, displace * 0.55, depth - 1);
    var right = jaggedPath(mid, p1, displace * 0.55, depth - 1);
    return left.concat(right.slice(1));
  }

  function fracToPoint(f, rect){ return { x: rect.x + f.x * rect.w, y: rect.y + f.y * rect.h }; }

  function spawnTendril(originOverride, dirOverride, strength){
    var rect = imgRect();
    strength = strength || 1;

    var origin;
    if (originOverride){
      origin = originOverride;
    } else {
      var onLeft = Math.random() < 0.5;
      var t = rand(0.05, 0.95);
      var f = onLeft ? lerp(topLeft, apex, t) : lerp(apex, topRight, t);
      origin = fracToPoint(f, rect);
    }

    var center = fracToPoint(centroid, rect);
    var dx = origin.x - center.x, dy = origin.y - center.y;
    var baseAngle = Math.atan2(dy, dx);
    var angle = dirOverride !== undefined ? dirOverride : baseAngle + rand(-0.6, 0.6);

    var stageMin = Math.min(rect.w, rect.h) * 2.1;
    var length = rand(0.35, 0.85) * stageMin * strength;
    var end = { x: origin.x + Math.cos(angle) * length, y: origin.y + Math.sin(angle) * length };

    var path = jaggedPath(origin, end, length * rand(0.18, 0.32), 5);

    var life = rand(420, 820) * (0.7 + 0.3 * strength);
    tendrils.push({
      path: path,
      born: performance.now(),
      life: life,
      width: rand(1.6, 3.2) * strength
    });

    // Occasional fork off the main whip.
    if (Math.random() < 0.4 && strength > 0.4){
      var forkIdx = Math.floor(path.length * rand(0.3, 0.65));
      var forkOrigin = path[forkIdx] || origin;
      spawnTendril(forkOrigin, angle + rand(-0.9, 0.9), strength * 0.55);
    }
  }

  function playLightningSfx(){
    // Best-effort: silently no-ops if the audio context isn't unlocked yet
    // (browsers require a prior user gesture — see script-37.js).
    try { if (window.__undeadSpellAudio) window.__undeadSpellAudio('lightning', false); } catch(e) {}
  }

  function burst(){
    var count = Math.floor(rand(3, 7));
    for (var i = 0; i < count; i++){
      (function(i){
        setTimeout(function(){ spawnTendril(); }, rand(0, 140) * i * 0.4);
      })(i);
    }
    playLightningSfx();
    img.classList.remove('vividexFlash');
    void img.offsetWidth;
    img.classList.add('vividexFlash');
  }

  function drawTendril(t, now){
    var age = now - t.born;
    if (age >= t.life) return false;
    var p = age / t.life;
    var alpha;
    if (p < 0.1) alpha = p / 0.1;
    else alpha = 1 - ((p - 0.1) / 0.9);
    alpha = Math.max(0, Math.min(1, alpha));
    if (alpha <= 0.01) return true;

    var pts = t.path;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Outer glow pass.
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.strokeStyle = 'rgba(90,180,255,' + (alpha * 0.35).toFixed(3) + ')';
    ctx.lineWidth = t.width * 3.2;
    ctx.shadowColor = 'rgba(80,180,255,0.9)';
    ctx.shadowBlur = 18;
    ctx.stroke();

    // Bright core pass.
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var j = 1; j < pts.length; j++) ctx.lineTo(pts[j].x, pts[j].y);
    ctx.strokeStyle = 'rgba(215,245,255,' + alpha.toFixed(3) + ')';
    ctx.lineWidth = Math.max(0.6, t.width * (1 - p * 0.4));
    ctx.shadowBlur = 8;
    ctx.stroke();

    return true;
  }

  var rafId = null;
  function loop(now){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    tendrils = tendrils.filter(function(t){ return drawTendril(t, now); });
    rafId = requestAnimationFrame(loop);
  }
  rafId = requestAnimationFrame(loop);

  setTimeout(burst, 1000);
  setTimeout(burst, 2000);
  setTimeout(burst, 2900);

  setTimeout(function(){
    bumper.classList.add('vividexHide');
  }, 3400);

  setTimeout(function(){
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resize);
    removeBumper();
  }, 4000);
})();
```

## Task 5 — Wire up the script tag

File: `index.html`

**Find:**
```html
<script id="boot-splash-layout-wait-patch" src="scripts/script-31.js"></script>
```

**Insert immediately before it:**
```html
<script id="vividex-splash-bumper" src="scripts/script-50.js"></script>
```

## Task 6 — Register in scripts/manifest.txt

**Append:**
```
50 | vividex-splash-bumper | (function(){
```

## Task 7 — service-worker.js

**Find:**
```js
const CACHE_NAME = "undead-nightfall-external-assets-v3-loudness-normalized";
```
**Replace with:**
```js
const CACHE_NAME = "undead-nightfall-external-assets-v4-vividex-bumper";
```

**Find:**
```js
  "./assets/usernameBtn-bg.png",
];
```
**Replace with:**
```js
  "./assets/usernameBtn-bg.png",
  "./assets/vividex-splash-v.png",
];
```

## Task 8 — Verification

1. `python -m http.server 8934` from repo root.
2. Playwright `browser_navigate` to `http://localhost:8934/index.html` at:
   - 390×844 (phone portrait)
   - 844×390 (phone landscape)
   - 820×1180 (tablet)
3. At each size: screenshot at ~1.5s (mid-burst), confirm the V is centered,
   sized sensibly, and at least one whip is visible arcing from an edge.
4. `browser_console_messages` at each size — expect zero `level: "error"`.
5. Wait to ~4.5s, confirm `#vividexBumper` is removed from the DOM
   (`browser_evaluate: () => !document.getElementById('vividexBumper')`)
   and the title screen underneath is present/interactive.
6. Confirm `window.matchMedia('(prefers-reduced-motion: reduce)')` path via
   `browser_evaluate` forcing the media query is not practical in Playwright
   without CDP emulation — acceptable to code-review this path instead of
   live-testing it, since it's a small isolated branch (early return with a
   fixed fade timer, no canvas).

## Task 9 — Repo bookkeeping

- Update `agents.md` Change Log (prepend entry).
- Update `HANDOVER.md` per the existing template (files inspected, files
  changed, summary of findings, tests performed, risk level, next
  recommended action).
