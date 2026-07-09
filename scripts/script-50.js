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
