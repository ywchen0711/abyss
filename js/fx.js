// Light and fire: glowing particles (fire, sparks, frost, souls), dust and smoke, lightning bolts, the sword's trail,
// circles on the ground (warnings before a boss slam, scorch marks, the frost ring) and a camera shake.
import * as THREE from 'three';
import { glowTexture } from './world.js';

const VERT = `attribute float size; attribute vec4 rgba; varying vec4 vC; uniform float uScale;
void main() { vC = rgba; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = size * uScale / -mv.z; gl_Position = projectionMatrix * mv; }`;
const FRAG = `uniform sampler2D map; varying vec4 vC; void main() { vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vC.rgb, vC.a * t.a); }`;

class Points {
  constructor(scene, n, blending) {
    this.n = n; this.count = 0;
    this.p = new Float32Array(n * 3); this.v = new Float32Array(n * 3); this.c = new Float32Array(n * 4); this.c0 = new Float32Array(n * 4); this.s = new Float32Array(n); this.s0 = new Float32Array(n); this.s1 = new Float32Array(n); this.life = new Float32Array(n); this.age = new Float32Array(n); this.grav = new Float32Array(n); this.drag = new Float32Array(n);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(this.p, 3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('rgba', new THREE.BufferAttribute(this.c, 4).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('size', new THREE.BufferAttribute(this.s, 1).setUsage(THREE.DynamicDrawUsage));
    this.mat = new THREE.ShaderMaterial({ uniforms: { map: { value: glowTexture() }, uScale: { value: 400 } }, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending });
    this.mesh = new THREE.Points(g, this.mat); this.mesh.frustumCulled = false; scene.add(this.mesh); this.g = g;
  }
  emit(o) {
    if (this.count >= this.n) return; const i = this.count++, k3 = i * 3, k4 = i * 4;
    this.p[k3] = o.x; this.p[k3 + 1] = o.y; this.p[k3 + 2] = o.z; this.v[k3] = o.vx || 0; this.v[k3 + 1] = o.vy || 0; this.v[k3 + 2] = o.vz || 0;
    const c = o.color; this.c0[k4] = c.r; this.c0[k4 + 1] = c.g; this.c0[k4 + 2] = c.b; this.c0[k4 + 3] = o.a ?? 1;
    this.s0[i] = o.size || 0.5; this.s1[i] = o.size1 ?? this.s0[i]; this.life[i] = o.life || 0.6; this.age[i] = 0; this.grav[i] = o.grav || 0; this.drag[i] = o.drag || 0;
  }
  update(dt) {
    let i = 0;
    while (i < this.count) {
      this.age[i] += dt; const k = this.age[i] / this.life[i];
      if (k >= 1) { this.copy(this.count - 1, i); this.count--; continue; }
      const k3 = i * 3, k4 = i * 4, dr = Math.exp(-this.drag[i] * dt);
      this.v[k3] *= dr; this.v[k3 + 1] = this.v[k3 + 1] * dr - this.grav[i] * dt; this.v[k3 + 2] *= dr;
      this.p[k3] += this.v[k3] * dt; this.p[k3 + 1] += this.v[k3 + 1] * dt; this.p[k3 + 2] += this.v[k3 + 2] * dt;
      const fade = k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85;
      this.c[k4] = this.c0[k4]; this.c[k4 + 1] = this.c0[k4 + 1]; this.c[k4 + 2] = this.c0[k4 + 2]; this.c[k4 + 3] = this.c0[k4 + 3] * fade;
      this.s[i] = this.s0[i] + (this.s1[i] - this.s0[i]) * k; i++;
    }
    this.g.setDrawRange(0, this.count); for (const a of ['position', 'rgba', 'size']) this.g.attributes[a].needsUpdate = true;
  }
  copy(a, b) { for (let k = 0; k < 3; k++) { this.p[b * 3 + k] = this.p[a * 3 + k]; this.v[b * 3 + k] = this.v[a * 3 + k]; } for (let k = 0; k < 4; k++) { this.c[b * 4 + k] = this.c[a * 4 + k]; this.c0[b * 4 + k] = this.c0[a * 4 + k]; } this.s[b] = this.s[a]; this.s0[b] = this.s0[a]; this.s1[b] = this.s1[a]; this.life[b] = this.life[a]; this.age[b] = this.age[a]; this.grav[b] = this.grav[a]; this.drag[b] = this.drag[a]; }
}
const ringTex = (() => { let t = null; return () => { if (t) return t; const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.translate(128, 128); const gr = g.createRadialGradient(0, 0, 60, 0, 0, 128); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.75, 'rgba(255,255,255,0.25)'); gr.addColorStop(0.93, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(-128, -128, 256, 256); t = new THREE.CanvasTexture(c); return t; }; })();
const discTex = (() => { let t = null; return () => { if (t) return t; const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.7, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); t = new THREE.CanvasTexture(c); return t; }; })();

export class FX {
  constructor(scene) {
    this.scene = scene; this.glow = new Points(scene, 6000, THREE.AdditiveBlending); this.dust = new Points(scene, 1500, THREE.NormalBlending);
    this.dust.mat.uniforms.map.value = discTex();
    this.bolts = []; this.decals = []; this.shakeT = 0; this.shakeA = 0; this.C = new THREE.Color();
    // the sword trail
    const n = 12, g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 2 * 3), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 2 * 3), 3));
    const idx = []; for (let k = 0; k < n - 1; k++) { const a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } g.setIndex(idx);
    this.trail = { n, pts: [], mesh: new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })) };
    this.trail.mesh.frustumCulled = false; scene.add(this.trail.mesh);
  }
  setScale(h, fov) { const s = h / (2 * Math.tan(fov * Math.PI / 360)); this.glow.mat.uniforms.uScale.value = s; this.dust.mat.uniforms.uScale.value = s; }
  // bursts of light
  spark(x, y, z, color, n = 10, o = {}) { const c = this.C.set(color); for (let k = 0; k < n; k++) { const a = Math.random() * 6.28, sp = (o.speed || 5) * (0.4 + Math.random()); this.glow.emit({ x, y, z, vx: Math.cos(a) * sp, vy: (o.up ?? 3) * Math.random() + (o.lift || 0), vz: Math.sin(a) * sp, color: c, life: (o.life || 0.45) * (0.6 + Math.random() * 0.8), size: o.size || 0.35, size1: o.size1 ?? 0.05, grav: o.grav ?? 9, drag: o.drag ?? 2, a: o.a ?? 1 }); } }
  flame(x, y, z, o = {}) { const hot = Math.random(); this.glow.emit({ x: x + (Math.random() - 0.5) * (o.r || 0.3), y, z: z + (Math.random() - 0.5) * (o.r || 0.3), vx: (Math.random() - 0.5) * 0.8, vy: (o.rise || 3) * (0.6 + Math.random() * 0.8), vz: (Math.random() - 0.5) * 0.8, color: this.C.setRGB(1, 0.25 + hot * 0.4, 0.04 + hot * 0.1), life: (o.life || 0.6) * (0.6 + Math.random() * 0.7), size: o.size || 1.1, size1: 0.15, grav: -1, drag: 1.5, a: o.a ?? 0.5 }); }
  puff(x, y, z, color, n = 6, o = {}) { const c = this.C.set(color); for (let k = 0; k < n; k++) { const a = Math.random() * 6.28, sp = (o.speed || 1.6) * Math.random(); this.dust.emit({ x, y, z, vx: Math.cos(a) * sp, vy: (o.up ?? 0.8) * Math.random(), vz: Math.sin(a) * sp, color: c, life: (o.life || 0.9) * (0.6 + Math.random() * 0.8), size: o.size || 0.6, size1: o.size1 ?? 1.6, grav: -0.3, drag: 1.8, a: o.a ?? 0.5 }); } }
  // a forked bolt of lightning between points, lying flat so it shows from above
  bolt(pts, color = '#9ad8ff', life = 0.2, w = 0.18) { const mesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })); mesh.frustumCulled = false; this.scene.add(mesh); const b = { pts, mesh, t: 0, life, w }; this.shapeBolt(b); this.bolts.push(b); }
  shapeBolt(b) {
    const P = [], col = [];
    for (let s = 0; s < b.pts.length - 1; s++) { const [a, c] = [b.pts[s], b.pts[s + 1]], n = Math.max(3, Math.ceil(Math.hypot(c[0] - a[0], c[2] - a[2]) / 0.6));
      let prev = null;
      for (let k = 0; k <= n; k++) { const f = k / n, j = k && k < n ? 0.45 : 0, x = a[0] + (c[0] - a[0]) * f + (Math.random() - 0.5) * j, y = a[1] + (c[1] - a[1]) * f + (Math.random() - 0.5) * j * 0.5, z = a[2] + (c[2] - a[2]) * f + (Math.random() - 0.5) * j;
        if (prev) { const dx = x - prev[0], dz = z - prev[2], l = Math.hypot(dx, dz) || 1, nx = -dz / l * b.w, nz = dx / l * b.w; P.push(prev[0] + nx, prev[1], prev[2] + nz, prev[0] - nx, prev[1], prev[2] - nz, x + nx, y, z + nz, prev[0] - nx, prev[1], prev[2] - nz, x - nx, y, z - nz, x + nx, y, z + nz); }
        prev = [x, y, z]; } }
    b.mesh.geometry.dispose(); b.mesh.geometry = new THREE.BufferGeometry(); b.mesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  }
  // a circle on the ground: warn (fills up red, then cb), ring (expands), scorch / ice / glow (fades)
  decal(kind, x, z, r, life, o = {}) {
    const mat = new THREE.MeshBasicMaterial({ map: kind === 'ring' || kind === 'warn' ? ringTex() : discTex(), color: o.color || (kind === 'warn' ? '#ff2a1a' : '#ffffff'), transparent: true, opacity: o.a ?? 0.8, blending: o.dark ? THREE.NormalBlending : THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); mesh.rotation.x = -Math.PI / 2; mesh.position.set(x, 0.07 + this.decals.length * 0.001, z); mesh.scale.setScalar(r); this.scene.add(mesh);
    let inner = null; if (kind === 'warn') { inner = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: discTex(), color: '#ff2a10', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })); inner.rotation.x = -Math.PI / 2; inner.position.set(x, 0.08, z); inner.scale.setScalar(0.01); this.scene.add(inner); }
    const d = { kind, mesh, inner, t: 0, life, r, a: o.a ?? 0.8, cb: o.cb, follow: o.follow }; this.decals.push(d); return d;
  }
  shake(a, t = 0.3) { this.shakeA = Math.max(this.shakeA, a); this.shakeT = Math.max(this.shakeT, t); }
  // the sword trail: feed it the hand and the point each frame of a swing
  trailPush(base, tip, on) { const T = this.trail; if (on) T.pts.unshift([base.clone(), tip.clone()]); else if (T.pts.length) T.pts.pop(); if (T.pts.length > T.n) T.pts.length = T.n; }
  update(dt, camera) {
    this.glow.update(dt); this.dust.update(dt);
    for (const b of this.bolts) { b.t += dt; if (Math.random() < 0.5) this.shapeBolt(b); b.mesh.material.opacity = 1 - b.t / b.life; }
    this.bolts = this.bolts.filter((b) => { if (b.t < b.life) return true; this.scene.remove(b.mesh); b.mesh.geometry.dispose(); b.mesh.material.dispose(); return false; });
    for (const d of this.decals) {
      d.t += dt; const k = d.t / d.life;
      if (d.follow) d.mesh.position.set(d.follow.x, d.mesh.position.y, d.follow.z);
      if (d.kind === 'warn') { d.inner.scale.setScalar(d.r * Math.min(1, k)); d.mesh.material.opacity = 0.5 + Math.sin(d.t * 18) * 0.3; if (k >= 1 && d.cb) { d.cb(); d.cb = null; } }
      else if (d.kind === 'ring') { d.mesh.scale.setScalar(d.r * (0.15 + k * 0.85)); d.mesh.material.opacity = d.a * (1 - k); }
      else d.mesh.material.opacity = d.a * (k < 0.8 ? 1 : (1 - k) / 0.2);
    }
    this.decals = this.decals.filter((d) => { if (d.t < d.life) return true; this.scene.remove(d.mesh); d.mesh.material.dispose(); if (d.inner) { this.scene.remove(d.inner); d.inner.material.dispose(); } return false; });
    // the trail ribbon: brighter at the newest edge, fading into nothing
    const T = this.trail, pos = T.mesh.geometry.attributes.position, col = T.mesh.geometry.attributes.color;
    for (let k = 0; k < T.n; k++) { const p = T.pts[Math.min(k, T.pts.length - 1)], f = T.pts.length ? 1 - k / T.n : 0; if (!p) { pos.setXYZ(k * 2, 0, -99, 0); pos.setXYZ(k * 2 + 1, 0, -99, 0); continue; } pos.setXYZ(k * 2, p[0].x, p[0].y, p[0].z); pos.setXYZ(k * 2 + 1, p[1].x, p[1].y, p[1].z); col.setXYZ(k * 2, 0, 0, 0); col.setXYZ(k * 2 + 1, 0.9 * f, 0.85 * f, 0.7 * f); }
    pos.needsUpdate = true; col.needsUpdate = true;
    // the shake
    if (this.shakeT > 0) { this.shakeT -= dt; const a = this.shakeA * Math.max(0, this.shakeT) * 3; camera.position.x += (Math.random() - 0.5) * a; camera.position.z += (Math.random() - 0.5) * a; if (this.shakeT <= 0) this.shakeA = 0; }
  }
  clear() { for (const d of this.decals) { this.scene.remove(d.mesh); if (d.inner) this.scene.remove(d.inner); } this.decals = []; for (const b of this.bolts) this.scene.remove(b.mesh); this.bolts = []; this.glow.count = 0; this.dust.count = 0; this.trail.pts = []; }
}
