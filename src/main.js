import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createWorld, generateLocation, presetLocation, PRESET_NAMES } from './world.js';
import { HEROES, Fighter, COMBO_WINDOW } from './fighter.js';
import { AIController } from './ai.js';
import { Effects, WarpStreaks } from './effects.js';
import { spawnProjectile, updateProjectiles, clearProjectiles } from './combat.js';
import { basis } from './util.js';
import { isTouch, TouchControls } from './touch.js';

const $ = (id) => document.getElementById(id);
const WARP_COOLDOWN = 12; // seconds in a system before a launch can warp again

// ---------- Renderer ----------
const renderer = new THREE.WebGLRenderer({ canvas: $('c'), antialias: true, powerPreference: 'high-performance' });
// Phones: render at a lower pixel ratio to keep the frame rate up
renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 15000);
scene.add(camera); // so camera-attached effects render
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.9, 0.5, 0.8));
composer.addPass(new OutputPass());
const fitCamera = () => { camera.aspect = innerWidth / innerHeight; camera.fov = camera.aspect < 1 ? 85 : 65; camera.updateProjectionMatrix(); };
fitCamera();
addEventListener('resize', () => {
  fitCamera();
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);
});
const warpFx = new WarpStreaks(camera);

// ---------- Sound (synthesized, no files needed) ----------
let actx = null;
const SFX = {
  whiff: [400, 200, 'sine', 0.08, 0.05], hit: [160, 40, 'sawtooth', 0.18, 0.22], heavy: [110, 30, 'sawtooth', 0.3, 0.3],
  block: [700, 500, 'triangle', 0.08, 0.12], beam: [900, 250, 'sawtooth', 0.2, 0.07], zap: [1600, 500, 'square', 0.1, 0.05],
  orb: [500, 900, 'sine', 0.18, 0.1], blink: [1800, 200, 'sine', 0.15, 0.12], freeze: [2400, 1200, 'triangle', 0.4, 0.12],
  dash: [250, 900, 'sine', 0.15, 0.08], boom: [90, 25, 'sawtooth', 0.6, 0.35], slow: [900, 120, 'sine', 0.8, 0.15],
  launch: [180, 30, 'square', 0.5, 0.3], warp: [60, 1400, 'sawtooth', 1.3, 0.15],
  ko: [220, 40, 'sawtooth', 1.2, 0.3], tick: [660, 660, 'square', 0.08, 0.06], go: [440, 880, 'square', 0.3, 0.08],
};
function sfx(name) {
  if (!actx || !SFX[name]) return;
  const [f0, f1, type, dur, vol] = SFX[name], t = actx.currentTime;
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur);
}

// ---------- Input ----------
const keys = new Set(), pressed = new Set();
const mouse = { l: false, r: false };
addEventListener('keydown', (e) => {
  if (!e.repeat) pressed.add(e.code);
  keys.add(e.code);
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
});
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => { keys.clear(); mouse.l = mouse.r = false; });
$('c').addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') return; if (e.button === 0) mouse.l = true; if (e.button === 2) mouse.r = true; });
addEventListener('mouseup', (e) => { if (e.button === 0) mouse.l = false; if (e.button === 2) mouse.r = false; });
addEventListener('contextmenu', (e) => e.preventDefault());
const k = (...codes) => codes.some((c) => keys.has(c)) ? 1 : 0;
const touch = isTouch ? new TouchControls($('touch')) : null;
document.body.classList.toggle('touch', !!touch);
const showTouch = (on) => { if (!touch) return; $('touch').classList.toggle('hidden', !on); if (!on) touch.release(); };

// ---------- Game state ----------
const game = {
  scene, state: 'menu', paused: false, fx: new Effects(scene), projectiles: [], world: null,
  player: null, cpu: null, ai: null, wins: [0, 0], round: 1, timer: 0, shake: 0, hitStop: 0,
  sector: 1, matchSeed: 0, locTime: 0, warp: null,
  settings: { hero: 'volt', opponent: 'random', diff: 'normal', arena: 'earth' }, sfx,
  spawnProjectile(owner, origin, vel, spec) { spawnProjectile(this, owner, origin, vel, spec); },
  onHit(target, dmg, blocked, melee, launch) {
    if (blocked) { sfx('block'); return; }
    const heavy = dmg >= 12 || launch;
    sfx(launch ? 'launch' : heavy ? 'heavy' : 'hit');
    this.shake = Math.max(this.shake, launch ? 1.6 : heavy ? 0.9 : 0.4);
    if (melee || heavy) this.hitStop = launch ? 0.18 : heavy ? 0.08 : 0.04;
  },
  onLaunch(attacker, victim, dir) {
    if (this.state !== 'fight' || victim.dead) return;
    flashText('LAUNCH!', 600);
    if (this.locTime >= WARP_COOLDOWN) startWarp(attacker, victim, dir);
  },
};
const playerBasis = { fwd: new THREE.Vector3(), right: new THREE.Vector3(1, 0, 0), up: new THREE.Vector3() };

