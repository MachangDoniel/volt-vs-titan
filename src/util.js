import * as THREE from 'three';

const WORLD_UP = new THREE.Vector3(0, 1, 0);

// Build a forward/right/up frame looking along `dir`. Keeps the previous
// right vector when looking straight up or down so controls don't flip.
export function basis(dir, out) {
  out.fwd.copy(dir).normalize();
  const r = new THREE.Vector3().crossVectors(out.fwd, WORLD_UP);
  if (r.lengthSq() > 0.0004) out.right.copy(r.normalize());
  else out.right.addScaledVector(out.fwd, -out.right.dot(out.fwd)).normalize();
  out.up.crossVectors(out.right, out.fwd).normalize();
  return out;
}
