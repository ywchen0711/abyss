// The dead. Hundreds of skeletons at once: every bone of every skeleton is drawn with a few instanced meshes (skulls,
// ribcages, pelvises, limb bones, glowing eyes and one mesh per kind of weapon), posed through one shared rig.
// They climb out of the ground, find their way to you through the cave (straight at you when they can see you,
// otherwise down the walking-distance field), crowd round without overlapping, wind up and strike, shoot arrows and
// bolts, and burst into a shower of bones when they die.
import * as THREE from 'three';
import { merge } from './world.js?v=2';
import { slide, sight, cellOf, CELL, solid } from './cave.js?v=2';

export const KINDS = {
  skel:   { hp: 22, speed: 3.0, dmg: 5, range: 1.4, scale: 1.05, weapon: 'sword', shield: true, eye: '#ff3a1a', xp: 4, gold: 3, cd: 1.7, tint: '#b8b098' },
  runner: { hp: 12, speed: 5.2, dmg: 4, range: 1.2, scale: 0.86, weapon: 'claw', eye: '#ff8a1a', xp: 3, gold: 2, cd: 0.9, tint: '#a8a088' },
  archer: { hp: 16, speed: 2.7, dmg: 6, range: 12, ranged: 'arrow', keep: 8, scale: 0.96, weapon: 'bow', eye: '#ffd040', xp: 5, gold: 3, cd: 2.4, tint: '#b0a684' },
  mage:   { hp: 20, speed: 2.4, dmg: 10, range: 11, ranged: 'bolt', keep: 9, scale: 1, weapon: 'staff', eye: '#40a8ff', xp: 7, gold: 5, cd: 3.2, tint: '#9aa0b0' },
  brute:  { hp: 110, speed: 2.2, dmg: 14, range: 2.3, scale: 1.7, weapon: 'axe', eye: '#ff2a1a', xp: 22, gold: 12, cd: 2.4, tint: '#a49880', slam: 2.6 },
  king:   { hp: 1000, speed: 2.7, dmg: 22, range: 3.4, scale: 2.8, weapon: 'great', crown: true, eye: '#ff3a10', xp: 300, gold: 150, cd: 2.2, tint: '#c0b498', boss: true },
};
export const MAX = 260;

