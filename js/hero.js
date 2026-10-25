// The hero, as a paper doll. Underneath, a man: a bare head with hair and a beard, a padded tunic, breeches, bare
// hands and leather shoes, on a full chain of joints (pelvis, lower and upper spine, neck, head; collarbone,
// shoulder, elbow, wrist; hip, knee, ankle, toes). Over that goes whatever he wears: every helm, armour, pair of
// gloves and boots, every weapon has its own shape, and the rarity shows in the metal (plain iron, blued steel,
// gilded, blackened with glowing runes). He is posed by hand each frame: a real stride, breathing at rest, a cut
// that winds up through the body and steps in, a cast, the whirlwind, a tucked roll, a flinch and a fall.
import * as THREE from 'three';

// ------------------------------------------------------------------ materials
function paint(n, f) { const c = document.createElement('canvas'); c.width = c.height = n; f(c.getContext('2d'), n); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t; }
const metalTex = paint(256, (g, n) => { g.fillStyle = '#b8b8b8'; g.fillRect(0, 0, n, n); for (let k = 0; k < 4000; k++) { const v = 150 + Math.random() * 80; g.fillStyle = `rgba(${v},${v},${v},0.25)`; g.fillRect(Math.random() * n, Math.random() * n, 1 + Math.random() * 3, 1); } g.strokeStyle = 'rgba(60,60,60,0.35)'; for (let k = 0; k < 60; k++) { const x = Math.random() * n, y = Math.random() * n, a = Math.random() * 6.3, l = 6 + Math.random() * 30; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); } for (let k = 0; k < 18; k++) { g.fillStyle = 'rgba(90,60,40,0.18)'; g.beginPath(); g.arc(Math.random() * n, Math.random() * n, 4 + Math.random() * 14, 0, 7); g.fill(); } });
const mailTex = paint(128, (g, n) => { g.fillStyle = '#2a2a2e'; g.fillRect(0, 0, n, n); g.lineWidth = 1.6; for (let y = 0; y < n + 8; y += 6) for (let x = (y / 6) % 2 ? 3 : 0; x < n + 8; x += 6) { g.strokeStyle = 'rgba(200,200,210,0.75)'; g.beginPath(); g.arc(x, y, 2.6, 0, 7); g.stroke(); } }); mailTex.repeat.set(3, 3);
const scaleTex = paint(128, (g, n) => { g.fillStyle = '#1a1a1e'; g.fillRect(0, 0, n, n); for (let y = -8; y < n + 8; y += 10) for (let x = (y / 10) % 2 ? 8 : 0; x < n + 16; x += 16) { const gr = g.createLinearGradient(0, y, 0, y + 12); gr.addColorStop(0, '#d8d8dc'); gr.addColorStop(1, '#6a6a70'); g.fillStyle = gr; g.beginPath(); g.moveTo(x - 8, y); g.lineTo(x + 8, y); g.lineTo(x + 8, y + 6); g.quadraticCurveTo(x, y + 14, x - 8, y + 6); g.closePath(); g.fill(); g.strokeStyle = '#2a2a2e'; g.stroke(); } }); scaleTex.repeat.set(2, 2);
const clothTex = paint(128, (g, n) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, n, n); for (let y = 0; y < n; y += 2) { g.fillStyle = `rgba(0,0,0,${0.04 + Math.random() * 0.04})`; g.fillRect(0, y, n, 1); } for (let x = 0; x < n; x += 2) { g.fillStyle = 'rgba(0,0,0,0.03)'; g.fillRect(x, 0, 1, n); } for (let k = 0; k < 10; k++) { g.fillStyle = 'rgba(90,70,50,0.08)'; g.beginPath(); g.arc(Math.random() * n, n - Math.random() * 40, 6 + Math.random() * 16, 0, 7); g.fill(); } });
const quiltTex = paint(128, (g, n) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, n, n); g.strokeStyle = 'rgba(60,40,20,0.35)'; g.lineWidth = 2; for (let x = 0; x < n; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, n); g.stroke(); } for (let k = 0; k < 2000; k++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.05})`; g.fillRect(Math.random() * n, Math.random() * n, 2, 2); } });
let ENV = null; const mats = [];
const std = ({ env, ...o }) => { const m = new THREE.MeshStandardMaterial(o); m.userData.env = env ?? 0.6; if (o.metalness > 0.3) { m.envMap = ENV; m.envMapIntensity = m.userData.env; } mats.push(m); return m; };
export function setHeroEnv(env) { ENV = env; for (const m of mats) if (m.metalness > 0.3) { m.envMap = env; m.envMapIntensity = m.userData.env ?? 0.6; m.needsUpdate = true; } }
const skin = std({ color: '#c89a7a', roughness: 0.7 }), hair = std({ color: '#3a2618', roughness: 0.9 }), eyeM = new THREE.MeshBasicMaterial({ color: '#100804' });
const tunic = std({ color: '#6a5a46', map: quiltTex, roughness: 0.95 }), breeches = std({ color: '#3a2e24', map: clothTex, roughness: 0.95 });
const leather = std({ color: '#5a3a24', roughness: 0.82 }), darkLeather = std({ color: '#2e1e14', roughness: 0.85 });
const cloth = std({ color: '#b8b0a0', map: clothTex, roughness: 0.95, side: THREE.DoubleSide }), red = std({ color: '#8a1616', map: clothTex, roughness: 0.9, side: THREE.DoubleSide }), white = std({ color: '#d8d2c4', map: clothTex, roughness: 0.9, side: THREE.DoubleSide });
const boneM = std({ color: '#ada490', roughness: 0.75 }), black = new THREE.MeshBasicMaterial({ color: '#060404' });
// the metal of an item by its rarity: plain iron, blued steel, gilded steel, blackened steel with glowing runes
const RAR = {};
function metal(rar) {
  if (RAR[rar]) return RAR[rar];
  const P = [['#8a8e94', '#5a5e64', '#8a7a60', null], ['#8a98b8', '#4a5470', '#6a9aff', '#1a3a9a'], ['#a0a4aa', '#5a5e66', '#e0b040', null], ['#4a4650', '#26242a', '#ff8a2a', '#ff5a10']][rar];
  return (RAR[rar] = { plate: std({ color: P[0], map: metalTex, metalness: 0.72, roughness: 0.42 }), dark: std({ color: P[1], map: metalTex, metalness: 0.75, roughness: 0.48 }),
    trim: std({ color: P[2], metalness: 0.9, roughness: 0.3, emissive: P[3] || '#000000', emissiveIntensity: P[3] ? 1.4 : 0 }), mail: std({ color: P[0], map: mailTex, bumpMap: mailTex, bumpScale: 1.2, metalness: 0.6, roughness: 0.55 }),
    blade: std({ color: rar === 3 ? '#c8c0c0' : '#e8ecf2', map: metalTex, metalness: 0.85, roughness: 0.22, emissive: rar === 3 ? '#3a0a00' : '#1a1c20', env: 1.1 }) });
}
const M = (g, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); return o; };
const J = (parent, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
const cap = (r, l, m, x, y, z, sx = 1, sz = 1) => { const o = M(new THREE.CapsuleGeometry(r, l, 4, 10), m, x, y, z); o.scale.set(sx, 1, sz); return o; };
const cup = (r, m, open = Math.PI / 2) => new THREE.Mesh(new THREE.SphereGeometry(r, 14, 8, 0, Math.PI * 2, 0, open), m);
// put a piece on a joint, tagged with the slot it belongs to (so it can be taken off again)
let TAG = null;
const P = (parent, o, x, y, z, rx, ry, rz) => { if (x !== undefined) o.position.set(x, y, z); if (rx !== undefined) o.rotation.set(rx, ry || 0, rz || 0); o.userData.slot = TAG; parent.add(o); return o; };

export function makeHero() {
  const root = new THREE.Group();
  const pelvis = J(root, 0, 0.98, 0), spineLo = J(pelvis, 0, 0.12, 0), spineUp = J(spineLo, 0, 0.17, 0), neck = J(spineUp, 0, 0.44, 0), head = J(neck, 0, 0.08, 0.01);
  const legs = [-1, 1].map((sd) => { const hip = J(pelvis, sd * 0.115, -0.06, 0), knee = J(hip, 0, -0.44, 0), ankle = J(knee, 0, -0.42, 0), toe = J(ankle, 0, -0.03, 0.15); return { hip, knee, ankle, toe }; });
  const arms = [-1, 1].map((sd) => { const clav = J(spineUp, sd * 0.16, 0.36, 0), sh = J(clav, sd * 0.17, 0, 0), el = J(sh, 0, -0.31, 0), wr = J(el, 0, -0.28, 0), hand = J(wr, 0, -0.06, 0); return { clav, sh, el, wr, hand }; });
  const sword = J(arms[1].hand, 0, -0.06, 0.02), tip = new THREE.Object3D(); sword.add(tip);
  const H = { root, pelvis, spineLo, spineUp, chest: spineUp, neck, head, legs, arms, sword, tip, plume: [], tassets: [], tabF: null, tabB: null, phase: 0, flash: 0, plumeV: 0, plumeA: 0, worn: {} };
  // ---- the man underneath
  TAG = 'body';
  P(pelvis, M(new THREE.CylinderGeometry(0.2, 0.21, 0.2, 14), breeches, 0, 0.02, 0)); P(pelvis, M(new THREE.TorusGeometry(0.205, 0.028, 6, 20), darkLeather, 0, 0.1, 0), undefined); pelvis.children[pelvis.children.length - 1].rotation.x = Math.PI / 2;
  P(pelvis, M(new THREE.BoxGeometry(0.07, 0.06, 0.03), leather, 0, 0.1, 0.21)); P(pelvis, M(new THREE.BoxGeometry(0.1, 0.11, 0.06), leather, 0.17, 0.02, 0.13), undefined, undefined, undefined, 0, 0.6, 0);
  P(pelvis, M(new THREE.BoxGeometry(0.05, 0.75, 0.025), darkLeather, -0.24, -0.25, -0.08), undefined, undefined, undefined, 0.35, 0, 0.15);
  legs.forEach((L) => { P(L.hip, cap(0.088, 0.28, breeches, 0, -0.2, 0)); P(L.knee, cap(0.072, 0.28, breeches, 0, -0.2, 0)); const sh = P(L.ankle, M(new THREE.BoxGeometry(0.12, 0.08, 0.19), leather, 0, -0.025, 0.04)); sh.userData.under = 'boots'; const t = P(L.toe, M(new THREE.BoxGeometry(0.11, 0.06, 0.08), leather, 0, -0.005, 0.03)); t.userData.under = 'boots'; });
  P(spineLo, cap(0.19, 0.08, tunic, 0, 0.03, 0, 1.08, 0.85)); P(spineUp, cap(0.215, 0.24, tunic, 0, 0.18, 0, 1.08, 0.8));
  P(spineUp, M(new THREE.CylinderGeometry(0.14, 0.2, 0.08, 14), tunic, 0, 0.4, 0));
  arms.forEach((A, i) => { P(A.sh, M(new THREE.SphereGeometry(0.08, 10, 8), tunic, 0, -0.02, 0)); P(A.sh, cap(0.07, 0.2, tunic, 0, -0.16, 0)); P(A.el, cap(0.06, 0.18, tunic, 0, -0.13, 0));
    const hb = P(A.hand, M(new THREE.BoxGeometry(0.08, 0.09, 0.09), skin, 0, -0.01, 0)); hb.userData.under = 'gloves';
    for (let k = 0; k < 4; k++) { const f = P(A.hand, M(new THREE.CylinderGeometry(0.014, 0.014, 0.08, 5), skin, -0.03 + k * 0.02, -0.055, 0.042), undefined, undefined, undefined, Math.PI / 2, 0, 0); f.userData.under = 'gloves'; }
    const th = P(A.hand, M(new THREE.CylinderGeometry(0.015, 0.015, 0.06, 5), skin, (i ? -1 : 1) * 0.045, -0.02, 0.035), undefined, undefined, undefined, Math.PI / 2, 0, (i ? -1 : 1) * 0.6); th.userData.under = 'gloves'; });
  // the face: skin, short dark hair, a beard, brows, eyes and a nose (all hidden by a closed helm)
  P(neck, M(new THREE.CylinderGeometry(0.075, 0.085, 0.12, 12), skin, 0, 0.02, 0));
  const face = [P(head, M(new THREE.SphereGeometry(0.135, 18, 14), skin, 0, 0.14, 0.01)), P(head, M(new THREE.SphereGeometry(0.14, 16, 10, 0, Math.PI * 2, 0, Math.PI / 1.9), hair, 0, 0.165, -0.012)), P(head, M(new THREE.SphereGeometry(0.11, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2.2), hair, 0, 0.11, 0.04)),
    P(head, M(new THREE.BoxGeometry(0.035, 0.05, 0.04), skin, 0, 0.13, 0.14)), P(head, M(new THREE.SphereGeometry(0.017, 8, 6), eyeM, -0.048, 0.16, 0.12)), P(head, M(new THREE.SphereGeometry(0.017, 8, 6), eyeM, 0.048, 0.16, 0.12)),
    P(head, M(new THREE.BoxGeometry(0.05, 0.012, 0.02), hair, -0.05, 0.185, 0.125), undefined, undefined, undefined, 0, 0, -0.15), P(head, M(new THREE.BoxGeometry(0.05, 0.012, 0.02), hair, 0.05, 0.185, 0.125), undefined, undefined, undefined, 0, 0, 0.15), P(head, M(new THREE.SphereGeometry(0.15, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2.4), skin, 0, 0.148, 0.005))];
  face[1].userData.under = 'helm'; face[8].userData.under = 'never'; face[8].visible = false;
  // the cape: always his
  const capeG = new THREE.PlaneGeometry(0.66, 1.25, 8, 14); capeG.translate(0, -0.62, 0);
  H.cape = P(spineUp, M(capeG, cloth, 0, 0.4, -0.19)); H.capeBase = capeG.attributes.position.array.slice();
  for (const sd of [-1, 1]) P(spineUp, M(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 10), metal(2).trim, sd * 0.2, 0.4, -0.17), undefined, undefined, undefined, Math.PI / 2, 0, 0);
  // the shield: always on his arm
  const shp = new THREE.Shape(); shp.moveTo(-0.27, 0.32); shp.lineTo(0.27, 0.32); shp.lineTo(0.27, 0.05); shp.quadraticCurveTo(0.25, -0.24, 0, -0.42); shp.quadraticCurveTo(-0.25, -0.24, -0.27, 0.05); shp.closePath();
  const shield = J(arms[0].el, -0.1, -0.15, 0.03); shield.rotation.set(0, -Math.PI / 2, 0); H.shield = shield;
  P(shield, M(new THREE.ExtrudeGeometry(shp, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2 }), red));
  const rim = P(shield, M(new THREE.ExtrudeGeometry(shp, { depth: 0.03, bevelEnabled: false }), metal(0).plate, 0, 0, -0.012)); rim.scale.set(1.07, 1.06, 1);
  P(shield, M(new THREE.BoxGeometry(0.06, 0.52, 0.02), metal(2).trim, 0, -0.02, 0.06)); P(shield, M(new THREE.BoxGeometry(0.38, 0.06, 0.02), metal(2).trim, 0, 0.12, 0.06)); P(shield, M(new THREE.SphereGeometry(0.06, 10, 8), metal(2).trim, 0, 0.12, 0.07));
  // a soft shadow at his feet
  const sc = document.createElement('canvas'); sc.width = sc.height = 64; { const g = sc.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,0.65)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
  H.shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false })); H.shadow.rotation.x = -Math.PI / 2; H.shadow.position.y = 0.03; root.add(H.shadow);
  TAG = null;
  return H;
}

// ------------------------------------------------------------------ dressing him: take off what a slot had, put on the new piece
// look: { helm, armor, gloves, boots, weapon, amulet, ring } each { k: base key, rar } or null
export function dress(H, look) {
  for (const slot of ['helm', 'armor', 'gloves', 'boots', 'weapon', 'amulet', 'ring']) {
    const it = look[slot] || null, key = it ? it.k + ':' + it.rar : '';
    if (H.worn[slot] === key) continue; H.worn[slot] = key;
    const old = []; H.root.traverse((o) => { if (o.userData.slot === slot) old.push(o); }); for (const o of old) o.parent.remove(o);
    if (slot === 'helm') H.plume = []; if (slot === 'armor') { H.tassets = []; H.tabF = H.tabB = null; }
    H.root.traverse((o) => { if (o.userData.under === slot) o.visible = !it; });
    if (it) { TAG = slot; BUILD[slot](H, it.k, it.rar, metal(it.rar)); TAG = null; }
  }
  if (!look.weapon) { TAG = 'weapon'; H.worn.weapon = 'none'; BUILD.weapon(H, 'longsword', 0, metal(0)); TAG = null; }
  // a closed helm hides the face
  const closed = look.helm && look.helm.k === 'great'; H.head.children.forEach((o) => { if (o.userData.slot === 'body' && o.userData.under !== 'never' && o !== H.head.children[0]) o.visible = !closed && (o.userData.under !== 'helm' || !look.helm); });
}
const BUILD = {
  helm(H, k, rar, X) {
    const h = H.head;
    if (k === 'great') {
      P(h, M(new THREE.CylinderGeometry(0.155, 0.15, 0.27, 18), X.plate, 0, 0.13, 0)); P(h, cup(0.157, X.plate), 0, 0.265, 0);
      P(h, M(new THREE.BoxGeometry(0.02, 0.3, 0.05), X.plate, 0, 0.16, 0.145));
      for (const sd of [-1, 1]) P(h, M(new THREE.BoxGeometry(0.11, 0.022, 0.02), black, sd * 0.07, 0.17, 0.148));
      for (let q = 0; q < 6; q++) P(h, M(new THREE.CylinderGeometry(0.008, 0.008, 0.02, 4), black, 0.04 + (q % 3) * 0.025, 0.08 + Math.floor(q / 3) * 0.03, 0.15), undefined, undefined, undefined, Math.PI / 2, 0, 0);
      P(h, M(new THREE.TorusGeometry(0.153, 0.012, 4, 20), X.trim, 0, 0.025, 0), undefined, undefined, undefined, Math.PI / 2, 0, 0);
      P(h, M(new THREE.BoxGeometry(0.035, 0.07, 0.3), X.trim, 0, 0.405, -0.01));
      let p = P(h, new THREE.Group(), 0, 0.43, -0.06); for (let q = 0; q < 4; q++) { const seg = M(new THREE.ConeGeometry(0.05 - q * 0.006, 0.17, 6), rar === 1 ? std({ color: '#1a3a8a', roughness: 0.9 }) : red, 0, 0.07, 0); seg.rotation.x = Math.PI; p.add(seg); H.plume.push(p); const n = new THREE.Group(); n.position.set(0, 0.12, -0.02); p.add(n); p = n; }
    } else if (k === 'kettle') {
      P(h, cup(0.158, X.plate, Math.PI / 2.1), 0, 0.17, 0); P(h, M(new THREE.TorusGeometry(0.16, 0.014, 4, 22), X.trim, 0, 0.175, 0), undefined, undefined, undefined, Math.PI / 2, 0, 0);
      P(h, M(new THREE.BoxGeometry(0.025, 0.12, 0.02), X.plate, 0, 0.13, 0.148)); P(h, M(new THREE.BoxGeometry(0.018, 0.11, 0.03), X.trim, 0, 0.27, 0.02), undefined, undefined, undefined, 0.2, 0, 0);
      P(h, M(new THREE.CylinderGeometry(0.155, 0.165, 0.11, 16, 1, true, Math.PI * 0.75, Math.PI * 1.5), X.mail, 0, 0.09, 0));
    } else if (k === 'circlet') {
      P(h, M(new THREE.TorusGeometry(0.145, 0.02, 6, 20), boneM, 0, 0.22, 0.005), undefined, undefined, undefined, Math.PI / 2, 0, 0);
      const skull = P(h, M(new THREE.SphereGeometry(0.04, 10, 8), boneM, 0, 0.24, 0.145)); skull.scale.set(1, 1.1, 0.8);
      for (const sd of [-1, 1]) { P(h, M(new THREE.SphereGeometry(0.009, 6, 4), new THREE.MeshBasicMaterial({ color: rar === 3 ? '#ff6a1a' : '#100804' }), sd * 0.015, 0.245, 0.175)); let p = P(h, new THREE.Group(), sd * 0.12, 0.25, 0.03, 0, 0, -sd * 0.5); for (let q = 0; q < 4; q++) { p.add(M(new THREE.ConeGeometry(0.03 - q * 0.006, 0.1, 6), boneM, 0, 0.05, 0)); const n = new THREE.Group(); n.position.y = 0.08; n.rotation.z = -sd * 0.35; n.rotation.x = -0.2; p.add(n); p = n; } }
      if (rar >= 2) P(h, M(new THREE.OctahedronGeometry(0.025), X.trim, 0, 0.2, 0.15));
    } else if (k === 'winged') {
      P(h, cup(0.16, X.plate, Math.PI / 2), 0, 0.17, 0); P(h, M(new THREE.CylinderGeometry(0.16, 0.16, 0.09, 18, 1, true), X.plate, 0, 0.14, 0));
      for (const sd of [-1, 1]) { P(h, M(new THREE.BoxGeometry(0.02, 0.12, 0.09), X.plate, sd * 0.15, 0.09, 0.07)); const wing = new THREE.Shape(); wing.moveTo(0, 0); for (let q = 0; q < 5; q++) { wing.lineTo(0.06 + q * 0.05, 0.08 + q * 0.06); wing.lineTo(0.04 + q * 0.05, 0.02 + q * 0.05); } wing.lineTo(0, 0.05); wing.closePath(); const w = P(h, M(new THREE.ExtrudeGeometry(wing, { depth: 0.012, bevelEnabled: false }), X.trim, sd * 0.16, 0.18, -0.03), undefined, undefined, undefined, 0, sd > 0 ? -Math.PI / 2 : Math.PI / 2, 0); w.scale.x = 1; if (sd < 0) w.scale.x = 1; }
      P(h, M(new THREE.BoxGeometry(0.03, 0.06, 0.02), X.trim, 0, 0.13, 0.155));
    }
  },
  armor(H, k, rar, X) {
    const up = H.spineUp, lo = H.spineLo, pe = H.pelvis;
    const tassets = () => { H.tassets = [-1, 1].map((sd) => { const t = P(pe, new THREE.Group(), sd * 0.13, 0.04, 0.12); const p = M(new THREE.BoxGeometry(0.17, 0.2, 0.025), X.plate, 0, -0.1, 0.02); p.rotation.x = 0.12; t.add(p); t.add(M(new THREE.BoxGeometry(0.15, 0.015, 0.03), X.trim, 0, -0.005, 0.03)); return t; }); };
    const tabard = (m) => { const tg = new THREE.PlaneGeometry(0.22, 0.52, 1, 4); tg.translate(0, -0.26, 0); H.tabF = P(pe, new THREE.Group(), 0, 0.08, 0.215); H.tabB = P(pe, new THREE.Group(), 0, 0.08, -0.215); H.tabF.add(M(tg, m)); H.tabB.add(M(tg.clone(), m)); H.tabF.add(M(new THREE.PlaneGeometry(0.06, 0.06), X.trim, 0, -0.12, 0.004)); };
    const skirt = (m) => P(pe, M(new THREE.CylinderGeometry(0.235, 0.3, 0.3, 16, 1, true), m, 0, -0.16, 0));
    const pauldrons = (n, r0) => H.arms.forEach((A, i) => { const sd = i ? 1 : -1; for (let q = 0; q < n; q++) { const l = P(A.sh, cup(r0 - q * 0.018, X.plate, Math.PI / 2.2), sd * (0.02 + q * 0.025), 0.03 - q * 0.055, 0, 0, 0, -sd * (0.45 + q * 0.18)); l.scale.set(1.1, 0.8, 1.15); } P(A.sh, M(new THREE.TorusGeometry(r0 - 0.03, 0.012, 4, 16, Math.PI), X.trim, sd * 0.02, 0.06, 0), undefined, undefined, undefined, 0, Math.PI / 2, -sd * 0.45); });
    const sleeves = (m) => H.arms.forEach((A) => { P(A.sh, cap(0.074, 0.2, m, 0, -0.16, 0)); });
    if (k === 'plate' || k === 'templar') {
      const pm = k === 'templar' ? std({ color: rar === 3 ? '#3a3640' : '#d8d4cc', map: metalTex, metalness: 0.55, roughness: 0.4 }) : X.plate;
      P(lo, cap(0.195, 0.08, X.mail, 0, 0.03, 0, 1.1, 0.86)); P(up, cap(0.235, 0.22, pm, 0, 0.18, 0.01, 1.12, 0.8)); P(up, M(new THREE.BoxGeometry(0.03, 0.36, 0.03), pm, 0, 0.18, 0.2));
      P(up, M(new THREE.BoxGeometry(0.035, 0.16, 0.02), X.trim, 0, 0.24, 0.21)); P(up, M(new THREE.BoxGeometry(0.11, 0.035, 0.02), X.trim, 0, 0.27, 0.21));
      P(up, M(new THREE.TorusGeometry(0.2, 0.02, 6, 18, Math.PI), X.trim, 0, 0.42, 0.02), undefined, undefined, undefined, -Math.PI / 2 + 0.2, 0, 0);
      for (const y of [0.02, -0.06]) P(up, M(new THREE.CylinderGeometry(0.23 - y * 0.2, 0.24, 0.07, 16, 1, true), pm, 0, y, 0));
      P(H.neck, M(new THREE.CylinderGeometry(0.11, 0.17, 0.1, 14), pm, 0, 0.0, 0));
      skirt(X.mail); tassets(); tabard(k === 'templar' ? white : red); pauldrons(k === 'templar' ? 4 : 3, k === 'templar' ? 0.18 : 0.16); sleeves(X.mail);
      if (k === 'templar') { P(up, M(new THREE.BoxGeometry(0.05, 0.24, 0.02), red, 0, 0.2, 0.215)); P(up, M(new THREE.BoxGeometry(0.17, 0.05, 0.02), red, 0, 0.25, 0.215)); }
    } else if (k === 'chain') {
      P(lo, cap(0.2, 0.08, X.mail, 0, 0.03, 0, 1.1, 0.86)); P(up, cap(0.225, 0.24, X.mail, 0, 0.18, 0, 1.1, 0.82)); P(H.neck, M(new THREE.CylinderGeometry(0.1, 0.18, 0.12, 14), X.mail, 0, 0.0, 0));
      skirt(X.mail); sleeves(X.mail); H.arms.forEach((A) => P(A.el, cap(0.064, 0.12, X.mail, 0, -0.08, 0)));
      P(pe, M(new THREE.TorusGeometry(0.22, 0.03, 6, 20), darkLeather, 0, 0.12, 0), undefined, undefined, undefined, Math.PI / 2, 0, 0); P(pe, M(new THREE.BoxGeometry(0.08, 0.07, 0.03), X.trim, 0, 0.12, 0.23));
    } else if (k === 'scale') {
      const sm = std({ color: rar === 3 ? '#5a4a44' : rar === 1 ? '#8a9ab8' : '#a8a49a', map: scaleTex, bumpMap: scaleTex, bumpScale: 1.5, metalness: 0.65, roughness: 0.45 });
      P(lo, cap(0.2, 0.08, sm, 0, 0.03, 0, 1.1, 0.86)); P(up, cap(0.232, 0.24, sm, 0, 0.18, 0, 1.1, 0.82)); skirt(sm); pauldrons(2, 0.14); sleeves(X.mail);
      P(up, M(new THREE.TorusGeometry(0.19, 0.02, 6, 18, Math.PI), X.trim, 0, 0.42, 0.02), undefined, undefined, undefined, -Math.PI / 2 + 0.2, 0, 0);
    }
  },
  gloves(H, k, rar, X) {
    H.arms.forEach((A, i) => {
      const sd = i ? 1 : -1, m = k === 'leather' ? leather : k === 'bonegrip' ? darkLeather : X.dark;
      P(A.hand, M(new THREE.BoxGeometry(0.092, 0.1, 0.1), m, 0, -0.01, 0));
      for (let q = 0; q < 4; q++) P(A.hand, M(new THREE.CylinderGeometry(0.016, 0.016, 0.09, 5), m, -0.034 + q * 0.023, -0.06, 0.045), undefined, undefined, undefined, Math.PI / 2, 0, 0);
      P(A.hand, M(new THREE.CylinderGeometry(0.017, 0.017, 0.07, 5), m, -sd * 0.05, -0.02, 0.04), undefined, undefined, undefined, Math.PI / 2, 0, sd * 0.6);
      if (k === 'gauntlets') { P(A.wr, M(new THREE.CylinderGeometry(0.075, 0.06, 0.08, 10), X.plate, 0, 0.02, 0)); P(A.el, cap(0.066, 0.17, X.plate, 0, -0.14, 0, 1, 1.05)); const co = P(A.el, cup(0.07, X.plate), 0, 0, -0.03, -Math.PI / 2 - 0.3, 0, 0); P(A.el, M(new THREE.SphereGeometry(0.03, 6, 5), X.trim, 0, 0, -0.09)); for (let q = 0; q < 3; q++) P(A.hand, M(new THREE.BoxGeometry(0.095, 0.014, 0.105), X.plate, 0, 0.02 - q * 0.025, 0.003)); }
      if (k === 'leather') { P(A.wr, M(new THREE.CylinderGeometry(0.07, 0.06, 0.1, 10), leather, 0, 0.03, 0)); P(A.wr, M(new THREE.TorusGeometry(0.068, 0.008, 4, 12), X.trim, 0, 0.07, 0), undefined, undefined, undefined, Math.PI / 2, 0, 0); }
      if (k === 'bonegrip') { P(A.el, cap(0.064, 0.16, darkLeather, 0, -0.14, 0)); for (let q = 0; q < 3; q++) P(A.el, M(new THREE.ConeGeometry(0.02, 0.09, 5), boneM, sd * 0.05, -0.08 - q * 0.06, -0.03), undefined, undefined, undefined, -0.4, 0, sd * 1.2); for (let q = 0; q < 4; q++) P(A.hand, M(new THREE.ConeGeometry(0.011, 0.05, 4), boneM, -0.034 + q * 0.023, -0.03, 0.065), undefined, undefined, undefined, Math.PI / 2, 0, 0); }
    });
  },
  boots(H, k, rar, X) {
    H.legs.forEach((L) => {
      const m = k === 'leather' ? leather : X.dark;
      P(L.ankle, M(new THREE.BoxGeometry(0.135, 0.095, 0.21), m, 0, -0.025, 0.05)); P(L.toe, M(new THREE.BoxGeometry(0.125, 0.075, 0.1), k === 'leather' ? leather : X.plate, 0, 0, 0.04), undefined, undefined, undefined, 0.1, 0, 0);
      if (k === 'leather') { P(L.knee, cap(0.08, 0.22, leather, 0, -0.26, 0)); P(L.knee, M(new THREE.CylinderGeometry(0.095, 0.085, 0.07, 12), darkLeather, 0, -0.12, 0)); }
      if (k === 'war') { P(L.knee, cap(0.08, 0.2, darkLeather, 0, -0.27, 0)); const kc = P(L.knee, cup(0.082, X.plate), 0, 0, 0.03, Math.PI / 2 + 0.3, 0, 0); P(L.knee, M(new THREE.BoxGeometry(0.09, 0.22, 0.03), X.plate, 0, -0.25, 0.07)); for (let q = 0; q < 2; q++) P(L.toe, M(new THREE.BoxGeometry(0.13, 0.012, 0.012), X.trim, 0, 0.03, 0.01 + q * 0.04)); }
      if (k === 'greaves') { P(L.hip, cap(0.085, 0.24, X.plate, 0, -0.2, 0.02, 1.08, 0.9)); P(L.knee, cup(0.085, X.plate), 0, 0, 0.03, Math.PI / 2 + 0.3, 0, 0); P(L.knee, M(new THREE.SphereGeometry(0.035, 8, 6), X.trim, 0, 0, 0.11)); P(L.knee, cap(0.076, 0.26, X.plate, 0, -0.21, 0.01, 1, 1.05)); P(L.ankle, M(new THREE.CylinderGeometry(0.075, 0.07, 0.07, 10), X.plate, 0, 0.01, 0)); for (let q = 0; q < 2; q++) P(L.toe, M(new THREE.BoxGeometry(0.13, 0.012, 0.012), X.trim, 0, 0.03, 0.01 + q * 0.04)); }
    });
  },
  weapon(H, k, rar, X) {
    const s = H.sword, grip = (len = 0.2) => { P(s, M(new THREE.CylinderGeometry(0.022, 0.024, len, 8), darkLeather, 0, 0, 0)); for (let q = 0; q < 4; q++) P(s, M(new THREE.TorusGeometry(0.024, 0.006, 4, 8), leather, 0, -len * 0.4 + q * len * 0.25, 0), undefined, undefined, undefined, Math.PI / 2, 0, 0); };
    let tipY = 1.22;
    if (k === 'longsword' || k === 'broadsword' || k === 'greatsword') {
      const L = k === 'greatsword' ? 1.45 : k === 'broadsword' ? 0.85 : 1.0, W = k === 'broadsword' ? 0.11 : k === 'greatsword' ? 0.09 : 0.075;
      grip(k === 'greatsword' ? 0.32 : 0.2);
      if (k === 'longsword') { const gd = P(s, M(new THREE.TorusGeometry(0.2, 0.018, 6, 16, Math.PI * 0.5), X.trim, 0, 0.02, 0), undefined, undefined, undefined, 0, 0, Math.PI * 1.25); P(s, M(new THREE.SphereGeometry(0.03, 8, 6), X.trim, 0.14, 0.14, 0)); P(s, M(new THREE.SphereGeometry(0.03, 8, 6), X.trim, -0.14, 0.14, 0)); }
      else P(s, M(new THREE.BoxGeometry(k === 'greatsword' ? 0.5 : 0.3, 0.05, 0.06), X.trim, 0, 0.12, 0));
      P(s, M(new THREE.CylinderGeometry(0.045, 0.045, 0.025, 12), X.trim, 0, k === 'greatsword' ? -0.18 : -0.12, 0), undefined, undefined, undefined, Math.PI / 2, 0, 0);
      P(s, M(new THREE.BoxGeometry(W, L, 0.02), X.blade, 0, 0.14 + L / 2, 0)); const t = P(s, M(new THREE.ConeGeometry(W * 0.7, 0.14, 4), X.blade, 0, 0.14 + L + 0.07, 0), undefined, undefined, undefined, 0, Math.PI / 4, 0); t.scale.z = 0.33;
      if (rar >= 2) P(s, M(new THREE.BoxGeometry(0.012, L * 0.7, 0.024), X.trim, 0, 0.18 + L * 0.35, 0));
      tipY = 0.14 + L + 0.1;
    } else if (k === 'axe') {
      P(s, M(new THREE.CylinderGeometry(0.026, 0.03, 0.9, 8), darkLeather, 0, 0.32, 0)); const b = P(s, M(new THREE.CylinderGeometry(0.26, 0.26, 0.03, 16, 1, false, 0, Math.PI * 0.9), X.blade, 0.02, 0.68, 0), undefined, undefined, undefined, Math.PI / 2, 0, Math.PI / 2 + Math.PI * 0.05);
      P(s, M(new THREE.BoxGeometry(0.08, 0.12, 0.06), X.dark, 0, 0.68, 0)); P(s, M(new THREE.ConeGeometry(0.03, 0.12, 4), X.dark, -0.08, 0.68, 0), undefined, undefined, undefined, 0, 0, Math.PI / 2); tipY = 0.8;
    } else if (k === 'hammer') {
      P(s, M(new THREE.CylinderGeometry(0.026, 0.03, 0.9, 8), darkLeather, 0, 0.32, 0)); P(s, M(new THREE.BoxGeometry(0.28, 0.14, 0.14), X.plate, 0, 0.74, 0)); P(s, M(new THREE.BoxGeometry(0.3, 0.03, 0.15), X.trim, 0, 0.74, 0)); P(s, M(new THREE.ConeGeometry(0.03, 0.14, 4), X.dark, 0, 0.88, 0)); tipY = 0.82;
    } else if (k === 'flail') {
      grip(0.3); P(s, M(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 8), X.trim, 0, 0.17, 0));
      for (let q = 0; q < 5; q++) P(s, M(new THREE.TorusGeometry(0.03, 0.008, 4, 8), X.dark, 0, 0.24 + q * 0.06, 0), undefined, undefined, undefined, 0, q % 2 ? Math.PI / 2 : 0, 0);
      P(s, M(new THREE.SphereGeometry(0.11, 12, 10), X.plate, 0, 0.6, 0)); for (let q = 0; q < 10; q++) { const a = q / 10 * Math.PI * 2, b2 = (q % 3) * 0.6 - 0.6; P(s, M(new THREE.ConeGeometry(0.025, 0.09, 4), X.dark, Math.cos(a) * Math.cos(b2) * 0.12, 0.6 + Math.sin(b2) * 0.12, Math.sin(a) * Math.cos(b2) * 0.12), undefined, undefined, undefined, Math.atan2(Math.sin(a) * Math.cos(b2), Math.sin(b2)) + Math.PI / 2, 0, -a + Math.PI / 2); } tipY = 0.72;
    }
    if (rar === 3) { const g = P(s, new THREE.PointLight('#ff6a20', 2.5, 3, 2), 0, tipY * 0.6, 0); }
    H.tip.position.set(0, tipY, 0);
  },
  amulet(H, k, rar, X) { const up = H.spineUp; P(up, M(new THREE.TorusGeometry(0.13, 0.006, 4, 20, Math.PI * 1.1), X.trim, 0, 0.43, 0.06), undefined, undefined, undefined, -Math.PI / 2 + 0.7, 0, Math.PI * 1.05); const gem = k === 'fang' ? M(new THREE.ConeGeometry(0.02, 0.07, 5), boneM) : M(new THREE.OctahedronGeometry(0.03), std({ color: ['#c8c8d0', '#4a8aff', '#ffd040', '#ff6a1a'][rar], emissive: ['#202020', '#1a40c0', '#a07000', '#ff4a00'][rar], emissiveIntensity: 1.2, metalness: 0.4, roughness: 0.2 })); P(up, gem, 0, 0.31, 0.215, k === 'fang' ? Math.PI : 0, 0, 0); },
  ring(H, k, rar, X) { P(H.arms[1].hand, M(new THREE.TorusGeometry(0.02, 0.006, 4, 10), X.trim, 0.0, -0.06, 0.06), undefined, undefined, undefined, 0, Math.PI / 2, 0); P(H.arms[1].hand, M(new THREE.SphereGeometry(0.012, 6, 5), new THREE.MeshBasicMaterial({ color: { iron: '#9a9a9a', bone: '#e8dcc0', ruby: '#ff2a3a', moon: '#bfe8ff' }[k] || '#ffffff' }), 0, -0.06, 0.08)); },
};

const lerp = (a, b, k) => a + (b - a) * k, ease = (k) => k * k * (3 - 2 * k), clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const set = (o, x, y, z) => o.rotation.set(x, y, z);
// pose the knight. o: { speed (0..1 of a run), attack (0..1, or -1), cast (0..1, -1), spin (radians or null), dash (0..1, -1), hit (0..1), dead (0..), t }
export function poseHero(H, o, dt) {
  const { pelvis, spineLo, spineUp, neck, head, legs, arms, sword } = H, t = o.t, run = clamp(o.speed || 0);
  if (run > 0.05) H.phase += dt * (5.2 + run * 5.6);
  const p = H.phase, breath = Math.sin(t * 1.7);
  // ---- the stride (left leg phase p, right leg p + π)
  const gait = (q) => { const fwd = Math.sin(q), swing = Math.max(0, Math.cos(q)); return { hip: -fwd * 0.62 * run - 0.05, knee: 0.08 + run * (0.15 + 1.15 * swing * swing), push: Math.max(0, -fwd) * Math.max(0, -Math.cos(q)) }; };
  legs.forEach((L, i) => { const g = gait(p + (i ? Math.PI : 0)); set(L.hip, g.hip, 0, (i ? -1 : 1) * -0.03); set(L.knee, g.knee, 0, 0); set(L.ankle, -(g.hip + g.knee) * 0.85 + g.push * 0.5 * run, 0, 0); set(L.toe, -g.push * 0.6 * run, 0, 0); });
  pelvis.position.set(Math.sin(p) * 0.025 * run, 0.98 - 0.05 * run + 0.045 * run * (Math.abs(Math.cos(p)) - 0.5) + Math.sin(t * 0.6) * 0.004 * (1 - run), 0);
  set(pelvis, 0, Math.sin(p) * 0.16 * run, Math.sin(p) * 0.05 * run + Math.sin(t * 0.5) * 0.02 * (1 - run));
  set(spineLo, 0.1 * run + 0.03, -Math.sin(p) * 0.1 * run, -Math.sin(p) * 0.03 * run);
  set(spineUp, 0.06 * run + breath * 0.02, -Math.sin(p) * 0.12 * run, 0); spineUp.scale.set(1 + breath * 0.012, 1, 1 + breath * 0.012);
  set(neck, -0.1 * run, Math.sin(p) * 0.1 * run, 0); set(head, -0.06 * run + Math.sin(t * 0.7) * 0.03 * (1 - run), Math.sin(t * 0.4) * 0.12 * (1 - run), 0);
  // ---- the arms: the sword arm swings against the stride, the shield is carried high
  const aw = Math.sin(p) * 0.5 * run;
  set(arms[1].clav, 0, 0, 0); set(arms[1].sh, -0.18 - aw, 0, -0.14); set(arms[1].el, -0.55 - Math.max(0, -aw) * 0.6, 0, 0); set(arms[1].wr, 0.1, 0, 0);
  set(arms[0].clav, 0, 0, 0); set(arms[0].sh, -0.35 + aw * 0.4, 0.2, 0.18); set(arms[0].el, -1.25, 0, 0); set(arms[0].wr, 0, 0, 0);
  set(sword, Math.PI / 2 - 0.35 + run * 0.15, 0, 0);
  let lunge = 0;
  // ---- the sword cut: wind up through the hips and chest, step in and cut down across, follow through, recover
  if (o.attack >= 0) {
    const k = o.attack, wind = ease(clamp(k / 0.3)), cut = ease(clamp((k - 0.3) / 0.22)), rec = ease(clamp((k - 0.62) / 0.38)), a = wind * (1 - cut), b = cut * (1 - rec);
    set(pelvis, 0, lerp(0, 0.45, a) + lerp(0, -0.35, b), 0); pelvis.position.y = 0.98 - 0.06 * (a + b);
    set(spineLo, 0.05 + 0.1 * b, 0.3 * a - 0.35 * b, 0.05 * a);
    set(spineUp, -0.1 * a + 0.2 * b, 0.45 * a - 0.5 * b, -0.08 * a + 0.06 * b);
    set(arms[1].sh, lerp(-0.2, -2.5, a) + lerp(0, -0.55, b), lerp(0, 0.5, a) + lerp(0, -0.9, b), lerp(-0.15, -0.5, a) + lerp(0, -0.1, b));
    set(arms[1].el, lerp(-0.55, -1.5, a) + lerp(0, -0.2, b), 0, 0); set(arms[1].wr, lerp(0.1, 0.7, a) + lerp(0, -0.4, b), 0, 0);
    set(sword, Math.PI / 2 + lerp(-0.35, 0.2, a) + lerp(0, 0.3, b), 0, 0);
    set(arms[0].sh, -0.5 - 0.3 * b, 0.3 + 0.3 * a, 0.2); set(arms[0].el, -1.4 + 0.3 * b, 0, 0);
    // the front (left) foot steps in, the back leg drives
    lunge = 0.3 * b + 0.08 * a; set(legs[0].hip, -0.6 * (a + b) - 0.05, 0, 0.05); set(legs[0].knee, 0.5 * (a + b) + 0.1, 0, 0); set(legs[0].ankle, 0.1 * (a + b), 0, 0);
    set(legs[1].hip, 0.35 * b + 0.1 * a, 0, -0.05); set(legs[1].knee, 0.25 * (a + b) + 0.1, 0, 0); set(legs[1].ankle, -0.4 * b, 0, 0); set(legs[1].toe, 0.4 * b, 0, 0);
    set(head, -0.1 * b, -0.3 * a + 0.3 * b, 0);
  }
  // ---- the cast: the shield hand thrust out, palm open, the body behind it
  if (o.cast >= 0) { const k = Math.sin(clamp(o.cast) * Math.PI); set(arms[0].sh, -1.55 * k - 0.35 * (1 - k), -0.2 * k + 0.2, 0.15); set(arms[0].el, -1.25 * (1 - k) - 0.1, 0, 0); set(arms[0].wr, -0.7 * k, 0, 0); set(spineUp, -0.1 * k, -0.25 * k, 0); set(spineLo, 0.05, -0.15 * k, 0); lunge = Math.max(lunge, 0.1 * k); }
  // ---- the whirlwind: arms out, blade level, spinning on the balls of the feet
  if (o.spin != null) { set(pelvis, 0, o.spin, 0); set(spineLo, 0.15, 0, 0); set(spineUp, 0.05, 0.3, 0); set(arms[1].sh, -1.45, 0, -1.25); set(arms[1].el, -0.15, 0, 0); set(arms[1].wr, 0, 0, 0); set(sword, Math.PI / 2, 0, 0); set(arms[0].sh, -1.2, 0, 1.2); set(arms[0].el, -0.5, 0, 0);
    legs.forEach((L, i) => { const s = Math.sin(o.spin * 2 + i * Math.PI) * 0.25; set(L.hip, -0.35 + s, 0, (i ? -1 : 1) * 0.18); set(L.knee, 0.55 - s, 0, 0); set(L.ankle, -0.2, 0, 0); }); pelvis.position.y = 0.9; }
  // ---- the roll: tucked tight, over the shoulder and back up
  if (o.dash >= 0) { const k = o.dash, s = Math.sin(k * Math.PI); set(pelvis, ease(k) * Math.PI * 2, 0, 0); pelvis.position.y = 0.98 - 0.5 * s; set(spineLo, 0.6 * s, 0, 0); set(spineUp, 0.5 * s, 0, 0); set(head, 0.5 * s, 0, 0);
    legs.forEach((L) => { set(L.hip, -1.7 * s, 0, 0); set(L.knee, 2.3 * s + 0.1, 0, 0); set(L.ankle, -0.3 * s, 0, 0); }); arms.forEach((A) => { set(A.sh, -1.1 * s - 0.3, 0, 0); set(A.el, -1.6 * s - 0.4, 0, 0); }); }
  // ---- struck: the chest and head snap back
  if (o.hit > 0) { const k = clamp(o.hit); spineUp.rotation.x -= 0.28 * k; head.rotation.x -= 0.35 * k; arms[0].sh.rotation.x -= 0.3 * k; }
  // ---- killed: down onto the knees, then forward onto the ground
  if (o.dead > 0) { const a = ease(clamp(o.dead / 0.6)), b = ease(clamp((o.dead - 0.7) / 0.6));
    set(pelvis, 1.35 * b, 0.2 * b, 0.1 * b); pelvis.position.y = lerp(lerp(0.98, 0.52, a), 0.22, b);
    legs.forEach((L, i) => { set(L.hip, lerp(-1.2 * a, -0.2, b), 0, (i ? -0.1 : 0.1)); set(L.knee, lerp(2.2 * a, 0.3, b), 0, 0); set(L.ankle, 0.6 * a * (1 - b), 0, 0); });
    set(spineLo, 0.35 * a, 0, 0); set(spineUp, 0.3 * a, 0, 0.1 * b); set(head, 0.4 * a, 0.6 * b, 0); set(arms[1].sh, lerp(0.1, -2.6, b), 0, -0.3); set(arms[1].el, -0.2, 0, 0); set(arms[0].sh, lerp(0.2, -2.4, b), 0, 0.4); set(arms[0].el, -0.3, 0, 0); lunge = 0.4 * b; }
  pelvis.position.z = lunge;
  // ---- the hanging things: tassets follow the thighs, the tabard swings, the plume lags behind
  H.tassets.forEach((T, i) => set(T, Math.min(0, legs[i].hip.rotation.x) * 0.75, 0, 0));
  const fwdLeg = Math.min(legs[0].hip.rotation.x, legs[1].hip.rotation.x), backLeg = Math.max(legs[0].hip.rotation.x, legs[1].hip.rotation.x);
  if (H.tabF) { set(H.tabF, Math.min(0, fwdLeg) * 0.8 - 0.05 * run, 0, 0); set(H.tabB, Math.max(0, backLeg) * 0.8 + 0.25 * run, 0, 0); }
  H.plumeA += (run * 0.9 + (o.dash >= 0 ? 0.8 : 0) - H.plumeA) * Math.min(1, dt * 4);
  H.plume.forEach((P, k) => set(P, -0.5 - H.plumeA * 0.5 * (k ? 0.5 : 1) + Math.sin(t * 6 - k * 0.9) * 0.08 * (0.3 + run), Math.sin(t * 3.1 + k) * 0.06, 0));
  // ---- the cape trails behind with the speed and ripples
  const pa = H.cape.geometry.attributes.position, b0 = H.capeBase, lift = 0.12 + run * 0.5 + (o.dash >= 0 ? 0.6 : 0) + (o.spin != null ? 0.8 : 0);
  for (let i = 0; i < pa.count; i++) { const y = b0[i * 3 + 1], d = -y / 1.25, x = b0[i * 3]; pa.setXYZ(i, x * (1 + d * 0.3), y * (1 - d * lift * 0.22), b0[i * 3 + 2] - d * d * lift * 0.6 - d * 0.08 + Math.sin(t * 7 - d * 5 + x * 4) * 0.045 * d * (0.3 + run) + Math.sin(t * 1.3 + x * 2) * 0.015 * d); }
  pa.needsUpdate = true; H.cape.geometry.computeVertexNormals();
  // ---- hit flash on the steel
  H.flash = Math.max(0, H.flash - dt * 4); for (const m of [tunic, ...Object.values(RAR).map((r) => r.plate)]) m.emissive.setRGB(H.flash * 0.9, H.flash * 0.15, H.flash * 0.1);
}
// where the sword point is in the world (for the swing trail)
export function swordTip(H, v) { return H.tip.getWorldPosition(v); }
