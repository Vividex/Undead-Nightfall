// source: inline block 1
"use strict";
/* PATCH: sound-toggle-label-and-global-audio-gate */
const canvas=document.getElementById("c"),ctx=canvas.getContext("2d");
const ui={hp:document.getElementById("hp"),mp:document.getElementById("mp"),kills:document.getElementById("kills"),time:document.getElementById("time"),streak:document.getElementById("streak"),buffs:document.getElementById("buffs"),start:document.getElementById("start"),end:document.getElementById("end"),stats:document.getElementById("endStats"),pause:document.getElementById("pause"),muteGame:document.getElementById("muteGame"),muteTitle:document.getElementById("muteTitle"),instructions:document.getElementById("instructions"),showInstructions:document.getElementById("showInstructions"),showControls:document.getElementById("showControls"),controlsPanel:document.getElementById("controlsPanel"),resetControls:document.getElementById("resetControls"),levelToastRoot:document.getElementById("levelToastRoot"),bossWarning:document.getElementById("bossWarning"),levelToast:document.getElementById("levelToast"),joy:document.getElementById("joy"),stick:document.getElementById("stick")};
let W=0,H=0,DPR=1;
function resize(){DPR=Math.min(2,window.devicePixelRatio||1);W=innerWidth;H=innerHeight;canvas.width=Math.floor(W*DPR);canvas.height=Math.floor(H*DPR);ctx.setTransform(DPR,0,0,DPR,0,0)}
addEventListener("resize",resize,{passive:true});resize();

let audio=null,bgMusic=null;
const MUSIC_URL="https://opengameart.org/sites/default/files/megasong_0.mp3";

const SCORE_KEY="undeadNightfallHighScoresV1";
function loadScores(){try{return JSON.parse(localStorage.getItem(SCORE_KEY))||{bestTime:0,mostKills:0,mostBosses:0,highestCombo:0,highestLevel:1,bestScore:0}}catch(e){return{bestTime:0,mostKills:0,mostBosses:0,highestCombo:0,highestLevel:1,bestScore:0}}}
function saveScores(scores){try{localStorage.setItem(SCORE_KEY,JSON.stringify(scores))}catch(e){}}
function scoreRow(label,value,highlight=false){return `<div class="${highlight?'newRecord':''}"><span>${label}</span><b>${value}</b></div>`}
const MUSIC_KEY="undeadNightfallMusicMuted";
const SOUND_KEY="undeadNightfallSoundMuted";
let musicMuted=false;try{musicMuted=(localStorage.getItem(SOUND_KEY)??localStorage.getItem(MUSIC_KEY))==="1";window.__undeadSoundMuted=musicMuted;}catch(e){musicMuted=false;window.__undeadSoundMuted=false;}
function ensureAudio(){if(musicMuted)return;if(!audio)audio=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==="suspended")audio.resume()}
function tone(freq,dur=0.08,type="square",gain=0.04,when=0){if(!audio||musicMuted||window.__undeadSoundMuted)return;const t=audio.currentTime+when,o=audio.createOscillator(),g=audio.createGain(),f=audio.createBiquadFilter();o.type=type;o.frequency.setValueAtTime(freq,t);f.type="lowpass";f.frequency.setValueAtTime(1600,t);g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);o.connect(f);f.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+dur)}
function syncMusicButtons(){const text=musicMuted?"Music: Off":"Music: On";if(ui.muteGame)ui.muteGame.textContent=text;if(ui.muteTitle)ui.muteTitle.textContent=text;if(ui.muteGame)ui.muteGame.setAttribute("aria-label","Sound Toggle");if(ui.muteTitle)ui.muteTitle.setAttribute("aria-label","Sound Toggle")}
function setMusicMuted(v){
  musicMuted=!!v;
  try{localStorage.setItem(SOUND_KEY,musicMuted?"1":"0");localStorage.setItem(MUSIC_KEY,musicMuted?"1":"0");window.__undeadSoundMuted=musicMuted;}catch(e){window.__undeadSoundMuted=musicMuted;}
  if(bgMusic){
    bgMusic.muted=musicMuted;
    if(musicMuted) bgMusic.pause();
    else {
      const start = document.getElementById("start");
      const titleVisible = start && getComputedStyle(start).display !== "none";
      if(!titleVisible){
        const p=bgMusic.play();
        if(p&&p.catch)p.catch(()=>{});
      }
    }
  }
  try{document.querySelectorAll("audio,video").forEach(el=>{el.muted=musicMuted;if(musicMuted)el.pause();});}catch(e){}
  try{if(audio&&musicMuted&&audio.state==="running")audio.suspend();}catch(e){}
  try{if(window.syncCampfireAmbience)window.syncCampfireAmbience();}catch(e){}
  syncMusicButtons();
} try{if(window.__undeadApplyGlobalAudioMute)window.__undeadApplyGlobalAudioMute();}catch(e){}
function toggleMusic(){setMusicMuted(!musicMuted);try{if(window.syncCampfireAmbience)window.syncCampfireAmbience();}catch(e){}}
function startRealMusic(){
  try{
    if(!bgMusic){
      bgMusic=new Audio(MUSIC_URL);
      bgMusic.loop=true;
      bgMusic.volume=(typeof window.__undeadMusicVolume==="number"?window.__undeadMusicVolume:0.6);
      bgMusic.preload="auto";
      bgMusic.setAttribute("playsinline","true");
      document.body.appendChild(bgMusic);
    }

    if(!bgMusic.src || bgMusic.src.indexOf(MUSIC_URL) === -1){
      bgMusic.src = MUSIC_URL;
    }

    bgMusic.loop = true;
    bgMusic.volume=(typeof window.__undeadMusicVolume==="number"?window.__undeadMusicVolume:0.6);
    bgMusic.muted = musicMuted;

    if(musicMuted) return;
    // In-game pause must stop gameplay only, not the background music.
    if(typeof game !== "undefined" && game && game.over) return;

    const p = bgMusic.play();
    if(p&&p.catch)p.catch((e)=>console.log("Game music play blocked:", e && e.message ? e.message : e));
  }catch(e){console.log("Game music failed:", e && e.message ? e.message : e);}
}
syncMusicButtons();

/* iOS PWA lock-screen audio guard
   iOS exposes any playing HTMLAudioElement as a lock-screen media player.
   Pause game/title audio whenever the app is backgrounded or locked, then
   resume only the audio that was already playing when the app becomes visible. */
let __iosResumeBgMusic=false;
let __iosResumeCampfire=false;
function suppressIOSMediaSession(){
  try{
    if('mediaSession' in navigator){
      navigator.mediaSession.metadata=null;
      try{navigator.mediaSession.playbackState='none';}catch(e){}
      ['play','pause','stop','seekbackward','seekforward','previoustrack','nexttrack','seekto'].forEach(function(action){
        try{navigator.mediaSession.setActionHandler(action,null);}catch(e){}
      });
    }
  }catch(e){}
}
function pauseAudioForIOSLockScreen(){
  suppressIOSMediaSession();
  try{
    __iosResumeBgMusic=!!(bgMusic && !bgMusic.paused && !bgMusic.ended);
    if(bgMusic) bgMusic.pause();
  }catch(e){}
  try{
    const camp=window.__undeadCampfireAudio;
    __iosResumeCampfire=!!(camp && !camp.paused && !camp.ended);
    if(camp) camp.pause();
  }catch(e){}
}
function resumeAudioAfterIOSLockScreen(){
  suppressIOSMediaSession();
  if(document.hidden || document.visibilityState !== 'visible') return;
  if(musicMuted)return;
  try{
    const start=document.getElementById('start');
    const titleVisible=start && getComputedStyle(start).display!=='none';
    if(__iosResumeBgMusic && bgMusic && !titleVisible){
      const p=bgMusic.play(); if(p&&p.catch)p.catch(()=>{});
    }
    if(__iosResumeCampfire && window.__undeadCampfireAudio && titleVisible){
      const p=window.__undeadCampfireAudio.play(); if(p&&p.catch)p.catch(()=>{});
    }
  }catch(e){}
  __iosResumeBgMusic=false;
  __iosResumeCampfire=false;
}
suppressIOSMediaSession();
document.addEventListener('visibilitychange',function(){
  if(document.hidden) pauseAudioForIOSLockScreen();
  else resumeAudioAfterIOSLockScreen();
},{passive:true});
window.addEventListener('pagehide',pauseAudioForIOSLockScreen,{passive:true});
window.addEventListener('pageshow',resumeAudioAfterIOSLockScreen,{passive:true});

const world={w:3800,h:3800};
let game=null;
const enemyTypes=[
 {name:"Skeleton",chance:.52,hp:45,atk:7,spd:80,r:17,body:"#cfc5a8",head:"#ddd2b8"},
 {name:"Ghoul",chance:.26,hp:82,atk:12,spd:105,r:19,body:"#5f9458",head:"#486f43"},
 {name:"Death Knight",chance:.10,hp:185,atk:23,spd:60,r:24,body:"#53495d",head:"#332d3b"},
 {name:"Archer",chance:.12,hp:58,atk:14,spd:78,r:18,body:"#8a7d62",head:"#d9cfb4"},
 {name:"Ghost",chance:.10,hp:82,atk:12,spd:105,r:19,body:"#cfe8f2",head:"#e8f6fb",ghostly:true}
];

const bossTypes=[
 {key:"bone",name:"Bone Colossus",hp:760,atk:30,spd:46,r:52,body:"#d6cfb7",head:"#efe6ca",aura:"#d6c291"},
 {key:"lich",name:"Lich King",hp:840,atk:25,spd:56,r:46,body:"#342044",head:"#d8f5ff",aura:"#74d8ff"},
 {key:"warlord",name:"Corrupted Warlord",hp:980,atk:36,spd:50,r:50,body:"#4b1714",head:"#b9825c",aura:"#ff4b2e"},
 {key:"wraith",name:"Wraith Lord",hp:720,atk:28,spd:70,r:42,body:"#1a0a2e",head:"#d4c8f0",aura:"#8855ff"},
 {key:"necromancer",name:"Necromancer",hp:900,atk:26,spd:54,r:45,body:"#1c1430",head:"#ede6ff",aura:"#85ff9c"},
 {key:"plague",name:"Plague Harbinger",hp:1100,atk:18,spd:38,r:54,body:"#1a3a0a",head:"#253d18",aura:"#7ecf3a"},
 {key:"twins",name:"Ashenveil Twins",hp:500,atk:22,spd:62,r:38,body:"#0a1a2e",head:"#c8e8ff",aura:"#a0e8ff",twin:true},
 {key:"dragon",name:"Bone Dragon",hp:1400,atk:40,spd:30,r:72,body:"#c8bfa0",head:"#ede4c8",aura:"#e8c84a"}
];
function fmt(s){return String((s/60)|0).padStart(2,"0")+":"+String(s%60).padStart(2,"0")}
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
function currentDifficultyStage(){
 const t=game?game.t:0;
 if(t<60)return "Skeletons only";
 if(t<120)return "Ghouls unlocked";
 if(t<180)return "Archers unlocked";
 if(t<240)return "Boss incoming";
 if(t<420)return "Death Knights unlocked";
 return "Horde intensifying";
}
function spawnInterval(){
 const t=game?game.t:0;
 let base=t<60?1.25:t<120?1.08:t<180?.94:t<240?.86:t<420?.78:.78;
 if(t>=420){
  const extraMinutes=Math.floor((t-420)/60)+1;
  base=base/Math.pow(1.05,extraMinutes);
 }
 return Math.max(.28,base);
}
function spawnBurstCount(){
 const t=game?game.t:0;
 if(t<300)return 1;
 if(t<480)return 2;
 return Math.min(4,2+Math.floor((t-480)/180));
}
function reset(){
 const props=[];
 for(let i=0;i<420;i++){
  const t=Math.random();
  props.push({x:Math.random()*world.w,y:Math.random()*world.h,r:8+Math.random()*28,type:t<.32?"deadTree":t<.55?"grave":t<.72?"bone":t<.88?"rock":"ruin",rot:Math.random()*6.283});
 }
 game={running:true,paused:false,over:false,last:performance.now(),t:0,kills:0,swordKills:0,fireKills:0,boltKills:0,bossesDefeated:0,bestSwordStreak:0,fireCasts:0,boltCasts:0,potions:0,powerUps:0,combo:0,comboTimer:0,highestCombo:0,damage:0,spawnTimer:0,dropTimer:3,lastStage:"Skeletons only",nextBossAt:180,bossPending:false,bossWarning:0,
 hero:{x:world.w/2,y:world.h/2,r:18,level:1,baseHp:165,baseMp:170,baseSpeed:255,hp:165,maxHp:165,mp:170,maxMp:170,dir:0,swing:0,inv:0,step:0,swordStreak:0,spinDir:0,boosts:{speed:0,attack:0,god:0,berserk:0}},score:0,
 cam:{x:0,y:0},props,enemies:[],balls:[],drops:[],fx:[],bolts:[],arrows:[],shadowOrbs:[],poisonPools:[]};
 hud();
}
function chooseEnemy(){
 const unlocked=unlockedEnemyNames();
 const pool=enemyTypes.filter(t=>unlocked.includes(t.name));
 if(pool.length===1)return pool[0];
 const weights={Skeleton:1,Ghoul:.72,Archer:.46,"Death Knight":.24,Ghost:.24};
 let total=pool.reduce((sum,t)=>sum+(weights[t.name]||1),0);
 let r=Math.random()*total;
 for(const t of pool){
  r-=weights[t.name]||1;
  if(r<=0)return t;
 }
 return pool[0];
}
function spawnEnemy(){let m=120,side=(Math.random()*4)|0,x,y,c=game.cam;if(side===0){x=c.x-m;y=c.y+Math.random()*H}else if(side===1){x=c.x+W+m;y=c.y+Math.random()*H}else if(side===2){x=c.x+Math.random()*W;y=c.y-m}else{x=c.x+Math.random()*W;y=c.y+H+m}x=Math.max(30,Math.min(world.w-30,x));y=Math.max(30,Math.min(world.h-30,y));const t=chooseEnemy();game.enemies.push({type:t.name,x,y,r:t.r,hp:t.hp,maxHp:t.hp,atk:t.atk,spd:t.spd,body:t.body,head:t.head,cd:0,slow:0,hit:0})}