// ------------------------------------------------------------------ the bones
const paint = (g, c) => { const n = g.attributes.position.count, a = new Float32Array(n * 3), col = new THREE.Color(c); for (let i = 0; i < n; i++) { a[i * 3] = col.r; a[i * 3 + 1] = col.g; a[i * 3 + 2] = col.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; };
// the skull in two parts: the cranium (brow, cheekbones, deep sockets, the nose hole, the upper teeth) and the jaw that opens
function craniumGeometry() {
  const P = [], B = '#ffffff', D = '#120a06';
  const dome = new THREE.SphereGeometry(0.14, 16, 12); dome.scale(1, 1.06, 1.18); dome.translate(0, 0.045, -0.012); P.push(paint(dome, B));
  const face = new THREE.BoxGeometry(0.17, 0.11, 0.1, 2, 2, 2); face.translate(0, -0.03, 0.095); P.push(paint(face, '#efe6d2'));
  const brow = new THREE.BoxGeometry(0.2, 0.03, 0.05); brow.translate(0, 0.035, 0.145); P.push(paint(brow, B));
  for (const sd of [-1, 1]) {
    const ck = new THREE.SphereGeometry(0.04, 8, 6); ck.scale(1.2, 0.8, 1); ck.translate(sd * 0.085, -0.035, 0.11); P.push(paint(ck, '#e8dfca'));
    const eye = new THREE.SphereGeometry(0.047, 10, 8); eye.scale(1, 0.9, 0.55); eye.translate(sd * 0.056, 0.0, 0.152); P.push(paint(eye, D));
    const tmp = new THREE.SphereGeometry(0.05, 8, 6); tmp.scale(0.5, 1, 1); tmp.translate(sd * 0.15, -0.01, 0.02); P.push(paint(tmp, '#e0d6c0'));
  }
  const nose = new THREE.ConeGeometry(0.024, 0.055, 3); nose.rotateX(Math.PI); nose.translate(0, -0.055, 0.15); P.push(paint(nose, D));
  for (let k = 0; k < 8; k++) { const a = (k - 3.5) / 3.5 * 0.9, th = new THREE.BoxGeometry(0.017, 0.028, 0.016); th.translate(Math.sin(a) * 0.065, -0.093, 0.085 + Math.cos(a) * 0.055); P.push(paint(th, '#f8f2e4')); }
  return merge(P);
}
function jawGeometry() {
  const P = [], u = new THREE.TorusGeometry(0.066, 0.017, 5, 14, Math.PI); u.rotateX(-Math.PI / 2); u.rotateY(Math.PI); u.scale(1, 1, 1.25); u.translate(0, -0.05, 0.045); P.push(paint(u, '#e8dfca'));
  for (const sd of [-1, 1]) { const r = new THREE.BoxGeometry(0.02, 0.07, 0.03); r.translate(sd * 0.066, -0.02, 0.03); P.push(paint(r, '#e0d6c0')); }
  const chin = new THREE.BoxGeometry(0.05, 0.03, 0.03); chin.translate(0, -0.055, 0.125); P.push(paint(chin, '#e8dfca'));
  for (let k = 0; k < 8; k++) { const a = (k - 3.5) / 3.5 * 0.9, th = new THREE.BoxGeometry(0.016, 0.026, 0.015); th.translate(Math.sin(a) * 0.058, -0.03, 0.05 + Math.cos(a) * 0.064); P.push(paint(th, '#f8f2e4')); }
  return merge(P);
}
function ribGeometry() {
  const parts = [], W = '#ffffff';
  for (let k = 0; k < 5; k++) { const r = 0.15 - Math.abs(k - 1.4) * 0.016, t = new THREE.TorusGeometry(r, 0.018, 4, 16, Math.PI * 1.5); t.rotateX(Math.PI / 2); t.rotateY(-Math.PI * 0.25 + Math.PI / 2 + Math.PI); t.scale(1.18, 1, 0.92); t.translate(0, 0.43 - k * 0.07, 0.0); parts.push(paint(t, k % 2 ? '#f2ead8' : W)); }
  const spine = new THREE.CylinderGeometry(0.03, 0.034, 0.5, 6); spine.translate(0, 0.25, -0.1); parts.push(paint(spine, '#e8e0cc'));
  for (let k = 0; k < 6; k++) { const v = new THREE.BoxGeometry(0.025, 0.03, 0.05); v.translate(0, 0.06 + k * 0.08, -0.14); parts.push(paint(v, '#ddd4bf')); }
  const sternum = new THREE.BoxGeometry(0.04, 0.24, 0.025); sternum.translate(0, 0.33, 0.13); parts.push(paint(sternum, W));
  for (const sd of [-1, 1]) { const cl = new THREE.CylinderGeometry(0.017, 0.017, 0.2, 5); cl.rotateZ(Math.PI / 2 - sd * 0.25); cl.translate(sd * 0.1, 0.48, 0.04); parts.push(paint(cl, W)); const sc = new THREE.BoxGeometry(0.11, 0.13, 0.015); sc.rotateY(sd * 0.4); sc.translate(sd * 0.12, 0.38, -0.12); parts.push(paint(sc, '#e0d6c0')); }
  return merge(parts);
}
function pelvisGeometry() {
  const P = [];
  for (const sd of [-1, 1]) { const w = new THREE.SphereGeometry(0.085, 8, 6, 0, Math.PI); w.scale(1, 1.1, 0.4); w.rotateY(sd * 1.1 + Math.PI / 2); w.translate(sd * 0.085, 0.03, -0.01); P.push(paint(w, '#ffffff')); const sk = new THREE.SphereGeometry(0.035, 6, 5); sk.translate(sd * 0.1, -0.03, 0); P.push(paint(sk, '#e8e0cc')); }
  const sac = new THREE.ConeGeometry(0.045, 0.12, 5); sac.rotateX(Math.PI); sac.translate(0, -0.0, -0.07); P.push(paint(sac, '#e8e0cc'));
  const pub = new THREE.TorusGeometry(0.06, 0.018, 4, 10, Math.PI); pub.rotateX(Math.PI / 2 + 0.6); pub.translate(0, -0.05, 0.05); P.push(paint(pub, '#f0e8d4'));
  return merge(P);
}
// a long bone (humerus, femur): knobbed at both ends, 0.34 long, hanging down from its joint
function boneGeometry() { const a = new THREE.CapsuleGeometry(0.032, 0.28, 2, 6); a.translate(0, -0.17, 0); const k1 = new THREE.SphereGeometry(0.048, 7, 5); k1.scale(1.2, 1, 1); const k2 = new THREE.SphereGeometry(0.042, 7, 5); k2.scale(1.3, 0.9, 1); k2.translate(0, -0.34, 0); return merge([paint(a, '#ffffff'), paint(k1, '#eee6d2'), paint(k2, '#eee6d2')]); }
// two bones side by side (radius and ulna, tibia and fibula)
function twinGeometry() { const a = new THREE.CapsuleGeometry(0.024, 0.28, 2, 5); a.translate(-0.018, -0.17, 0); const b = new THREE.CapsuleGeometry(0.017, 0.28, 2, 5); b.translate(0.026, -0.17, -0.008); const k = new THREE.SphereGeometry(0.04, 6, 5); k.scale(1.3, 0.8, 1); const k2 = new THREE.SphereGeometry(0.03, 6, 5); k2.scale(1.4, 0.8, 1); k2.translate(0, -0.34, 0); return merge([paint(a, '#ffffff'), paint(b, '#f0e8d6'), paint(k, '#eee6d2'), paint(k2, '#eee6d2')]); }
// a bony hand: the palm and four clawed fingers curled forward, the thumb
function handGeometry() { const P = []; const palm = new THREE.BoxGeometry(0.06, 0.06, 0.022); palm.translate(0, -0.035, 0); P.push(paint(palm, '#ece4d0'));
  for (let k = 0; k < 4; k++) { const x = -0.024 + k * 0.016; const f1 = new THREE.CapsuleGeometry(0.007, 0.035, 1, 4); f1.translate(x, -0.085, 0.006); const f2 = new THREE.CapsuleGeometry(0.006, 0.03, 1, 4); f2.rotateX(-0.9); f2.translate(x, -0.115, 0.022); P.push(paint(f1, '#ffffff'), paint(f2, '#f4ecdc')); }
  const th = new THREE.CapsuleGeometry(0.008, 0.04, 1, 4); th.rotateZ(0.7); th.rotateX(-0.5); th.translate(-0.04, -0.05, 0.02); P.push(paint(th, '#ffffff')); return merge(P); }
// a bony foot: heel, arch, five toes
function footGeometry() { const P = []; const heel = new THREE.SphereGeometry(0.03, 6, 5); heel.translate(0, -0.03, -0.03); P.push(paint(heel, '#ece4d0')); const arch = new THREE.BoxGeometry(0.06, 0.028, 0.1); arch.rotateX(-0.25); arch.translate(0, -0.035, 0.03); P.push(paint(arch, '#ffffff'));
  for (let k = 0; k < 5; k++) { const t = new THREE.CapsuleGeometry(0.008, 0.04, 1, 4); t.rotateX(Math.PI / 2); t.translate(-0.026 + k * 0.013, -0.052, 0.11 - Math.abs(k - 1) * 0.006); P.push(paint(t, '#f4ecdc')); } return merge(P); }
// a few vertebrae stacked, 0.24 long upward (the lower back, the neck)
function vertGeometry() { const P = []; for (let k = 0; k < 4; k++) { const v = new THREE.CylinderGeometry(0.036, 0.036, 0.04, 8); v.translate(0, 0.03 + k * 0.06, 0); P.push(paint(v, k % 2 ? '#efe6d2' : '#ffffff')); const s = new THREE.BoxGeometry(0.016, 0.03, 0.05); s.translate(0, 0.03 + k * 0.06, -0.04); P.push(paint(s, '#e0d6c0')); const w = new THREE.BoxGeometry(0.1, 0.014, 0.018); w.translate(0, 0.03 + k * 0.06, -0.01); P.push(paint(w, '#e8dfca')); } return merge(P); }
function weaponGeometry(kind) {
  const P = [];
  if (kind === 'sword') { const bl = new THREE.BoxGeometry(0.06, 0.8, 0.015); bl.translate(0, 0.5, 0); const gd = new THREE.BoxGeometry(0.22, 0.04, 0.05); gd.translate(0, 0.1, 0); const hd = new THREE.CylinderGeometry(0.025, 0.025, 0.16, 5); P.push(paint(bl, '#9a9488'), paint(gd, '#5a4a3a'), paint(hd, '#3a2a1a')); }
  if (kind === 'great') { const bl = new THREE.BoxGeometry(0.12, 1.5, 0.03); bl.translate(0, 0.9, 0); const gd = new THREE.BoxGeometry(0.46, 0.07, 0.08); gd.translate(0, 0.14, 0); const hd = new THREE.CylinderGeometry(0.04, 0.04, 0.3, 6); const sk = new THREE.SphereGeometry(0.06, 6, 5); sk.translate(0, -0.17, 0); P.push(paint(bl, '#6a6460'), paint(gd, '#8a6a2a'), paint(hd, '#2a1a10'), paint(sk, '#c8a040')); }
  if (kind === 'axe') { const hd = new THREE.CylinderGeometry(0.035, 0.035, 1.0, 6); hd.translate(0, 0.35, 0); const bl = new THREE.CylinderGeometry(0.28, 0.28, 0.04, 12, 1, false, 0, Math.PI); bl.rotateZ(Math.PI / 2); bl.rotateY(Math.PI / 2); bl.translate(0.0, 0.72, 0.02); P.push(paint(hd, '#4a3420'), paint(bl, '#7a746c')); }
  if (kind === 'bow') { const a = new THREE.TorusGeometry(0.4, 0.025, 4, 16, Math.PI * 0.9); a.rotateZ(Math.PI / 2 - Math.PI * 0.45); a.rotateY(Math.PI / 2); a.translate(0, 0, 0.12); const s = new THREE.CylinderGeometry(0.006, 0.006, 0.78, 3); s.translate(0, 0, -0.06); P.push(paint(a, '#5a3a1e'), paint(s, '#d8d0c0')); }
  if (kind === 'staff') { const hd = new THREE.CylinderGeometry(0.03, 0.035, 1.5, 6); hd.translate(0, 0.45, 0); const top = new THREE.TorusGeometry(0.1, 0.025, 4, 10); top.translate(0, 1.25, 0); P.push(paint(hd, '#3a2a20'), paint(top, '#8a8a9a')); }
  if (kind === 'claw') { for (const x of [-0.04, 0, 0.04]) { const c = new THREE.ConeGeometry(0.015, 0.16, 3); c.translate(x, -0.1, 0.03); P.push(paint(c, '#d8d0b8')); } }
  if (kind === 'shield') { const s = new THREE.CylinderGeometry(0.2, 0.2, 0.04, 10); s.rotateX(Math.PI / 2); const b = new THREE.SphereGeometry(0.06, 6, 4); b.translate(0, 0, 0.03); P.push(paint(s, '#4a3a2a'), paint(b, '#7a7470')); }
  if (kind === 'crown') { const r = new THREE.CylinderGeometry(0.19, 0.19, 0.08, 10, 1, true); r.translate(0, 0.16, 0); P.push(paint(r, '#e8b830')); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2, c = new THREE.ConeGeometry(0.04, 0.13, 4); c.translate(Math.cos(a) * 0.18, 0.25, Math.sin(a) * 0.18); P.push(paint(c, '#f0c840')); } }
  return merge(P);
}

