import * as THREE from 'three';

export const ARENA_RADIUS = 280;

// Starting arenas you can pick in the menu. Everything after the first warp is procedural.
export const PRESETS = {
  earth: { type: 'terran', name: 'Earth Orbit', seed: 101 },
  mars: { type: 'desert', name: 'Red Planet', seed: 202 },
  deep: { type: 'belt', name: 'Deep Space', seed: 303 },
  random: null,
};
export const PRESET_NAMES = { earth: 'Earth Orbit', mars: 'Red Planet', deep: 'Deep Space', random: 'Random' };

const TYPES = {
  terran: 'Terran World', desert: 'Desert World', ice: 'Ice World', lava: 'Lava World',
  gas: 'Gas Giant', star: 'Star Corona', blackhole: 'Black Hole', belt: 'Asteroid Belt',
};

// Small seeded RNG so the same seed always builds the same system
export function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SYL = ['ka', 'zor', 'vel', 'ix', 'tau', 'or', 'neb', 'qua', 'xan', 'ry', 'sol', 'mir', 'eth', 'dra', 'ul', 'kep', 'tes', 'vy', 'lor', 'an'];
function genName(r) {
  let s = '';
  for (let i = 0, n = r() < 0.4 ? 3 : 2; i < n; i++) s += SYL[(r() * SYL.length) | 0];
  const suf = [`-${(r() * 900 + 10) | 0}${'bcdef'[(r() * 5) | 0]}`, ' Prime', ' IV', ' Major', ' Alpha', ' VII'];
  return s[0].toUpperCase() + s.slice(1) + suf[(r() * suf.length) | 0];
}

/** Describe a location from a seed. `avoidType` keeps two warps in a row from looking the same. */
export function generateLocation(seed, avoidType) {
  const r = rng(seed), keys = Object.keys(TYPES);
  let type = keys[(r() * keys.length) | 0];
  if (type === avoidType) type = keys[(keys.indexOf(type) + 1 + ((r() * (keys.length - 1)) | 0)) % keys.length];
  return { seed, type, name: genName(r), label: TYPES[type] };
}
export function presetLocation(id) {
  const p = PRESETS[id];
  if (!p) return generateLocation((Math.random() * 1e9) | 0);
  return { ...p, label: TYPES[p.type] };
}

// ---------- Procedural textures ----------
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function tex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

function rockyTexture(p, rand) {
  const [c, g] = canvas(1024, 512);
  g.fillStyle = p.ocean; g.fillRect(0, 0, 1024, 512);
  for (let k = 0; k < 8; k++) {
    const cx = rand() * 1024, cy = 90 + rand() * 330;
    for (let i = 0; i < 45; i++) {
      const x = cx + (rand() - 0.5) * 260, y = cy + (rand() - 0.5) * 140, r = 6 + rand() * 38;
      g.globalAlpha = 0.55 + rand() * 0.45; g.fillStyle = p.land[(rand() * p.land.length) | 0];
      for (const off of [-1024, 0, 1024]) { g.beginPath(); g.ellipse(x + off, y, r * 1.7, r, 0, 0, Math.PI * 2); g.fill(); }
    }
  }
  if (p.caps) { g.globalAlpha = 0.9; g.fillStyle = '#e8eef5'; g.fillRect(0, 0, 1024, 26); g.fillRect(0, 486, 1024, 26); }
  g.globalAlpha = 1;
  return tex(c);
}

function lavaGlowTexture(rand) {
  const [c, g] = canvas(1024, 512);
  g.fillStyle = '#000'; g.fillRect(0, 0, 1024, 512);
  g.strokeStyle = '#ff7a1a'; g.lineCap = 'round';
  for (let i = 0; i < 90; i++) {
    let x = rand() * 1024, y = rand() * 512; g.lineWidth = 1 + rand() * 4; g.beginPath(); g.moveTo(x, y);
    for (let s = 0; s < 14; s++) { x += (rand() - 0.5) * 50; y += (rand() - 0.5) * 30; g.lineTo(x, y); }
    g.stroke();
  }
  g.fillStyle = '#ffae3a';
  for (let i = 0; i < 40; i++) { g.beginPath(); g.ellipse(rand() * 1024, rand() * 512, 6 + rand() * 24, 4 + rand() * 12, 0, 0, Math.PI * 2); g.fill(); }
  return tex(c);
}

