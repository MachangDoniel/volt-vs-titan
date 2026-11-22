import * as THREE from 'three';

const randDir = () => {
  const v = new THREE.Vector3();
  do v.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1); while (v.lengthSq() > 1 || v.lengthSq() < 0.01);
  return v.normalize();
};

export class Effects {
  constructor(scene) { this.scene = scene; this.items = []; }

  burst(pos, color, count = 24, speed = 18) {
    const p = new Float32Array(count * 3), v = [];
    for (let i = 0; i < count; i++) { p.set([pos.x, pos.y, pos.z], i * 3); v.push(randDir().multiplyScalar(speed * (0.3 + Math.random()))); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const mat = new THREE.PointsMaterial({ color: new THREE.Color(color).multiplyScalar(3), size: 0.4, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const obj = new THREE.Points(geo, mat); this.scene.add(obj);
    this.items.push({ obj, life: 0.6, max: 0.6, step: (dt, it) => {
      for (let i = 0; i < count; i++) { p[i * 3] += v[i].x * dt; p[i * 3 + 1] += v[i].y * dt; p[i * 3 + 2] += v[i].z * dt; v[i].multiplyScalar(Math.exp(-3 * dt)); }
      geo.attributes.position.needsUpdate = true; mat.opacity = it.life / it.max;
    } });
  }

  ring(pos, color, maxR, dur) {
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(2), wireframe: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const obj = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), mat); obj.position.copy(pos); this.scene.add(obj);
    this.items.push({ obj, life: dur, max: dur, step: (dt, it) => {
      const t = 1 - it.life / it.max; obj.scale.setScalar(1 + maxR * t); mat.opacity = 0.55 * (1 - t);
    } });
  }

  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i]; it.life -= dt;
      if (it.life <= 0) { this.scene.remove(it.obj); it.obj.geometry.dispose(); it.obj.material.dispose(); this.items.splice(i, 1); }
      else it.step(dt, it);
    }
  }

  clear() { for (const it of this.items) it.life = 0; this.update(0); }
}

// Hyperspace streaks attached to the camera, shown while warping between systems
export class WarpStreaks {
  constructor(camera) {
    this.N = 400; this.intensity = 0;
    this.pts = Array.from({ length: this.N }, () => {
      const a = Math.random() * Math.PI * 2, r = 3 + Math.random() * 40;
      return { x: Math.cos(a) * r, y: Math.sin(a) * r, z: -5 - Math.random() * 300 };
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.N * 6), 3));
    this.mat = new THREE.LineBasicMaterial({ color: new THREE.Color(0x9fc8ff).multiplyScalar(2.5), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    this.lines = new THREE.LineSegments(geo, this.mat);
    this.lines.frustumCulled = false; this.lines.visible = false;
    camera.add(this.lines);
  }

  update(dt) {
    const I = this.intensity;
    this.lines.visible = I > 0.01;
    if (!this.lines.visible) return;
    const arr = this.lines.geometry.attributes.position.array, len = 5 + 70 * I;
    this.pts.forEach((p, i) => {
      p.z += dt * 450 * I;
      if (p.z > -4) p.z -= 300;
      arr.set([p.x, p.y, p.z, p.x, p.y, p.z - len], i * 6);
    });
    this.lines.geometry.attributes.position.needsUpdate = true;
    this.mat.opacity = Math.min(1, I);
  }
}