// ------------------------------------------------------------------ one shared rig, posed for each skeleton in turn
// pelvis → lower back → ribcage → neck → head → jaw; collarbone → shoulder → elbow → wrist → hand; hip → knee → ankle → foot
function makeRig() {
  const J = (parent, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); parent.add(o); return o; };
  const root = new THREE.Object3D(), hips = J(root, 0, 0.86, 0), lumbar = J(hips, 0, 0.03, -0.03), chest = J(lumbar, 0, 0.19, 0.03), neck = J(chest, 0, 0.5, -0.03), head = J(neck, 0, 0.1, 0.04), jaw = J(head, 0, -0.055, 0.0);
  const clL = J(chest, -0.06, 0.47, 0), clR = J(chest, 0.06, 0.47, 0), shL = J(clL, -0.14, -0.01, 0), shR = J(clR, 0.14, -0.01, 0);
  const elL = J(shL, 0, -0.32, 0), elR = J(shR, 0, -0.32, 0), wrL = J(elL, 0, -0.3, 0), wrR = J(elR, 0, -0.3, 0);
  const thL = J(hips, -0.1, -0.03, 0), thR = J(hips, 0.1, -0.03, 0), knL = J(thL, 0, -0.42, 0), knR = J(thR, 0, -0.42, 0), anL = J(knL, 0, -0.4, 0), anR = J(knR, 0, -0.4, 0);
  const eyes = [J(head, -0.056, 0.0, 0.14), J(head, 0.056, 0.0, 0.14)];
  const weapon = J(wrR, 0, -0.08, 0.02), shield = J(elL, -0.06, -0.16, 0.05), crown = J(head, 0, 0.05, 0);
  const S = (x, y, z) => new THREE.Matrix4().makeScale(x, y, z), one = S(1, 1, 1);
  const parts = [['cranium', head, one], ['jaw', jaw, one], ['rib', chest, one], ['pelvis', hips, one], ['vert', lumbar, S(1, 0.82, 1)], ['vert', neck, S(0.72, 0.42, 0.72)],
    ['bone', shL, S(1, 0.94, 1)], ['bone', shR, S(1, 0.94, 1)], ['twin', elL, S(1, 0.88, 1)], ['twin', elR, S(1, 0.88, 1)], ['hand', wrL, one], ['hand', wrR, one],
    ['bone', thL, S(1.1, 1.24, 1.1)], ['bone', thR, S(1.1, 1.24, 1.1)], ['twin', knL, S(1.1, 1.18, 1.1)], ['twin', knR, S(1.1, 1.18, 1.1)], ['foot', anL, one], ['foot', anR, one]];
  return { root, hips, lumbar, chest, neck, head, jaw, clL, clR, shL, shR, elL, elR, wrL, wrR, hdL: wrL, hdR: wrR, thL, thR, knL, knR, anL, anR, eyes, weapon, shield, crown, parts };
}

