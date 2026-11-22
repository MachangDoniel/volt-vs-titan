import * as THREE from 'three';

/*
 * Hero roster. All original characters: edit names, colors and numbers here to rebalance.
 * ability.kind: timeSlow | shockwave | barrage | blink | freeze
 * beam extras: count/spread (multi-shot), homing (steering strength), chill (slow on hit, seconds)
 * ai.prefDist: how far away the AI likes to fight with this hero
 */
export const HEROES = {
  volt: {
    id: 'volt', name: 'VOLT', title: 'The Speedster', css: '#ffd21f',
    color: 0xb3121f, trim: 0xf2c014, accent: 0xffd21f, scale: 1.0, bulk: 0.95,
    look: { head: 'cowl', wings: true, emblem: 'bolt' },
    maxHp: 90, maxSpeed: 64, accel: 175, drag: 3.2, dashSpeed: 135, dashCd: 0.55,
    melee: { dmg: 6, cd: 0.22, windup: 0.08, range: 3.6, knock: 10, stun: 0.18 },
    beam: { name: 'Lightning', dmg: 7, speed: 175, cost: 12, cd: 0.35, color: 0xfff27a, radius: 0.12, length: 3.2, knock: 6, sfx: 'zap' },
    ability: { kind: 'timeSlow', name: 'Time Slow', cost: 60, cd: 10, duration: 3.5, aiRange: 40 },
    ai: { prefDist: 4 }, trailJitter: 0.35, trailColor: 0xffe14a,
    desc: 'Blinding speed and rapid strikes. Slows time around the enemy.',
    stats: { Power: 0.45, Speed: 1, Health: 0.6, Range: 0.6 },
  },
  titan: {
    id: 'titan', name: 'TITAN', title: 'The Powerhouse', css: '#ff3b2f',
    color: 0x1d3fb8, trim: 0xc81d1d, accent: 0xff3b2f, scale: 1.15, bulk: 1.15,
    look: { head: 'hair', cape: true, emblem: 'diamond' },
    maxHp: 125, maxSpeed: 42, accel: 95, drag: 2.6, dashSpeed: 90, dashCd: 0.9,
    melee: { dmg: 12, cd: 0.45, windup: 0.11, range: 3.9, knock: 26, stun: 0.35 },
    beam: { name: 'Heat Vision', dmg: 13, speed: 115, cost: 18, cd: 0.75, color: 0xff4422, radius: 0.22, length: 4.2, knock: 12, sfx: 'beam' },
    ability: { kind: 'shockwave', name: 'Shockwave', cost: 50, cd: 8, radius: 15, dmg: 18, knock: 55, stun: 0.9, aiRange: 11 },
    ai: { prefDist: 12 }, trailJitter: 0, trailColor: 0x9ab8ff,
    desc: 'Flight, crushing punches, heat vision and a devastating shockwave.',
    stats: { Power: 1, Speed: 0.55, Health: 1, Range: 0.8 },
  },
  nova: {
    id: 'nova', name: 'NOVA', title: 'The Cosmic Blaster', css: '#ff5af0',
    color: 0x2b1650, trim: 0xe8b83a, accent: 0xff5af0, scale: 1.05, bulk: 1.0,
    look: { head: 'helmet', emblem: 'star' },
    maxHp: 100, maxSpeed: 50, accel: 120, drag: 2.8, dashSpeed: 105, dashCd: 0.7,
    melee: { dmg: 8, cd: 0.35, windup: 0.1, range: 3.7, knock: 14, stun: 0.22 },
    beam: { name: 'Plasma Orb', dmg: 9, speed: 72, cost: 14, cd: 0.45, color: 0xff6af5, radius: 0.45, length: 0, homing: 1.6, knock: 8, sfx: 'orb', life: 3.5 },
    ability: { kind: 'barrage', name: 'Star Barrage', cost: 55, cd: 9, count: 7, dmg: 6, speed: 60, aiRange: 60 },
    ai: { prefDist: 22 }, trailJitter: 0.05, trailColor: 0xff8af8,
    desc: 'Ranged specialist. Homing plasma orbs and a swarm of seeking stars.',
    stats: { Power: 0.65, Speed: 0.7, Health: 0.8, Range: 1 },
  },
  rift: {
    id: 'rift', name: 'RIFT', title: 'The Phase Runner', css: '#00e5ff',
    color: 0x15171f, trim: 0x2a8fa0, accent: 0x00f0ff, scale: 0.98, bulk: 0.92,
    look: { head: 'cowl', visor: true, emblem: 'ring' },
    maxHp: 85, maxSpeed: 58, accel: 160, drag: 3.1, dashSpeed: 125, dashCd: 0.5,
    melee: { dmg: 7, cd: 0.25, windup: 0.08, range: 3.6, knock: 11, stun: 0.2 },
    beam: { name: 'Phase Shards', dmg: 5, speed: 150, cost: 15, cd: 0.55, color: 0x40f6ff, radius: 0.1, length: 2.2, count: 3, spread: 0.09, knock: 4, sfx: 'zap' },
    ability: { kind: 'blink', name: 'Blink Strike', cost: 45, cd: 7, range: 60, dmg: 11, knock: 30, stun: 0.45, aiRange: 45 },
    ai: { prefDist: 6 }, trailJitter: 0.15, trailColor: 0x40f6ff,
    desc: 'Teleporting speedster. Blink behind enemies to chain combos.',
    stats: { Power: 0.55, Speed: 0.9, Health: 0.55, Range: 0.7 },
  },
  glacier: {
    id: 'glacier', name: 'GLACIER', title: 'The Frozen Fortress', css: '#7fe0ff',
    color: 0x5f8fbf, trim: 0xbfe4ff, accent: 0x7fe0ff, scale: 1.2, bulk: 1.2,
    look: { head: 'crest', visor: true, emblem: 'flake' },
    maxHp: 150, maxSpeed: 40, accel: 95, drag: 2.5, dashSpeed: 85, dashCd: 0.9,
    melee: { dmg: 13, cd: 0.5, windup: 0.14, range: 4.0, knock: 24, stun: 0.4 },
    beam: { name: 'Frost Ray', dmg: 8, speed: 100, cost: 15, cd: 0.6, color: 0x9fe8ff, radius: 0.2, length: 3.5, knock: 4, chill: 2.0, sfx: 'beam' },
    ability: { kind: 'freeze', name: 'Ice Prison', cost: 60, cd: 11, range: 30, duration: 1.6, dmg: 10, aiRange: 25 },
    ai: { prefDist: 14 }, trailJitter: 0, trailColor: 0xcff4ff,
    desc: 'Slow but nearly unbreakable. Chills with frost and freezes foes solid.',
    stats: { Power: 0.9, Speed: 0.45, Health: 1, Range: 0.75 },
  },
};