function separateEnemies(){
 const es=game.enemies;
 for(let i=0;i<es.length;i++){
  const a=es[i];
  if(a.dead||a.phased)continue;
  for(let j=i+1;j<es.length;j++){
   const b=es[j];
   if(b.dead||b.phased)continue;
   let dx=b.x-a.x,dy=b.y-a.y;
   let dist=Math.hypot(dx,dy);
   const minDist=a.r+b.r;
   if(dist>=minDist)continue;
   if(dist<.0001){const ang=Math.random()*6.283;dx=Math.cos(ang);dy=Math.sin(ang);dist=1;}
   const nx=dx/dist,ny=dy/dist,overlap=(minDist-dist)/2;
   a.x-=nx*overlap;a.y-=ny*overlap;
   b.x+=nx*overlap;b.y+=ny*overlap;
  }
 }
}
function triggerBossWarning(){game.bossWarning=3;game.bossPending=true;tone(95,.42,"sawtooth",.075);tone(58,.55,"sawtooth",.055,.18)}
function spawnBoss(){
 const idx=Math.max(0,Math.floor(game.nextBossAt/180)-1)%bossTypes.length;
 const t=bossTypes[idx];
 const h=game.hero;
 let a=Math.random()*6.283,dist=Math.min(520,Math.max(300,Math.min(W,H)*.42));
 let x=Math.max(70,Math.min(world.w-70,h.x+Math.cos(a)*dist));
 let y=Math.max(70,Math.min(world.h-70,h.y+Math.sin(a)*dist));
 if(t.twin){
  const tid="tw"+Math.floor(game.t*1000);
  const x2=Math.max(70,Math.min(world.w-70,h.x+Math.cos(a+Math.PI)*dist));
  const y2=Math.max(70,Math.min(world.h-70,h.y+Math.sin(a+Math.PI)*dist));
  game.enemies.push({type:"Frost Twin",bossKey:"twins",twinRole:"frost",isBoss:true,x,y,r:t.r,hp:t.hp,maxHp:t.hp,atk:t.atk,spd:t.spd,body:"#0a1a2e",head:"#c8e8ff",aura:"#a0e8ff",cd:1.2,specialCd:2.4,slow:0,hit:0,twinId:tid,enraged:false});
  game.enemies.push({type:"Ash Twin",bossKey:"twins",twinRole:"ash",isBoss:true,x:x2,y:y2,r:t.r,hp:t.hp,maxHp:t.hp,atk:t.atk,spd:t.spd,body:"#2e1008",head:"#ffe0c8",aura:"#ff6a22",cd:1.2,specialCd:2.4,slow:0,hit:0,twinId:tid,enraged:false});
  burst(x,y,"#a0e8ff",22);burst(x2,y2,"#ff6a22",22);
  tone(120,.22,"sawtooth",.07);tone(72,.35,"sawtooth",.05,.12);
  return;
 }
 game.enemies.push({type:t.name,bossKey:t.key,isBoss:true,x,y,r:t.r,hp:t.hp,maxHp:t.hp,atk:t.atk,spd:t.spd,body:t.body,head:t.head,aura:t.aura,cd:1.2,specialCd:2.2,slow:0,hit:0});
 burst(x,y,t.aura,34);
 tone(120,.22,"sawtooth",.07);tone(72,.35,"sawtooth",.05,.12);
}
function chooseDropType(){
 const r=Math.random()*100;
 if(r<45)return "hp";
 if(r<80)return "mp";
 if(r<90)return "speed";
 if(r<98)return "attack";
 return "god";
}
function chooseBossDropType(){
 const r=Math.random()*100;
 if(r<48)return "hp";
 if(r<82)return "mp";
 if(r<93)return "attack";
 return "speed";
}

function addDrop(x,y,forcedType=null){
 const type=forcedType||chooseDropType();
 const large=type==="god";
 game.drops.push({x,y,r:large?16:13,type,bob:Math.random()*6.283});
}
function dropColor(type){return type==="hp"?"#d52233":type==="mp"?"#1f80ff":type==="speed"?"#55e686":type==="attack"?"#ff9b2f":"#f4e66a"}
function collectDrop(d){
 const h=game.hero;
 d.used=true;
 if(d.type==="hp"){game.potions++;h.hp=Math.min(h.maxHp,h.hp+48);tone(320,.12,"triangle",.04);burst(d.x,d.y,dropColor(d.type),12);return}
 if(d.type==="mp"){game.potions++;h.mp=Math.min(h.maxMp,h.mp+60);tone(520,.12,"triangle",.04);burst(d.x,d.y,dropColor(d.type),12);return}
 game.powerUps++;
 if(d.type==="speed")h.boosts.speed=30;
 if(d.type==="attack")h.boosts.attack=30;
 if(d.type==="god")h.boosts.god=30;
 tone(d.type==="god"?760:620,.16,"triangle",.055);
 burst(d.x,d.y,dropColor(d.type),d.type==="god"?28:16);
}
function burst(x,y,color,n=12){for(let i=0;i<n;i++){let a=Math.random()*6.283,s=35+Math.random()*130;game.fx.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.35,max:.35,color,r:2+Math.random()*3})}}
function registerKill(){
 if(!game)return;
 game.comboTimer=3;
 game.combo=(game.combo||0)+1;
 game.highestCombo=Math.max(game.highestCombo||0,game.combo);
}

function heroStatMultiplier(){return 1+((game&&game.hero?game.hero.level:1)-1)*0.05}
function spellCost(base){const lvl=game&&game.hero?game.hero.level:1;return Math.max(1,Math.ceil(base*Math.max(.5,1-(lvl-1)*.05)))}
function attackMultiplier(){return heroStatMultiplier()}
function calculateScore(){if(!game)return 0;return Math.floor(game.t)+game.kills*10+game.bossesDefeated*250+(game.hero.level-1)*500+(game.highestCombo||0)*25}
function showLevelToast(){
 if(!ui.levelToast||!game)return;
 const h=game.hero;
 ui.levelToast.innerHTML=`Level ${h.level}<small>Stats +${Math.round((heroStatMultiplier()-1)*100)}% · spells cost less</small>`;
 ui.levelToast.classList.remove("show");
 void ui.levelToast.offsetWidth;
 ui.levelToast.classList.add("show");
}
function levelUpHero(){
 if(!game||!game.hero)return;
 const h=game.hero;
 const oldMaxHp=h.maxHp, oldMaxMp=h.maxMp;
 h.level++; showLevelToast(h.level); try{if(window.__undeadPlayLevelUpAudio)window.__undeadPlayLevelUpAudio();}catch(e){} burst(h.x,h.y,"#fff1a8",42); tone(520,.08,"triangle",.055); tone(780,.12,"triangle",.045,.08); tone(1040,.16,"triangle",.035,.16);
 const mult=heroStatMultiplier();
 h.maxHp=Math.round(h.baseHp*mult);
 h.maxMp=Math.round(h.baseMp*mult);
 h.hp=h.maxHp;
 h.mp=h.maxMp;
 showLevelToast();
 burst(h.x,h.y,"#ffd483",34);
 tone(520,.12,"triangle",.05);tone(760,.18,"triangle",.04,.08);tone(1040,.22,"triangle",.035,.18);
}

function applyEnemyRecoil(e, amount, src){
 if(!game||!e||e.dead)return;
 amount=Number(amount)||0;
 if(amount<=0)return;

 // Bosses should feel heavy.
 if(e.isBoss) amount*=.28;

 let ax=0,ay=0;
 const h=game.hero;

 if(src==="fire"){
   // Fireball pushes away from blast if available, otherwise away from hero.
   ax=e.x-(game._lastImpactX||h.x);
   ay=e.y-(game._lastImpactY||h.y);
 }else{
   ax=e.x-h.x;
   ay=e.y-h.y;
 }

 let d=Math.hypot(ax,ay);
 if(!d){ax=Math.cos(h.dir||0);ay=Math.sin(h.dir||0);d=1;}
 ax/=d;ay/=d;

 e.x+=ax*amount;
 e.y+=ay*amount;
 e.recoil=Math.max(e.recoil||0,.12);
 e.hit=Math.max(e.hit||0,.16);
 e.slow=Math.max(e.slow||0, src==="bolt"?.32:.24);
}

function damageEnemy(e,d,src){if(e.phased)return;if(src==="sword"&&e.type==="Ghost")return;const h=game.hero;d*=attackMultiplier();if(h&&h.boosts&&h.boosts.attack>0)d*=1.45;if(e.isBoss)d*=.72;e.hp-=d;applyEnemyRecoil(e,src==="sword"?22:src==="fire"?16:src==="bolt"?7:10,src);e.hit=.16;e.slow=Math.max(e.slow||0,.22);if(e.hp<=0){game.kills++;registerKill();if(e.isBoss){game.bossesDefeated++;levelUpHero();burst(e.x,e.y,e.aura||"#7b1010",46);addDrop(e.x,e.y,chooseBossDropType());if(e.twinId){const sv=game.enemies.find(en=>en.twinId===e.twinId&&en!==e&&!en.dead);if(sv){sv.enraged=true;burst(sv.x,sv.y,sv.aura||"#ff9900",36);tone(220,.2,"sawtooth",.08);}}}if(src==="sword"){game.swordKills++;if(game&&game.hero&&game.hero.boosts.berserk<=0){game.hero.swordStreak = (game.hero.swordStreak||0) + (e.isBoss?5:1);game.bestSwordStreak=Math.max(game.bestSwordStreak||0,game.hero.swordStreak);if(game.hero.swordStreak>=25) triggerBerserk();}}if(src==="fire"){game.fireKills++; if(game&&game.hero) game.hero.swordStreak=0;}if(src==="bolt"){game.boltKills++; if(game&&game.hero) game.hero.swordStreak=0;}burst(e.x,e.y,e.isBoss?(e.aura||"#7b1010"):"#7b1010",e.isBoss?26:16);if(!e.isBoss&&Math.random()<.20)addDrop(e.x,e.y);e.dead=true}}


const keys={};
const mouse={x:0,y:0,active:false};
const CONTROL_KEY="undeadNightfallControlsV1";
const defaultControls={
 up:{type:"key",code:"KeyW",label:"W"},
 down:{type:"key",code:"KeyS",label:"S"},
 left:{type:"key",code:"KeyA",label:"A"},
 right:{type:"key",code:"KeyD",label:"D"},
 sword:{type:"mouse",button:0,label:"Left Click",alt:{type:"key",code:"Space",label:"Space"}},
 fireball:{type:"mouse",button:2,label:"Right Click",alt:{type:"key",code:"KeyF",label:"F"}},
 lightning:{type:"mouse",button:1,label:"Middle Click",alt:{type:"key",code:"KeyQ",label:"Q"}}
}