const show = (id) => $(id).classList.remove('hidden');
const hide = (id) => $(id).classList.add('hidden');
let textTimer = 0;
function flashText(t, ms) {
  $('center').textContent = t; clearTimeout(textTimer);
  if (ms) textTimer = setTimeout(() => { if ($('center').textContent === t) $('center').textContent = ''; }, ms);
}

function setWorld(loc) {
  game.world?.dispose();
  game.world = createWorld(scene, loc);
  game.locTime = 0;
}

function showBanner() {
  const L = game.world.loc;
  $('bannerSector').textContent = `SECTOR ${game.sector}`;
  $('bannerName').textContent = L.name;
  $('bannerType').textContent = L.label + (L.type === 'blackhole' ? ': gravity pulls you in' : L.type === 'star' ? ': the surface burns' : '');
  const b = $('banner'); b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
  $('sectorLabel').textContent = `Sector ${game.sector} · ${L.name}`;
}

function startMatch() {
  if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch { /* no audio */ } }
  cleanup();
  const s = game.settings;
  const others = Object.keys(HEROES).filter((id) => id !== s.hero);
  const oppId = s.opponent === 'random' || s.opponent === s.hero ? others[(Math.random() * others.length) | 0] : s.opponent;
  game.matchSeed = (Math.random() * 1e9) | 0; game.sector = 1;
  setWorld(presetLocation(s.arena));
  const pDef = HEROES[s.hero], cDef = HEROES[oppId];
  game.player = new Fighter(scene, pDef);
  game.cpu = new Fighter(scene, cDef);
  game.ai = new AIController(game.cpu, game.player, s.diff);
  game.demoAI = DEMO ? new AIController(game.player, game.cpu, 'hard') : null;
  game.wins = [0, 0]; game.round = 1;
  $('p1name').textContent = pDef.name + ' (YOU)'; $('p2name').textContent = cDef.name;
  $('beamName').textContent = pDef.beam.name; $('abilityName').textContent = pDef.ability.name;
  $('tbBeamName').textContent = pDef.beam.name.toUpperCase(); $('tbAbilityName').textContent = pDef.ability.name.toUpperCase();
  show('hud'); hide('menu'); hide('over'); showTouch(true);
  if (touch) { document.documentElement.requestFullscreen?.().then(() => screen.orientation?.lock?.('landscape')).catch(() => {}); }
  showBanner();
  startRound();
}

function startRound() {
  clearProjectiles(game);
  game.fx.clear();
  game.player.reset(new THREE.Vector3(0, 0, -16));
  game.cpu.reset(new THREE.Vector3(0, 0, 16));
  game.state = 'intro'; game.timer = 3; game.warp = null;
  $('roundLabel').textContent = `ROUND ${game.round}`;
  lastCount = 4;
}

function startWarp(attacker, victim, dir) {
  game.state = 'warp';
  game.warp = { t: 0, dir: dir.clone().normalize(), attacker, victim, swapped: false };
  clearProjectiles(game);
  sfx('warp');
}

// Called at the peak of the white flash: build the next system and drop the fighters in
function arriveNextSystem() {
  game.sector++;
  const seed = (game.matchSeed + game.sector * 7919) >>> 0;
  setWorld(generateLocation(seed, game.world.loc.type));
  const P = game.player, C = game.cpu, w = game.warp;
  P.reset(new THREE.Vector3(0, 0, -16), false); C.reset(new THREE.Vector3(0, 0, 16), false);
  w.victim.stun = 0.7;
  w.victim.vel.set(0, 0, w.victim === P ? -30 : 30);
  game.fx.clear();
  camera.position.set(0, 3, -26);
  showBanner();
}

function cleanup() {
  clearProjectiles(game);
  game.fx.clear();
  game.player?.dispose(); game.cpu?.dispose();
  game.player = game.cpu = null;
  warpFx.intensity = 0; $('flash').style.opacity = 0;
}