export const COMBO_WINDOW = 1.3; // seconds between hits to keep a combo alive
export const LAUNCH_HITS = 3;

const capsule = (r, len, mat) => new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 10), mat);

function emblemShape(kind) {
  const s = new THREE.Shape();
  const poly = (n, r1, r2) => { for (let i = 0; i < n * 2; i++) { const r = i % 2 ? r2 : r1, a = (i / (n * 2)) * Math.PI * 2 + Math.PI / 2; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); } s.closePath(); };
  if (kind === 'bolt') { s.moveTo(0.06, 0.2); s.lineTo(-0.1, -0.02); s.lineTo(0.01, -0.02); s.lineTo(-0.05, -0.2); s.lineTo(0.1, 0.03); s.lineTo(-0.01, 0.03); s.closePath(); }
  else if (kind === 'diamond') { s.moveTo(0, 0.17); s.lineTo(0.22, 0.04); s.lineTo(0, -0.2); s.lineTo(-0.22, 0.04); s.closePath(); }
  else if (kind === 'star') poly(5, 0.2, 0.08);
  else if (kind === 'flake') poly(6, 0.2, 0.06);
  else if (kind === 'ring') { s.absarc(0, 0, 0.18, 0, Math.PI * 2, false); const h = new THREE.Path(); h.absarc(0, 0, 0.1, 0, Math.PI * 2, true); s.holes.push(h); }
  return s;
}

