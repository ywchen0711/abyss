// What a floor of the abyss looks like: one rolling cave mesh (flagstones and moss on the floor, rock rising into
// cliffs where the grid is solid), boulders along the walls, flat old slabs, bones everywhere, iron braziers with
// living fire, teal crystals, the obelisk on its rune circle, chests, shrines and the portal down.
import * as THREE from 'three';
import { CELL, density, rng, centre } from './cave.js';

// ------------------------------------------------------------------ textures painted on a canvas
function canvas(n) { const c = document.createElement('canvas'); c.width = c.height = n; return c; }
let STONE = null;
export function stoneTextures() {
  if (STONE) return STONE;
  const N = 512, c = canvas(N), g = c.getContext('2d'), img = g.createImageData(N, N), d = img.data, R = rng(77);
  // seamless voronoi flagstones: each pixel finds its nearest two seeds (wrapping round the edges)
  const pts = []; for (let k = 0; k < 14; k++) pts.push([R() * N, R() * N, 0.8 + R() * 0.4]);
  const noise = new Float32Array(N * N); for (let o = 0; o < 4; o++) { const s = 4 << o, grid = []; for (let k = 0; k < s * s; k++) grid.push(R()); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const u = x / N * s, v = y / N * s, i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, at = (a, b) => grid[(a % s) + (b % s) * s], sm = (t) => t * t * (3 - 2 * t); noise[x + y * N] += ((at(i, j) * (1 - sm(fu)) + at(i + 1, j) * sm(fu)) * (1 - sm(fv)) + (at(i, j + 1) * (1 - sm(fu)) + at(i + 1, j + 1) * sm(fu)) * sm(fv)) / (1 << o); } }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let d1 = 1e9, d2 = 1e9, tone = 1;
    for (const [px, py, t] of pts) { let dx = Math.abs(x - px), dy = Math.abs(y - py); dx = Math.min(dx, N - dx); dy = Math.min(dy, N - dy); const dd = dx * dx + dy * dy; if (dd < d1) { d2 = d1; d1 = dd; tone = t; } else if (dd < d2) d2 = dd; }
    const edge = Math.sqrt(d2) - Math.sqrt(d1), n = noise[x + y * N] / 1.9, crack = edge < 1.3 ? 0.62 : edge < 2.6 ? 0.86 : 1;
    let v = (0.42 + n * 0.62) * (0.88 + (tone - 1) * 0.5) * crack; const k = (x + y * N) * 4;
    d[k] = 255 * Math.min(1, v * 0.5); d[k + 1] = 255 * Math.min(1, v * 0.56); d[k + 2] = 255 * Math.min(1, v * 0.52); d[k + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  // little pebbles and scratches
  for (let k = 0; k < 500; k++) { g.fillStyle = `rgba(${R() < 0.5 ? '20,24,20' : '150,160,150'},${0.15 + R() * 0.2})`; g.beginPath(); g.arc(R() * N, R() * N, 0.6 + R() * 1.8, 0, 7); g.fill(); }
  const map = new THREE.CanvasTexture(c); map.wrapS = map.wrapT = THREE.RepeatWrapping; map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4;
  const bump = new THREE.CanvasTexture(c); bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  return (STONE = { map, bump });
}
// a soft round glow (fire, magic, sparks)
let GLOW = null;
export function glowTexture() {
  if (GLOW) return GLOW;
  const c = canvas(128), g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.7)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.15)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); GLOW = new THREE.CanvasTexture(c); return GLOW;
}
// a tongue of flame: bright at the bottom, licking up to a point
let FLAME = null;
export function flameTexture() {
  if (FLAME) return FLAME;
  const c = canvas(128), g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 92, 2, 64, 80, 60); gr.addColorStop(0, 'rgba(255,250,220,1)'); gr.addColorStop(0.3, 'rgba(255,190,70,0.9)'); gr.addColorStop(0.65, 'rgba(240,80,20,0.45)'); gr.addColorStop(1, 'rgba(120,20,0,0)');
  g.fillStyle = gr; g.beginPath(); g.moveTo(64, 4); g.bezierCurveTo(92, 40, 112, 70, 100, 100); g.quadraticCurveTo(64, 132, 28, 100); g.bezierCurveTo(16, 70, 36, 40, 64, 4); g.fill();
  FLAME = new THREE.CanvasTexture(c); return FLAME;
}
// a magic circle of runes for the floor
function runeTexture() {
  const c = canvas(512), g = c.getContext('2d'); g.translate(256, 256); g.strokeStyle = '#fff'; g.fillStyle = '#fff';
  for (const [r, w] of [[240, 6], [210, 3], [150, 4], [120, 2]]) { g.lineWidth = w; g.beginPath(); g.arc(0, 0, r, 0, 7); g.stroke(); }
  g.font = '28px serif'; g.textAlign = 'center'; const runes = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ';
  for (let k = 0; k < 24; k++) { g.save(); g.rotate(k / 24 * Math.PI * 2); g.fillText(runes[k], 0, -218); g.restore(); }
  g.lineWidth = 3; g.beginPath(); for (let k = 0; k <= 5; k++) { const a = (k * 2) / 5 * Math.PI * 2 - Math.PI / 2; k ? g.lineTo(Math.cos(a) * 150, Math.sin(a) * 150) : g.moveTo(Math.cos(a) * 150, Math.sin(a) * 150); } g.stroke();
  const t = new THREE.CanvasTexture(c); return t;
}