function toMenu() {
  cleanup();
  setWorld(presetLocation(game.settings.arena === 'random' ? 'deep' : game.settings.arena));
  game.state = 'menu'; game.paused = false;
  hide('hud'); hide('over'); hide('pause'); show('menu'); showTouch(false); $('center').textContent = '';
  $('banner').classList.remove('show');
}

// ---------- Per-frame ----------
function playerIntent() {
  const { fwd, right } = basis(game.cpu.pos.clone().sub(game.player.pos), playerBasis);
  let f = k('KeyW', 'ArrowUp') - k('KeyS', 'ArrowDown'), s = k('KeyD', 'ArrowRight') - k('KeyA', 'ArrowLeft'), v = k('Space') - k('KeyC', 'ControlLeft');
  const th = touch?.held, tp = touch?.pressed;
  if (touch) { const st = touch.stick; f += st.forward; s += st.strafe; v += (th.has('up') ? 1 : 0) - (th.has('down') ? 1 : 0); }
  const move = new THREE.Vector3().addScaledVector(fwd, f).addScaledVector(right, s).add(new THREE.Vector3(0, v, 0));
  return {
    move,
    punch: k('KeyJ') || mouse.l || !!th?.has('punch'),
    beam: k('KeyK') || mouse.r || !!th?.has('beam'),
    dash: pressed.has('ShiftLeft') || pressed.has('ShiftRight') || !!tp?.has('dash'),
    ability: pressed.has('KeyQ') || !!tp?.has('ability'),
    block: !!k('KeyF') || !!th?.has('block'),
  };
}

let lastCount = 4;
const camTarget = new THREE.Vector3(), camPos = new THREE.Vector3();
let menuAngle = 0;

function updateWarp(realDt) {
  const w = game.warp;
  w.t += realDt;
  if (!w.swapped) {
    // Both fighters rocket along the launch direction
    w.victim.vel.copy(w.dir).multiplyScalar(170);
    w.attacker.vel.copy(w.dir).multiplyScalar(165).addScaledVector(w.victim.pos.clone().sub(w.attacker.pos), 2);
    w.attacker.dashT = 0.2; // skip speed cap
  }
  warpFx.intensity = w.swapped ? Math.max(0, 1 - (w.t - 1.2) / 0.6) : Math.min(1, w.t / 0.6);
  const flash = w.t < 0.9 ? 0 : w.t < 1.2 ? (w.t - 0.9) / 0.3 : Math.max(0, 1 - (w.t - 1.2) / 0.5);
  $('flash').style.opacity = flash.toFixed(3);
  if (!w.swapped && w.t >= 1.2) { w.swapped = true; arriveNextSystem(); }
  if (w.t >= 1.8) { game.state = 'fight'; game.warp = null; warpFx.intensity = 0; $('flash').style.opacity = 0; }
}

