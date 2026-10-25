// The hero: a knight in worn plate over mail, with a white cape, a red tabard, a longsword and a heater shield.
// He is a full chain of joints (pelvis, lower and upper spine, neck, head; collarbone, shoulder, elbow, wrist;
// hip, knee, ankle, toes) posed by hand each frame: a real walking stride (the pelvis rocks and turns over the
// planted foot, the chest turns against it, the knees fold in the swing and the feet stay flat on the ground),
// breathing and shifting weight at rest, a sword cut that winds up through the whole body and steps into the blow,
// a cast, the whirlwind, a tucked forward roll, a flinch, and a fall to the knees and then forward.
import * as THREE from 'three';

// ------------------------------------------------------------------ materials: brushed and scratched steel, mail, leather, cloth
function paint(n, f) { const c = document.createElement('canvas'); c.width = c.height = n; f(c.getContext('2d'), n); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t; }
const metalTex = paint(256, (g, n) => { g.fillStyle = '#b8b8b8'; g.fillRect(0, 0, n, n); for (let k = 0; k < 4000; k++) { const v = 150 + Math.random() * 80; g.fillStyle = `rgba(${v},${v},${v},0.25)`; g.fillRect(Math.random() * n, Math.random() * n, 1 + Math.random() * 3, 1); } g.strokeStyle = 'rgba(60,60,60,0.35)'; for (let k = 0; k < 60; k++) { const x = Math.random() * n, y = Math.random() * n, a = Math.random() * 6.3, l = 6 + Math.random() * 30; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); } for (let k = 0; k < 18; k++) { g.fillStyle = 'rgba(90,60,40,0.18)'; g.beginPath(); g.arc(Math.random() * n, Math.random() * n, 4 + Math.random() * 14, 0, 7); g.fill(); } });
const mailTex = paint(128, (g, n) => { g.fillStyle = '#2a2a2e'; g.fillRect(0, 0, n, n); g.lineWidth = 1.6; for (let y = 0; y < n + 8; y += 6) for (let x = (y / 6) % 2 ? 3 : 0; x < n + 8; x += 6) { g.strokeStyle = 'rgba(200,200,210,0.75)'; g.beginPath(); g.arc(x, y, 2.6, 0, 7); g.stroke(); } });
mailTex.repeat.set(3, 3);
const clothTex = paint(128, (g, n) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, n, n); for (let y = 0; y < n; y += 2) { g.fillStyle = `rgba(0,0,0,${0.04 + Math.random() * 0.04})`; g.fillRect(0, y, n, 1); } for (let x = 0; x < n; x += 2) { g.fillStyle = 'rgba(0,0,0,0.03)'; g.fillRect(x, 0, 1, n); } for (let k = 0; k < 10; k++) { g.fillStyle = 'rgba(90,70,50,0.08)'; g.beginPath(); g.arc(Math.random() * n, n - Math.random() * 40, 6 + Math.random() * 16, 0, 7); g.fill(); } });
const steel = new THREE.MeshStandardMaterial({ color: '#9aa0a8', map: metalTex, metalness: 0.72, roughness: 0.42 });
const darkSteel = new THREE.MeshStandardMaterial({ color: '#5a5e66', map: metalTex, metalness: 0.75, roughness: 0.48 });
const mail = new THREE.MeshStandardMaterial({ color: '#a0a0a8', map: mailTex, bumpMap: mailTex, bumpScale: 1.2, metalness: 0.6, roughness: 0.55 });
const leather = new THREE.MeshStandardMaterial({ color: '#5a3a24', roughness: 0.82 });
const darkLeather = new THREE.MeshStandardMaterial({ color: '#2e1e14', roughness: 0.85 });
const cloth = new THREE.MeshStandardMaterial({ color: '#b8b0a0', map: clothTex, roughness: 0.95, side: THREE.DoubleSide });
const red = new THREE.MeshStandardMaterial({ color: '#8a1616', map: clothTex, roughness: 0.9, side: THREE.DoubleSide });
const gold = new THREE.MeshStandardMaterial({ color: '#d8a840', metalness: 0.9, roughness: 0.32 });
const bladeM = new THREE.MeshStandardMaterial({ color: '#e8ecf2', map: metalTex, metalness: 0.85, roughness: 0.22, emissive: '#1a1c20' });
const black = new THREE.MeshBasicMaterial({ color: '#060404' });
const M = (g, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); return o; };
const A = (parent, o) => { parent.add(o); return o; };
const J = (parent, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
const cap = (r, l, m, x, y, z, sx = 1, sz = 1) => { const o = M(new THREE.CapsuleGeometry(r, l, 4, 10), m, x, y, z); o.scale.set(sx, 1, sz); return o; };
// a cupped plate (a lame of a pauldron, a knee cop)
const cup = (r, m, open = Math.PI / 2) => new THREE.Mesh(new THREE.SphereGeometry(r, 14, 8, 0, Math.PI * 2, 0, open), m);

export function setHeroEnv(env) { for (const m of [steel, darkSteel, mail, gold, bladeM]) { m.envMap = env; m.envMapIntensity = m === bladeM ? 1.1 : 0.55; m.needsUpdate = true; } }
export function makeHero() {
  const root = new THREE.Group();
  const pelvis = J(root, 0, 0.98, 0);
  // ---- the hips: a mail skirt, a belt with a buckle, a pouch and a scabbard, steel tassets over the thighs
  pelvis.add(M(new THREE.CylinderGeometry(0.2, 0.22, 0.2, 14), darkSteel, 0, 0.02, 0));
  const skirt = M(new THREE.CylinderGeometry(0.235, 0.3, 0.3, 16, 1, true), mail, 0, -0.16, 0); pelvis.add(skirt);
  A(pelvis, M(new THREE.TorusGeometry(0.215, 0.032, 6, 20), darkLeather, 0, 0.1, 0)).rotation.x = Math.PI / 2;
  pelvis.add(M(new THREE.BoxGeometry(0.08, 0.07, 0.03), gold, 0, 0.1, 0.22));
  const pouch = M(new THREE.BoxGeometry(0.1, 0.11, 0.06), leather, 0.17, 0.02, 0.13); pouch.rotation.y = 0.6; pelvis.add(pouch);
  const scab = M(new THREE.BoxGeometry(0.05, 0.75, 0.025), darkLeather, -0.24, -0.25, -0.08); scab.rotation.set(0.35, 0, 0.15); pelvis.add(scab);
  pelvis.add(M(new THREE.BoxGeometry(0.06, 0.04, 0.04), gold, -0.25, 0.1, -0.03));
  const tassets = [-1, 1].map((sd) => { const t = J(pelvis, sd * 0.13, 0.04, 0.12); const p = M(new THREE.BoxGeometry(0.17, 0.2, 0.025), steel, 0, -0.1, 0.02); p.rotation.x = 0.12; t.add(p); t.add(M(new THREE.BoxGeometry(0.15, 0.015, 0.03), gold, 0, -0.005, 0.03)); return t; });
  // the tabard: a front and a back panel that swing between the legs
  const tabF = J(pelvis, 0, 0.08, 0.215), tabB = J(pelvis, 0, 0.08, -0.215);
  const tg = new THREE.PlaneGeometry(0.22, 0.52, 1, 4); tg.translate(0, -0.26, 0);
  tabF.add(M(tg, red)); const tbg = tg.clone(); tabB.add(M(tbg, red));
  A(tabF, M(new THREE.PlaneGeometry(0.06, 0.06), gold, 0, -0.12, 0.004)).rotation.z = Math.PI / 4;
  // ---- legs: cuisse, knee cop, greave, sabaton with a toe that bends
  const legs = [-1, 1].map((sd) => {
    const hip = J(pelvis, sd * 0.115, -0.06, 0);
    hip.add(cap(0.09, 0.28, mail, 0, -0.2, 0));
    hip.add(cap(0.085, 0.24, steel, 0, -0.2, 0.02, 1.08, 0.9));
    const knee = J(hip, 0, -0.44, 0);
    const kc = cup(0.085, steel); kc.rotation.x = Math.PI / 2 + 0.3; kc.position.z = 0.03; knee.add(kc);
    knee.add(M(new THREE.SphereGeometry(0.035, 8, 6), gold, 0, 0, 0.11));
    knee.add(cap(0.075, 0.26, steel, 0, -0.21, 0.01, 1, 1.05));
    const ankle = J(knee, 0, -0.42, 0);
    const foot = M(new THREE.BoxGeometry(0.13, 0.09, 0.2), darkSteel, 0, -0.025, 0.05); ankle.add(foot);
    ankle.add(M(new THREE.CylinderGeometry(0.075, 0.07, 0.07, 10), steel, 0, 0.01, 0));
    const toe = J(ankle, 0, -0.03, 0.15); const tm = M(new THREE.BoxGeometry(0.12, 0.07, 0.1), steel, 0, 0, 0.04); tm.rotation.x = 0.1; toe.add(tm);
    for (let k = 0; k < 2; k++) toe.add(M(new THREE.BoxGeometry(0.125, 0.012, 0.012), gold, 0, 0.03, 0.01 + k * 0.04));
    return { hip, knee, ankle, toe };
  });
  // ---- the spine: lower and upper, the breastplate with a ridge and a gold cross, the backplate
  const spineLo = J(pelvis, 0, 0.12, 0), spineUp = J(spineLo, 0, 0.17, 0);
  spineLo.add(cap(0.19, 0.08, mail, 0, 0.03, 0, 1.1, 0.85));
  const plate = cap(0.235, 0.22, steel, 0, 0.18, 0.01, 1.12, 0.8); spineUp.add(plate);
  spineUp.add(M(new THREE.BoxGeometry(0.03, 0.36, 0.03), steel, 0, 0.18, 0.2));
  spineUp.add(M(new THREE.BoxGeometry(0.035, 0.16, 0.02), gold, 0, 0.24, 0.21)); spineUp.add(M(new THREE.BoxGeometry(0.11, 0.035, 0.02), gold, 0, 0.27, 0.21));
  A(spineUp, M(new THREE.TorusGeometry(0.2, 0.02, 6, 18, Math.PI), gold, 0, 0.42, 0.02)).rotation.set(-Math.PI / 2 + 0.2, 0, 0);
  for (const y of [0.02, -0.06]) spineUp.add(M(new THREE.CylinderGeometry(0.23 - y * 0.2, 0.24, 0.07, 16, 1, true), steel, 0, y, 0));
  // ---- the head: a gorget, a great helm with a visor ridge, breaths and slits, a crest and a red plume
  const neck = J(spineUp, 0, 0.44, 0.0);
  neck.add(M(new THREE.CylinderGeometry(0.11, 0.17, 0.1, 14), steel, 0, 0.0, 0));
  const head = J(neck, 0, 0.08, 0.01);
  head.add(M(new THREE.CylinderGeometry(0.155, 0.15, 0.27, 18), steel, 0, 0.13, 0));
  A(head, cup(0.157, steel, Math.PI / 2)).position.y = 0.265;
  const ridge = M(new THREE.BoxGeometry(0.02, 0.3, 0.05), steel, 0, 0.16, 0.145); head.add(ridge);
  for (const sd of [-1, 1]) head.add(M(new THREE.BoxGeometry(0.11, 0.022, 0.02), black, sd * 0.07, 0.17, 0.148));
  for (let k = 0; k < 6; k++) A(head, M(new THREE.CylinderGeometry(0.008, 0.008, 0.02, 4), black, 0.04 + (k % 3) * 0.025, 0.08 + Math.floor(k / 3) * 0.03, 0.15)).rotation.x = Math.PI / 2;
  A(head, M(new THREE.TorusGeometry(0.153, 0.012, 4, 20), gold, 0, 0.025, 0)).rotation.x = Math.PI / 2;
  head.add(M(new THREE.BoxGeometry(0.035, 0.07, 0.3), gold, 0, 0.405, -0.01));
  const plume = []; { let p = J(head, 0, 0.43, -0.06); for (let k = 0; k < 4; k++) { const seg = M(new THREE.ConeGeometry(0.05 - k * 0.006, 0.17, 6), red, 0, 0.07, 0); seg.rotation.x = Math.PI; p.add(seg); plume.push(p); p = J(p, 0, 0.12, -0.02); } }
  // ---- arms: collarbone, a layered pauldron, mail sleeve, couter at the elbow, vambrace, gauntlet with fingers
  const arms = [-1, 1].map((sd) => {
    const clav = J(spineUp, sd * 0.16, 0.36, 0);
    const sh = J(clav, sd * 0.17, 0, 0);
    for (let k = 0; k < 3; k++) { const l = cup(0.16 - k * 0.018, steel, Math.PI / 2.2); l.position.set(sd * (0.02 + k * 0.025), 0.03 - k * 0.055, 0); l.rotation.z = -sd * (0.45 + k * 0.18); l.scale.set(1.1, 0.8, 1.15); sh.add(l); }
    A(sh, M(new THREE.TorusGeometry(0.13, 0.012, 4, 16, Math.PI), gold, sd * 0.02, 0.06, 0)).rotation.set(0, Math.PI / 2, -sd * 0.45);
    sh.add(cap(0.072, 0.2, mail, 0, -0.16, 0));
    const el = J(sh, 0, -0.31, 0);
    const co = cup(0.07, steel); co.rotation.x = -Math.PI / 2 - 0.3; co.position.z = -0.03; el.add(co); el.add(M(new THREE.SphereGeometry(0.03, 6, 5), gold, 0, 0, -0.09));
    el.add(cap(0.065, 0.17, steel, 0, -0.14, 0, 1, 1.05));
    const wr = J(el, 0, -0.28, 0);
    wr.add(M(new THREE.CylinderGeometry(0.075, 0.06, 0.08, 10), steel, 0, 0.02, 0));
    const hand = J(wr, 0, -0.06, 0);
    hand.add(M(new THREE.BoxGeometry(0.09, 0.1, 0.1), darkSteel, 0, -0.01, 0));
    for (let k = 0; k < 4; k++) A(hand, M(new THREE.CylinderGeometry(0.016, 0.016, 0.09, 5), darkSteel, -0.034 + k * 0.023, -0.06, 0.045)).rotation.x = Math.PI / 2;
    A(hand, M(new THREE.CylinderGeometry(0.017, 0.017, 0.07, 5), darkSteel, sd * -0.05, -0.02, 0.04)).rotation.set(Math.PI / 2, 0, sd * 0.6);
    return { clav, sh, el, wr, hand };
  });
  // ---- the longsword: a fullered blade, a curved guard, a wrapped grip, a wheel pommel
  const sword = J(arms[1].hand, 0, -0.06, 0.02);
  sword.add(M(new THREE.CylinderGeometry(0.022, 0.024, 0.2, 8), darkLeather, 0, 0, 0));
  for (let k = 0; k < 5; k++) A(sword, M(new THREE.TorusGeometry(0.024, 0.006, 4, 8), leather, 0, -0.08 + k * 0.04, 0)).rotation.x = Math.PI / 2;
  const guard = M(new THREE.TorusGeometry(0.2, 0.018, 6, 16, Math.PI * 0.5), gold, 0, 0.02, 0); guard.rotation.set(0, 0, Math.PI * 0.25 + Math.PI); sword.add(guard);
  sword.add(M(new THREE.SphereGeometry(0.03, 8, 6), gold, 0.14, 0.14, 0)); sword.add(M(new THREE.SphereGeometry(0.03, 8, 6), gold, -0.14, 0.14, 0));
  A(sword, M(new THREE.CylinderGeometry(0.045, 0.045, 0.025, 12), gold, 0, -0.12, 0)).rotation.x = Math.PI / 2;
  const blade = M(new THREE.BoxGeometry(0.075, 1.0, 0.018), bladeM, 0, 0.64, 0); sword.add(blade);
  const tipM = M(new THREE.ConeGeometry(0.053, 0.14, 4), bladeM, 0, 1.21, 0); tipM.scale.z = 0.33; tipM.rotation.y = Math.PI / 4; sword.add(tipM);
  sword.add(M(new THREE.BoxGeometry(0.03, 0.06, 0.03), gold, 0, 0.1, 0));
  const tip = new THREE.Object3D(); tip.position.y = 1.22; sword.add(tip);
  // ---- the shield: a heater with a steel rim, a red field and a gold lion-cross, strapped to the forearm
  const sh = new THREE.Shape(); sh.moveTo(-0.27, 0.32); sh.lineTo(0.27, 0.32); sh.lineTo(0.27, 0.05); sh.quadraticCurveTo(0.25, -0.24, 0, -0.42); sh.quadraticCurveTo(-0.25, -0.24, -0.27, 0.05); sh.closePath();
  const shield = J(arms[0].el, -0.1, -0.15, 0.03); shield.rotation.set(0, -Math.PI / 2, 0);
  const field = M(new THREE.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2 }), red); shield.add(field);
  const rim = M(new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: false }), steel, 0, 0, -0.012); rim.scale.set(1.07, 1.06, 1); shield.add(rim);
  shield.add(M(new THREE.BoxGeometry(0.06, 0.52, 0.02), gold, 0, -0.02, 0.06)); shield.add(M(new THREE.BoxGeometry(0.38, 0.06, 0.02), gold, 0, 0.12, 0.06));
  shield.add(M(new THREE.SphereGeometry(0.06, 10, 8), gold, 0, 0.12, 0.07));
  for (const [x, y] of [[-0.22, 0.27], [0.22, 0.27], [0.2, -0.05], [-0.2, -0.05], [0, -0.33]]) shield.add(M(new THREE.SphereGeometry(0.016, 6, 4), steel, x, y, 0.06));
  // ---- the cape: hung from the shoulders, flowing behind as he runs
  const capeG = new THREE.PlaneGeometry(0.66, 1.25, 8, 14); capeG.translate(0, -0.62, 0);
  const cape = M(capeG, cloth, 0, 0.4, -0.19); spineUp.add(cape);
  for (const sd of [-1, 1]) A(spineUp, M(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 10), gold, sd * 0.2, 0.4, -0.17)).rotation.x = Math.PI / 2;
  const capeBase = capeG.attributes.position.array.slice();
  // a soft shadow at his feet
  const sc = document.createElement('canvas'); sc.width = sc.height = 64; { const g = sc.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,0.65)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.03; root.add(shadow);
  return { root, pelvis, spineLo, spineUp, chest: spineUp, neck, head, plume, legs, arms, sword, blade, tip, shield, tassets, tabF, tabB, cape, capeBase, shadow, phase: 0, flash: 0, plumeV: 0, plumeA: 0 };
}

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
  set(H.tabF, Math.min(0, fwdLeg) * 0.8 - 0.05 * run, 0, 0); set(H.tabB, Math.max(0, backLeg) * 0.8 + 0.25 * run, 0, 0);
  H.plumeA += (run * 0.9 + (o.dash >= 0 ? 0.8 : 0) - H.plumeA) * Math.min(1, dt * 4);
  H.plume.forEach((P, k) => set(P, -0.5 - H.plumeA * 0.5 * (k ? 0.5 : 1) + Math.sin(t * 6 - k * 0.9) * 0.08 * (0.3 + run), Math.sin(t * 3.1 + k) * 0.06, 0));
  // ---- the cape trails behind with the speed and ripples
  const pa = H.cape.geometry.attributes.position, b0 = H.capeBase, lift = 0.12 + run * 0.5 + (o.dash >= 0 ? 0.6 : 0) + (o.spin != null ? 0.8 : 0);
  for (let i = 0; i < pa.count; i++) { const y = b0[i * 3 + 1], d = -y / 1.25, x = b0[i * 3]; pa.setXYZ(i, x * (1 + d * 0.3), y * (1 - d * lift * 0.22), b0[i * 3 + 2] - d * d * lift * 0.6 - d * 0.08 + Math.sin(t * 7 - d * 5 + x * 4) * 0.045 * d * (0.3 + run) + Math.sin(t * 1.3 + x * 2) * 0.015 * d); }
  pa.needsUpdate = true; H.cape.geometry.computeVertexNormals();
  // ---- hit flash on the steel
  H.flash = Math.max(0, H.flash - dt * 4); steel.emissive.setRGB(H.flash * 0.9, H.flash * 0.15, H.flash * 0.1);
}
// where the sword point is in the world (for the swing trail)
export function swordTip(H, v) { return H.tip.getWorldPosition(v); }