function buildBody(def, parent) {
  const L = def.look;
  const suit = new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.35, metalness: 0.4 });
  const trim = new THREE.MeshStandardMaterial({ color: def.trim, roughness: 0.4, metalness: 0.5 });
  const glow = new THREE.MeshStandardMaterial({ color: def.accent, emissive: def.accent, emissiveIntensity: 2.5 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xd9a27a, roughness: 0.7 });
  const b = def.bulk;

  const torso = capsule(0.42, 0.75, suit); torso.position.y = 0.35; torso.scale.set(b, 1, 0.8); parent.add(torso);
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.06, 6, 20), trim);
  belt.rotation.x = Math.PI / 2; belt.position.y = -0.02; belt.scale.set(b, 0.82, 1); parent.add(belt);
  const emblem = new THREE.Mesh(new THREE.ShapeGeometry(emblemShape(L.emblem)), glow);
  emblem.position.set(0, 0.55, 0.345); parent.add(emblem);

  // Head
  const head = new THREE.Group(); head.position.y = 1.12; parent.add(head);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.27, 20, 14), skin));
  if (L.head === 'cowl') head.add(new THREE.Mesh(new THREE.SphereGeometry(0.29, 20, 14, 0, Math.PI * 2, 0, 1.95), suit));
  if (L.head === 'hair') {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.29, 20, 14, 0, Math.PI * 2, 0, 1.15), new THREE.MeshStandardMaterial({ color: 0x15110e, roughness: 0.6 }));
    hair.position.z = -0.02; head.add(hair);
  }
  if (L.head === 'helmet' || L.head === 'crest') {
    head.add(new THREE.Mesh(new THREE.SphereGeometry(0.31, 20, 14), trim));
    if (L.head === 'crest') { const fin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.5), suit); fin.position.set(0, 0.3, -0.02); head.add(fin); }
  }
  if (L.wings) for (const sd of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.28, 6), glow);
    wing.position.set(sd * 0.29, 0.08, -0.02); wing.rotation.z = -sd * 1.1; head.add(wing);
  }
  if (L.visor || L.head === 'helmet') {
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.12), glow); visor.position.set(0, 0.03, 0.25); head.add(visor);
  } else for (const sd of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), glow);
    eye.position.set(sd * 0.09, 0.03, 0.255); head.add(eye);
  }

  // Arms (pivot at shoulder so punches can animate)
  const arms = [];
  for (const sd of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(sd * 0.58 * b, 0.78, 0); parent.add(pivot);
    const arm = capsule(0.13 * b, 0.55, suit); arm.position.y = -0.38; pivot.add(arm);
    const fist = new THREE.Mesh(new THREE.SphereGeometry(0.15 * b, 10, 8), trim); fist.position.y = -0.8; pivot.add(fist);
    arms.push(pivot);
  }
  const legs = [];
  for (const sd of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(sd * 0.22 * b, -0.2, 0); parent.add(pivot);
    const leg = capsule(0.16 * b, 0.7, suit); leg.position.y = -0.5; pivot.add(leg);
    const boot = capsule(0.17 * b, 0.25, trim); boot.position.y = -0.98; pivot.add(boot);
    legs.push(pivot);
  }

  let cape = null;
  if (L.cape) {
    cape = new THREE.Group(); cape.position.set(0, 0.85, -0.32); parent.add(cape);
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.8, 1, 6), new THREE.MeshStandardMaterial({ color: def.trim, side: THREE.DoubleSide, roughness: 0.8 }));
    cloth.position.y = -0.9; cape.add(cloth);
  }

  const light = new THREE.PointLight(def.accent, 5, 14, 2); light.position.y = 0.5; parent.add(light);
  return { suit, trim, arms, legs, head, cape };
}

const _v = new THREE.Vector3(), _q = new THREE.Quaternion();
const UP = new THREE.Vector3(0, 1, 0);
const randDir = () => new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();