export class Horde {
  constructor(scene) {
    this.list = []; this.scene = scene; this.rig = makeRig();
    const boneMat = new THREE.MeshStandardMaterial({ color: '#d0c8b4', vertexColors: true, roughness: 0.8, metalness: 0 });
    const mk = (geo, n, mat = boneMat) => { const m = new THREE.InstancedMesh(geo, mat, n); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.count = 0; m.frustumCulled = false; scene.add(m); return m; };
    this.m = { cranium: mk(craniumGeometry(), MAX), jaw: mk(jawGeometry(), MAX), rib: mk(ribGeometry(), MAX), pelvis: mk(pelvisGeometry(), MAX), vert: mk(vertGeometry(), MAX * 2), bone: mk(boneGeometry(), MAX * 4), twin: mk(twinGeometry(), MAX * 4), hand: mk(handGeometry(), MAX * 2), foot: mk(footGeometry(), MAX * 2), eye: mk(new THREE.SphereGeometry(0.03, 6, 4), MAX * 2, new THREE.MeshBasicMaterial({ color: '#ffffff' })) };
    const steel = new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.5, metalness: 0.6 });
    this.steel = steel;
    for (const w of ['sword', 'great', 'axe', 'bow', 'staff', 'claw', 'shield', 'crown']) this.m[w] = mk(weaponGeometry(w), w === 'great' || w === 'crown' ? 8 : MAX, steel);
    // shadows: a soft dark disc under every one of them
    const sh = document.createElement('canvas'); sh.width = sh.height = 64; const g = sh.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,0.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    const shGeo = new THREE.PlaneGeometry(1, 1); shGeo.rotateX(-Math.PI / 2);
    this.m.shadow = mk(shGeo, MAX + 8, new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sh), transparent: true, depthWrite: false }));
    // bones that fly when one breaks apart
    this.debris = []; const dm = new THREE.MeshStandardMaterial({ color: '#a8a088', vertexColors: true, roughness: 0.7 }); this.d = { skull: mk(craniumGeometry(), 160, dm), jaw: mk(jawGeometry(), 160, dm), hand: mk(handGeometry(), 300, dm), bone: mk(boneGeometry(), 900, dm), rib: mk(ribGeometry(), 160, dm) };
    this.grid = new Map(); this.tmp = new THREE.Matrix4(); this.col = new THREE.Color(); this.v = new THREE.Vector3();
    this.m.eye.material.toneMapped = false;
  }
  setEnv(env) { this.steel.envMap = env; this.steel.envMapIntensity = 0.5; this.steel.needsUpdate = true; }
  clear() { this.list = []; this.debris = []; }
  get alive() { return this.list.filter((e) => !e.dead); }
  spawn(kind, x, z, o = {}) {
    if (this.list.length >= MAX) return null;
    const K = KINDS[kind], d = o.depth || 1, hpK = 1 + (d - 1) * 0.38, elite = !!o.elite;
    const e = { kind, K, x, z, vx: 0, vz: 0, yaw: Math.random() * 6.3, hp: K.hp * hpK * (elite ? 4.5 : 1), max: K.hp * hpK * (elite ? 4.5 : 1), dmg: K.dmg * (1 + (d - 1) * 0.2) * (elite ? 1.5 : 1),
      speed: K.speed * (elite ? 1.12 : 1) * (0.9 + Math.random() * 0.2), scale: K.scale * (elite ? 1.25 : 1), elite, boss: !!K.boss, state: o.sleep ? 'idle' : 'rise', rise: o.sleep ? 1 : 0, t: Math.random() * 3, phase: Math.random() * 6, cd: K.cd * Math.random(), atk: -1,
      frozen: 0, slow: 0, flash: 0, burn: 0, kx: 0, kz: 0, seen: 0, seeT: 0, dead: false, deathT: 0, pack: o.pack, summonT: 6, slamT: 5, id: Math.random() };
    this.list.push(e); return e;
  }
  near(x, z, r) { const out = []; for (const e of this.list) if (!e.dead && e.rise >= 1 && (e.x - x) ** 2 + (e.z - z) ** 2 <= (r + 0.4 * e.scale) ** 2) out.push(e); return out; }
  nearest(x, z, r, skip) { let b = null, bd = r * r; for (const e of this.list) { if (e.dead || e.rise < 1 || (skip && skip.has(e))) continue; const d = (e.x - x) ** 2 + (e.z - z) ** 2; if (d < bd) { bd = d; b = e; } } return b; }
  // the crowd: a coarse grid so neighbours push each other apart
  hash() { this.grid.clear(); for (const e of this.list) { if (e.dead) continue; const k = (Math.floor(e.x / 1.6) << 12) ^ Math.floor(e.z / 1.6); let a = this.grid.get(k); if (!a) this.grid.set(k, (a = [])); a.push(e); } }
  update(dt, C) {
    const P = C.player, F = C.F; this.hash();
    for (const e of this.list) {
      e.t += dt; e.flash = Math.max(0, e.flash - dt * 5);
      if (e.dead) { e.deathT += dt; continue; }
      if (e.burn > 0) { e.burn -= dt; e.burnTick = (e.burnTick || 0) - dt; if (e.burnTick <= 0) { e.burnTick = 0.5; C.damage(e, e.burnDmg, { fire: true, quiet: true }); if (e.dead) continue; } }
      if (e.state === 'rise') { e.rise = Math.min(1, e.rise + dt * 1.4); if (e.rise >= 1) e.state = 'chase'; continue; }
      const dx = P.x - e.x, dz = P.z - e.z, dist = Math.hypot(dx, dz) || 0.001;
      if (e.state === 'idle') { if ((dist < 14 && sight(F, e.x, e.z, P.x, P.z)) || e.hp < e.max) { e.state = 'chase'; C.wake(e); } else { e.phase += dt * 0.5; continue; } }
      if (e.frozen > 0) { e.frozen -= dt; continue; }
      const sp = e.speed * (e.slow > 0 ? 0.45 : 1); e.slow = Math.max(0, e.slow - dt);
      e.cd -= dt; e.seeT -= dt; if (e.seeT <= 0) { e.seeT = 0.25 + Math.random() * 0.2; e.seen = dist < 26 && sight(F, e.x, e.z, P.x, P.z); }
      // an attack under way: wind up, then the blow lands
      if (e.atk >= 0) {
        e.atk += dt / (e.boss ? 0.9 : 0.55);
        if (e.atk >= 0.6 && !e.struck) { e.struck = true; if (e.K.ranged) C.shoot(e, e.K.ranged); else if (e.K.slam) C.slam(e); else if (dist < e.K.range * e.scale * 0.75 + 1.1 && P.alive) C.hurt(e.dmg, e); }
        if (e.atk >= 1) { e.atk = -1; e.struck = false; }
        e.yaw = turn(e.yaw, Math.atan2(dx, dz), dt * 8); continue;
      }
      // the boss: slams the ground and calls up more dead
      if (e.boss) { e.slamT -= dt; e.summonT -= dt; if (e.slamT <= 0 && dist < 9) { e.slamT = 6 + Math.random() * 2; C.bossSlam(e); e.atk = 0; e.struck = true; continue; } if (e.summonT <= 0) { e.summonT = 11; C.summon(e); } }
      // move: straight at the hero if he can be seen, otherwise follow the walking-distance field
      let mx = 0, mz = 0; const reach = e.K.range * (e.K.ranged ? 1 : e.scale * 0.75 + 0.35);
      if (P.alive) {
        if (e.K.ranged && e.seen && dist < e.K.range) { if (dist < e.K.keep - 1.5) { mx = -dx / dist; mz = -dz / dist; } if (e.cd <= 0) { e.cd = e.K.cd * (0.8 + Math.random() * 0.4); e.atk = 0; } }
        else if (dist <= reach && e.seen) { if (e.cd <= 0) { e.cd = e.K.cd * (0.8 + Math.random() * 0.4); e.atk = 0; } }
        else if (e.seen || dist < 2.5) { mx = dx / dist; mz = dz / dist; }
        else { const [fx, fz] = flowDir(F, C.flow, e.x, e.z); mx = fx; mz = fz; }
      }
      // keep out of each other's way
      const ci = Math.floor(e.x / 1.6), cj = Math.floor(e.z / 1.6); let px = 0, pz = 0;
      for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) { const L = this.grid.get(((ci + a) << 12) ^ (cj + b)); if (!L) continue; for (const o of L) { if (o === e) continue; const ox = e.x - o.x, oz = e.z - o.z, dd = ox * ox + oz * oz, rr = (0.38 * e.scale + 0.38 * o.scale) ** 2; if (dd < rr && dd > 1e-6) { const d1 = Math.sqrt(dd), push = (Math.sqrt(rr) - d1) / Math.sqrt(rr); px += ox / d1 * push; pz += oz / d1 * push; } } }
      if (dist < 0.75 + 0.35 * e.scale) { px -= dx / dist * 0.6; pz -= dz / dist * 0.6; }
      e.kx *= Math.exp(-dt * 7); e.kz *= Math.exp(-dt * 7);
      const vx = mx * sp + px * 3 + e.kx, vz = mz * sp + pz * 3 + e.kz;
      [e.x, e.z] = slide(F, e.x, e.z, vx * dt, vz * dt, 0.3 * e.scale);
      const moving = Math.hypot(mx, mz) > 0.1; e.moving = moving;
      if (moving) e.phase += dt * sp * 2.4;
      e.yaw = turn(e.yaw, moving && !(e.K.ranged && e.seen) ? Math.atan2(mx, mz) : Math.atan2(dx, dz), dt * 7);
    }
    // bones flying apart
    for (const b of this.debris) { b.t += dt; if (b.y > 0.05 || b.vy > 0) { b.vy -= 18 * dt; b.x += b.vx * dt; b.z += b.vz * dt; b.y += b.vy * dt; b.rx += b.sx * dt; b.rz += b.sz * dt; if (b.y < 0.05) { b.y = 0.05; b.vy = -b.vy * 0.25; b.vx *= 0.5; b.vz *= 0.5; b.sx *= 0.4; b.sz *= 0.4; if (Math.abs(b.vy) < 1) b.vy = 0; } } if (b.t > 3.5) b.y -= dt * 0.25; }
    this.debris = this.debris.filter((b) => b.t < 5.5);
    this.list = this.list.filter((e) => !e.dead || e.deathT < 0.05);
  }
  kill(e, from, C) {
    e.dead = true; e.deathT = 0;
    // shatter: skull, ribs, limbs fly from where he stood
    const ax = from ? e.x - from.x : 0, az = from ? e.z - from.z : 0, al = Math.hypot(ax, az) || 1, s = e.scale;
    const add = (type, y, n = 1) => { for (let k = 0; k < n; k++) this.debris.push({ type, x: e.x + (Math.random() - 0.5) * 0.3 * s, z: e.z + (Math.random() - 0.5) * 0.3 * s, y: y * s, vx: ax / al * (2 + Math.random() * 3) + (Math.random() - 0.5) * 4, vz: az / al * (2 + Math.random() * 3) + (Math.random() - 0.5) * 4, vy: 3 + Math.random() * 4, rx: Math.random() * 6, rz: Math.random() * 6, sx: (Math.random() - 0.5) * 18, sz: (Math.random() - 0.5) * 18, t: 0, s, tint: e.K.tint }); };
    add('skull', 1.6); add('jaw', 1.5); add('rib', 1.2); add('bone', 0.9, 6); add('hand', 0.8, 2);
    if (this.debris.length > 700) this.debris.splice(0, this.debris.length - 700);
  }
  // write every skeleton's bones into the instanced meshes
  render(t, cam) {
    const R = this.rig, m = this.m, M = this.tmp, col = this.col, cnt = {}; for (const k in m) cnt[k] = 0;
    const put = (mesh, obj, c) => { const i = cnt[mesh]++; m[mesh].setMatrixAt(i, obj.matrixWorld); if (c) m[mesh].setColorAt(i, c); };
    const shadowM = new THREE.Matrix4(), q0 = new THREE.Quaternion(), p0 = new THREE.Vector3(), s0 = new THREE.Vector3(), gold = new THREE.Color('#ffc840'), ice = new THREE.Color('#9ad8ff'), ember = new THREE.Color('#ff9a50'), blood = new THREE.Color('#ff4a3a'), ec = new THREE.Color(), wc = new THREE.Color();
    for (const e of this.list) {
      if (e.dead) continue;
      pose(R, e, t);
      const rise = e.rise < 1 ? e.rise : 1, sink = (1 - rise) * -1.7 * e.scale;
      R.root.position.set(e.x, sink, e.z); R.root.rotation.set(0, e.yaw, 0); R.root.scale.setScalar(e.scale);
      R.root.updateMatrixWorld(true);
      col.set(e.K.tint); if (e.elite) col.lerp(gold, 0.45); if (e.frozen > 0) col.copy(ice); if (e.burn > 0) col.lerp(ember, 0.3 + Math.sin(t * 20) * 0.1); if (e.flash > 0) col.lerp(blood, e.flash);
      for (const [type, j, S] of R.parts) { M.multiplyMatrices(j.matrixWorld, S); const i = cnt[type]++; m[type].setMatrixAt(i, M); m[type].setColorAt(i, col); }
      ec.set(e.frozen > 0 ? '#bfefff' : e.elite ? '#ffe070' : e.K.eye).multiplyScalar(e.state === 'idle' ? 1.2 : 2.6 + Math.sin(t * 7 + e.id * 20) * 0.4);
      for (const ey of R.eyes) put('eye', ey, ec);
      wc.set(e.elite ? '#ffd870' : '#ffffff');
      put(e.K.weapon, R.weapon, wc); if (e.K.shield) put('shield', R.shield, wc); if (e.K.crown) put('crown', R.crown, wc);
      p0.set(e.x, 0.03, e.z); s0.set(1.3 * e.scale, 1, 1.3 * e.scale); m.shadow.setMatrixAt(cnt.shadow++, shadowM.compose(p0, q0, s0));
    }
    // the debris
    const dc = { skull: 0, bone: 0, rib: 0, jaw: 0, hand: 0 }, o = this.o || (this.o = new THREE.Object3D());
    for (const b of this.debris) { o.position.set(b.x, b.y, b.z); o.rotation.set(b.rx, 0, b.rz); o.scale.setScalar(b.s); o.updateMatrix(); const mesh = this.d[b.type]; if (dc[b.type] >= mesh.instanceMatrix.count) continue; mesh.setMatrixAt(dc[b.type]++, o.matrix); }
    for (const k in this.d) { this.d[k].count = dc[k]; this.d[k].instanceMatrix.needsUpdate = true; }
    for (const k in m) { m[k].count = cnt[k]; m[k].instanceMatrix.needsUpdate = true; if (m[k].instanceColor) m[k].instanceColor.needsUpdate = true; }
  }
}
const turn = (a, b, k) => { let d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return a + d * Math.min(1, k); };
// downhill on the walking-distance field from the hero
function flowDir(F, flow, x, z) {
  if (!flow) return [0, 0];
  const i = cellOf(x), j = cellOf(z), here = flow[i + j * F.W];
  let best = here < 0 ? 32767 : here, bx = 0, bz = 0;
  for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) { const n = i + a + (j + b) * F.W, d = flow[n]; if (d >= 0 && d < best && !(a && b && (F.grid[i + a + j * F.W] || F.grid[i + (j + b) * F.W]))) { best = d; bx = a; bz = b; } }
  if (!bx && !bz) return [0, 0];
  // aim for the middle of the next cell
  const tx = (i + bx + 0.5) * CELL - x, tz = (j + bz + 0.5) * CELL - z, l = Math.hypot(tx, tz) || 1; return [tx / l, tz / l];
}
// how a skeleton moves. A loose, uneven shamble: the pelvis rocks and turns over each step, the spine sways against
// it, the knees fold in the swing and the bony feet stay flat; the arms hang and lag behind the stride, the wrists
// flop, the head lolls and twitches and the jaw clatters. Then the poses: slumped asleep, clawing up out of the
// ground, the overhead blow (twisting through the spine, stepping in), the bow drawn to the cheek, the staff raised.
const set = (o, x, y, z) => o.rotation.set(x, y, z), ez = (k) => k * k * (3 - 2 * k), cl = (v) => Math.max(0, Math.min(1, v));
function pose(R, e, t) {
  const walk = e.moving ? 1 : 0, idle = e.state === 'idle', ph = e.phase, s = Math.sin(ph), c = Math.cos(ph), id = e.id, limp = 0.65 + (id * 13 % 1) * 0.35;
  // legs: hip, knee, ankle (one leg drags a little, each skeleton its own way)
  const leg = (th, kn, an, q, amp) => { const f = Math.sin(q), sw = Math.max(0, Math.cos(q)), hip = -f * 0.55 * walk * amp - 0.06, knee = 0.1 + walk * (0.18 + 1.0 * sw * sw * amp); set(th, hip, 0, 0); set(kn, knee, 0, 0); set(an, -(hip + knee) * 0.85, 0, 0); };
  leg(R.thL, R.knL, R.anL, ph, 1); leg(R.thR, R.knR, R.anR, ph + Math.PI, limp);
  R.thL.rotation.z = 0.05; R.thR.rotation.z = -0.05;
  R.hips.position.set(Math.sin(ph) * 0.03 * walk, 0.86 - 0.03 * walk + Math.abs(c) * 0.05 * walk, 0);
  set(R.hips, 0, s * 0.2 * walk, s * 0.09 * walk + Math.sin(e.t * 1.3 + id * 9) * 0.03);
  set(R.lumbar, 0.1 + (idle ? 0.3 : 0), -s * 0.14 * walk, -s * 0.06 * walk);
  set(R.chest, 0.08 + (idle ? 0.25 : 0), -s * 0.1 * walk, Math.sin(e.t * 0.8 + id * 3) * 0.05);
  // the head lolls, and now and then snaps round
  const twitch = Math.max(0, Math.sin(e.t * 0.7 + id * 31) - 0.92) * 6;
  set(R.neck, idle ? 0.45 : 0.08, 0, 0);
  set(R.head, idle ? 0.55 : -0.18 + Math.sin(e.t * 2.3 + id) * 0.08, Math.sin(e.t * 0.9 + id * 4) * 0.3 + twitch * 0.5, Math.sin(e.t * 1.7 + id) * 0.12 - twitch * 0.2);
  set(R.jaw, idle ? 0.3 : 0.06 + Math.max(0, Math.sin(e.t * 11 + id * 5)) * 0.25 + (e.atk >= 0 ? 0.35 : 0), 0, 0);
  // arms: loose and reaching, lagging the stride
  const lag = Math.sin(ph - 0.8), lag2 = Math.sin(ph - 1.6);
  set(R.clL, 0, 0, 0.05); set(R.clR, 0, 0, -0.05);
  set(R.shL, -0.55 - lag * 0.4 * walk, 0.1, 0.22); set(R.elL, -0.45 - Math.max(0, lag2) * 0.35 * walk, 0, 0); set(R.wrL, -0.25 + lag2 * 0.35 * walk, 0, 0.1);
  set(R.shR, -0.6 + lag * 0.4 * walk, -0.1, -0.2); set(R.elR, -0.7 - Math.max(0, -lag2) * 0.3 * walk, 0, 0); set(R.wrR, 0.1, 0, 0);
  set(R.weapon, Math.PI / 2 + 0.45, 0, 0); set(R.shield, 0.3, 0, 0);
  if (idle) { set(R.shL, 0.15, 0, 0.12); set(R.elL, -0.15, 0, 0); set(R.wrL, 0.3, 0, 0); set(R.shR, 0.12, 0, -0.1); set(R.elR, -0.2, 0, 0); set(R.weapon, Math.PI / 2 + 1.1, 0, 0); }
  if (R.weapon.parent !== (e.kind === 'archer' ? R.wrL : R.wrR)) (e.kind === 'archer' ? R.wrL : R.wrR).add(R.weapon);
  if (e.kind === 'archer') { set(R.shL, -1.45, 0.15, 0); set(R.elL, -0.05, 0, 0); set(R.wrL, 0, 0, 0); set(R.weapon, 0, 0, 0); set(R.shR, -1.4, -0.55, 0); set(R.elR, -0.6, 0, 0); }
  if (e.kind === 'mage') { set(R.weapon, 0.15, 0, 0); set(R.shR, -0.55, 0, -0.12); set(R.elR, -1.0, 0, 0); set(R.wrR, 0.3, 0, 0); set(R.shL, -0.8 + lag * 0.2, 0, 0.3); set(R.elL, -0.9, 0, 0); set(R.wrL, -0.6, 0, 0); }
  if (e.kind === 'runner') { set(R.lumbar, 0.35, -s * 0.2 * walk, 0); set(R.chest, 0.35, 0, 0); set(R.head, -0.55, 0, 0); set(R.shL, -0.2 - s * 1.0 * walk, 0, 0.3); set(R.shR, -0.2 + s * 1.0 * walk, 0, -0.3); set(R.elL, -0.9, 0, 0); set(R.elR, -0.9, 0, 0); set(R.wrL, -0.6, 0, 0); set(R.wrR, -0.6, 0, 0); }
  if (e.kind === 'brute' || e.boss) { R.thL.rotation.z = 0.12; R.thR.rotation.z = -0.12; set(R.chest, 0.2, -s * 0.12 * walk, 0); }
  // the blow
  if (e.atk >= 0) {
    const k = e.atk, up = ez(cl(k / 0.6)), down = ez(cl((k - 0.6) / 0.25)), back = ez(cl((k - 0.85) / 0.15)), a = up * (1 - down), b = down * (1 - back);
    if (e.kind === 'archer') { set(R.shR, -1.4, -0.55 + a * 0.4 - b * 0.5, 0); set(R.elR, -0.6 - a * 1.6 + b * 1.4, 0, 0); set(R.wrR, -0.3 * a, 0, 0); set(R.chest, 0.05, 0.25 * a, 0); }
    else if (e.kind === 'mage') { set(R.shR, -0.55 - a * 2.1 + b * 1.5, 0, -0.12); set(R.elR, -1.0 + a * 0.6, 0, 0); set(R.shL, -0.8 - a * 1.5 + b * 1.7, 0, 0.3); set(R.elL, -0.9 + a * 0.6, 0, 0); set(R.wrL, -1.0 * b, 0, 0); set(R.chest, 0.08 - 0.25 * a + 0.35 * b, 0, 0); set(R.head, -0.4 * a, 0, 0); }
    else {
      set(R.shR, -0.6 - a * 2.4 - b * 0.1 + b * 1.5, -0.1 + a * 0.4 - b * 0.6, -0.2 + a * 0.2); set(R.elR, -0.7 - a * 0.6 + b * 0.5, 0, 0); set(R.wrR, 0.1 + a * 0.6 - b * 0.5, 0, 0);
      set(R.lumbar, 0.05 - 0.15 * a + 0.3 * b, 0.35 * a - 0.45 * b, 0); set(R.chest, 0.05 - 0.15 * a + 0.35 * b, 0.3 * a - 0.5 * b, 0);
      set(R.thL, -0.5 * (a + b) - 0.05, 0, 0.06); set(R.knL, 0.45 * (a + b) + 0.1, 0, 0); set(R.anL, 0.05, 0, 0); set(R.thR, 0.3 * b, 0, -0.06); set(R.knR, 0.2 + 0.2 * b, 0, 0); set(R.anR, -0.4 * b, 0, 0);
      R.hips.position.z = 0.15 * b; R.hips.position.y -= 0.05 * (a + b);
      if (e.K.slam) { set(R.shL, -0.6 - a * 2.4 + b * 1.6, 0.1 - a * 0.4 + b * 0.5, 0.2 - a * 0.2); set(R.elL, -0.7 - a * 0.6 + b * 0.5, 0, 0); }
    }
  }
  // clawing up out of the ground
  if (e.rise < 1) { const k = 1 - e.rise; set(R.lumbar, 0.5 * k, 0, 0); set(R.chest, 0.6 * k, 0, 0.1 * Math.sin(e.t * 9)); set(R.head, -0.5 * k, 0, 0); set(R.shL, -2.6 * k - 0.4, 0, 0.35); set(R.shR, -2.4 * k - 0.4, 0, -0.35); set(R.elL, -0.6 * k + Math.sin(e.t * 12) * 0.3 * k, 0, 0); set(R.elR, -0.6 * k + Math.cos(e.t * 12) * 0.3 * k, 0, 0); set(R.wrL, -0.8 * k, 0, 0); set(R.wrR, -0.8 * k, 0, 0); }
}