function applyHeroDamage(amount, source){
 const h=game&&game.hero;
 if(!h||game.over)return false;

 amount=Number(amount);
 if(!Number.isFinite(amount)||amount<=0){
   console.warn("Ignored invalid hero damage", amount, source);
   return false;
 }

 if(!Number.isFinite(h.hp)){
   console.warn("Hero HP was invalid; restoring to max", h.hp);
   h.hp=Number.isFinite(h.maxHp)?h.maxHp:165;
 }

 if(!Number.isFinite(h.maxHp)||h.maxHp<=0){
   console.warn("Hero max HP was invalid; restoring default", h.maxHp);
   h.maxHp=165;
 }

 const before=h.hp;
 h.hp=Math.max(0, Math.min(h.maxHp, h.hp-amount));
 game.damage=(game.damage||0)+amount;
 game.lastDamage={amount,source,before,after:h.hp,time:game.t};

 if(h.hp<=0){
   console.warn("Hero died from damage event", game.lastDamage);
   endGame();
   return true;
 }
 return false;
}
;
let controls=loadControls();
let pendingBind=null;
function cloneControls(obj){return JSON.parse(JSON.stringify(obj));}
function loadControls(){
 try{
  const saved=JSON.parse(localStorage.getItem(CONTROL_KEY));
  return Object.assign(cloneControls(defaultControls),saved||{});
 }catch(e){return cloneControls(defaultControls);}
}
function saveControls(){try{localStorage.setItem(CONTROL_KEY,JSON.stringify(controls));}catch(e){}}
function bindingMatches(bind,e){
 if(!bind)return false;
 if(bind.type==="key"&&e.code)return e.code===bind.code;
 if(bind.type==="mouse"&&typeof e.button==="number")return e.button===bind.button;
 return false;
}
function actionPressed(action,e){
 const bind=controls[action];
 return bindingMatches(bind,e)||bindingMatches(bind&&bind.alt,e);
}
function keyHeld(action){
 const bind=controls[action];
 if(!bind||bind.type!=="key")return false;
 return !!keys[bind.code];
}
function labelForBind(bind){
 if(!bind)return "";
 const main=bind.label||bind.code||("Mouse "+bind.button);
 const alt=bind.alt?(" / "+(bind.alt.label||bind.alt.code||("Mouse "+bind.alt.button))):"";
 return main+alt;
}
function updateControlButtons(){
 document.querySelectorAll(".keyBind[data-bind]").forEach(btn=>{
  const action=btn.dataset.bind;
  btn.textContent=labelForBind(controls[action]);
 });
}
function eventLabel(e){
 if(e.type&&e.type.startsWith("mouse")){
  return e.button===0?"Left Click":e.button===1?"Middle Click":e.button===2?"Right Click":"Mouse "+e.button;
 }
 if(e.code==="Space")return "Space";
 if(e.code&&e.code.startsWith("Key"))return e.code.replace("Key","");
 if(e.code&&e.code.startsWith("Digit"))return e.code.replace("Digit","");
 return e.key||e.code||"Key";
}
function setBindingFromEvent(action,e){
 if(["up","down","left","right"].includes(action)){
  controls[action]={type:"key",code:e.code,label:eventLabel(e)};
 }else{
  if(e.type&&e.type.startsWith("mouse"))controls[action]={type:"mouse",button:e.button,label:eventLabel(e)};
  else controls[action]={type:"key",code:e.code,label:eventLabel(e)};
 }
 saveControls();
 updateControlButtons();
}
function screenToWorld(clientX,clientY){
 if(!game)return{x:clientX,y:clientY};
 return{x:clientX+game.cam.x,y:clientY+game.cam.y};
}

const joy={x:0,y:0,on:false,id:null};
function joyMove(e){mouse.active=false;const r=ui.joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy,len=Math.hypot(dx,dy)||1,m=Math.min(1,len/(r.width*.36));joy.x=dx/len*m;joy.y=dy/len*m;ui.stick.style.transform=`translate(calc(-50% + ${joy.x*r.width*.28}px),calc(-50% + ${joy.y*r.height*.28}px))`}
ui.joy.addEventListener("pointerdown",e=>{mouse.active=false;joy.on=true;joy.id=e.pointerId;ui.joy.setPointerCapture(e.pointerId);joyMove(e);e.preventDefault()});
ui.joy.addEventListener("pointermove",e=>{if(joy.on&&e.pointerId===joy.id)joyMove(e);e.preventDefault()});
function joyEnd(e){joy.on=false;joy.x=0;joy.y=0;ui.stick.style.transform="translate(-50%,-50%)";if(e)e.preventDefault()}
ui.joy.addEventListener("pointerup",joyEnd);ui.joy.addEventListener("pointercancel",joyEnd);


function triggerBerserk(){
 const h=game.hero;
 h.boosts.berserk=15;
 h.spinDir=Number.isFinite(h.dir)?h.dir:0;
 h.swordStreak=0;
 burst(h.x,h.y,"#ff2a1d",40);
 tone(220,.15,"sawtooth",.08);
 setTimeout(()=>{ if(game && game.hero) burst(game.hero.x, game.hero.y, "#ffd483", 20); }, 200);
 game.fx.push({text:"BERSERK MODE!",x:h.x,y:h.y-60,life:1.8,max:1.8,color:"#ffcf66",vy:-20});
}

function swordAttack(){if(!game||game.over||game.paused)return;const h=game.hero;if(h.boosts.berserk>0)return;if(h.swing>0)return;h.dir=Number.isFinite(h.dir)?h.dir:0;h.swing=0;h._swingSafetyStart=performance.now();h.dir=Number.isFinite(h.dir)?h.dir:0;h.swing=.17;h.spinDir=h.dir;/* uploaded sword audio replaces generated sword tone */const reach=h.boosts.attack>0?104:88;for(const e of game.enemies){const dx=e.x-h.x,dy=e.y-h.y,d=Math.hypot(dx,dy);let a=Math.atan2(dy,dx),diff=Math.atan2(Math.sin(a-h.dir),Math.cos(a-h.dir));if(d<reach&&Math.abs(diff)<1.35)damageEnemy(e,72,"sword")}}
function fireball(){if(!game||game.over||game.paused)return;const h=game.hero;const cost=spellCost(3);if(h.mp<cost&&h.boosts.god<=0){tone(95,.08,"triangle",.03);return}if(h.boosts.god<=0)h.mp-=cost;game.fireCasts++;game.balls.push({x:h.x+Math.cos(h.dir)*34,y:h.y+Math.sin(h.dir)*34,vx:Math.cos(h.dir)*560,vy:Math.sin(h.dir)*560,life:1.25,r:10});tone(440,.12,"sawtooth",.05)}
function lightning(){if(!game||game.over||game.paused)return;const h=game.hero;const cost=spellCost(28);if(h.mp<cost&&h.boosts.god<=0){tone(95,.08,"triangle",.03);return}if(h.boosts.god<=0)h.mp-=cost;game.boltCasts++;let sx=h.x,sy=h.y;const targets=game.enemies.map(e=>({e,d:Math.hypot(e.x-h.x,e.y-h.y)})).filter(o=>o.d<260).sort((a,b)=>a.d-b.d).slice(0,8);for(const o of targets){game.bolts.push({x1:sx,y1:sy,x2:o.e.x,y2:o.e.y,life:.16});damageEnemy(o.e,55,"bolt");sx=o.e.x;sy=o.e.y}burst(h.x,h.y,"#9ce6ff",18);tone(780,.13,"sawtooth",.04)}
document.getElementById("sword").addEventListener("pointerdown",e=>{swordAttack();e.preventDefault()});
document.getElementById("fire").addEventListener("pointerdown",e=>{fireball();e.preventDefault()});
document.getElementById("bolt").addEventListener("pointerdown",e=>{lightning();e.preventDefault()});

document.addEventListener("keydown",e=>{
 if(pendingBind){
   e.preventDefault();
   setBindingFromEvent(pendingBind,e);
   document.querySelectorAll(".keyBind.listening").forEach(b=>b.classList.remove("listening"));
   pendingBind=null;
   return;
 }
 keys[e.code]=true;
 if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code))e.preventDefault();
 if(!game||game.over||game.paused)return;
 if(actionPressed("sword",e)){swordAttack();e.preventDefault();}
 if(actionPressed("fireball",e)){fireball();e.preventDefault();}
 if(actionPressed("lightning",e)){lightning();e.preventDefault();}
});
document.addEventListener("keyup",e=>{keys[e.code]=false;});
canvas.addEventListener("mousemove",e=>{
 if(joy&&joy.on)return;
 mouse.active=true;
 mouse.x=e.clientX;
 mouse.y=e.clientY;
});
canvas.addEventListener("mousedown",e=>{
 if(pendingBind){
   e.preventDefault();
   setBindingFromEvent(pendingBind,e);
   document.querySelectorAll(".keyBind.listening").forEach(b=>b.classList.remove("listening"));
   pendingBind=null;
   return;
 }
 if(!game||game.over||game.paused)return;
 if(joy&&joy.on){mouse.active=false;}else{mouse.active=true;mouse.x=e.clientX;mouse.y=e.clientY;}
 if(actionPressed("sword",e)){swordAttack();e.preventDefault();}
 if(actionPressed("fireball",e)){fireball();e.preventDefault();}
 if(actionPressed("lightning",e)){lightning();e.preventDefault();}
});
canvas.addEventListener("contextmenu",e=>e.preventDefault());


function begin(e){
 if(e){try{e.preventDefault();}catch(err){}}
 try{ensureAudio();}catch(err){console.log("Audio context failed:",err);}
 try{if(window.__undeadCampfireAudio)window.__undeadCampfireAudio.pause(); startRealMusic();}catch(err){console.log("Music failed:",err);}
 try{
   reset();
   ui.start.style.display="none";
   ui.end.style.display="none";
   ui.pause.textContent="Pause";
   if(ui.bossWarning)ui.bossWarning.classList.remove("show");
   setTimeout(()=>{try{startRealMusic();}catch(e){}},100);
 }catch(err){
   alert("The game could not start in this iOS preview. Please open the file in Safari/Chrome instead of Files preview. Error: "+err.message);
 }
}
function bindStartButton(id){
 const el=document.getElementById(id);
 if(!el)return;
 ["click","touchend","pointerup"].forEach(evt=>{
   el.addEventListener(evt,function(e){begin(e);},{passive:false});
 });
}
bindStartButton("begin");
bindStartButton("again");
ui.muteGame.addEventListener("pointerdown",e=>{e.preventDefault();toggleMusic()});
ui.muteTitle.addEventListener("click",e=>{e.preventDefault();toggleMusic()});
ui.showInstructions.addEventListener("click",e=>{e.preventDefault();ui.instructions.classList.toggle("show");ui.showInstructions.textContent=ui.instructions.classList.contains("show")?"Hide Instructions":"Instructions"});

if(ui.showControls)ui.showControls.addEventListener("click",e=>{
 e.preventDefault();
 ui.controlsPanel.classList.toggle("show");
 ui.showControls.textContent=ui.controlsPanel.classList.contains("show")?"Hide Controls":"Controls";
 updateControlButtons();
});
document.querySelectorAll(".keyBind[data-bind]").forEach(btn=>{
 btn.addEventListener("pointerdown",e=>{
   e.preventDefault();
   pendingBind=btn.dataset.bind;
   document.querySelectorAll(".keyBind.listening").forEach(b=>b.classList.remove("listening"));
   btn.classList.add("listening");
   btn.textContent="Press key / click...";
 });
});
if(ui.resetControls)ui.resetControls.addEventListener("click",e=>{
 e.preventDefault();
 controls=cloneControls(defaultControls);
 saveControls();
 updateControlButtons();
});
updateControlButtons();

ui.pause.addEventListener("click",()=>{if(!game||game.over)return;game.paused=!game.paused;ui.pause.textContent=game.paused?"Play":"Pause";try{if(bgMusic){const v=(typeof window.__undeadMusicVolume==="number"?window.__undeadMusicVolume:0.6);bgMusic.volume=v;bgMusic.muted=musicMuted||v<=0;if(musicMuted||v<=0){bgMusic.pause();}else{bgMusic.muted=false;const p=bgMusic.play();if(p&&p.catch)p.catch(()=>{});}}else if(!musicMuted&&typeof startRealMusic==="function"){startRealMusic();}}catch(e){}});


function totalScore(){
 const s=Math.floor(game.t);
 const level=game.hero.level||1;
 const swordStreak=game.bestSwordStreak||game.hero.swordStreak||0;
 const timeScore=Math.floor(s*8);
 const killScore=game.kills*35;
 const bossScore=game.bossesDefeated*600;
 const levelScore=(level-1)*450;
 const comboScore=(game.highestCombo||0)*45;
 const swordSkillScore=swordStreak*30;
 const spellSkillScore=(game.fireKills+game.boltKills)*18;
 const survivalBonus=s>=300?Math.floor((s-300)*4):0;
 return Math.max(0, timeScore+killScore+bossScore+levelScore+comboScore+swordSkillScore+spellSkillScore+survivalBonus);
}