function update(dt, realDt) {
  game.world?.update(dt);
  warpFx.update(realDt);

  if (game.state === 'menu') {
    menuAngle += realDt * 0.05;
    camera.position.set(Math.cos(menuAngle) * 70, 18, Math.sin(menuAngle) * 70);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, -10, 0);
    return;
  }

  const P = game.player, C = game.cpu;
  const sP = C.slowActive > 0 ? 0.3 : 1, sC = P.slowActive > 0 ? 0.3 : 1;
  P.slowActive = Math.max(0, P.slowActive - dt); C.slowActive = Math.max(0, C.slowActive - dt);
  $('slowfx').classList.toggle('on', P.slowActive > 0 || C.slowActive > 0);

  if (game.state === 'warp') updateWarp(realDt);
  const fighting = game.state === 'fight';
  if (fighting) game.locTime += dt;
  const iP = fighting ? (game.demoAI ? game.demoAI.think(dt * sP, game) : playerIntent()) : null;
  const iC = fighting ? game.ai.think(dt * sC, game) : null;
  P.update(dt * sP, iP, C, game);
  C.update(dt * sC, iC, P, game);
  if (game.state !== 'warp' || game.warp?.swapped) {
    game.world.collide(P); game.world.collide(C);
    if (fighting) { game.world.hazards(P, dt * sP); game.world.hazards(C, dt * sC); }
  }

  // Keep the two bodies from overlapping
  const sep = C.pos.clone().sub(P.pos), d = sep.length(), min = P.radius + C.radius;
  if (d < min && d > 0.001) { sep.divideScalar(d).multiplyScalar((min - d) / 2); P.pos.sub(sep); C.pos.add(sep); }

  updateProjectiles(game, dt);
  game.fx.update(dt);

  // Round flow
  if (game.state === 'intro') {
    game.timer -= realDt;
    const n = Math.ceil(game.timer);
    if (n !== lastCount && n > 0) { lastCount = n; flashText(String(n)); sfx('tick'); }
    if (game.timer <= 0) { game.state = 'fight'; flashText('FIGHT!', 700); sfx('go'); }
  } else if (fighting && (P.dead || C.dead)) {
    game.state = 'ko'; game.timer = 2.4; flashText('K.O.'); sfx('ko');
    game.wins[P.dead ? 1 : 0]++;
  } else if (game.state === 'ko') {
    game.timer -= realDt;
    if (game.timer <= 0) {
      $('center').textContent = '';
      if (game.wins[0] >= 2 || game.wins[1] >= 2) {
        const won = game.wins[0] >= 2;
        game.state = 'over';
        $('overTitle').textContent = won ? 'VICTORY' : 'DEFEAT';
        $('overSub').textContent = `${P.def.name} ${game.wins[0]} : ${game.wins[1]} ${C.def.name} · reached sector ${game.sector}`;
        show('over'); showTouch(false);
      } else { game.round++; startRound(); }
    }
  }

  // Third-person lock-on camera: behind the player, looking toward the enemy
  const { fwd, right, up } = basis(C.pos.clone().sub(P.pos), playerBasis);
  camPos.copy(P.pos).addScaledVector(fwd, -9).addScaledVector(up, 2.6).addScaledVector(right, 1.6);
  camera.position.lerp(camPos, 1 - Math.exp(-(game.state === 'warp' ? 20 : 8) * realDt));
  camTarget.copy(P.pos).addScaledVector(fwd, 8);
  camera.up.lerp(up, 1 - Math.exp(-6 * realDt)).normalize();
  camera.lookAt(camTarget);
  if (game.shake > 0) {
    camera.position.add(new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(game.shake));
    game.shake = Math.max(0, game.shake - realDt * 3);
  }

  updateHud();
}

function setBar(el, frac) { el.style.width = (Math.max(0, frac) * 100).toFixed(1) + '%'; el.parentElement.classList.toggle('low', frac < 0.3 && el.parentElement.classList.contains('hp')); }
function updateHud() {
  const P = game.player, C = game.cpu;
  setBar($('p1hp'), P.hp / P.def.maxHp); setBar($('p2hp'), C.hp / C.def.maxHp);
  setBar($('p1en'), P.energy / 100); setBar($('p2en'), C.energy / 100);
  $('p1wins').textContent = '★'.repeat(game.wins[0]); $('p2wins').textContent = '★'.repeat(game.wins[1]);
  const live = P.combo > 0 && P.t - P.lastHitT < COMBO_WINDOW;
  $('combo').textContent = live ? `${P.combo} HIT${P.combo > 1 ? 'S' : ''}${P.combo === 2 ? ' · next hit LAUNCHES' : ''}` : '';
  $('warpReady').textContent = game.locTime >= WARP_COOLDOWN ? 'WARP READY: land a 3-hit combo' : `warp in ${Math.ceil(WARP_COOLDOWN - game.locTime)}s`;
  const d = P.def;
  const cd = (id, v, max, cost = 0) => {
    const el = $(id); el.style.setProperty('--cd', Math.min(1, v / max).toFixed(3));
    el.style.opacity = P.energy >= cost ? 1 : 0.5;
  };
  cd('skMelee', P.cd.melee, d.melee.cd + d.melee.windup);
  cd('skBeam', P.cd.beam, d.beam.cd, d.beam.cost);
  cd('skDash', P.cd.dash, d.dashCd, 10);
  cd('skAbility', P.cd.ability, d.ability.cd, d.ability.cost);
  if (touch) {
    cd('tbPunch', P.cd.melee, d.melee.cd + d.melee.windup);
    cd('tbBeam', P.cd.beam, d.beam.cd, d.beam.cost);
    cd('tbDash', P.cd.dash, d.dashCd, 10);
    cd('tbAbility', P.cd.ability, d.ability.cd, d.ability.cost);
  }
}

