// The dead. Hundreds of skeletons at once: every bone of every skeleton is drawn with a few instanced meshes (skulls,
// ribcages, pelvises, limb bones, glowing eyes and one mesh per kind of weapon), posed through one shared rig.
// They climb out of the ground, find their way to you through the cave (straight at you when they can see you,
// otherwise down the walking-distance field), crowd round without overlapping, wind up and strike, shoot arrows and
// bolts, and burst into a shower of bones when they die.
import * as THREE from 'three';
import { skullGeometry, merge } from './world.js';
import { slide, sight, cellOf, CELL, solid } from './cave.js';

export const KINDS = {
  skel:   { hp: 22, speed: 3.0, dmg: 5, range: 1.4, scale: 1.05, weapon: 'sword', shield: true, eye: '#ff3a1a', xp: 4, gold: 3, cd: 1.7, tint: '#b8b098' },
  runner: { hp: 12, speed: 5.2, dmg: 4, range: 1.2, scale: 0.86, weapon: 'claw', eye: '#ff8a1a', xp: 3, gold: 2, cd: 0.9, tint: '#a8a088' },
  archer: { hp: 16, speed: 2.7, dmg: 6, range: 12, ranged: 'arrow', keep: 8, scale: 0.96, weapon: 'bow', eye: '#ffd040', xp: 5, gold: 3, cd: 2.4, tint: '#b0a684' },
  mage:   { hp: 20, speed: 2.4, dmg: 10, range: 11, ranged: 'bolt', keep: 9, scale: 1, weapon: 'staff', eye: '#40a8ff', xp: 7, gold: 5, cd: 3.2, tint: '#9aa0b0' },
  brute:  { hp: 110, speed: 2.2, dmg: 14, range: 2.3, scale: 1.7, weapon: 'axe', eye: '#ff2a1a', xp: 22, gold: 12, cd: 2.4, tint: '#a49880', slam: 2.6 },
  king:   { hp: 1000, speed: 2.7, dmg: 22, range: 3.4, scale: 2.8, weapon: 'great', crown: true, eye: '#ff3a10', xp: 300, gold: 150, cd: 2.2, tint: '#c0b498', boss: true },
};
export const MAX = 260;
const SCALE = new THREE.Matrix4();

// ------------------------------------------------------------------ the bones
const paint = (g, c) => { const n = g.attributes.position.count, a = new Float32Array(n * 3), col = new THREE.Color(c); for (let i = 0; i < n; i++) { a[i * 3] = col.r; a[i * 3 + 1] = col.g; a[i * 3 + 2] = col.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; };
function ribGeometry() {
  const parts = [], W = '#ffffff';
  const spine = new THREE.CylinderGeometry(0.035, 0.04, 0.5, 6); spine.translate(0, 0.22, -0.06); parts.push(paint(spine, '#e8e0cc'));
  for (let k = 0; k < 4; k++) { const r = 0.15 - Math.abs(k - 1.2) * 0.018, t = new THREE.TorusGeometry(r, 0.022, 4, 14, Math.PI * 1.45); t.rotateX(Math.PI / 2); t.rotateY(-Math.PI * 0.225 + Math.PI / 2 + Math.PI); t.scale(1.15, 1, 0.9); t.translate(0, 0.42 - k * 0.075, 0.0); parts.push(paint(t, W)); }
  const sternum = new THREE.BoxGeometry(0.04, 0.24, 0.03); sternum.translate(0, 0.34, 0.13); parts.push(paint(sternum, W));
  const collar = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 5); collar.rotateZ(Math.PI / 2); collar.translate(0, 0.49, 0.02); parts.push(paint(collar, W));
  return merge(parts);
}
function pelvisGeometry() {
  const a = new THREE.TorusGeometry(0.12, 0.04, 5, 10, Math.PI); a.rotateX(-Math.PI / 2 + 0.3); a.scale(1.2, 1, 0.8);
  const b = new THREE.SphereGeometry(0.06, 6, 5); b.translate(0, 0.02, -0.06);
  return merge([paint(a, '#ffffff'), paint(b, '#e8e0cc')]);
}
function boneGeometry() { const a = new THREE.CapsuleGeometry(0.04, 0.3, 2, 6); a.translate(0, -0.17, 0); const k1 = new THREE.SphereGeometry(0.055, 6, 5); const k2 = new THREE.SphereGeometry(0.05, 6, 5); k2.translate(0, -0.34, 0); return merge([paint(a, '#ffffff'), paint(k1, '#eee6d2'), paint(k2, '#eee6d2')]); }
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
function makeRig() {
  const J = (parent, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); parent.add(o); return o; };
  const root = new THREE.Object3D(), hips = J(root, 0, 0.86, 0), chest = J(hips, 0, 0.06, 0), head = J(chest, 0, 0.62, 0.02);
  const shL = J(chest, -0.2, 0.47, 0), shR = J(chest, 0.2, 0.47, 0), elL = J(shL, 0, -0.34, 0), elR = J(shR, 0, -0.34, 0), hdL = J(elL, 0, -0.33, 0), hdR = J(elR, 0, -0.33, 0);
  const thL = J(hips, -0.1, -0.02, 0), thR = J(hips, 0.1, -0.02, 0), knL = J(thL, 0, -0.42, 0), knR = J(thR, 0, -0.42, 0);
  const eyes = [J(head, -0.065, 0.0, 0.16), J(head, 0.065, 0.0, 0.16)];
  const weapon = J(hdR, 0, 0, 0), shield = J(elL, -0.05, -0.2, 0.08), crown = J(head, 0, 0.0, 0);
  // the limb bones get stretched to their length (the unit bone is 0.34 long)
  const bones = [[shL, 1], [shR, 1], [elL, 0.95], [elR, 0.95], [thL, 1.22], [thR, 1.22], [knL, 1.2], [knR, 1.2]];
  return { root, hips, chest, head, shL, shR, elL, elR, hdL, hdR, thL, thR, knL, knR, eyes, weapon, shield, crown, bones };
}