function cloudTexture(rand) {
  const [c, g] = canvas(1024, 512);
  for (let i = 0; i < 500; i++) {
    const x = rand() * 1024, y = 40 + rand() * 432, r = 4 + rand() * 26;
    g.fillStyle = `rgba(255,255,255,${0.05 + rand() * 0.18})`;
    g.beginPath(); g.ellipse(x, y, r * 2.5, r, 0, 0, Math.PI * 2); g.fill();
  }
  return tex(c);
}

function gasTexture(rand, hue) {
  const [c, g] = canvas(512, 512);
  const f1 = 0.02 + rand() * 0.04, f2 = 0.08 + rand() * 0.1, ph = rand() * 6;
  for (let y = 0; y < 512; y++) {
    const l = 38 + 18 * Math.sin(y * f1 + ph) + 8 * Math.sin(y * f2) + rand() * 4;
    const h = hue * 360 + 25 * Math.sin(y * f1 * 0.7);
    g.fillStyle = `hsl(${h},${40 + 15 * Math.sin(y * 0.05)}%,${l}%)`; g.fillRect(0, y, 512, 1);
  }
  g.fillStyle = `hsla(${hue * 360 + 30},60%,60%,0.8)`;
  g.beginPath(); g.ellipse(160 + rand() * 200, 300, 40, 18, 0, 0, Math.PI * 2); g.fill();
  return tex(c);
}

function starTexture(rand, base) {
  const [c, g] = canvas(512, 256);
  g.fillStyle = base; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 2500; i++) {
    g.fillStyle = rand() < 0.5 ? 'rgba(255,255,220,0.35)' : 'rgba(120,30,0,0.25)';
    g.beginPath(); g.arc(rand() * 512, rand() * 256, 1 + rand() * 4, 0, Math.PI * 2); g.fill();
  }
  return tex(c);
}

function radialStripTexture(stops) {
  const [c, g] = canvas(512, 4);
  const grd = g.createLinearGradient(0, 0, 512, 0);
  stops.forEach(([o, col]) => grd.addColorStop(o, col));
  g.fillStyle = grd; g.fillRect(0, 0, 512, 4);
  return tex(c);
}

function bandedRingTexture(rand, hue) {
  const [c, g] = canvas(512, 4);
  for (let x = 0; x < 512; x++) {
    const a = x < 20 || x > 495 ? 0 : (0.2 + 0.7 * rand()) * (Math.sin(x * 0.15) * 0.3 + 0.7);
    g.fillStyle = `hsla(${hue * 360 + 20},30%,${60 + rand() * 20}%,${a})`; g.fillRect(x, 0, 1, 4);
  }
  return tex(c);
}

function glowTexture() {
  const [c, g] = canvas(256, 256);
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.25, 'rgba(255,255,255,0.35)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

// Ring with UVs running from inner edge (u=0) to outer edge (u=1)
function ringMesh(inner, outer, map, extra = {}) {
  const geo = new THREE.RingGeometry(inner, outer, 160, 1);
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (Math.hypot(p.getX(i), p.getY(i)) - inner) / (outer - inner), 0.5);
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map, transparent: true, side: THREE.DoubleSide, depthWrite: false, ...extra }));
}

