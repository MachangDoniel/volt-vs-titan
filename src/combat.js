import * as THREE from 'three';

// Projectiles shared by the game and the headless simulator.

export function spawnProjectile(game, owner, origin, vel, spec) {
  let geo;
  if (spec.length) { geo = new THREE.CylinderGeometry(spec.radius, spec.radius, spec.length, 6, 1); geo.rotateX(Math.PI / 2); }
  else geo = new THREE.SphereGeometry(spec.radius, 12, 8);
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(spec.color).multiplyScalar(4), toneMapped: false }));
  mesh.position.copy(origin); mesh.lookAt(origin.clone().add(vel));
  game.scene.add(mesh);
  game.projectiles.push({ mesh, vel, owner, spec, speed: vel.length(), life: spec.life || 2.5 });
}

export function removeProjectile(game, i) {
  const p = game.projectiles[i];
  game.scene.remove(p.mesh); p.mesh.geometry.dispose(); p.mesh.material.dispose();
  game.projectiles.splice(i, 1);
}

export function clearProjectiles(game) {
  while (game.projectiles.length) removeProjectile(game, 0);
}

const _d = new THREE.Vector3();
export function updateProjectiles(game, dt) {
  for (let i = game.projectiles.length - 1; i >= 0; i--) {
    const p = game.projectiles[i];
    const target = p.owner === game.player ? game.cpu : game.player;
    const step = dt * (target.slowActive > 0 ? 0.3 : 1); // the owner is slowed by the target's Time Slow
    const pos = p.mesh.position;
    if (p.spec.homing && !target.dead) {
      _d.subVectors(target.pos, pos).normalize().multiplyScalar(p.speed);
      p.vel.lerp(_d, Math.min(1, p.spec.homing * step)).setLength(p.speed);
      if (p.spec.length) p.mesh.lookAt(_d.copy(pos).add(p.vel));
    }
    pos.addScaledVector(p.vel, step); p.life -= step;
    if (!target.dead && pos.distanceTo(target.pos) < target.radius + p.spec.radius + 0.4) {
      target.takeHit({ dmg: p.spec.dmg, dir: p.vel.clone().normalize(), knock: p.spec.knock, stun: 0.12, chill: p.spec.chill }, p.owner, game);
      removeProjectile(game, i); continue;
    }
    if (game.world.hitsSolid(pos, p.spec.radius)) { game.fx.burst(pos, p.spec.color, 16, 12); removeProjectile(game, i); continue; }
    if (p.life <= 0) removeProjectile(game, i);
  }
}