function endGame(){
 if(game&&game.hero&&Number.isFinite(game.hero.hp)&&game.hero.hp>0&&!game.forceEnd){console.warn("Blocked endGame while hero still has HP", game.hero.hp, game.lastDamage);return;}
 game.over=true;
 try{if(bgMusic)bgMusic.pause()}catch(e){}
 ui.end.style.display="grid";

 const s=Math.floor(game.t);
 const oldScores=loadScores();
 const finalScore=totalScore();
 game.score = finalScore;

 const newBestScore=finalScore>(oldScores.bestScore||0);
 const newBestTime=s>(oldScores.bestTime||0);
 const newMostKills=game.kills>(oldScores.mostKills||0);
 const newMostBosses=game.bossesDefeated>(oldScores.mostBosses||0);
 const newHighestCombo=(game.highestCombo||0)>(oldScores.highestCombo||0);
 const newHighestLevel=(game.hero.level||1)>(oldScores.highestLevel||1);

 const scores={
  bestTime:Math.max(oldScores.bestTime||0,s),
  mostKills:Math.max(oldScores.mostKills||0,game.kills),
  mostBosses:Math.max(oldScores.mostBosses||0,game.bossesDefeated),
  highestCombo:Math.max(oldScores.highestCombo||0,game.highestCombo||0),
  highestLevel:Math.max(oldScores.highestLevel||1,game.hero.level||1),
  bestScore:Math.max(oldScores.bestScore||0,finalScore)
 };
 saveScores(scores);

 const anyRecord=newBestScore||newBestTime||newMostKills||newMostBosses||newHighestCombo||newHighestLevel;

 ui.stats.innerHTML=`${anyRecord?'<p style="text-align:center;color:#fff1a8;font-weight:900;margin:4px 0 10px">New high score!</p>':''}`+
 scoreRow("Total score",finalScore.toLocaleString(),newBestScore)+
 scoreRow("Hero level",game.hero.level||1,newHighestLevel)+
 scoreRow("Survival time",fmt(s),newBestTime)+
 scoreRow("Total kills",game.kills,newMostKills)+
 scoreRow("Bosses defeated",game.bossesDefeated,newMostBosses)+
 scoreRow("Highest combo",game.highestCombo||0,newHighestCombo)+
 scoreRow("Best sword streak",game.bestSwordStreak||0)+
 scoreRow("Power-ups collected",game.powerUps)+
 scoreRow("Potions collected",game.potions)+
 scoreRow("Sword kills",game.swordKills)+
 scoreRow("Fireball kills",game.fireKills)+
 scoreRow("Lightning kills",game.boltKills)+
 scoreRow("Fireballs cast",game.fireCasts)+
 scoreRow("Lightning casts",game.boltCasts)+
 scoreRow("Damage taken",Math.round(game.damage))+
 '<p style="text-align:center;font-size:13px;opacity:.86;margin:12px 0 4px">Saved records</p>'+
 scoreRow("Best total score",scores.bestScore.toLocaleString(),newBestScore)+
 scoreRow("Highest hero level",scores.highestLevel,newHighestLevel)+
 scoreRow("Best survival time",fmt(scores.bestTime),newBestTime)+
 scoreRow("Most kills",scores.mostKills,newMostKills)+
 scoreRow("Most bosses defeated",scores.mostBosses,newMostBosses)+
 scoreRow("Best combo",scores.highestCombo,newHighestCombo);

 try {
   setTimeout(function(){
     if (typeof submitLeaderboardScore === "function") submitLeaderboardScore();
     if (typeof showLeaderboard === "function") setTimeout(showLeaderboard, 800);
   }, 300);
 } catch(e) {}
}

function hud(){if(!game)return;const h=game.hero;ui.hp.style.height=Math.max(0,Math.min(100,(Number.isFinite(h.hp)&&Number.isFinite(h.maxHp)&&h.maxHp>0?h.hp/h.maxHp*100:0)))+"%";ui.mp.style.height=Math.max(0,h.mp/h.maxMp*100)+"%";ui.kills.textContent="Kills: "+game.kills+" | Level: "+h.level;ui.time.textContent=fmt(Math.floor(game.t));if(ui.streak) ui.streak.textContent="Sword Streak: "+Math.min(h.swordStreak||0,25)+"/25";
 const active=[];
 if(h.boosts.speed>0)active.push({cls:"speed",icon:"➤",name:"Speed",time:h.boosts.speed});
 if(h.boosts.attack>0)active.push({cls:"attack",icon:"⚔",name:"Attack",time:h.boosts.attack});
 if(h.boosts.god>0)active.push({cls:"god",icon:"★",name:"God",time:h.boosts.god});if(h.boosts.berserk>0)active.push({cls:"berserk",icon:"⚔",name:"Berserk",time:h.boosts.berserk});
 if(ui.buffs)ui.buffs.innerHTML=active.map(b=>`<div class="buff ${b.cls}"><span class="buffIcon">${b.icon}</span><span>${b.name}</span><b>${Math.ceil(b.time)}s</b></div>`).join("");
}

function updateBerserkState(dt){
 const h=game.hero;
 const wasActive=h.boosts.berserk>0;
 h.boosts.berserk=Math.max(0,h.boosts.berserk-dt);
 if(wasActive && h.boosts.berserk<=0){
   h.swing=0;
   h.spinDir=h.dir;
 }
}



function swordStuckSafety(){
  try{
    if(!game || !game.hero) return;
    const h = game.hero;

    if(!Number.isFinite(h.swing) || h.swing < 0 || h.swing > 0.5){
      h.swing = 0;
    }

    if(!Number.isFinite(h.dir)){
      h.dir = 0;
    }

    if(!Number.isFinite(h.spinDir)){
      h.spinDir = h.dir;
    }

    if(h.boosts && h.boosts.berserk <= 0){
      if(h.swing <= 0.001){
        h.swing = 0;
        h.spinDir = h.dir;
      }
    }

    // Failsafe: if normal sword animation somehow remains active too long,
    // force it back to idle. This should not affect legitimate attacks.
    if(!h._swingSafetyStart) h._swingSafetyStart = 0;

    if(h.swing > 0 && (!h.boosts || h.boosts.berserk <= 0)){
      const now = performance.now();
      if(h._swingSafetyStart === 0){
        h._swingSafetyStart = now;
      }else if(now - h._swingSafetyStart > 650){
        h.swing = 0;
        h.spinDir = h.dir;
        h._swingSafetyStart = 0;
      }
    }else{
      h._swingSafetyStart = 0;
    }
  }catch(e){}
}

function sanitizeSwordState(){
 const h=game&&game.hero;
 if(!h)return;
 if(!Number.isFinite(h.swing) || h.swing < 0 || h.swing > 0.25) h.swing = 0;
 if(!Number.isFinite(h.dir)) h.dir = 0;
 if(!Number.isFinite(h.spinDir)) h.spinDir = h.dir;
 if(h.boosts && h.boosts.berserk <= 0 && h.swing < 0.001) {
   h.swing = 0;
   h.spinDir = h.dir;
 }
}