const atmoMaterial = (color) => new THREE.ShaderMaterial({
  uniforms: { c: { value: new THREE.Color(color) } },
  vertexShader: `varying vec3 vN; varying vec3 vV;
    void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `uniform vec3 c; varying vec3 vN; varying vec3 vV;
    void main(){ float f = pow(1.0 - max(dot(vN, vV), 0.0), 3.0); gl_FragColor = vec4(c * f * 2.0, f); }`,
  transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
});

const ROCKY = {
  terran: { ocean: '#123e86', land: ['#2f7d3a', '#557a2c', '#9a8a5a', '#2c6b34'], atmo: 0x5aa8ff, clouds: true, caps: true },
  desert: { ocean: '#7a2e14', land: ['#a8441c', '#c2652e', '#5a2410', '#8f3a18'], atmo: 0xff8a5a, caps: true },
  ice: { ocean: '#8fb4d4', land: ['#e8f4ff', '#cfe3f5', '#7fa6c8', '#ffffff'], atmo: 0x9fe0ff, clouds: true },
  lava: { ocean: '#1a0c08', land: ['#2a1410', '#3a1a12', '#120806'], atmo: 0xff5a1a, lava: true },
};

// ---------- Build a location ----------
export function createWorld(scene, loc) {
  const rand = rng(loc.seed * 31 + 7);
  const hue = rand();
  const group = new THREE.Group();
  scene.add(group);
  scene.background = new THREE.Color().setHSL(hue, 0.5, 0.012);
  const glow = glowTexture();
  const bodies = [];   // solid spheres: {center, radius}
  let gravity = null;  // black hole pull
  let heat = null;     // star surface burn
  const spinners = [];

  // Lighting (some types override the sun direction)
  let sunDir = new THREE.Vector3(-0.6, 0.35, -0.7).normalize(), sunColor = 0xfff1d6, sunVisible = true;
  if (loc.type === 'star') { sunDir = new THREE.Vector3(0, -1, 0); sunVisible = false; }
  if (loc.type === 'blackhole') { sunColor = 0xffa060; }
  const sun = new THREE.DirectionalLight(sunColor, loc.type === 'blackhole' ? 1.6 : 3.2); sun.position.copy(sunDir).multiplyScalar(100);
  group.add(sun, new THREE.HemisphereLight(0x8aa0ff, loc.type === 'star' ? 0xff7a20 : 0x201010, 0.5));
  if (sunVisible) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xfff0c0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    s.position.copy(sunDir).multiplyScalar(4500); s.scale.setScalar(900); group.add(s);
  }

  // Starfield
  {
    const N = 9000, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), c = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const v = new THREE.Vector3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize().multiplyScalar(5000 + rand() * 2000);
      pos.set([v.x, v.y, v.z], i * 3);
      c.setHSL(0.55 + rand() * 0.15 - (rand() < 0.2 ? 0.45 : 0), 0.5, 0.6 + rand() * 0.4); col.set([c.r, c.g, c.b], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    group.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, depthWrite: false })));
  }

  // Distant spiral galaxies
  for (let k = 0; k < 4; k++) {
    const N = 2500, pos = new Float32Array(N * 3), arms = 2 + (k % 3);
    for (let i = 0; i < N; i++) {
      const r = Math.pow(rand(), 0.7) * 260, a = (i % arms) / arms * Math.PI * 2 + r * 0.025 + (rand() - 0.5) * 0.5;
      pos.set([Math.cos(a) * r, (rand() - 0.5) * 12, Math.sin(a) * r], i * 3);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: 1.0, sizeAttenuation: false, color: new THREE.Color().setHSL(rand(), 0.6, 0.5), transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending }));
    pts.position.set(rand() * 2 - 1, rand() * 1.2 - 0.3, rand() * 2 - 1).normalize().multiplyScalar(4200);
    pts.rotation.set(rand() * 3, rand() * 3, rand() * 3);
    group.add(pts);
  }

  // Nebula clouds tinted per system
  const neb = [new THREE.Color().setHSL(hue, 0.8, 0.5), new THREE.Color().setHSL((hue + 0.15 + rand() * 0.3) % 1, 0.8, 0.5)];
  for (let i = 0; i < 14; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: neb[i % 2], transparent: true, opacity: 0.1 + rand() * 0.12, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.position.set(rand() * 2 - 1, rand() * 1.4 - 0.5, rand() * 2 - 1).normalize().multiplyScalar(3800);
    s.scale.setScalar(1200 + rand() * 1800); group.add(s);
  }

  const addGasGiant = (center, R, solid) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64), new THREE.MeshStandardMaterial({ map: gasTexture(rand, hue), roughness: 1 }));
    m.position.copy(center); m.rotation.z = 0.15; group.add(m); spinners.push([m, 0.006]);
    const atmo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.04, 64, 48), atmoMaterial(new THREE.Color().setHSL(hue, 0.6, 0.6)));
    atmo.position.copy(center); group.add(atmo);
    const ring = ringMesh(R * 1.3, R * 2.1, bandedRingTexture(rand, hue), { opacity: 0.85 });
    ring.position.copy(center); ring.rotation.x = -Math.PI / 2 + 0.28; ring.rotation.y = 0.2; group.add(ring);
    if (solid) bodies.push({ center, radius: R });
  };

  // Main feature of the system
  const T = loc.type;
  if (ROCKY[T]) {
    const P = ROCKY[T], R = 380 + rand() * 140, center = new THREE.Vector3((rand() - 0.5) * 200, -(R + 160), (rand() - 0.5) * 200);
    const mat = new THREE.MeshStandardMaterial({ map: rockyTexture(P, rand), roughness: 0.9 });
    if (P.lava) { mat.emissive = new THREE.Color(0xff6a1a); mat.emissiveMap = lavaGlowTexture(rand); mat.emissiveIntensity = 2.2; }
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64), mat);
    mesh.position.copy(center); mesh.rotation.z = 0.3; group.add(mesh);
    const atmo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.05, 64, 48), atmoMaterial(P.atmo));
    atmo.position.copy(center); group.add(atmo);
    if (P.clouds) {
      const cl = new THREE.Mesh(new THREE.SphereGeometry(R * 1.012, 64, 48), new THREE.MeshStandardMaterial({ map: cloudTexture(rand), transparent: true, depthWrite: false }));
      cl.position.copy(center); group.add(cl); spinners.push([cl, 0.004]);
    }
    bodies.push({ center, radius: R });
  } else if (T === 'gas') {
    const R = 900 + rand() * 200;
    addGasGiant(new THREE.Vector3(250, -(R + 200), -350), R, true);
  } else if (T === 'star') {
    const R = 700, center = new THREE.Vector3(0, -(R + 190), 0);
    const tint = ['#ffb030', '#ff7a20', '#9fc0ff'][(rand() * 3) | 0];
    const mat = new THREE.MeshBasicMaterial({ map: starTexture(rand, tint), toneMapped: false });
    mat.color.setScalar(1.6);
    const m = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64), mat); m.position.copy(center); group.add(m); spinners.push([m, 0.01]);
    const corona = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: tint, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.9 }));
    corona.position.copy(center); corona.scale.setScalar(R * 3.4); group.add(corona);
    const atmo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.06, 64, 48), atmoMaterial(tint)); atmo.position.copy(center); group.add(atmo);
    bodies.push({ center, radius: R });
    heat = { center, radius: R, range: 70, dps: 6 };
  } else if (T === 'blackhole') {
    const center = new THREE.Vector3((rand() - 0.5) * 120, -30, 240), R = 36;
    const hole = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 32), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    hole.position.copy(center); group.add(hole);
    const disk = ringMesh(R * 1.3, R * 5, radialStripTexture([[0, 'rgba(255,255,255,1)'], [0.15, 'rgba(255,200,120,0.9)'], [0.5, 'rgba(255,90,30,0.5)'], [1, 'rgba(120,20,10,0)']]),
      { blending: THREE.AdditiveBlending, toneMapped: false });
    disk.material.color.setScalar(2);
    disk.position.copy(center); disk.rotation.x = -Math.PI / 2 + 0.35; group.add(disk); spinners.push([disk, 0.3, 'z']);
    const photon = new THREE.Mesh(new THREE.TorusGeometry(R * 1.12, 0.9, 8, 96), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd9a0).multiplyScalar(3), toneMapped: false }));
    photon.position.copy(center); photon.lookAt(new THREE.Vector3(0, 0, 0)); group.add(photon);
    bodies.push({ center, radius: R });
    gravity = { center, radius: R, strength: 4.5e5, max: 75, dps: 30 };
  } else if (T === 'belt') {
    addGasGiant(new THREE.Vector3(-1800, 300, -2600), 500, false);
  }

  // Moon for most systems
  if (T !== 'star' && T !== 'blackhole' && rand() < 0.7) {
    const moon = new THREE.Mesh(new THREE.SphereGeometry(50 + rand() * 40, 48, 32), new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(rand(), 0.1, 0.55), roughness: 1, flatShading: true }));
    moon.position.set((rand() - 0.5) * 1600, 200 + rand() * 200, -900 - rand() * 400); group.add(moon);
  }

  // Asteroids: fighters bounce off these and beams explode on them
  const count = { belt: 170, blackhole: 70, star: 25, gas: 60 }[T] ?? 40 + ((rand() * 40) | 0);
  const asteroids = [];
  const rockMat = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(hue, 0.1, 0.4), roughness: 1, flatShading: true });
  const variants = [];
  for (let v = 0; v < 6; v++) {
    const g = new THREE.IcosahedronGeometry(1, 1), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const s = 0.75 + rand() * 0.45; p.setXYZ(i, p.getX(i) * s, p.getY(i) * s, p.getZ(i) * s); }
    g.computeVertexNormals(); variants.push(g);
  }
  for (let tries = 0; asteroids.length < count && tries < 6000; tries++) {
    const pos = new THREE.Vector3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).multiplyScalar(ARENA_RADIUS);
    const r = 2 + Math.pow(rand(), 2) * 10;
    if (pos.length() > ARENA_RADIUS || pos.length() < 35) continue;
    if (bodies.some((b) => pos.distanceTo(b.center) < b.radius * (gravity ? 1.6 : 1) + r + 15)) continue;
    const m = new THREE.Mesh(variants[asteroids.length % variants.length], rockMat);
    m.position.copy(pos); m.scale.setScalar(r); m.rotation.set(rand() * 6, rand() * 6, rand() * 6);
    group.add(m);
    asteroids.push({ mesh: m, pos: m.position, r, spin: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(0.4) });
  }

  const tmp = new THREE.Vector3();
  return {
    loc, group, asteroids, bodies,
    update(dt) {
      for (const a of asteroids) { a.mesh.rotation.x += a.spin.x * dt; a.mesh.rotation.y += a.spin.y * dt; }
      for (const [m, s, axis] of spinners) m.rotation[axis || 'y'] += s * dt;
    },
    // Keep a fighter out of rocks and planets, and inside the arena
    collide(f) {
      for (const a of asteroids) {
        tmp.subVectors(f.pos, a.pos); const d = tmp.length(), min = a.r + f.radius;
        if (d < min && d > 0.0001) {
          tmp.divideScalar(d); f.pos.addScaledVector(tmp, min - d);
          const vn = f.vel.dot(tmp); if (vn < 0) f.vel.addScaledVector(tmp, -vn * 1.4);
        }
      }
      for (const b of bodies) {
        tmp.subVectors(f.pos, b.center); const d = tmp.length(), min = b.radius + f.radius + 0.5;
        if (d < min) { tmp.divideScalar(d); f.pos.copy(b.center).addScaledVector(tmp, min); const vn = f.vel.dot(tmp); if (vn < 0) f.vel.addScaledVector(tmp, -vn * 1.2); }
      }
      const L = f.pos.length();
      if (L > ARENA_RADIUS) f.vel.addScaledVector(tmp.copy(f.pos).divideScalar(L), -(L - ARENA_RADIUS) * 0.5);
    },
    // Environmental effects: black-hole pull and burns, star heat. Returns true while hurting.
    hazards(f, dt) {
      if (f.dead) return false;
      let hurt = false;
      if (gravity) {
        tmp.subVectors(gravity.center, f.pos); const d = tmp.length();
        f.vel.addScaledVector(tmp.divideScalar(d), Math.min(gravity.max, gravity.strength / (d * d)) * dt);
        if (d < gravity.radius + f.radius + 6) { f.hp = Math.max(0, f.hp - gravity.dps * dt); hurt = true; }
      }
      if (heat && f.pos.distanceTo(heat.center) - heat.radius < heat.range) { f.hp = Math.max(0, f.hp - heat.dps * dt); hurt = true; }
      return hurt;
    },
    hitsSolid(p, r = 0) {
      for (const a of asteroids) if (p.distanceTo(a.pos) < a.r + r) return true;
      return bodies.some((b) => p.distanceTo(b.center) < b.radius + r);
    },
    dispose() {
      scene.remove(group);
      group.traverse((o) => { o.geometry?.dispose(); const m = o.material; if (m) (Array.isArray(m) ? m : [m]).forEach((x) => { x.map?.dispose(); x.emissiveMap?.dispose(); x.dispose(); }); });
    },
  };
}
