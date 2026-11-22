// On-screen controls for phones and tablets.
// Left half: a floating joystick that appears wherever your thumb lands.
// Right side: action buttons (hold-able), plus up/down and pause.

export const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window || location.hash.includes('touch');

const DEAD_ZONE = 0.15;

export class TouchControls {
  constructor(root) {
    this.root = root;
    this.joy = { x: 0, y: 0, id: null, cx: 0, cy: 0, R: 60 };
    this.held = new Set();
    this.pressed = new Set();
    const zone = root.querySelector('#joyZone');
    this.base = root.querySelector('#joyBase');
    this.knob = root.querySelector('#joyKnob');

    zone.addEventListener('pointerdown', (e) => {
      if (this.joy.id !== null) return;
      e.preventDefault();
      zone.setPointerCapture(e.pointerId);
      this.joy.id = e.pointerId;
      this.joy.R = this.base.offsetWidth / 2;
      // Re-center the joystick under the thumb
      this.joy.cx = e.clientX; this.joy.cy = e.clientY;
      this.base.style.left = `${e.clientX}px`; this.base.style.top = `${e.clientY}px`;
      this.base.classList.add('active');
      this.moveJoy(e);
    });
    zone.addEventListener('pointermove', (e) => { if (e.pointerId === this.joy.id) this.moveJoy(e); });
    const end = (e) => {
      if (e.pointerId !== this.joy.id) return;
      this.joy.id = null; this.joy.x = this.joy.y = 0;
      this.knob.style.transform = '';
      this.base.classList.remove('active');
      this.base.style.left = this.base.style.top = '';
    };
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);

    root.querySelectorAll('[data-btn]').forEach((b) => {
      const name = b.dataset.btn;
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        b.setPointerCapture(e.pointerId);
        this.held.add(name); this.pressed.add(name);
        b.classList.add('down');
        navigator.vibrate?.(8);
      });
      const up = () => { this.held.delete(name); b.classList.remove('down'); };
      b.addEventListener('pointerup', up);
      b.addEventListener('pointercancel', up);
      b.addEventListener('lostpointercapture', up);
    });

    // Stop long-press menus, double-tap zoom and pinch zoom while playing
    root.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('gesturestart', (e) => e.preventDefault());
  }

  moveJoy(e) {
    let dx = e.clientX - this.joy.cx, dy = e.clientY - this.joy.cy;
    const R = this.joy.R, L = Math.hypot(dx, dy);
    if (L > R) { dx *= R / L; dy *= R / L; }
    this.joy.x = dx / R; this.joy.y = dy / R;
    this.knob.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  /** Joystick as forward / strafe amounts in -1..1 (with a dead zone). */
  get stick() {
    const dz = (v) => (Math.abs(v) < DEAD_ZONE ? 0 : (v - Math.sign(v) * DEAD_ZONE) / (1 - DEAD_ZONE));
    return { forward: -dz(this.joy.y), strafe: dz(this.joy.x) };
  }

  release() {
    this.held.clear(); this.pressed.clear();
    this.joy.id = null; this.joy.x = this.joy.y = 0;
    this.knob.style.transform = ''; this.base.classList.remove('active');
    this.root.querySelectorAll('.down').forEach((b) => b.classList.remove('down'));
  }

  endFrame() { this.pressed.clear(); }
}
