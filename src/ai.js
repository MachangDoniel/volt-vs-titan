import * as THREE from 'three';
import { basis } from './util.js';
import { COMBO_WINDOW } from './fighter.js';

const DIFF = {
  easy:   { react: 0.25, aggr: 0.5 },
  normal: { react: 0.6,  aggr: 0.85 },
  hard:   { react: 0.95, aggr: 1.2 },
};

// State-machine opponent that works for any hero: it keeps the hero's preferred
// distance, attacks in range, presses combos, and reacts to beams and punches.
export class AIController {
  constructor(me, enemy, difficulty) {
    this.me = me; this.enemy = enemy; this.d = DIFF[difficulty] || DIFF.normal;
    this.mode = 'approach'; this.timer = 0; this.strafe = 1; this.vert = 0;
    this.blockT = 0; this.seenPunch = -1;
    this.basis = { fwd: new THREE.Vector3(), right: new THREE.Vector3(1, 0, 0), up: new THREE.Vector3() };
  }

  think(dt, game) {
    const { me, enemy: en, d } = this;
    const toEn = en.pos.clone().sub(me.pos), dist = toEn.length();
    const { fwd, right, up } = basis(toEn, this.basis);
    const R = Math.random, pref = me.def.ai.prefDist;

    this.timer -= dt;
    if (this.timer <= 0) {
      const low = me.hp / me.def.maxHp < 0.3, r = R();
      if (dist > Math.max(30, pref * 2)) this.mode = r < 0.8 ? 'approach' : 'strafe';
      else if (low && r < 0.35) this.mode = 'retreat';
      else if (pref > 8 && dist < pref * 0.5 && r < 0.5) this.mode = 'retreat';
      else this.mode = r < 0.2 + 0.4 * d.aggr ? 'approach' : r < 0.85 ? 'strafe' : 'retreat';
      this.timer = 0.6 + R() * 1.6; this.strafe = R() < 0.5 ? -1 : 1; this.vert = Math.round(R() * 2 - 1);
    }
    // Mid-combo: stay on the target to finish it
    const comboLive = me.combo > 0 && me.t - me.lastHitT < COMBO_WINDOW;
    if (comboLive) this.mode = 'approach';

    const intent = { move: new THREE.Vector3(), punch: false, beam: false, dash: false, ability: false, block: false };
    const m = intent.move;
    if (this.mode === 'approach') {
      const close = comboLive ? 2.5 : Math.max(2.5, pref * 0.8);
      m.copy(fwd).multiplyScalar(dist > close ? 1 : -0.4).addScaledVector(right, this.strafe * 0.3);
    } else if (this.mode === 'strafe') {
      m.copy(right).multiplyScalar(this.strafe).addScaledVector(up, this.vert * 0.5).addScaledVector(fwd, dist > pref + 6 ? 0.5 : dist < pref - 4 ? -0.4 : 0);
    } else m.copy(fwd).negate().addScaledVector(right, this.strafe * 0.5);

    // Offense
    if (dist < me.def.melee.range + 0.4 && R() < dt * (comboLive ? 12 : 7) * d.aggr) intent.punch = true;
    if (dist > 7 && me.energy > me.def.beam.cost + 8 && R() < dt * 1.5 * d.aggr) intent.beam = true;
    const A = me.def.ability;
    if (dist < A.aiRange && me.energy >= A.cost && R() < dt * 0.9 * d.aggr) intent.ability = true;

    // Defense: dodge or block incoming projectiles
    for (const p of game.projectiles) {
      if (p.owner === me) continue;
      const rel = me.pos.clone().sub(p.mesh.position);
      if (rel.length() < 22 && rel.dot(p.vel) > 0 && R() < d.react * dt * 6) {
        if (me.energy > 20 && R() < 0.6) { intent.dash = true; m.copy(right).multiplyScalar(this.strafe).addScaledVector(up, R() - 0.5); }
        else this.blockT = 0.35;
      }
    }
    // Defense: react to a punch wind-up (harder to react once already in a combo)
    if (en.pendingMelee > 0 && en.punchId !== this.seenPunch && dist < 5) {
      this.seenPunch = en.punchId;
      const pressure = en.combo >= 2 ? 1.2 : 1;
      if (R() < d.react * 0.6 * pressure) this.blockT = 0.3;
      else if (R() < d.react * 0.3) { intent.dash = true; m.copy(right).multiplyScalar(this.strafe); }
    }
    this.blockT -= dt;
    if (this.blockT > 0) { intent.block = true; intent.punch = intent.beam = intent.ability = false; }
    return intent;
  }
}