let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const realDt = Math.min(Math.max((now - last) / 1000, 0), 0.05); last = now;
  // #...-fast: simulate many fixed steps per frame (headless testing only)
  const steps = FAST ? 40 : 1, stepDt = FAST ? 1 / 60 : realDt;
  for (let i = 0; i < steps && !game.paused; i++) {
    let dt = stepDt;
    if (game.hitStop > 0) { game.hitStop -= stepDt; dt *= 0.05; }
    if (game.state === 'ko') dt *= 0.35;
    update(dt, stepDt);
  }
  pressed.clear(); touch?.endFrame();
  composer.render();
}

// ---------- Menu wiring ----------
function buildMenu() {
  const cards = $('heroCards');
  for (const h of Object.values(HEROES)) {
    const el = document.createElement('div');
    el.className = 'card' + (h.id === game.settings.hero ? ' on' : '');
    el.style.setProperty('--c', h.css);
    el.innerHTML = `<div class="nm">${h.name}</div><div class="tt">${h.title}</div><p>${h.desc}</p>
      <div class="st">${Object.entries(h.stats).map(([n, v]) => `<span>${n}</span><i style="width:${v * 100}%"></i>`).join('')}</div>
      <p class="mv">K: ${h.beam.name}<br>Q: ${h.ability.name}</p>`;
    el.onclick = () => { game.settings.hero = h.id; [...cards.children].forEach((c) => c.classList.remove('on')); el.classList.add('on'); };
    cards.appendChild(el);
  }
  const fill = (seg, entries, key) => {
    for (const [id, label] of entries) {
      const b = document.createElement('button'); b.textContent = label; b.dataset.v = id;
      if (id === game.settings[key]) b.classList.add('on');
      seg.appendChild(b);
    }
  };
  fill($('oppSeg'), [['random', 'Random'], ...Object.values(HEROES).map((h) => [h.id, h.name])], 'opponent');
  fill($('arenaSeg'), Object.entries(PRESET_NAMES), 'arena');
  const wireSeg = (el, key, onChange) => el.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    [...el.children].forEach((c) => c.classList.toggle('on', c === b)); game.settings[key] = b.dataset.v; onChange?.();
  });
  wireSeg($('diffSeg'), 'diff');
  wireSeg($('oppSeg'), 'opponent');
  wireSeg($('arenaSeg'), 'arena', () => setWorld(presetLocation(game.settings.arena)));
  $('startBtn').onclick = startMatch;
  $('rematchBtn').onclick = startMatch;
  $('menuBtn').onclick = toMenu;
  const setPaused = (p) => { game.paused = p; $('pause').classList.toggle('hidden', !p); if (p) touch?.release(); };
  $('resumeBtn').onclick = () => setPaused(false);
  $('tbPause').onclick = () => setPaused(true);
  $('quitBtn').onclick = toMenu;
  addEventListener('keydown', (e) => {
    if (e.code !== 'Escape' || game.state === 'menu' || game.state === 'over') return;
    setPaused(!game.paused);
  });
}

// URL flags for testing: #demo (AI plays both sides), plus -<arena>, -<hero>, -fast, -debug
const DEMO = location.hash.startsWith('#demo');
const FAST = DEMO && location.hash.includes('fast');
buildMenu();
// iPhone Safari can't hide its toolbars; installing to the home screen gives true full screen
const isIOS = /iP(hone|od|ad)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const standalone = navigator.standalone || matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches;
if (isIOS && !standalone) $('iosTip').classList.remove('hidden');
window.__g = game; // handy for debugging from the browser console
setWorld(presetLocation(game.settings.arena));
requestAnimationFrame(frame);
if (DEMO) {
  const parts = location.hash.slice(1).split('-');
  for (const p of parts) { if (PRESET_NAMES[p]) game.settings.arena = p; if (HEROES[p]) game.settings.hero = p; }
  startMatch();
  const seedFlag = parts.find((p) => /^seed\d+$/.test(p));
  if (seedFlag) { setWorld(generateLocation(+seedFlag.slice(4))); showBanner(); }
  if (parts.includes('warptest')) { game.state = 'fight'; startWarp(game.player, game.cpu, new THREE.Vector3(0, 0, 1)); game.warp.t = 0.75; }
  window.__game = game;
  if (parts.includes('debug')) setInterval(() => {
    const f = (x) => x && [x.def.id, x.hp.toFixed(0), x.pos.toArray().map((v) => v.toFixed(0)).join(',')];
    document.title = JSON.stringify({ s: game.state, r: game.round, w: game.wins, sec: game.sector, loc: game.world.loc.type, P: f(game.player), C: f(game.cpu) });
  }, 250);
}