export class Horde {
  constructor(scene) {
    this.list = []; this.scene = scene; this.rig = makeRig();
    const boneMat = new THREE.MeshStandardMaterial({ color: '#d0c8b4', vertexColors: true, roughness: 0.8, metalness: 0 });
    const mk = (geo, n, mat = boneMat) => { const m = new THREE.InstancedMesh(geo, mat, n); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.count = 0; m.frustumCulled = false; scene.add(m); return m; };
    this.m = { skull: mk(skullGeometry(), MAX), rib: mk(ribGeometry(), MAX), pelvis: mk(pelvisGeometry(), MAX), bone: mk(boneGeometry(), MAX * 8), eye: mk(new THREE.SphereGeometry(0.034, 6, 4), MAX * 2, new THREE.MeshBasicMaterial({ color: '#ffffff' })) };
    const steel = new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.5, metalness: 0.6 });
    for (const w of ['sword', 'great', 'axe', 'bow', 'staff', 'claw', 'shield', 'crown']) this.m[w] = mk(weaponGeometry(w), w === 'great' || w === 'crown' ? 8 : MAX, steel);
    // shadows: a soft dark disc under every one of them
    const sh = document.createElement('canvas'); sh.width = sh.height = 64; const g = sh.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,0.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    const shGeo = new THREE.PlaneGeometry(1, 1); shGeo.rotateX(-Math.PI / 2);
    this.m.shadow = mk(shGeo, MAX + 8, new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sh), transparent: true, depthWrite: false }));
    // bones that fly when one breaks apart
    this.debris = []; const dm = new THREE.MeshStandardMaterial({ color: '#a8a088', vertexColors: true, roughness: 0.7 }); this.d = { skull: mk(skullGeometry(), 160, dm), bone: mk(boneGeometry(), 900, dm), rib: mk(ribGeometry(), 160, dm) };
    this.grid = new Map(); this.tmp = new THREE.Matrix4(); this.col = new THREE.Color(); this.v = new THREE.Vector3();
    this.m.eye.material.toneMapped = false;
  }
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
    add('skull', 1.6); add('rib', 1.2); add('bone', 0.9, 6);
    if (this.debris.length > 700) this.debris.splice(0, this.debris.length - 700);
  }
  // write every skeleton's bones into the instanced meshes
  render(t, cam) {
    const R = this.rig, m = this.m, M = this.tmp, col = this.col, cnt = {}; for (const k in m) cnt[k] = 0;
    const put = (mesh, obj, c) => { const i = cnt[mesh]++; m[mesh].setMatrixAt(i, obj.matrixWorld); if (c) m[mesh].setColorAt(i, c); };
    const shadowM = new THREE.Matrix4(), q0 = new THREE.Quaternion(), p0 = new THREE.Vector3(), s0 = new THREE.Vector3();
    for (const e of this.list) {
      if (e.dead) continue;
      pose(R, e, t);
      const rise = e.rise < 1 ? e.rise : 1, sink = (1 - rise) * -1.7 * e.scale;
      R.root.position.set(e.x, sink, e.z); R.root.rotation.set(0, e.yaw, 0); R.root.scale.setScalar(e.scale);
      R.root.updateMatrixWorld(true);
      col.set(e.K.tint); if (e.elite) col.lerp(new THREE.Color('#ffc840'), 0.45); if (e.frozen > 0) col.set('#9ad8ff'); if (e.burn > 0) col.lerp(new THREE.Color('#ff9a50'), 0.3 + Math.sin(t * 20) * 0.1); if (e.flash > 0) col.lerp(new THREE.Color('#ff4a3a'), e.flash);
      put('skull', R.head, col); put('rib', R.chest, col); put('pelvis', R.hips, col);
      for (const [j, len] of R.bones) { M.copy(j.matrixWorld).multiply(SCALE.makeScale(1, len, 1)); const i = cnt.bone++; m.bone.setMatrixAt(i, M); m.bone.setColorAt(i, col); }
      const ec = new THREE.Color(e.frozen > 0 ? '#bfefff' : e.elite ? '#ffe070' : e.K.eye).multiplyScalar(e.state === 'idle' ? 1.4 : 3);
      for (const ey of R.eyes) put('eye', ey, ec);
      const wc = new THREE.Color(e.elite ? '#ffd870' : '#ffffff');
      put(e.K.weapon, R.weapon, wc); if (e.K.shield) put('shield', R.shield, wc); if (e.K.crown) put('crown', R.crown, wc);
      p0.set(e.x, 0.03, e.z); s0.set(1.3 * e.scale, 1, 1.3 * e.scale); m.shadow.setMatrixAt(cnt.shadow++, shadowM.compose(p0, q0, s0));
    }
    // the debris
    const dc = { skull: 0, bone: 0, rib: 0 }, o = new THREE.Object3D();
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
// how a skeleton stands: a jerky shamble, arms raised to swing, bow drawn, staff lifted, rising from the ground
function pose(R, e, t) {
  const s = Math.sin(e.phase), c = Math.cos(e.phase), walk = e.moving ? 1 : 0, idle = e.state === 'idle';
  R.hips.position.y = 0.86 + Math.abs(c) * 0.05 * walk; R.hips.rotation.set(0, s * 0.1 * walk, Math.sin(e.t * 1.3 + e.id * 9) * 0.03);
  R.chest.rotation.set(0.12 + (idle ? 0.25 : 0), 0, s * 0.06 * walk);
  R.head.rotation.set(idle ? 0.4 : -0.05 + Math.sin(e.t * 2.3 + e.id) * 0.06, Math.sin(e.t * 0.9 + e.id * 4) * 0.25, Math.sin(e.t * 1.7) * 0.1);
  R.thL.rotation.set(s * 0.7 * walk, 0, 0.04); R.thR.rotation.set(-s * 0.7 * walk, 0, -0.04);
  R.knL.rotation.set(Math.max(0, -c) * 0.9 * walk + 0.05, 0, 0); R.knR.rotation.set(Math.max(0, c) * 0.9 * walk + 0.05, 0, 0);
  // arms reach forward, the way the dead come at you
  R.shL.rotation.set(-0.9 - s * 0.2 * walk, 0, 0.25); R.elL.rotation.set(-0.4, 0, 0); R.shR.rotation.set(-0.7 + s * 0.3 * walk, 0, -0.2); R.elR.rotation.set(-0.6, 0, 0);
  R.weapon.rotation.set(Math.PI / 2 + 0.5, 0, 0); R.shield.rotation.set(0.3, 0, 0);
  if (e.kind === 'archer') { R.shL.rotation.set(-1.5, 0.15, 0); R.elL.rotation.set(0, 0, 0); R.weapon.rotation.set(0, 0, 0); R.weapon.position.set(0, 0, 0); R.hdL.add(R.weapon); R.shR.rotation.set(-1.45, -0.5, 0); R.elR.rotation.set(-0.5, 0, 0); }
  else if (R.weapon.parent !== R.hdR) R.hdR.add(R.weapon);
  if (e.kind === 'mage') { R.weapon.rotation.set(0.1, 0, 0); R.shR.rotation.set(-0.6, 0, -0.1); R.elR.rotation.set(-0.9, 0, 0); }
  if (e.kind === 'runner') { R.chest.rotation.x = 0.55; R.shL.rotation.set(-0.3 - s * 0.9 * walk, 0, 0.2); R.shR.rotation.set(-0.3 + s * 0.9 * walk, 0, -0.2); }
  if (e.atk >= 0) {
    const k = e.atk, up = k < 0.6 ? k / 0.6 : 1, down = k < 0.6 ? 0 : (k - 0.6) / 0.4;
    if (e.kind === 'archer') { R.shR.rotation.set(-1.45, -0.5 + up * 0.5 - down * 0.6, 0); R.elR.rotation.set(-0.5 - up * 1.2 + down * 1.2, 0, 0); }
    else if (e.kind === 'mage') { R.shR.rotation.set(-0.6 - up * 2 + down * 1.6, 0, -0.1); R.shL.rotation.set(-0.9 - up * 1.4 + down * 1.4, 0, 0.3); R.chest.rotation.x = -0.2 * up + 0.3 * down; }
    else { R.shR.rotation.set(-0.7 - up * 2.2 + down * 2.9, 0, -0.2 + up * 0.3); R.elR.rotation.set(-0.6 + up * 0.3, 0, 0); R.chest.rotation.set(0.12 - up * 0.3 + down * 0.5, up * 0.4 - down * 0.8, 0); if (e.K.slam) { R.shL.rotation.set(-0.7 - up * 2.2 + down * 2.9, 0, 0.2 - up * 0.3); } }
  }
  if (e.state === 'rise' || e.rise < 1) { const k = 1 - e.rise; R.chest.rotation.x = 0.8 * k; R.shL.rotation.set(-2.4 * k - 0.6, 0, 0.3); R.shR.rotation.set(-2.4 * k - 0.6, 0, -0.3); }
  if (e.frozen > 0) { /* frozen mid-step: nothing changes */ }
}