// ------------------------------------------------------------------ shared bits
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...o });
export function rockGeometry(seed, detail = 1) {
  const g = new THREE.IcosahedronGeometry(1, detail), p = g.attributes.position, R = rng(seed), v = new THREE.Vector3(), bumps = [];
  for (let k = 0; k < 6; k++) bumps.push([new THREE.Vector3(R() - 0.5, R() - 0.5, R() - 0.5).normalize(), 0.15 + R() * 0.25]);
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); let s = 1; for (const [b, a] of bumps) s += Math.max(0, v.dot(b)) * a - a * 0.3; v.multiplyScalar(s); v.y *= 0.8; p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); return g;
}

// ------------------------------------------------------------------ the floor
export function buildWorld(F, scene) {
  const group = new THREE.Group(); scene.add(group);
  const R = rng(F.seed + 5), S = F.W * CELL, seg = F.W * 2, tex = stoneTextures();
  const nz = (x, z, f) => Math.sin(x * f + F.seed) * Math.cos(z * f * 1.3 + F.seed * 0.7) * 0.5 + Math.sin((x + z) * f * 2.1) * 0.25;
  // the cave: floor at 0, rock swelling up into walls (2–5 m) wherever the grid is solid
  const geo = new THREE.PlaneGeometry(S, S, seg, seg); geo.rotateX(-Math.PI / 2); geo.translate(S / 2, 0, S / 2);
  const pos = geo.attributes.position, uv = geo.attributes.uv, col = new Float32Array(pos.count * 3);
  for (let k = 0; k < pos.count; k++) {
    const x = pos.getX(k), z = pos.getZ(k), dn = density(F, x, z);
    const rock = THREE.MathUtils.smoothstep(dn, 0.3, 0.95), h = rock * (2.6 + (nz(x, z, 0.21) + 0.6) * 2.2) + (rock < 0.05 ? nz(x, z, 1.7) * 0.04 : 0);
    pos.setY(k, h); uv.setXY(k, x / 9, z / 9);
    const moss = Math.max(0, nz(x, z, 0.13) + 0.2), dark = 1 - THREE.MathUtils.smoothstep(dn, 0.05, 0.4) * 0.45;
    let r = (0.62 - moss * 0.12) * dark, gg = (0.66 + moss * 0.08) * dark, b = (0.6 - moss * 0.05) * dark;
    if (rock > 0.05) { const t = Math.min(1, rock * 1.3), top = THREE.MathUtils.smoothstep(h, 2, 5); r = r * (1 - t) + (0.26 - top * 0.1) * t; gg = gg * (1 - t) + (0.27 - top * 0.1) * t; b = b * (1 - t) + (0.25 - top * 0.08) * t; }
    col[k * 3] = r; col[k * 3 + 1] = gg; col[k * 3 + 2] = b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
  const ground = new THREE.Mesh(geo, std('#ffffff', { map: tex.map, bumpMap: tex.bump, bumpScale: 0.8, vertexColors: true, roughness: 0.95 }));
  group.add(ground);
  // boulders along the walls, three shapes, instanced
  const edges = []; for (let j = 1; j < F.H - 1; j++) for (let i = 1; i < F.W - 1; i++) { if (!F.grid[i + j * F.W]) continue; let n = 0; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) n += !F.grid[i + a + (j + b) * F.W]; if (n) edges.push([i, j]); }
  const rockMat = std('#7a7e74', { roughness: 0.95, flatShading: true }), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), p3 = new THREE.Vector3(), c3 = new THREE.Color();
  for (let v = 0; v < 3; v++) {
    const mine = edges.filter((_, k) => k % 3 === v && R() < 0.75), mesh = new THREE.InstancedMesh(rockGeometry(v * 31 + F.seed), rockMat, mine.length);
    mine.forEach(([i, j], k) => { const s = 0.9 + R() * 1.1; p3.set(centre(i) + (R() - 0.5) * 1.2, -0.2 + R() * 0.5, centre(j) + (R() - 0.5) * 1.2); q.setFromEuler(e.set(R() * 0.5, R() * 6.3, R() * 0.5)); sc.set(s * (1 + R() * 0.6), s * (0.7 + R() * 0.9), s * (1 + R() * 0.6)); mesh.setMatrixAt(k, m4.compose(p3, q, sc)); c3.setHSL(0.25 + R() * 0.08, 0.06, 0.32 + R() * 0.12); mesh.setColorAt(k, c3); });
    group.add(mesh);
  }
  // old flat slabs set into the floor, and loose stones
  { const geoS = new THREE.BoxGeometry(1.5, 0.05, 1.1), mesh = new THREE.InstancedMesh(geoS, std('#8a8e86', { map: tex.map, roughness: 0.9 }), F.slabs.length);
    F.slabs.forEach(([i, j], k) => { p3.set(centre(i) + (R() - 0.5), 0.01, centre(j) + (R() - 0.5)); q.setFromEuler(e.set((R() - 0.5) * 0.06, R() * 6.3, (R() - 0.5) * 0.06)); sc.set(0.7 + R() * 0.8, 1, 0.7 + R() * 0.8); mesh.setMatrixAt(k, m4.compose(p3, q, sc)); c3.setHSL(0.22, 0.06, 0.62 + R() * 0.2); mesh.setColorAt(k, c3); });
    group.add(mesh); }
  // bones: skulls, long bones and ribs, lying about
  const bonePile = F.bones.flatMap(([i, j]) => { const n = 1 + Math.floor(R() * 4), out = []; for (let k = 0; k < n; k++) out.push([centre(i) + (R() - 0.5) * 1.8, centre(j) + (R() - 0.5) * 1.8, R()]); return out; });
  { const boneMat = std('#a49c86', { roughness: 0.7 }), long = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.045, 0.5, 2, 6), boneMat, bonePile.length), skulls = bonePile.filter((b) => b[2] < 0.25), sk = new THREE.InstancedMesh(skullGeometry(), std('#aaa28c', { vertexColors: true, roughness: 0.6 }), skulls.length);
    bonePile.forEach(([x, z], k) => { p3.set(x, 0.05, z); q.setFromEuler(e.set(Math.PI / 2, 0, R() * 6.3)); sc.set(1, 0.6 + R() * 0.8, 1); long.setMatrixAt(k, m4.compose(p3, q, sc)); });
    skulls.forEach(([x, z], k) => { p3.set(x + 0.3, 0.12, z); q.setFromEuler(e.set(-0.4 + R() * 0.3, R() * 6.3, (R() - 0.5) * 0.8)); sc.setScalar(0.9 + R() * 0.3); sk.setMatrixAt(k, m4.compose(p3, q, sc)); });
    group.add(long, sk); }
  // teal crystals growing out of the rock
  const crystals = [];
  { const geoC = new THREE.ConeGeometry(0.22, 1.4, 5), list = F.crystals.flatMap(([i, j]) => { const out = []; for (let k = 0; k < 5; k++) out.push([centre(i) + (R() - 0.5) * 1.4, centre(j) + (R() - 0.5) * 1.4]); crystals.push([centre(i), centre(j)]); return out; });
    const mesh = new THREE.InstancedMesh(geoC, new THREE.MeshStandardMaterial({ color: '#3ae8d0', emissive: '#18a090', emissiveIntensity: 1.6, roughness: 0.25, metalness: 0.1, flatShading: true }), list.length);
    list.forEach(([x, z], k) => { const s = 0.5 + R() * 1.1; p3.set(x, 0.4 * s, z); q.setFromEuler(e.set((R() - 0.5) * 0.9, R() * 6, (R() - 0.5) * 0.9)); sc.set(s, s * (0.8 + R() * 0.8), s); mesh.setMatrixAt(k, m4.compose(p3, q, sc)); });
    group.add(mesh); }
  // braziers: an iron bowl on three legs with fire in it
  const flames = [], fireMat = new THREE.SpriteMaterial({ map: flameTexture(), color: '#d8601a', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.6 });
  const glowMat = new THREE.SpriteMaterial({ map: glowTexture(), color: '#ff7a2a', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.3 });
  const iron = std('#2a2622', { metalness: 0.6, roughness: 0.5 }), bowlG = new THREE.CylinderGeometry(0.55, 0.3, 0.4, 10, 1, true), legG = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 5), coalG = new THREE.CylinderGeometry(0.5, 0.5, 0.08, 10);
  const coal = new THREE.MeshBasicMaterial({ color: '#b84a10' });
  const braziers = F.braziers.map(([i, j]) => {
    const b = new THREE.Group(), x = centre(i), z = centre(j); b.position.set(x, 0, z);
    const bowl = new THREE.Mesh(bowlG, iron); bowl.position.y = 1.2; const cl = new THREE.Mesh(coalG, coal); cl.position.y = 1.32; b.add(bowl, cl);
    for (let k = 0; k < 3; k++) { const l = new THREE.Mesh(legG, iron), a = k / 3 * Math.PI * 2; l.position.set(Math.cos(a) * 0.3, 0.6, Math.sin(a) * 0.3); l.rotation.set(Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25); b.add(l); }
    for (let k = 0; k < 3; k++) { const f = new THREE.Sprite(fireMat); f.position.set((k - 1) * 0.16, 1.62, 0); f.scale.set(0.5, 0.8, 1); b.add(f); flames.push({ s: f, k: R() * 10, base: 1.62 }); }
    const gl = new THREE.Sprite(glowMat); gl.position.y = 1.6; gl.scale.setScalar(3); b.add(gl);
    group.add(b); return { x, z, y: 4.2, color: '#ff8a3a', power: 1.25 };
  });
  // light: a pool of point lights handed to the nearest fires and crystals each moment
  const lamps = [...braziers, ...crystals.map(([x, z]) => ({ x, z, y: 1.2, color: '#40f0d8', power: 0.6 }))];
  const pool = []; for (let k = 0; k < 6; k++) { const L = new THREE.PointLight('#ff8a3a', 0, 15, 1.6); group.add(L); pool.push(L); }
  // the obelisk on its rune circle
  const ob = new THREE.Group(), ax = centre(F.arena[0]), az = centre(F.arena[1]); ob.position.set(ax, 0, az);
  const darkStone = std('#2a2a30', { roughness: 0.7, metalness: 0.2, flatShading: true });
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3, 0.5, 8), darkStone); plinth.position.y = 0.25;
  const step2 = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 2, 0.5, 8), darkStone); step2.position.y = 0.7;
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.95, 6, 4), darkStone); spire.position.y = 3.9; spire.rotation.y = Math.PI / 4;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1, 4), darkStone); tip.position.y = 7.4; tip.rotation.y = Math.PI / 4;
  const runeMat = new THREE.MeshStandardMaterial({ color: '#ff6a20', emissive: '#ff4a10', emissiveIntensity: 0.6 });
  const runes = []; for (let k = 0; k < 4; k++) for (let r = 0; r < 4; r++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.42, 0.05), runeMat), a = k * Math.PI / 2, w = 0.88 - r * 0.13; m.position.set(Math.sin(a) * w * 0.72, 1.7 + r * 1.3, Math.cos(a) * w * 0.72); m.rotation.y = a; ob.add(m); runes.push(m); }
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.55), new THREE.MeshStandardMaterial({ color: '#ff9a40', emissive: '#ff5a10', emissiveIntensity: 1 })); core.position.y = 8.6;
  const circleMat = new THREE.MeshBasicMaterial({ map: runeTexture(), color: '#ff5a20', transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false });
  const circle = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), circleMat); circle.rotation.x = -Math.PI / 2; circle.position.y = 0.06;
  const obLight = new THREE.PointLight('#ff6a2a', 12, 24, 1.5); obLight.position.y = 5;
  ob.add(plinth, step2, spire, tip, core, circle, obLight); group.add(ob);
  const obelisk = { x: ax, z: az, group: ob, core, circle, circleMat, runeMat, light: obLight, runes };
  // chests: dark wood bound in iron and gold
  const wood = std('#5a3a22', { roughness: 0.8 }), gold = std('#d8a840', { metalness: 0.8, roughness: 0.35 });
  const chests = F.chests.map(([i, j]) => { const c = new THREE.Group(), x = centre(i), z = centre(j); c.position.set(x, 0, z); c.rotation.y = R() * 6.3;
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.7, 0.85), wood); base.position.y = 0.35; const lid = new THREE.Group(); lid.position.set(0, 0.7, -0.42);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.3, 10, 1, false, 0, Math.PI), wood); top.rotation.z = Math.PI / 2; top.position.z = 0.42; lid.add(top);
    for (const dx of [-0.5, 0.5]) { const band = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.72, 0.88), gold); band.position.set(dx, 0.35, 0); c.add(band); }
    const lock = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.24, 0.06), gold); lock.position.set(0, 0.62, 0.44); c.add(base, lid, lock); group.add(c);
    return { x, z, group: c, lid, open: false }; });
  // shrines: a pillar with a floating orb of power
  const KINDS = [['fury', '#ff4a3a'], ['mana', '#3a8aff'], ['haste', '#5aff7a'], ['fortune', '#ffd040']];
  const shrines = F.shrines.map(([i, j], k) => { const [kind, color] = KINDS[(F.seed + k) % 4], s = new THREE.Group(), x = centre(i), z = centre(j); s.position.set(x, 0, z);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.65, 1.3, 6), darkStone); ped.position.y = 0.65;
    const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4, 1), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2.2 })); orb.position.y = 2;
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.7 })); halo.position.y = 2; halo.scale.setScalar(3);
    s.add(ped, orb, halo); group.add(s); lamps.push({ x, z, y: 2.2, color, power: 0.8, shrine: true });
    return { x, z, kind, color, group: s, orb, halo, used: false }; });
  // the portal down (hidden until the obelisk is charged)
  const portal = new THREE.Group(); portal.position.set(ax + 6.5, 0, az); portal.visible = false;
  const ringM = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.16, 10, 40), new THREE.MeshStandardMaterial({ color: '#80c8ff', emissive: '#4aa0ff', emissiveIntensity: 2.4 })); ringM.position.y = 2;
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.5, 40), new THREE.MeshBasicMaterial({ map: swirlTexture(), color: '#8ad0ff', transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); disc.position.y = 2;
  const pLight = new THREE.PointLight('#6ab8ff', 0, 14, 1.5); pLight.position.y = 2; portal.add(ringM, disc, pLight); group.add(portal);
  let lampT = 0;
  return {
    group, braziers, chests, shrines, obelisk, portal: { group: portal, x: ax + 6.5, z: az, disc, light: pLight, ring: ringM },
    update(t, dt, px, pz) {
      for (const f of flames) { const w = Math.sin(t * 9 + f.k) * 0.12 + Math.sin(t * 23 + f.k * 3) * 0.06; f.s.scale.set(0.5 + w * 0.6, 0.8 + w * 1.4, 1); f.s.position.y = f.base + w * 0.2; }
      lampT -= dt; if (lampT <= 0) { lampT = 0.3; const near = lamps.map((l) => [l, (l.x - px) ** 2 + (l.z - pz) ** 2]).sort((a, b) => a[1] - b[1]).slice(0, pool.length); pool.forEach((L, k) => { const l = near[k] && near[k][1] < 900 ? near[k][0] : null; L.userData.l = l; if (l) { L.position.set(l.x, l.y, l.z); L.color.set(l.color); } }); }
      pool.forEach((L, k) => { const l = L.userData.l; L.intensity = l ? (l.power * (l.shrine && shrines.find((s) => s.x === l.x && s.used) ? 0.2 : 1)) * (13 + Math.sin(t * 11 + k) * 1.6 + Math.sin(t * 29 + k * 2) * 1) : 0; });
      for (const s of shrines) { s.orb.position.y = 2 + Math.sin(t * 2 + s.x) * 0.15; s.orb.rotation.y = t; s.halo.material.opacity = s.used ? 0.1 : 0.6 + Math.sin(t * 3) * 0.1; }
      obelisk.circle.rotation.z = t * 0.1; obelisk.core.rotation.y = t * 0.8;
      if (portal.visible) { this.portal.disc.rotation.z = -t * 2; this.portal.ring.rotation.z = t * 0.5; this.portal.light.intensity = 28 + Math.sin(t * 5) * 5; }
    },
    dispose() { scene.remove(group); group.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); },
  };
}
function swirlTexture() {
  const c = canvas(256), g = c.getContext('2d'); g.translate(128, 128);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 128); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(120,180,255,0.5)'); gr.addColorStop(1, 'rgba(40,80,200,0)'); g.fillStyle = gr; g.fillRect(-128, -128, 256, 256);
  g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 5; for (let k = 0; k < 5; k++) { g.beginPath(); for (let s = 0; s < 60; s++) { const a = k / 5 * Math.PI * 2 + s * 0.09, r = s * 2; s ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(0, 0); } g.stroke(); }
  return new THREE.CanvasTexture(c);
}
// a skull: the dome, the face, two dark eye sockets and a nose hole (vertex coloured), used for props and the dead
let SKULL = null;
export function skullGeometry() {
  if (SKULL) return SKULL;
  const parts = [], paint = (g, c) => { const n = g.attributes.position.count, a = new Float32Array(n * 3), col = new THREE.Color(c); for (let i = 0; i < n; i++) { a[i * 3] = col.r; a[i * 3 + 1] = col.g; a[i * 3 + 2] = col.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; };
  const dome = new THREE.SphereGeometry(0.17, 12, 10); dome.scale(1, 1.05, 1.15); parts.push(paint(dome, '#ffffff'));
  const jaw = new THREE.BoxGeometry(0.2, 0.08, 0.16); jaw.translate(0, -0.14, 0.06); parts.push(paint(jaw, '#e8e0cc'));
  for (const sx of [-1, 1]) { const eye = new THREE.SphereGeometry(0.05, 8, 6); eye.scale(1, 0.85, 0.6); eye.translate(sx * 0.065, 0.0, 0.165); parts.push(paint(eye, '#140c08')); }
  const nose = new THREE.ConeGeometry(0.025, 0.05, 3); nose.rotateX(Math.PI); nose.translate(0, -0.07, 0.185); parts.push(paint(nose, '#140c08'));
  SKULL = merge(parts); return SKULL;
}
// a tiny version of BufferGeometryUtils.mergeGeometries for non-indexed position/normal/color (+uv)
export function merge(list) {
  const flat = list.map((g) => (g.index ? g.toNonIndexed() : g)); let n = 0; flat.forEach((g) => { n += g.attributes.position.count; });
  const out = new THREE.BufferGeometry(), keys = ['position', 'normal', 'color'].filter((k) => flat.every((g) => g.attributes[k]));
  for (const k of keys) { const size = flat[0].attributes[k].itemSize, a = new Float32Array(n * size); let o = 0; for (const g of flat) { a.set(g.attributes[k].array, o); o += g.attributes[k].array.length; } out.setAttribute(k, new THREE.BufferAttribute(a, size)); }
  return out;
}