function update(dt){sanitizeSwordState();if(!game||game.paused||game.over)return;game.t+=dt;if(game.comboTimer>0){game.comboTimer=Math.max(0,game.comboTimer-dt);if(game.comboTimer<=0)game.combo=0;}const h=game.hero;h.swing=Math.max(0,Math.min(.17,h.swing-dt));if(h.swing<0.001)h.swing=0;h.inv=Math.max(0,h.inv-dt);h.boosts.speed=Math.max(0,h.boosts.speed-dt);h.boosts.attack=Math.max(0,h.boosts.attack-dt);h.boosts.god=Math.max(0,h.boosts.god-dt);updateBerserkState(dt);h.mp=Math.min(h.maxMp,h.mp+(h.boosts.god>0?9.5:4.2)*dt);
 let mx=0,my=0;
 if(keyHeld("up")||keys["ArrowUp"])my-=1;
 if(keyHeld("down")||keys["ArrowDown"])my+=1;
 if(keyHeld("left")||keys["ArrowLeft"])mx-=1;
 if(keyHeld("right")||keys["ArrowRight"])mx+=1;
 const km=Math.hypot(mx,my);
 if(km>.05){mx/=km;my/=km;}
 const jm=Math.hypot(joy.x,joy.y);
 let nx=0,ny=0,usingKeyboard=false;
 if(km>.05){nx=mx;ny=my;usingKeyboard=true;}
 else if(jm>.05){nx=joy.x/jm;ny=joy.y/jm;}
 if(km>.05||jm>.05){
   const moveSpeed=h.baseSpeed*heroStatMultiplier()*(h.boosts.speed>0?1.42:1);
   h.x+=nx*moveSpeed*dt;
   h.y+=ny*moveSpeed*dt;
   if(h.boosts.berserk<=0 && !usingKeyboard)h.dir=Math.atan2(ny,nx);
   h.step+=dt*8;
 }
 if(mouse.active&&jm<=.05&&h.boosts.berserk<=0){
   const mw=screenToWorld(mouse.x,mouse.y);
   h.dir=Math.atan2(mw.y-h.y,mw.x-h.x);
 }

 if(h.boosts.berserk>0){
   h.spinDir = (typeof h.spinDir==="number"?h.spinDir:h.dir) + dt*14;
   h.swing = .17;
   for(const e of game.enemies){
     const d=Math.hypot(e.x-h.x,e.y-h.y);
     if(d<96 && (!e.berserkHitCd || e.berserkHitCd<=0)){ e.berserkHitCd=.18; damageEnemy(e,58,"sword"); }
   }
 }

 h.x=Math.max(28,Math.min(world.w-28,h.x));h.y=Math.max(28,Math.min(world.h-28,h.y));game.cam.x=Math.max(0,Math.min(world.w-W,h.x-W/2));game.cam.y=Math.max(0,Math.min(world.h-H,h.y-H/2));
 const stage=currentDifficultyStage();
 if(stage!==game.lastStage){game.lastStage=stage;tone(360,.08,"triangle",.035);}
 game.bossWarning=Math.max(0,game.bossWarning-dt);
 if(!game.bossPending&&game.t>=game.nextBossAt-3)triggerBossWarning();
 if(game.bossPending&&game.t>=game.nextBossAt){spawnBoss();game.nextBossAt+=180;game.bossPending=false;}
 if(ui.bossWarning)ui.bossWarning.classList.toggle("show",game.bossWarning>0);
 game.spawnTimer-=dt;if(game.spawnTimer<=0){game.spawnTimer=spawnInterval();const count=spawnBurstCount();for(let i=0;i<count;i++)spawnEnemy()}
 game.dropTimer-=dt;if(game.dropTimer<=0){game.dropTimer=10+Math.random()*4;let a=Math.random()*6.283;addDrop(h.x+Math.cos(a)*(150+Math.random()*280),h.y+Math.sin(a)*(150+Math.random()*280))}
 for(const e of game.enemies){
 const dx=h.x-e.x, dy=h.y-e.y, d=Math.hypot(dx,dy)||1;
 e.cd=Math.max(0,e.cd-dt);
 e.slow=Math.max(0,e.slow-dt);
 e.hit=Math.max(0,e.hit-dt); e.berserkHitCd=Math.max(0,(e.berserkHitCd||0)-dt);

 if(e.isBoss){
   if(e.bossKey==="wraith"){
     e.phaseTimer=Math.max(0,(e.phaseTimer===undefined?5:e.phaseTimer)-dt);
     if(e.phased){
       e.phaseDuration=Math.max(0,(e.phaseDuration||0)-dt);
       if(e.phaseDuration<=0){e.phased=false;}
       continue;
     }
   if(e.phaseTimer<=0){
     e.phased=true;e.phaseDuration=2.0;e.phaseTimer=7.0;
     const pa=Math.random()*6.283,pd=180+Math.random()*120;
     e.x=Math.max(70,Math.min(world.w-70,h.x+Math.cos(pa)*pd));
     e.y=Math.max(70,Math.min(world.h-70,h.y+Math.sin(pa)*pd));
       for(let oi=0;oi<2;oi++){
         const oa=Math.atan2(h.y-e.y,h.x-e.x)+(Math.random()-.5)*1.4;
         game.shadowOrbs.push({x:e.x,y:e.y,vx:Math.cos(oa)*160,vy:Math.sin(oa)*160,life:5.0,damage:22});
       }
       tone(300,.22,"sawtooth",.06);
     }
   } else if(e.bossKey==="necromancer"){
    const necrSpd=e.spd*(e.slow>0?.55:1);
    if(d>440){e.x+=dx/d*necrSpd*dt;e.y+=dy/d*necrSpd*dt;}
    else if(d<340){e.x-=dx/d*necrSpd*dt;e.y-=dy/d*necrSpd*dt;}
    if(e.specialCd===undefined)e.specialCd=0;
    e.specialCd=Math.max(0,e.specialCd-dt);
    if(e.summonCd===undefined)e.summonCd=12;
    e.summonCd=Math.max(0,e.summonCd-dt);
    if(e.summonCd<=0){
      e.summonCd=12;
      for(let si=0;si<3;si++){const sa=Math.random()*6.283,sd=60+Math.random()*80;const t=chooseEnemy();game.enemies.push({type:t.name,x:Math.max(30,Math.min(world.w-30,h.x+Math.cos(sa)*sd)),y:Math.max(30,Math.min(world.h-30,h.y+Math.sin(sa)*sd)),r:t.r,hp:t.hp,maxHp:t.hp,atk:t.atk,spd:t.spd,body:t.body,head:t.head,cd:0,slow:0,hit:0});}
      burst(e.x,e.y,e.aura||"#85ff9c",18);tone(180,.15,"sawtooth",.06);
    }
    if(e.specialCd<=0&&d<620){
      e.specialCd=2.8;
      const ang=Math.atan2(dy,dx);
      game.arrows.push({x:e.x,y:e.y,vx:Math.cos(ang)*300,vy:Math.sin(ang)*300,life:2.4,damage:e.atk,color:e.aura||"#85ff9c",boss:true});
      tone(140,.08,"sawtooth",.04);
    }
    if(d<e.r+h.r+8&&e.cd<=0){
      e.cd=1.15;
      if(h.inv<=0){if(h.boosts.god>0){h.inv=.12;burst(h.x,h.y,"#f4e66a",10);tone(860,.05,"triangle",.03);}else{h.inv=.25;burst(h.x,h.y,e.aura||"#ff5555",14);tone(62,.12,"sawtooth",.07);applyHeroDamage(e.atk,e.type||"boss");}}
    }
    continue;
   } else if(e.bossKey==="plague"){
      e.poolCd=Math.max(0,(e.poolCd===undefined?4:e.poolCd)-dt);
     if(e.poolCd<=0){
       e.poolCd=4;
       game.poisonPools.push({x:e.x,y:e.y,r:52,life:12,maxLife:12,damageCd:0});
       burst(e.x,e.y,e.aura||"#7ecf3a",14);
       tone(85,.2,"sawtooth",.05);
     }
   } else if(e.bossKey==="twins"){
      const twinSpd=e.spd*(e.enraged?1.4:1)*(e.slow>0?.55:1);
      e.x+=dx/d*twinSpd*dt;e.y+=dy/d*twinSpd*dt;
      if(e.specialCd!==undefined)e.specialCd=Math.max(0,e.specialCd-dt);
      if(e.specialCd<=0&&d<580){
        const shots=e.enraged?3:1;
        e.specialCd=e.enraged?1.4:2.4;
        for(let si=0;si<shots;si++){const spread=(si-(shots-1)/2)*.28,ang=Math.atan2(dy,dx)+spread;game.arrows.push({x:e.x,y:e.y,vx:Math.cos(ang)*340,vy:Math.sin(ang)*340,life:2.2,damage:e.atk,color:e.aura||"#a0e8ff",boss:true});}
        tone(140,.08,"sawtooth",.04);
      }
      if(d<e.r+h.r+8&&e.cd<=0){
        e.cd=e.enraged?.7:1.15;
        if(h.inv<=0){if(h.boosts.god>0){h.inv=.12;burst(h.x,h.y,"#f4e66a",10);tone(860,.05,"triangle",.03);}else{h.inv=e.enraged?.18:.25;burst(h.x,h.y,e.aura||"#ff5555",14);tone(62,.12,"sawtooth",.07);applyHeroDamage(e.atk,e.type||"boss");}}
      }
      continue;
   } else if(e.bossKey==="dragon"){
    if(e.chargeCd===undefined)e.chargeCd=6;
    if(e.breathCd===undefined)e.breathCd=0;
    const dragSpd=e.spd*(e.slow>0?.55:1);
    e.breathCd=Math.max(0,e.breathCd-dt);
    if(e.chargeTime>0){
      e.chargeTime=Math.max(0,e.chargeTime-dt);
      e.x+=e.chargeDx*dragSpd*3*dt;
      e.y+=e.chargeDy*dragSpd*3*dt;
    } else {
      e.x+=dx/d*dragSpd*dt;e.y+=dy/d*dragSpd*dt;
      e.chargeCd=Math.max(0,e.chargeCd-dt);
      if(e.chargeCd<=0){
        e.chargeCd=8;e.chargeTime=1.5;
        e.chargeDx=dx/d;e.chargeDy=dy/d;
        burst(e.x,e.y,e.aura||"#e8c84a",20);tone(95,.18,"sawtooth",.07);
      }
    }
    if(e.breathCd<=0&&d<640){
      e.breathCd=3;
      const baseAng=Math.atan2(dy,dx);
      for(let bi=0;bi<5;bi++){const spread=(bi-2)*.22,ang=baseAng+spread;game.arrows.push({x:e.x,y:e.y,vx:Math.cos(ang)*380,vy:Math.sin(ang)*380,life:2.0,damage:e.atk,color:"#e8c84a",boss:true});}
      tone(110,.14,"sawtooth",.06);
    }
    if(d<e.r+h.r+8&&e.cd<=0){
      e.cd=1.1;
      if(h.inv<=0){if(h.boosts.god>0){h.inv=.12;burst(h.x,h.y,"#f4e66a",10);tone(860,.05,"triangle",.03);}else{h.inv=.25;burst(h.x,h.y,e.aura||"#e8c84a",14);tone(62,.12,"sawtooth",.07);applyHeroDamage(e.atk,e.type||"boss");}}
    }
    continue;
   }
   if(e.specialCd!==undefined)e.specialCd=Math.max(0,e.specialCd-dt);
   const spd=e.spd*(e.slow>0?.55:1);
   e.x+=dx/d*spd*dt;
   e.y+=dy/d*spd*dt;
   if(e.bossKey!=="wraith"&&e.bossKey!=="necromancer"&&e.bossKey!=="plague"&&e.specialCd<=0&&d<620){
     e.specialCd=e.type==="Lich King"?1.55:2.35;
     const shots=e.type==="Lich King"?3:1;
     for(let si=0;si<shots;si++){
       const spread=(si-(shots-1)/2)*.22,ang=Math.atan2(dy,dx)+spread;
       game.arrows.push({x:e.x,y:e.y,vx:Math.cos(ang)*360,vy:Math.sin(ang)*360,life:2.4,damage:e.atk,color:e.aura||"#d8d8d8",boss:true});
     }
     tone(140,.08,"sawtooth",.04);
   }
   if(d<e.r+h.r+8&&e.cd<=0){
     e.cd=1.15;
     if(h.inv<=0){if(h.boosts.god>0){h.inv=.12;burst(h.x,h.y,"#f4e66a",10);tone(860,.05,"triangle",.03);}else{h.inv=.25;burst(h.x,h.y,e.aura||"#ff5555",14);tone(62,.12,"sawtooth",.07);applyHeroDamage(e.atk,e.type||"boss");}}
   }
 } else if(e.type==="Archer"){
   const preferred=265;
   if(d>preferred+35){
     const spd=e.spd*(e.slow>0?.45:1);
     e.x+=dx/d*spd*dt;
     e.y+=dy/d*spd*dt;
   } else if(d<preferred-35){
     const spd=e.spd*(e.slow>0?.45:1);
     e.x-=dx/d*spd*dt;
     e.y-=dy/d*spd*dt;
   }
   if(e.cd<=0 && d<540){
     e.cd=2.25;
     game.arrows.push({x:e.x,y:e.y,vx:dx/d*430,vy:dy/d*430,life:2.1,damage:e.atk});
     tone(185,.04,"triangle",.025);
   }
 } else {
   const spd=e.spd*(e.slow>0?.45:1);
   e.x+=dx/d*spd*dt;
   e.y+=dy/d*spd*dt;
   if(d<e.r+h.r+5&&e.cd<=0){
     e.cd=.8;
     if(h.inv<=0){
       if(h.boosts.god>0){h.inv=.12;burst(h.x,h.y,"#f4e66a",8);tone(860,.05,"triangle",.03);}
       else{h.inv=.18;burst(h.x,h.y,"#ff5555",8);tone(70,.09,"sawtooth",.06);applyHeroDamage(e.atk,e.type||"enemy");}
     }
   }
 }
}
separateEnemies();
for(const a of game.arrows){
 a.x+=a.vx*dt;
 a.y+=a.vy*dt;
 a.life-=dt;
 if(a.life>0 && Math.hypot(a.x-h.x,a.y-h.y)<h.r+6){
   a.life=0;
   if(h.inv<=0){
     if(h.boosts.god>0){h.inv=.12;burst(h.x,h.y,"#f4e66a",8);tone(860,.05,"triangle",.03);}
     else{h.inv=.18;burst(h.x,h.y,"#d8d8d8",6);tone(120,.05,"triangle",.03);applyHeroDamage(a.damage,a.boss?"boss projectile":"arrow");}
   }
 }
}
game.arrows=game.arrows.filter(a=>a.life>0);
  for(const o of game.shadowOrbs){
    const odx=h.x-o.x,ody=h.y-o.y,od=Math.hypot(odx,ody)||1;
    o.vx+=odx/od*100*dt;o.vy+=ody/od*100*dt;
    const ospd=Math.hypot(o.vx,o.vy);
    if(ospd>210){o.vx=o.vx/ospd*210;o.vy=o.vy/ospd*210;}
    o.x+=o.vx*dt;o.y+=o.vy*dt;o.life-=dt;
    if(o.life>0&&Math.hypot(o.x-h.x,o.y-h.y)<h.r+8){
      o.life=0;
      if(h.inv<=0){if(h.boosts.god>0){h.inv=.12;burst(h.x,h.y,"#f4e66a",8);tone(860,.05,"triangle",.03);}else{h.inv=.18;burst(h.x,h.y,"#8855ff",8);tone(180,.08,"sawtooth",.05);applyHeroDamage(o.damage,"shadow orb");}}
    }
  }
  game.shadowOrbs=game.shadowOrbs.filter(o=>o.life>0);
  for(const p of game.poisonPools){p.life-=dt;p.damageCd=Math.max(0,p.damageCd-dt);if(p.life>0&&Math.hypot(h.x-p.x,h.y-p.y)<h.r+p.r){if(p.damageCd<=0&&h.inv<=0){p.damageCd=.5;if(h.boosts.god>0){burst(h.x,h.y,"#f4e66a",6);tone(860,.04,"triangle",.02);}else{applyHeroDamage(8,"poison pool");burst(h.x,h.y,"#7ecf3a",6);tone(90,.08,"sawtooth",.04);}}}}
  game.poisonPools=game.poisonPools.filter(p=>p.life>0);
 for(const b of game.balls){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;for(const e of game.enemies){if(!e.dead&&Math.hypot(e.x-b.x,e.y-b.y)<e.r+b.r){game._lastImpactX=b.x;game._lastImpactY=b.y;if(b.charged){if(!e._chargedFireHitUntil||e._chargedFireHitUntil<performance.now()){e._chargedFireHitUntil=performance.now()+180;damageEnemy(e,b.pierceDamage||52,"fire");burst(b.x,b.y,"#ff8a22",12);}}else{damageEnemy(e,86,"fire");burst(b.x,b.y,"#ff8a22",22);b.life=0;break}}}}
 game.enemies=game.enemies.filter(e=>!e.dead);game.balls=game.balls.filter(b=>b.life>0);
 for(const d of game.drops){d.bob+=dt*4;if(Math.hypot(d.x-h.x,d.y-h.y)<d.r+h.r){collectDrop(d)}}
game.drops=game.drops.filter(d=>!d.used);for(const f of game.fx){f.x+=f.vx*dt;f.y+=f.vy*dt;f.life-=dt}game.fx=game.fx.filter(f=>f.life>0);for(const l of game.bolts)l.life-=dt;game.bolts=game.bolts.filter(l=>l.life>0);hud()}
function line(x1,y1,x2,y2,w,c){ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.lineCap="butt"}
function drawTerrain(c){
 ctx.fillStyle="#030303";
 ctx.fillRect(0,0,W,H);
 for(let gx=-90;gx<W+90;gx+=90){
  for(let gy=-90;gy<H+90;gy+=90){
   const wx=(gx+c.x)*.014,wy=(gy+c.y)*.014;
   const shade=((Math.sin(wx)+Math.cos(wy)+Math.sin((wx+wy)*.9))*5)|0;
   ctx.fillStyle=`rgb(${9+shade},${12+shade},${10+shade})`;
   ctx.fillRect(gx,gy,92,92);
  }
 }
 ctx.fillStyle="rgba(57,10,8,.18)";
 for(let i=0;i<18;i++){
  let x=((i*293-c.x*.42)%(W+240))-120,y=((i*191-c.y*.37)%(H+240))-120;
  ctx.beginPath();ctx.ellipse(x,y,54+(i%4)*22,12+(i%3)*7,i*.67,0,6.283);ctx.fill();
 }
 ctx.fillStyle="rgba(125,130,115,.08)";
 for(let i=0;i<9;i++){
  let x=((i*397-c.x*.22)%(W+300))-150,y=((i*211-c.y*.18)%(H+260))-130;
  ctx.beginPath();ctx.ellipse(x,y,128,24,i*.4,0,6.283);ctx.fill();
 }
}
function drawProp(p,c){if(p.x<c.x-80||p.x>c.x+W+80||p.y<c.y-80||p.y>c.y+H+80)return;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);if(p.type==="deadTree"){line(0,18,0,-p.r*1.2,5,"#2a1b10");line(0,-10,-p.r*.7,-p.r*.4,3,"#2a1b10");line(0,-14,p.r*.65,-p.r*.55,3,"#2a1b10");ctx.fillStyle="rgba(0,0,0,.25)";ctx.beginPath();ctx.ellipse(2,18,p.r*.7,p.r*.22,0,0,6.283);ctx.fill()}else if(p.type==="grave"){ctx.fillStyle="#3e413b";ctx.beginPath();ctx.roundRect(-p.r*.45,-p.r*.8,p.r*.9,p.r*1.2,4);ctx.fill();ctx.strokeStyle="#252821";ctx.strokeRect(-p.r*.25,-p.r*.35,p.r*.5,2)}else if(p.type==="bone"){ctx.strokeStyle="#b9b49a";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-p.r*.6,0);ctx.lineTo(p.r*.6,0);ctx.stroke();ctx.fillStyle="#b9b49a";ctx.beginPath();ctx.arc(-p.r*.7,0,3,0,6.283);ctx.arc(p.r*.7,0,3,0,6.283);ctx.fill()}else if(p.type==="ruin"){ctx.fillStyle="#33332c";ctx.fillRect(-p.r*.5,-p.r*.3,p.r,p.r*.6);ctx.fillStyle="#24241f";ctx.fillRect(-p.r*.2,-p.r*.8,p.r*.4,p.r*.5)}else{ctx.fillStyle="#35352e";ctx.beginPath();ctx.ellipse(0,0,p.r,p.r*.58,.2,0,6.283);ctx.fill()}ctx.restore()}
function drawHero(h){
 const walk=Math.sin(h.step)*3,flash=h.inv>0;
 ctx.save();
 ctx.translate(h.x,h.y);

 // Magical boost auras from Patch 4/5 remain intact.
 if(h.boosts&&h.boosts.god>0){
  ctx.globalAlpha=.32+.18*Math.sin(game.t*12);
  ctx.fillStyle="#f4e66a";
  ctx.beginPath();ctx.arc(0,0,36,0,6.283);ctx.fill();
  ctx.globalAlpha=1;
 }else if(h.boosts&&h.boosts.speed>0){
  ctx.globalAlpha=.17;
  ctx.fillStyle="#55e686";
  ctx.beginPath();ctx.arc(0,0,31,0,6.283);ctx.fill();
  ctx.globalAlpha=1;
 }

 // Grounded shadow.
 ctx.fillStyle="rgba(0,0,0,.43)";
 ctx.beginPath();ctx.ellipse(0,18,20,8,0,0,6.283);ctx.fill();

 // Dark cloak behind the body, with a slight walking sway.
 ctx.fillStyle=flash?"#fff0b0":"#211721";
 ctx.beginPath();
 ctx.moveTo(-11,-13);
 ctx.quadraticCurveTo(-22,5,-15,27+walk*.35);
 ctx.lineTo(0,22+walk*.15);
 ctx.lineTo(15,27-walk*.35);
 ctx.quadraticCurveTo(22,5,11,-13);
 ctx.closePath();
 ctx.fill();
 ctx.strokeStyle="rgba(0,0,0,.55)";
 ctx.lineWidth=2;
 ctx.stroke();

 // Legs and boots: longer, less cartoony proportions.
 line(-6,7,-12,25+walk,6,flash?"#fff0b0":"#283044");
 line(6,7,12,25-walk,6,flash?"#fff0b0":"#283044");
 line(-12,25+walk,-18,27+walk,4,"#15100d");
 line(12,25-walk,18,27-walk,4,"#15100d");

 // Left arm with shoulder plate.
 line(-11,-4,-23,6,6,flash?"#fff0b0":"#7b684d");
 ctx.fillStyle=flash?"#fff0b0":"#8f8b7d";
 ctx.beginPath();ctx.ellipse(-13,-6,7,5,-.45,0,6.283);ctx.fill();

 // Sword arm and sword: body stays upright, weapon aims and swings.
 ctx.save();
 const visualSwordDir = (h.boosts && h.boosts.berserk > 0 && Number.isFinite(h.spinDir)) ? h.spinDir : h.dir;
 ctx.rotate(visualSwordDir);

 // Armoured right arm toward the sword.
 line(10,-3,26,-1,6,flash?"#fff0b0":"#8b785c");
 ctx.fillStyle=flash?"#fff0b0":"#9d9a8d";
 ctx.beginPath();ctx.ellipse(12,-5,7,5,.35,0,6.283);ctx.fill();

 // Swing rotation is added on top of aim direction.
 let swordRot=0;
 if(h.swing>0){
  const progress=1-(h.swing/.17);
  swordRot=-1.15+progress*2.3;
 }

 // Pivot at the hero's hand.
 ctx.translate(24,-2);
 ctx.rotate(swordRot);

 // Medieval sword handle, crossguard and blade kept close to the working Patch 6 size.
 ctx.fillStyle="#8a5b29";
 ctx.fillRect(-4,-4,14,8);
 ctx.fillStyle="#c7a45d";
 ctx.fillRect(7,-12,5,24);
 ctx.strokeStyle="#dce6f0";
 ctx.lineWidth=6;
 ctx.beginPath();ctx.moveTo(11,0);ctx.lineTo(44,0);ctx.stroke();
 ctx.strokeStyle="rgba(255,255,255,.55)";
 ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(15,-2);ctx.lineTo(41,-2);ctx.stroke();
 ctx.fillStyle="#dce6f0";
 ctx.beginPath();ctx.moveTo(50,0);ctx.lineTo(40,-7);ctx.lineTo(40,7);ctx.closePath();ctx.fill();

 if(h.swing>0){
  ctx.globalAlpha=.88;
  ctx.strokeStyle="rgba(245,250,255,.95)";
  ctx.lineWidth=7;
  ctx.beginPath();ctx.arc(10,0,46,-.58,.76);ctx.stroke();
  ctx.strokeStyle="rgba(135,205,255,.34)";
  ctx.lineWidth=17;
  ctx.beginPath();ctx.arc(10,0,48,-.48,.64);ctx.stroke();
  ctx.globalAlpha=1;
 }
 ctx.restore();

 // Torso armour: darker steel breastplate with leather underlayer.
 ctx.fillStyle=flash?"#fff0b0":"#4c3d2d";
 ctx.beginPath();ctx.ellipse(0,2,14,19,0,0,6.283);ctx.fill();
 ctx.fillStyle=flash?"#fff0b0":"#2d3440";
 ctx.beginPath();
 ctx.moveTo(-12,-11);
 ctx.lineTo(12,-11);
 ctx.lineTo(10,14);
 ctx.quadraticCurveTo(0,21,-10,14);
 ctx.closePath();
 ctx.fill();
 ctx.strokeStyle="#9d9483";
 ctx.lineWidth=2;
 ctx.beginPath();
 ctx.moveTo(0,-10);ctx.lineTo(0,16);
 ctx.moveTo(-10,-4);ctx.lineTo(10,-4);
 ctx.moveTo(-8,7);ctx.lineTo(8,7);
 ctx.stroke();

 // Belt and small cloak clasp.
 ctx.fillStyle="#1b120c";ctx.fillRect(-11,10,22,4);
 ctx.fillStyle="#c7a45d";ctx.beginPath();ctx.arc(0,-12,3.5,0,6.283);ctx.fill();

 // Helmeted head with visor instead of cartoon face/hair.
 ctx.fillStyle=flash?"#fff0b0":"#8d9088";
 ctx.beginPath();ctx.ellipse(0,-22,10,11,0,0,6.283);ctx.fill();
 ctx.fillStyle="#333842";
 ctx.fillRect(-8,-24,16,5);
 ctx.strokeStyle="#c3c4ba";
 ctx.lineWidth=2;
 ctx.beginPath();
 ctx.moveTo(-8,-18);ctx.lineTo(8,-18);
 ctx.moveTo(0,-29);ctx.lineTo(0,-16);
 ctx.stroke();
 ctx.fillStyle="#1a0f0b";
 ctx.beginPath();ctx.arc(4,-21,1.6,0,6.283);ctx.fill();

 ctx.restore();
}