export class Fighter {
  constructor(scene, def) {
    this.def = def;
    this.scene = scene;
    this.root = new THREE.Group();
    this.body = new THREE.Group();
    this.body.scale.setScalar(def.scale);
    this.root.add(this.body);
    this.parts = buildBody(def, this.body);
    scene.add(this.root);
    this.vel = new THREE.Vector3();
    this.radius = 1.3 * def.scale;

    // Ice block shown while frozen
    this.ice = new THREE.Mesh(new THREE.IcosahedronGeometry(1.8 * def.scale, 1),
      new THREE.MeshStandardMaterial({ color: 0xaee8ff, transparent: true, opacity: 0.45, roughness: 0.1, metalness: 0.2, emissive: 0x2a6a8a, flatShading: true }));
    this.ice.position.y = 0.3; this.ice.visible = false; this.root.add(this.ice);

    // Trail: crackling for speedsters, a vapor streak for fliers
    this.trailN = 28;
    this.trail = Array.from({ length: this.trailN }, () => new THREE.Vector3());
    const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.trailN * 3), 3));
    const tm = new THREE.LineBasicMaterial({ color: new THREE.Color(def.trailColor).multiplyScalar(3), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    this.trailLine = new THREE.Line(tg, tm); this.trailLine.frustumCulled = false;
    scene.add(this.trailLine);
    this.reset(new THREE.Vector3(), true);
  }

  get pos() { return this.root.position; }
  get dead() { return this.hp <= 0; }

  /** Place the fighter. fullHeal=false keeps HP/energy (used when warping mid-round). */
  reset(position, fullHeal = true) {
    this.root.position.copy(position);
    this.vel.set(0, 0, 0);
    if (fullHeal) { this.hp = this.def.maxHp; this.energy = 100; }
    this.cd = { melee: 0, beam: 0, dash: 0, ability: 0 };
    this.stun = 0; this.punchT = 0; this.pendingMelee = 0; this.punchSide = 0; this.punchId = 0;
    this.flash = 0; this.blocking = false; this.slowActive = 0; this.dashT = 0; this.t = Math.random() * 10;
    this.combo = 0; this.lastHitT = -99; this.chill = 0; this.frozen = 0;
    this.body.rotation.set(0, 0, 0);
    this.trail.forEach((p) => p.copy(position));
  }

  update(dt, intent, enemy, game) {
    const d = this.def;
    this.t += dt;
    for (const k in this.cd) this.cd[k] = Math.max(0, this.cd[k] - dt);
    this.stun = Math.max(0, this.stun - dt);
    this.flash = Math.max(0, this.flash - dt * 5);
    this.punchT = Math.max(0, this.punchT - dt * 5);
    this.dashT = Math.max(0, this.dashT - dt);
    this.chill = Math.max(0, this.chill - dt);
    this.frozen = Math.max(0, this.frozen - dt);
    this.ice.visible = this.frozen > 0;

    if (this.dead) {
      this.blocking = false;
      this.body.rotation.x += dt * 4; this.body.rotation.z += dt * 2;
      this.vel.multiplyScalar(Math.exp(-0.8 * dt));
      this.pos.addScaledVector(this.vel, dt);
      this.updateTrail();
      return;
    }

    this.energy = Math.min(100, this.energy + (this.blocking ? 0 : 15) * dt);
    if (this.pendingMelee > 0) {
      this.pendingMelee -= dt;
      if (this.pendingMelee <= 0 && this.stun <= 0) this.resolveMelee(enemy, game);
    }

    const slowMul = this.chill > 0 ? 0.55 : 1;
    if (this.stun <= 0 && intent) {
      const move = _v.copy(intent.move); if (move.lengthSq() > 1) move.normalize();
      this.blocking = !!intent.block && this.energy > 1;
      this.vel.addScaledVector(move, d.accel * slowMul * (this.blocking ? 0.35 : 1) * dt);
      if (this.blocking) this.energy -= 8 * dt;

      if (intent.dash && this.cd.dash <= 0 && this.energy >= 10) {
        const dir = move.lengthSq() > 0.01 ? move.clone().normalize() : enemy.pos.clone().sub(this.pos).normalize();
        this.vel.copy(dir).multiplyScalar(d.dashSpeed * slowMul);
        this.cd.dash = d.dashCd; this.energy -= 10; this.dashT = 0.2;
        game.fx.burst(this.pos, d.accent, 14, 10); game.sfx('dash');
      }
      if (!this.blocking) {
        if (intent.punch && this.cd.melee <= 0 && this.pendingMelee <= 0) this.startMelee();
        if (intent.beam && this.cd.beam <= 0 && this.energy >= d.beam.cost) this.fireBeam(enemy, game);
        if (intent.ability && this.cd.ability <= 0 && this.energy >= d.ability.cost) this.useAbility(enemy, game);
      }
    } else {
      this.blocking = false;
    }

    // Physics
    this.vel.multiplyScalar(Math.exp(-d.drag * dt));
    const cap = d.maxSpeed * slowMul;
    if (this.dashT <= 0 && this.stun <= 0 && this.vel.length() > cap) this.vel.setLength(cap);
    this.pos.addScaledVector(this.vel, dt);

    this.root.lookAt(enemy.pos); // lock-on duel: always face the opponent
    this.animate(dt);
    this.updateTrail();
  }

  animate(dt) {
    const P = this.parts, d = this.def;
    _q.copy(this.root.quaternion).invert();
    const local = _v.copy(this.vel).applyQuaternion(_q);
    const fwd = THREE.MathUtils.clamp(local.z / d.maxSpeed, -1, 1), side = THREE.MathUtils.clamp(local.x / d.maxSpeed, -1, 1);
    const k = 1 - Math.exp(-10 * dt);
    if (this.frozen > 0) return; // frozen solid: no animation
    this.body.rotation.x += (fwd * 0.7 - this.body.rotation.x) * k;
    this.body.rotation.z += (-side * 0.5 - this.body.rotation.z) * k;
    this.body.position.y = Math.sin(this.t * 2.2) * 0.08;

    P.arms.forEach((arm, i) => {
      let target = 0.25 + Math.max(0, fwd) * 0.5, zt = 0;
      if (this.blocking) { target = -1.9; zt = (i ? 1 : -1) * 0.6; }
      else if (i === this.punchSide && this.pendingMelee > 0) target = 0.7;
      else if (i === this.punchSide && this.punchT > 0) target = -Math.PI / 2 * Math.min(1, this.punchT * 1.6);
      arm.rotation.x += (target - arm.rotation.x) * (this.punchT > 0 && i === this.punchSide ? 1 : k);
      arm.rotation.z += (zt - arm.rotation.z) * k;
    });
    P.legs.forEach((leg, i) => { leg.rotation.x = 0.15 + Math.max(0, fwd) * 0.5 + Math.sin(this.t * 2 + i) * 0.08; });
    if (P.cape) P.cape.rotation.x = 0.15 + Math.min(1, this.vel.length() / d.maxSpeed) * 1.1 + Math.sin(this.t * 9) * 0.05;

    const f = this.flash, c = this.chill > 0 ? 0.25 : 0;
    P.suit.emissive.setRGB(f, f + c * 0.6, f + c); P.trim.emissive.setRGB(f, f + c * 0.6, f + c);
  }

  updateTrail() {
    for (let i = this.trailN - 1; i > 0; i--) this.trail[i].copy(this.trail[i - 1]);
    this.trail[0].copy(this.pos);
    const arr = this.trailLine.geometry.attributes.position.array, j = this.def.trailJitter;
    for (let i = 0; i < this.trailN; i++) {
      const p = this.trail[i], s = j * i * 0.2;
      arr[i * 3] = p.x + (Math.random() - 0.5) * s; arr[i * 3 + 1] = p.y + (Math.random() - 0.5) * s; arr[i * 3 + 2] = p.z + (Math.random() - 0.5) * s;
    }
    this.trailLine.geometry.attributes.position.needsUpdate = true;
    this.trailLine.material.opacity = THREE.MathUtils.clamp((this.vel.length() - 10) / 35, 0, 1) * (j > 0.1 ? 1 : 0.4);
  }

  startMelee() {
    this.cd.melee = this.def.melee.cd + this.def.melee.windup;
    this.pendingMelee = this.def.melee.windup;
    this.punchSide = 1 - this.punchSide;
    this.punchId++;
  }

  resolveMelee(enemy, game) {
    const m = this.def.melee;
    this.punchT = 1;
    const toE = enemy.pos.clone().sub(this.pos); const dist = toE.length(); toE.normalize();
    if (dist < m.range + enemy.radius * 0.5 && !enemy.dead) this.landMelee(enemy, toE, m.dmg, m.knock, m.stun, game);
    else { this.vel.addScaledVector(toE, 22); game.sfx('whiff'); } // whiff: lunge forward
  }

  /** Melee hit with combo tracking. The LAUNCH_HITS-th hit in a row launches the enemy. */
  landMelee(enemy, dir, dmg, knock, stun, game) {
    const chain = this.t - this.lastHitT < COMBO_WINDOW ? this.combo : 0;
    const launch = chain + 1 >= LAUNCH_HITS;
    const blocked = enemy.takeHit({ dmg: launch ? dmg * 1.5 : dmg, dir, knock: launch ? 95 : knock, stun: launch ? 1.1 : stun, melee: true, launch }, this, game);
    if (blocked) { this.combo = 0; return; }
    this.combo = launch ? 0 : chain + 1; this.lastHitT = this.t;
    if (launch) game.onLaunch?.(this, enemy, dir);
  }

  fireBeam(enemy, game) {
    const b = this.def.beam;
    this.cd.beam = b.cd; this.energy -= b.cost;
    const origin = this.parts.head.getWorldPosition(new THREE.Vector3());
    const dist = origin.distanceTo(enemy.pos);
    const aim = enemy.pos.clone().addScaledVector(enemy.vel, (dist / b.speed) * 0.6);
    const dir = aim.sub(origin).normalize();
    const n = b.count || 1, side = new THREE.Vector3().crossVectors(dir, UP);
    if (side.lengthSq() < 1e-4) side.set(1, 0, 0); side.normalize();
    for (let i = 0; i < n; i++) {
      const d = dir.clone().addScaledVector(side, (i - (n - 1) / 2) * (b.spread || 0)).normalize();
      game.spawnProjectile(this, origin, d.multiplyScalar(b.speed), b);
    }
    game.sfx(b.sfx);
  }

  useAbility(enemy, game) {
    const a = this.def.ability, d = this.def;
    const toE = enemy.pos.clone().sub(this.pos), dist = toE.length(); toE.normalize();
    // Targeted abilities fizzle (no cost) when out of range
    if ((a.kind === 'blink' || a.kind === 'freeze') && (dist > a.range || enemy.dead)) { this.cd.ability = 0.3; game.sfx('whiff'); return; }
    this.cd.ability = a.cd; this.energy -= a.cost;

    if (a.kind === 'timeSlow') {
      this.slowActive = a.duration;
      game.fx.ring(this.pos, 0x47b6ff, 30, 0.6); game.sfx('slow');
    } else if (a.kind === 'shockwave') {
      game.fx.ring(this.pos, d.accent, a.radius, 0.45); game.sfx('boom'); game.shake = Math.max(game.shake, 1.2);
      if (dist < a.radius && !enemy.dead) enemy.takeHit({ dmg: a.dmg, dir: toE, knock: a.knock, stun: a.stun }, this, game);
    } else if (a.kind === 'barrage') {
      const origin = this.pos.clone().addScaledVector(UP, 1);
      const spec = { dmg: a.dmg, speed: a.speed, color: d.beam.color, radius: 0.32, length: 0, homing: 2.6, knock: 5, life: 4 };
      for (let i = 0; i < a.count; i++) game.spawnProjectile(this, origin, toE.clone().addScaledVector(randDir(), 0.9).normalize().multiplyScalar(a.speed), spec);
      game.fx.ring(this.pos, d.accent, 6, 0.3); game.sfx('orb');
    } else if (a.kind === 'blink') {
      game.fx.burst(this.pos, d.accent, 30, 14);
      this.pos.copy(enemy.pos).addScaledVector(toE, 2.6); // appear behind the enemy
      this.vel.set(0, 0, 0); this.punchT = 1; this.root.lookAt(enemy.pos);
      game.fx.burst(this.pos, d.accent, 30, 14); game.sfx('blink');
      this.landMelee(enemy, toE.clone().negate(), a.dmg, a.knock, a.stun, game);
    } else if (a.kind === 'freeze') {
      game.fx.ring(enemy.pos, d.accent, 5, 0.5); game.sfx('freeze');
      enemy.takeHit({ dmg: a.dmg, dir: toE, knock: 2, stun: 0, freeze: a.duration }, this, game);
    }
  }

  /** Apply a hit. Returns true if it was blocked. */
  takeHit(o, attacker, game) {
    if (this.dead) return false;
    let { dmg, knock = 0, stun = 0 } = o;
    const blocked = this.blocking;
    if (blocked) {
      dmg *= 0.25; knock *= 0.35; stun = 0; this.energy = Math.max(0, this.energy - 12);
      if (o.freeze) this.chill = Math.max(this.chill, o.freeze); // blocked freeze becomes a chill
      game.fx.burst(this.pos, 0x88ccff, 10, 8);
    } else {
      if (o.chill) this.chill = Math.max(this.chill, o.chill);
      if (o.freeze) { this.frozen = o.freeze; stun = Math.max(stun, o.freeze); }
      game.fx.burst(this.pos, attacker.def.accent, o.launch ? 60 : 26, o.launch ? 40 : 20);
    }
    this.hp = Math.max(0, this.hp - dmg);
    this.vel.addScaledVector(o.dir, knock);
    this.stun = Math.max(this.stun, stun);
    this.pendingMelee = stun > 0 ? 0 : this.pendingMelee; // getting stunned cancels a wind-up
    this.flash = blocked ? 0.3 : 1;
    game.onHit(this, dmg, blocked, !!o.melee, !!o.launch && !blocked);
    return blocked;
  }

  dispose() {
    this.scene.remove(this.root, this.trailLine);
    const kill = (o) => { o.geometry?.dispose(); o.material?.dispose?.(); };
    this.root.traverse(kill); kill(this.trailLine);
  }
}