function drawBoneColossus(e,h,hit){
 const r=e.r,aim=Math.atan2(h.y-e.y,h.x-e.x);
 ctx.strokeStyle=hit?"#fff":"#d8cfb2";
 ctx.lineCap="round";
 ctx.lineWidth=8;
 // Huge skeletal legs and arms.
 line(-15,18,-26,48,8,ctx.strokeStyle);line(15,18,26,48,8,ctx.strokeStyle);
 line(-12,24,-3,48,5,"#8a8068");line(12,24,3,48,5,"#8a8068");
 line(-26,48,-38,50,6,"#c7bea3");line(26,48,38,50,6,"#c7bea3");
 line(-27,-8,-51,15,9,ctx.strokeStyle);
 ctx.save();ctx.rotate(aim);line(25,-8,56,7,9,ctx.strokeStyle);line(55,7,70,14,6,"#efe6ca");ctx.restore();
 // Rib cage.
 ctx.strokeStyle=hit?"#fff":"#cfc5a8";ctx.lineWidth=5;
 for(let i=0;i<5;i++){
  const y=-14+i*8;
  ctx.beginPath();ctx.ellipse(0,y,25-i*2,7,0,0,Math.PI);ctx.stroke();
 }
 line(0,-25,0,21,6,"#eee5c8");
 // Pelvis and shoulders.
 ctx.fillStyle=hit?"#fff":"#b8ad8e";ctx.beginPath();ctx.ellipse(0,19,25,10,0,0,6.283);ctx.fill();
 ctx.fillStyle="#8b826a";ctx.beginPath();ctx.ellipse(-22,-22,12,9,.2,0,6.283);ctx.ellipse(22,-22,12,9,-.2,0,6.283);ctx.fill();
 // Skull with horns and hollow eyes.
 ctx.fillStyle=hit?"#fff":"#e9dfc0";ctx.beginPath();ctx.ellipse(0,-47,21,18,0,0,6.283);ctx.fill();
 ctx.fillStyle="#0b0604";ctx.beginPath();ctx.ellipse(-7,-49,5,7,0,0,6.283);ctx.ellipse(7,-49,5,7,0,0,6.283);ctx.fill();
 ctx.strokeStyle="#d8cfb2";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-15,-58);ctx.lineTo(-33,-69);ctx.moveTo(15,-58);ctx.lineTo(33,-69);ctx.stroke();
 ctx.strokeStyle="#514834";ctx.lineWidth=2;for(let x=-6;x<=6;x+=4){line(x,-35,x,-28,2,"#514834")}
}
function drawLichKing(e,h,hit){
 const r=e.r,aim=Math.atan2(h.y-e.y,h.x-e.x),pulse=.5+.5*Math.sin(game.t*5);
 ctx.globalAlpha=.28+.16*pulse;ctx.fillStyle="#5bdcff";ctx.beginPath();ctx.arc(0,0,r+22,0,6.283);ctx.fill();ctx.globalAlpha=1;
 // Tattered robe.
 ctx.fillStyle=hit?"#fff":"#201126";ctx.beginPath();ctx.moveTo(-24,-29);ctx.lineTo(24,-29);ctx.lineTo(32,40);ctx.lineTo(14,30);ctx.lineTo(0,45);ctx.lineTo(-12,30);ctx.lineTo(-32,40);ctx.closePath();ctx.fill();
 ctx.strokeStyle="#6a4d7e";ctx.lineWidth=3;ctx.stroke();
 // Floating bones / hands.
 line(-18,-7,-42,6,6,"#d7d0e8");ctx.save();ctx.rotate(aim);line(18,-8,50,-4,6,"#d7d0e8");ctx.strokeStyle="#80e7ff";ctx.lineWidth=4;ctx.beginPath();ctx.arc(57,-4,9,0,6.283);ctx.stroke();ctx.restore();
 // Armour/collar.
 ctx.fillStyle="#111018";ctx.beginPath();ctx.moveTo(-22,-28);ctx.lineTo(0,-10);ctx.lineTo(22,-28);ctx.lineTo(0,-36);ctx.closePath();ctx.fill();
 // Pale skull face.
 ctx.fillStyle=hit?"#fff":"#d8f5ff";ctx.beginPath();ctx.ellipse(0,-45,15,18,0,0,6.283);ctx.fill();
 ctx.fillStyle="#061013";ctx.beginPath();ctx.ellipse(-5,-47,3.8,5,0,0,6.283);ctx.ellipse(5,-47,3.8,5,0,0,6.283);ctx.fill();
 ctx.fillStyle="#9ff0ff";ctx.beginPath();ctx.arc(-5,-47,1.4,0,6.283);ctx.arc(5,-47,1.4,0,6.283);ctx.fill();
 // Crown.
 ctx.fillStyle="#b49b45";ctx.beginPath();ctx.moveTo(-15,-61);ctx.lineTo(-7,-51);ctx.lineTo(0,-64);ctx.lineTo(7,-51);ctx.lineTo(15,-61);ctx.lineTo(12,-50);ctx.lineTo(-12,-50);ctx.closePath();ctx.fill();
}
function drawCorruptedWarlord(e,h,hit){
 const r=e.r,aim=Math.atan2(h.y-e.y,h.x-e.x),pulse=.5+.5*Math.sin(game.t*7);
 ctx.globalAlpha=.2+.14*pulse;ctx.fillStyle="#ff2a1d";ctx.beginPath();ctx.arc(0,3,r+17,0,6.283);ctx.fill();ctx.globalAlpha=1;
 // Bulky demonic armour.
 ctx.fillStyle=hit?"#fff":"#35100f";ctx.beginPath();ctx.ellipse(0,2,28,40,0,0,6.283);ctx.fill();
 ctx.fillStyle="#15100f";ctx.fillRect(-22,-19,44,42);
 ctx.strokeStyle="#8d201c";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-20,-5);ctx.lineTo(20,18);ctx.moveTo(20,-5);ctx.lineTo(-20,18);ctx.stroke();
 // Heavy shoulders and limbs.
 ctx.fillStyle="#5b1916";ctx.beginPath();ctx.ellipse(-28,-18,16,11,-.25,0,6.283);ctx.ellipse(28,-18,16,11,.25,0,6.283);ctx.fill();
 line(-18,15,-30,48,9,"#2b1412");line(18,15,30,48,9,"#2b1412");
 line(-28,-8,-52,14,10,"#4b1714");
 ctx.save();ctx.rotate(aim);line(28,-8,54,4,10,"#4b1714");ctx.strokeStyle="#b5a58a";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(50,4);ctx.lineTo(88,5);ctx.stroke();ctx.fillStyle="#b5a58a";ctx.beginPath();ctx.moveTo(95,5);ctx.lineTo(80,-6);ctx.lineTo(80,16);ctx.closePath();ctx.fill();ctx.restore();
 // Horned helm.
 ctx.fillStyle=hit?"#fff":"#4a2a22";ctx.beginPath();ctx.ellipse(0,-42,18,17,0,0,6.283);ctx.fill();
 ctx.strokeStyle="#d1c2a4";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-12,-51);ctx.lineTo(-32,-64);ctx.moveTo(12,-51);ctx.lineTo(32,-64);ctx.stroke();
 ctx.fillStyle="#ff4b2e";ctx.beginPath();ctx.arc(-5,-43,2.5,0,6.283);ctx.arc(5,-43,2.5,0,6.283);ctx.fill();
}
function drawWraithLord(e,h,hit){
 const pulse=.5+.5*Math.sin(game.t*8),phased=!!e.phased;
 ctx.fillStyle="#8844cc";ctx.globalAlpha=(phased?.08:.18)+.1*pulse;
 ctx.beginPath();ctx.arc(0,0,e.r+20,0,6.283);ctx.fill();
 ctx.globalAlpha=phased?.3:.92;
 ctx.fillStyle=hit?"#fff":"#1a0a2e";
 ctx.beginPath();ctx.moveTo(-20,-26);ctx.lineTo(20,-26);ctx.lineTo(28,38);ctx.lineTo(10,28);ctx.lineTo(0,42);ctx.lineTo(-10,28);ctx.lineTo(-28,38);ctx.closePath();ctx.fill();
 ctx.strokeStyle="#5533aa";ctx.lineWidth=3;ctx.stroke();
 const aim=Math.atan2(h.y-e.y,h.x-e.x);
 line(-16,-6,-40,10,6,hit?"#fff":"#ccc0e8");
 ctx.save();ctx.rotate(aim);line(16,-6,44,4,6,hit?"#fff":"#ccc0e8");ctx.restore();
 ctx.fillStyle=hit?"#fff":"#d4c8f0";ctx.beginPath();ctx.ellipse(0,-42,14,17,0,0,6.283);ctx.fill();
 ctx.fillStyle="#120820";ctx.beginPath();ctx.ellipse(-5,-44,4,6,0,0,6.283);ctx.ellipse(5,-44,4,6,0,0,6.283);ctx.fill();
 ctx.fillStyle="#aa66ff";ctx.beginPath();ctx.arc(-5,-44,1.8,0,6.283);ctx.arc(5,-44,1.8,0,6.283);ctx.fill();
 ctx.strokeStyle="#8844dd";ctx.lineWidth=3;
 for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*6,-58);ctx.quadraticCurveTo(i*6+3,-64+pulse*4,i*6,-58-(8+Math.abs(i)*4));ctx.stroke();}
 ctx.globalAlpha=1;
}
function drawFrostTwin(e,h,hit){
 const pulse=.5+.5*Math.sin(game.t*7),aim=Math.atan2(h.y-e.y,h.x-e.x),enraged=!!e.enraged;
 ctx.globalAlpha=(enraged?.32:.16)+.1*pulse;ctx.fillStyle="#a0e8ff";ctx.beginPath();ctx.arc(0,0,e.r+18,0,6.283);ctx.fill();ctx.globalAlpha=1;
 ctx.fillStyle=hit?"#fff":enraged?"#1a3a5e":"#0a1a2e";
 ctx.beginPath();ctx.moveTo(-16,-22);ctx.lineTo(16,-22);ctx.lineTo(22,34);ctx.lineTo(8,24);ctx.lineTo(0,38);ctx.lineTo(-8,24);ctx.lineTo(-22,34);ctx.closePath();ctx.fill();
 ctx.strokeStyle=enraged?"#55aaff":"#3388cc";ctx.lineWidth=3;ctx.stroke();
 line(-12,-4,-34,10,6,hit?"#fff":"#88ccff");
 ctx.save();ctx.rotate(aim);
 line(12,-4,38,6,6,hit?"#fff":"#88ccff");
 ctx.fillStyle=enraged?"#ffffff":"#c8f0ff";ctx.beginPath();ctx.moveTo(36,4);ctx.lineTo(44,-8);ctx.lineTo(52,4);ctx.lineTo(44,18);ctx.closePath();ctx.fill();
 ctx.restore();
 ctx.fillStyle=hit?"#fff":"#1a2e44";ctx.fillRect(-12,-8,24,22);
 ctx.strokeStyle="#55aaff";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(0,14);ctx.moveTo(-10,-2);ctx.lineTo(10,-2);ctx.stroke();
 ctx.fillStyle=hit?"#fff":"#c8e8ff";ctx.beginPath();ctx.ellipse(0,-36,12,14,0,0,6.283);ctx.fill();
 ctx.fillStyle="#061020";ctx.beginPath();ctx.ellipse(-4,-38,3,4.5,0,0,6.283);ctx.ellipse(4,-38,3,4.5,0,0,6.283);ctx.fill();
 ctx.fillStyle=enraged?"#ffffff":"#88ddff";ctx.beginPath();ctx.arc(-4,-38,1.6,0,6.283);ctx.arc(4,-38,1.6,0,6.283);ctx.fill();
 ctx.strokeStyle=enraged?"#fff":"#a0e8ff";ctx.lineWidth=enraged?3:2;
 for(let i=-2;i<=2;i++){const h2=10+Math.abs(i)*5;ctx.beginPath();ctx.moveTo(i*5,-48);ctx.lineTo(i*5,-48-h2);ctx.stroke();}
}
function drawAshTwin(e,h,hit){
 const pulse=.5+.5*Math.sin(game.t*9),aim=Math.atan2(h.y-e.y,h.x-e.x),enraged=!!e.enraged;
 ctx.globalAlpha=(enraged?.36:.18)+.12*pulse;ctx.fillStyle="#ff6a22";ctx.beginPath();ctx.arc(0,0,e.r+18,0,6.283);ctx.fill();ctx.globalAlpha=1;
 ctx.fillStyle=hit?"#fff":enraged?"#5e1a0a":"#2e1008";
 ctx.beginPath();ctx.moveTo(-16,-22);ctx.lineTo(16,-22);ctx.lineTo(22,34);ctx.lineTo(8,24);ctx.lineTo(0,38);ctx.lineTo(-8,24);ctx.lineTo(-22,34);ctx.closePath();ctx.fill();
 ctx.strokeStyle=enraged?"#ff4400":"#cc4400";ctx.lineWidth=3;ctx.stroke();
 ctx.fillStyle="#ff9944";ctx.globalAlpha=.7+.3*pulse;
 for(let i=0;i<3;i++){const sp=i*2.1+game.t*3;ctx.beginPath();ctx.arc(Math.cos(sp)*14,Math.sin(sp*1.3)*12+8,2+pulse*1.5,0,6.283);ctx.fill();}
 ctx.globalAlpha=1;
 line(-12,-4,-34,10,6,hit?"#fff":"#cc6622");
 ctx.save();ctx.rotate(aim);
 line(12,-4,38,6,6,hit?"#fff":"#cc6622");
 ctx.fillStyle=enraged?"#ffaa00":"#ff6622";ctx.beginPath();ctx.moveTo(34,6);ctx.quadraticCurveTo(44,-6,52,2);ctx.quadraticCurveTo(46,14,34,6);ctx.fill();
 ctx.restore();
 ctx.fillStyle=hit?"#fff":"#3a1a08";ctx.fillRect(-12,-8,24,22);
 ctx.strokeStyle=enraged?"#ff6600":"#aa3300";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(0,14);ctx.moveTo(-10,-2);ctx.lineTo(10,-2);ctx.stroke();
 ctx.fillStyle=hit?"#fff":"#ffe0c8";ctx.beginPath();ctx.ellipse(0,-36,12,14,0,0,6.283);ctx.fill();
 ctx.fillStyle="#1a0600";ctx.beginPath();ctx.ellipse(-4,-38,3,4.5,0,0,6.283);ctx.ellipse(4,-38,3,4.5,0,0,6.283);ctx.fill();
 ctx.fillStyle=enraged?"#ffaa00":"#ff6622";ctx.beginPath();ctx.arc(-4,-38,1.6,0,6.283);ctx.arc(4,-38,1.6,0,6.283);ctx.fill();
 ctx.fillStyle=hit?"#fff":enraged?"#ff4400":"#552200";
 ctx.beginPath();ctx.moveTo(-14,-46);ctx.lineTo(-8,-56);ctx.lineTo(-3,-48);ctx.lineTo(0,-60);ctx.lineTo(3,-48);ctx.lineTo(8,-56);ctx.lineTo(14,-46);ctx.lineTo(12,-44);ctx.lineTo(-12,-44);ctx.closePath();ctx.fill();
}
function drawBoneDragon(e,h,hit){
 const charging=e.chargeTime>0,aim=Math.atan2(h.y-e.y,h.x-e.x);
 const pulse=.5+.5*Math.sin(game.t*(charging?14:6));
 ctx.save();ctx.rotate(aim);
 // aura
 ctx.globalAlpha=(charging?.45:.22)+.1*pulse;ctx.fillStyle=e.aura||"#e8c84a";
 ctx.beginPath();ctx.arc(0,0,e.r+22,0,6.283);ctx.fill();ctx.globalAlpha=1;
 // wings
 ctx.fillStyle=hit?"#fff":"#a89870";
 ctx.beginPath();ctx.moveTo(-10,-10);ctx.quadraticCurveTo(-60,-55,-90,-30);ctx.quadraticCurveTo(-65,5,-10,10);ctx.closePath();ctx.fill();
 ctx.beginPath();ctx.moveTo(-10,10);ctx.quadraticCurveTo(-60,55,-90,30);ctx.quadraticCurveTo(-65,-5,-10,-10);ctx.closePath();ctx.fill();
 // body
 ctx.fillStyle=hit?"#fff":e.body||"#c8bfa0";
 ctx.beginPath();ctx.ellipse(0,0,e.r,e.r*.72,0,0,6.283);ctx.fill();
 ctx.strokeStyle=charging?"#e8c84a":"#a89060";ctx.lineWidth=charging?4:2;ctx.stroke();
 // spine ridges
 ctx.fillStyle=hit?"#fff":"#ede4c8";
 for(let ri=0;ri<5;ri++){const rx=-e.r*.6+ri*(e.r*.28);ctx.beginPath();ctx.moveTo(rx,-e.r*.72);ctx.lineTo(rx+6,-e.r*.72-10);ctx.lineTo(rx+12,-e.r*.72);ctx.fill();}
 // neck + skull head
 ctx.fillStyle=hit?"#fff":e.head||"#ede4c8";
 ctx.beginPath();ctx.ellipse(e.r+16,0,22,14,0,0,6.283);ctx.fill();
 ctx.strokeStyle=charging?"#e8c84a":"#b8a878";ctx.lineWidth=2;ctx.stroke();
 // jaw
 ctx.fillStyle=hit?"#fff":"#c8bfa0";
 ctx.beginPath();ctx.moveTo(e.r+6,6);ctx.lineTo(e.r+38,10);ctx.lineTo(e.r+6,14);ctx.closePath();ctx.fill();
 // eye
 ctx.fillStyle=charging?"#ff4400":"#e8c84a";
 ctx.beginPath();ctx.arc(e.r+20,-4,4,0,6.283);ctx.fill();
 ctx.restore();
}
function drawPlagueHarbinger(e,h,hit){
 const pulse=.5+.5*Math.sin(game.t*4),aim=Math.atan2(h.y-e.y,h.x-e.x);
 ctx.globalAlpha=.18+.1*pulse;ctx.fillStyle="#4ecf22";ctx.beginPath();ctx.arc(0,0,e.r+26,0,6.283);ctx.fill();ctx.globalAlpha=1;
 ctx.fillStyle=hit?"#fff":"#1a3a0a";ctx.beginPath();ctx.ellipse(0,4,e.r*.82,e.r*1.08,0,0,6.283);ctx.fill();
 ctx.strokeStyle="#2a5c14";ctx.lineWidth=3;ctx.stroke();
 ctx.fillStyle=hit?"#fff":"#4ecf22";
 for(let i=0;i<5;i++){const pa=i*1.257,pr=e.r*.62+Math.sin(i*2.4)*8;ctx.beginPath();ctx.arc(Math.cos(pa)*pr,Math.sin(pa)*pr,5+Math.sin(i+game.t*2)*2,0,6.283);ctx.fill();}
 line(-e.r*.6,0,-e.r*1.1,18,8,hit?"#fff":"#2a5c14");
 ctx.save();ctx.rotate(aim);line(e.r*.6,0,e.r*1.1,12,8,hit?"#fff":"#2a5c14");ctx.restore();
 ctx.fillStyle=hit?"#fff":"#253d18";ctx.beginPath();ctx.ellipse(0,-e.r*.82,e.r*.58,e.r*.52,0,0,6.283);ctx.fill();
 ctx.fillStyle="#0a1a04";ctx.beginPath();ctx.ellipse(-6,-e.r*.88,4,5.5,0,0,6.283);ctx.ellipse(6,-e.r*.88,4,5.5,0,0,6.283);ctx.fill();
 ctx.fillStyle="#7ecf3a";ctx.beginPath();ctx.arc(-6,-e.r*.88,2,0,6.283);ctx.arc(6,-e.r*.88,2,0,6.283);ctx.fill();
 ctx.fillStyle=hit?"#fff":"#4ecf22";ctx.globalAlpha=.6+.2*pulse;ctx.beginPath();ctx.arc(0,e.r*.9,6+pulse*3,0,6.283);ctx.fill();ctx.globalAlpha=1;
}
function drawNecromancer(e,h,hit){
 const pulse=.5+.5*Math.sin(game.t*6.5),summoning=(e.summonFlash||0)>0;
 ctx.globalAlpha=.16+.14*pulse;
 ctx.fillStyle="#85ff9c";ctx.beginPath();ctx.arc(0,0,e.r+24,0,6.283);ctx.fill();
 ctx.globalAlpha=summoning?.42:.92;
 ctx.fillStyle=hit?"#fff":"#1b1028";
 ctx.beginPath();ctx.moveTo(-22,-28);ctx.lineTo(22,-28);ctx.lineTo(30,38);ctx.lineTo(10,30);ctx.lineTo(0,46);ctx.lineTo(-10,30);ctx.lineTo(-30,38);ctx.closePath();ctx.fill();
 ctx.strokeStyle="#4c3b6f";ctx.lineWidth=3;ctx.stroke();
 const aim=Math.atan2(h.y-e.y,h.x-e.x);
 line(-14,-8,-42,10,6,hit?"#fff":"#c9ffd8");
 ctx.save();ctx.rotate(aim);line(14,-8,48,6,6,hit?"#fff":"#c9ffd8");ctx.restore();
 ctx.fillStyle=hit?"#fff":"#ede6ff";ctx.beginPath();ctx.ellipse(0,-43,15,18,0,0,6.283);ctx.fill();
 ctx.fillStyle="#0e0816";ctx.beginPath();ctx.ellipse(-5,-45,4,6,0,0,6.283);ctx.ellipse(5,-45,4,6,0,0,6.283);ctx.fill();
 ctx.fillStyle="#85ff9c";ctx.beginPath();ctx.arc(-5,-45,1.7,0,6.283);ctx.arc(5,-45,1.7,0,6.283);ctx.fill();
 ctx.strokeStyle="#85ff9c";ctx.lineWidth=3;
 ctx.beginPath();ctx.moveTo(0,-60);ctx.lineTo(0,-78);ctx.stroke();
 ctx.beginPath();ctx.arc(0,-80,7,0,6.283);ctx.stroke();
 for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*7,-58);ctx.quadraticCurveTo(i*7+2,-66+pulse*4,i*7,-58-(6+Math.abs(i)*3));ctx.stroke();}
 ctx.globalAlpha=1;
}
function drawEnemy(e,h){
 const aim=Math.atan2(h.y-e.y,h.x-e.x),hit=e.hit>0;
 ctx.save();ctx.translate(e.x,e.y);
 ctx.fillStyle="rgba(0,0,0,.55)";ctx.beginPath();ctx.ellipse(0,e.r*.95,e.r*1.15,e.r*.42,0,0,6.283);ctx.fill();
 if(e.isBoss){
  ctx.strokeStyle=e.aura||"#ffd483";ctx.lineWidth=3;ctx.globalAlpha=.48+.18*Math.sin(game.t*6);ctx.beginPath();ctx.arc(0,2,e.r+13,0,6.283);ctx.stroke();ctx.globalAlpha=1;
  if(e.bossKey==="bone")drawBoneColossus(e,h,hit);
  else if(e.bossKey==="lich")drawLichKing(e,h,hit);
  else if(e.bossKey==="wraith")drawWraithLord(e,h,hit);
  else if(e.bossKey==="necromancer")drawNecromancer(e,h,hit);
  else if(e.bossKey==="plague")drawPlagueHarbinger(e,h,hit);
  else if(e.bossKey==="twins"&&e.twinRole==="frost")drawFrostTwin(e,h,hit);
  else if(e.bossKey==="twins"&&e.twinRole==="ash")drawAshTwin(e,h,hit);
  else if(e.bossKey==="dragon")drawBoneDragon(e,h,hit);
  else drawCorruptedWarlord(e,h,hit);
  ctx.restore();
  ctx.fillStyle="#240606";ctx.fillRect(e.x-e.r,e.y-e.r-26,e.r*2,5);
  ctx.fillStyle=e.aura||"#ff8a22";ctx.fillRect(e.x-e.r,e.y-e.r-26,e.r*2*Math.max(0,e.hp/e.maxHp),5);
  ctx.fillStyle="#ffd483";ctx.font="bold 13px Georgia";ctx.textAlign="center";ctx.fillText(e.type,e.x,e.y-e.r-32);
  return;
 }
 let limb=e.type==="Skeleton"?"#d7ceb2":e.type==="Ghoul"?"#5f9658":"#514957";
 line(-8,8,-14,23,e.type==="Death Knight"?7:5,limb);line(8,8,14,23,e.type==="Death Knight"?7:5,limb);line(-10,-2,-23,7,e.type==="Death Knight"?7:5,limb);
 ctx.save();ctx.rotate(aim);line(10,-2,27,2,e.type==="Death Knight"?7:5,limb);if(e.type==="Death Knight"){ctx.strokeStyle="#c7ced8";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(23,2);ctx.lineTo(53,3);ctx.stroke()}ctx.restore();
 ctx.fillStyle=hit?"#fff":e.body;ctx.beginPath();ctx.ellipse(0,2,e.r*.72,e.r*1.05,0,0,6.283);ctx.fill();
 if(e.type==="Skeleton"){ctx.strokeStyle="#514834";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-8,0);ctx.lineTo(8,0);ctx.moveTo(-7,6);ctx.lineTo(7,6);ctx.moveTo(-6,12);ctx.lineTo(6,12);ctx.stroke()}
 if(e.type==="Archer"){ctx.save();ctx.rotate(aim);ctx.strokeStyle="#6b4a24";ctx.lineWidth=3;ctx.beginPath();ctx.arc(18,0,10,-1.1,1.1);ctx.stroke();ctx.strokeStyle="#d8d8d8";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(18,0);ctx.lineTo(34,0);ctx.stroke();ctx.restore();}
 if(e.type==="Death Knight"){ctx.fillStyle="#292530";ctx.fillRect(-13,-10,26,25);ctx.strokeStyle="#9b895f";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-11,-7);ctx.lineTo(11,15);ctx.moveTo(11,-7);ctx.lineTo(-11,15);ctx.stroke()}
 ctx.fillStyle=hit?"#fff":e.head;ctx.beginPath();ctx.ellipse(0,-e.r*.92,e.r*.58,e.r*.56,0,0,6.283);ctx.fill();
 ctx.fillStyle=e.type==="Death Knight"?"#e24444":"#14110e";ctx.beginPath();ctx.arc(4,-e.r*.98,2,0,6.283);ctx.arc(-3,-e.r*.98,1.8,0,6.283);ctx.fill();
 ctx.restore();
 ctx.fillStyle="#240606";ctx.fillRect(e.x-e.r,e.y-e.r-14,e.r*2,4);ctx.fillStyle="#c93030";ctx.fillRect(e.x-e.r,e.y-e.r-14,e.r*2*Math.max(0,e.hp/e.maxHp),4);
}
function draw(){if(!game){ctx.fillStyle="#050705";ctx.fillRect(0,0,W,H);return}const c=game.cam;drawTerrain(c);ctx.save();ctx.translate(-c.x,-c.y);ctx.strokeStyle="#2f2416";ctx.lineWidth=16;ctx.strokeRect(0,0,world.w,world.h);for(const p of game.props)drawProp(p,c);if(game.poisonPools)for(const p of game.poisonPools){const pa=Math.min(1,p.life/p.maxLife)*.72;ctx.globalAlpha=pa;ctx.fillStyle="#1a4a0a";ctx.beginPath();ctx.ellipse(p.x,p.y,p.r,p.r*.42,0,0,6.283);ctx.fill();ctx.fillStyle="#4ecf22";ctx.beginPath();ctx.ellipse(p.x,p.y,p.r*.72,p.r*.28,0,0,6.283);ctx.fill();ctx.globalAlpha=pa*.6;ctx.fillStyle="#8fff55";ctx.beginPath();ctx.ellipse(p.x-p.r*.2,p.y-p.r*.08,p.r*.28,p.r*.1,-.3,0,6.283);ctx.fill();ctx.globalAlpha=1;}for(const d of game.drops){const bob=Math.sin(d.bob)*3;ctx.fillStyle=dropColor(d.type);ctx.beginPath();ctx.ellipse(d.x,d.y+bob,d.type==="god"?12:9,d.type==="god"?15:13,0,0,6.283);ctx.fill();ctx.fillStyle="#f3e6c3";if(d.type==="speed"){ctx.fillRect(d.x-7,d.y-2+bob,14,4)}else if(d.type==="attack"){ctx.fillRect(d.x-8,d.y-12+bob,16,5);ctx.fillRect(d.x-2,d.y-15+bob,4,18)}else if(d.type==="god"){ctx.beginPath();ctx.arc(d.x,d.y+bob,5,0,6.283);ctx.fill()}else{ctx.fillRect(d.x-4,d.y-12+bob,8,5)}ctx.fillStyle="rgba(255,255,255,.42)";ctx.beginPath();ctx.ellipse(d.x-3,d.y-2+bob,2,6,0,0,6.283);ctx.fill()}for(const b of game.balls){ctx.fillStyle="#ff8a22";ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,6.283);ctx.fill();ctx.strokeStyle="#ffd05b";ctx.lineWidth=3;ctx.stroke()}const h=game.hero;const actors=[...game.enemies].sort((a,b)=>a.y-b.y);for(const e of actors)drawEnemy(e,h);drawHero(h);for(const a of game.arrows){
 ctx.save();
 ctx.translate(a.x,a.y);
 ctx.rotate(Math.atan2(a.vy,a.vx));
 ctx.strokeStyle=a.color||"#d8d8d8";
 ctx.lineWidth=a.boss?4:2;
 ctx.beginPath();
 ctx.moveTo(-10,0);
 ctx.lineTo(10,0);
 ctx.stroke();
 ctx.fillStyle="#8a5b29";
 ctx.fillRect(-8,-1,16,2);
 ctx.restore();
}
if(game.shadowOrbs)for(const o of game.shadowOrbs){ctx.globalAlpha=Math.min(1,o.life/5)*.85;ctx.fillStyle="#9966ff";ctx.beginPath();ctx.arc(o.x,o.y,9,0,6.283);ctx.fill();ctx.fillStyle="#cc99ff";ctx.beginPath();ctx.arc(o.x,o.y,4,0,6.283);ctx.fill();ctx.globalAlpha=1;}
for(const l of game.bolts){ctx.strokeStyle="rgba(150,225,255,.92)";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(l.x1,l.y1);ctx.lineTo((l.x1+l.x2)/2+Math.random()*24-12,(l.y1+l.y2)/2+Math.random()*24-12);ctx.lineTo(l.x2,l.y2);ctx.stroke()}for(const f of game.fx){
 if(f.text){
   f.y += (f.vy||-20)*(1/60);
   ctx.globalAlpha=Math.max(0,f.life/f.max);
   ctx.fillStyle=f.color||"#fff";
   ctx.font="bold 28px Georgia";
   ctx.textAlign="center";
   ctx.fillText(f.text,f.x-c.x,f.y-c.y);
   ctx.globalAlpha=1;
 } else {
   ctx.globalAlpha=Math.max(0,f.life/f.max);ctx.fillStyle=f.color;ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,6.283);ctx.fill();ctx.globalAlpha=1;
 }
}ctx.restore();const grd=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.12,W/2,H/2,Math.max(W,H)*.72);grd.addColorStop(0,"rgba(185,155,105,.05)");grd.addColorStop(.55,"rgba(50,60,45,.10)");grd.addColorStop(1,"rgba(0,0,0,.72)");ctx.fillStyle=grd;ctx.fillRect(0,0,W,H);if(game.paused&&!game.over){ctx.fillStyle="rgba(0,0,0,.5)";ctx.fillRect(0,0,W,H);ctx.fillStyle="#ffe4a4";ctx.font="bold 42px Georgia";ctx.textAlign="center";ctx.fillText("Paused",W/2,H/2)}}
function loop(now){swordStuckSafety();if(game){const dt=Math.min(.035,(now-game.last)/1000);game.last=now;update(dt)}sanitizeSwordState();draw();requestAnimationFrame(loop)}
requestAnimationFrame(loop);
