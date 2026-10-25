// The hero: a knight in worn steel plate with a white cape, a longsword and a kite shield. Built from simple shapes
// and posed by hand each frame: breathing when still, a running stride, a big sword swing, a cast with the free hand,
// the whirlwind spin, a dodge roll, a flinch when hit and a fall when killed.
import * as THREE from 'three';

const steel = new THREE.MeshStandardMaterial({ color: '#8a9098', metalness: 0.7, roughness: 0.5 });
const darkSteel = new THREE.MeshStandardMaterial({ color: '#4a4e56', metalness: 0.8, roughness: 0.45 });
const leather = new THREE.MeshStandardMaterial({ color: '#4a3020', roughness: 0.8 });
const cloth = new THREE.MeshStandardMaterial({ color: '#c8c4bc', roughness: 0.95, side: THREE.DoubleSide });
const red = new THREE.MeshStandardMaterial({ color: '#8a1a1a', roughness: 0.8 });
const gold = new THREE.MeshStandardMaterial({ color: '#d8a840', metalness: 0.9, roughness: 0.3 });
const M = (g, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); return o; };
const joint = (x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); return g; };

export function makeHero() {
  const root = new THREE.Group(), body = joint(0, 0.95, 0); root.add(body);
  // hips and legs
  const hips = M(new THREE.CylinderGeometry(0.24, 0.22, 0.22, 10), darkSteel); body.add(hips);
  const skirt = M(new THREE.CylinderGeometry(0.26, 0.34, 0.34, 10, 1, true), red, 0, -0.18, 0); body.add(skirt);
  const legs = [-1, 1].map((sd) => {
    const hip = joint(sd * 0.13, -0.08, 0); body.add(hip);
    hip.add(M(new THREE.CapsuleGeometry(0.09, 0.3, 3, 8), darkSteel, 0, -0.22, 0));
    const knee = joint(0, -0.44, 0); hip.add(knee); knee.add(M(new THREE.SphereGeometry(0.085, 8, 6), steel));
    knee.add(M(new THREE.CapsuleGeometry(0.08, 0.3, 3, 8), steel, 0, -0.2, 0));
    const boot = M(new THREE.BoxGeometry(0.15, 0.1, 0.27), darkSteel, 0, -0.44, 0.04); knee.add(boot);
    return { hip, knee };
  });
  // torso: a breastplate, belt, tabard, pauldrons
  const chest = joint(0, 0.12, 0); body.add(chest);
  const plate = M(new THREE.CapsuleGeometry(0.25, 0.28, 4, 12), steel, 0, 0.22, 0); plate.scale.set(1.12, 1, 0.82); chest.add(plate);
  chest.add(M(new THREE.TorusGeometry(0.255, 0.04, 6, 16), leather, 0, -0.02, 0)).rotation.x = Math.PI / 2;
  const tabard = M(new THREE.BoxGeometry(0.26, 0.5, 0.02), red, 0, 0.08, 0.215); chest.add(tabard);
  chest.add(M(new THREE.BoxGeometry(0.07, 0.07, 0.02), gold, 0, 0.26, 0.228));
  for (const sd of [-1, 1]) { const pa = M(new THREE.SphereGeometry(0.17, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), steel, sd * 0.32, 0.46, 0); pa.scale.set(1.15, 0.9, 1.1); pa.rotation.z = -sd * 0.35; chest.add(pa); }
  // the head: a great helm with a visor slit and a red crest
  const neck = joint(0, 0.56, 0); chest.add(neck);
  const helm = M(new THREE.CylinderGeometry(0.17, 0.16, 0.3, 14), steel, 0, 0.15, 0); neck.add(helm);
  neck.add(M(new THREE.SphereGeometry(0.17, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), steel, 0, 0.3, 0));
  neck.add(M(new THREE.BoxGeometry(0.26, 0.035, 0.05), new THREE.MeshBasicMaterial({ color: '#0a0806' }), 0, 0.2, 0.15));
  neck.add(M(new THREE.BoxGeometry(0.03, 0.2, 0.04), gold, 0, 0.13, 0.17));
  const crest = M(new THREE.BoxGeometry(0.05, 0.12, 0.38), red, 0, 0.47, -0.04); neck.add(crest);
  // arms
  const arms = [-1, 1].map((sd) => {
    const sh = joint(sd * 0.34, 0.4, 0); chest.add(sh);
    sh.add(M(new THREE.CapsuleGeometry(0.075, 0.24, 3, 8), darkSteel, 0, -0.17, 0));
    const el = joint(0, -0.36, 0); sh.add(el); el.add(M(new THREE.CapsuleGeometry(0.08, 0.22, 3, 8), steel, 0, -0.14, 0));
    const hand = joint(0, -0.32, 0); el.add(hand); hand.add(M(new THREE.SphereGeometry(0.08, 8, 6), leather));
    return { sh, el, hand };
  });
  // the longsword in the right hand
  const sword = joint(0, 0, 0); arms[1].hand.add(sword);
  sword.add(M(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 6), leather, 0, 0, 0));
  sword.add(M(new THREE.BoxGeometry(0.34, 0.05, 0.06), gold, 0, 0.12, 0));
  sword.add(M(new THREE.SphereGeometry(0.045, 8, 6), gold, 0, -0.13, 0));
  const blade = M(new THREE.BoxGeometry(0.08, 1.05, 0.02), new THREE.MeshStandardMaterial({ color: '#d8dce4', metalness: 0.95, roughness: 0.2, emissive: '#000000' }), 0, 0.66, 0); sword.add(blade);
  const tipM = M(new THREE.ConeGeometry(0.04, 0.12, 4), blade.material, 0, 1.24, 0); tipM.scale.z = 0.25; sword.add(tipM);
  sword.rotation.x = Math.PI / 2;
  const tip = new THREE.Object3D(); tip.position.y = 1.2; sword.add(tip);
  // a kite shield on the left arm
  const sh = new THREE.Shape(); sh.moveTo(0, 0.36); sh.quadraticCurveTo(0.27, 0.34, 0.26, 0.08); sh.quadraticCurveTo(0.22, -0.22, 0, -0.42); sh.quadraticCurveTo(-0.22, -0.22, -0.26, 0.08); sh.quadraticCurveTo(-0.27, 0.34, 0, 0.36);
  const shieldG = new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1 });
  const shield = joint(0, 0, 0); arms[0].el.add(shield); shield.position.set(-0.1, -0.16, 0.06); shield.rotation.y = -Math.PI / 2;
  shield.add(M(shieldG, red)); const boss = M(new THREE.SphereGeometry(0.07, 8, 6), gold, 0, 0.04, 0.08); shield.add(boss);
  const rim = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: false }), steel); rim.scale.set(1.08, 1.06, 1); rim.position.z = -0.01; shield.add(rim);
  // the cape: a hanging cloth that flows behind as he runs
  const capeG = new THREE.PlaneGeometry(0.62, 1.15, 6, 10); capeG.translate(0, -0.575, 0);
  const cape = M(capeG, cloth, 0, 0.52, -0.2); chest.add(cape);
  const capeBase = capeG.attributes.position.array.slice();
  root.traverse((o) => { if (o.isMesh) o.castShadow = false; });
  const H = { root, body, chest, neck, legs, arms, sword, blade, tip, cape, capeBase, shield, phase: 0, flash: 0 };
  return H;
}
const lerp = (a, b, k) => a + (b - a) * k;
// pose the knight. o: { speed (0..1 of a run), attack (0..1 through a swing, or -1), cast (0..1, -1), spin (radians, or null), dash (0..1, -1), hit (0..1), dead (0..1), t }
export function poseHero(H, o, dt) {
  const { body, chest, neck, legs, arms, sword } = H, t = o.t, run = o.speed || 0;
  H.phase += dt * (6 + run * 6) * (run > 0.05 ? 1 : 0);
  const s = Math.sin(H.phase), c = Math.cos(H.phase);
  // legs and the bob of a stride
  legs[0].hip.rotation.x = s * 0.75 * run; legs[1].hip.rotation.x = -s * 0.75 * run;
  legs[0].knee.rotation.x = Math.max(0, -c) * 1.1 * run; legs[1].knee.rotation.x = Math.max(0, c) * 1.1 * run;
  body.position.y = 0.95 + Math.abs(c) * 0.06 * run + Math.sin(t * 2) * 0.008 * (1 - run);
  body.rotation.set(0.12 * run, s * 0.08 * run, 0);
  chest.rotation.set(Math.sin(t * 2) * 0.02, -s * 0.15 * run, 0);
  // arms: swinging as he runs, shield held up
  arms[0].sh.rotation.set(-0.4 - s * 0.3 * run, 0, 0.18); arms[0].el.rotation.set(-1.1, 0, 0);
  arms[1].sh.rotation.set(-0.3 + s * 0.4 * run, 0, -0.2); arms[1].el.rotation.set(-0.5, 0, 0); arms[1].hand.rotation.set(0, 0, 0);
  sword.rotation.set(Math.PI / 2 - 0.3, 0, 0);
  if (o.attack >= 0) {
    // wind up over the right shoulder, cut down and across to the left, follow through
    const k = o.attack, wind = k < 0.25 ? k / 0.25 : 1, cut = k < 0.25 ? 0 : Math.min(1, (k - 0.25) / 0.4);
    const ease = cut * cut * (3 - 2 * cut);
    arms[1].sh.rotation.set(lerp(-2.4 * wind, -0.6, ease), lerp(0.6 * wind, -1.1, ease), lerp(-0.6, -0.1, ease));
    arms[1].el.rotation.set(lerp(-0.9, -0.1, ease), 0, 0);
    sword.rotation.set(lerp(Math.PI / 2 - 0.2, Math.PI / 2 + 0.4, ease), 0, 0);
    chest.rotation.y = lerp(0.6 * wind, -0.7, ease); body.rotation.x = 0.15 * ease;
  }
  if (o.cast >= 0) { const k = Math.sin(Math.min(1, o.cast) * Math.PI); arms[0].sh.rotation.set(-1.4 * k - 0.3, 0, 0.1); arms[0].el.rotation.set(-0.3 * k, 0, 0); chest.rotation.x = -0.1 * k; }
  if (o.spin != null) { body.rotation.y = o.spin; arms[1].sh.rotation.set(-1.5, 0, -1.3); arms[1].el.rotation.set(0, 0, 0); sword.rotation.set(Math.PI / 2, 0, 0); arms[0].sh.rotation.set(-1.4, 0, 1.2); }
  if (o.dash >= 0) { const k = Math.sin(o.dash * Math.PI); body.rotation.x = 0.7 * k; body.position.y = 0.95 - 0.35 * k; legs[0].hip.rotation.x = -1.2 * k; legs[1].hip.rotation.x = -0.6 * k; legs[0].knee.rotation.x = 1.6 * k; legs[1].knee.rotation.x = 1.6 * k; }
  if (o.hit > 0) { chest.rotation.x -= 0.25 * o.hit; neck.rotation.x = -0.2 * o.hit; } else neck.rotation.x = 0;
  if (o.dead > 0) { const k = Math.min(1, o.dead); body.rotation.x = -1.45 * k; body.position.y = lerp(0.95, 0.3, k); legs.forEach((l) => { l.hip.rotation.x = 0.3 * k; }); }
  // the cape trails behind with the speed and ripples
  const p = H.cape.geometry.attributes.position, b = H.capeBase, lift = 0.35 + run * 0.9 + (o.dash >= 0 ? 1 : 0);
  for (let i = 0; i < p.count; i++) { const y = b[i * 3 + 1], d = -y / 1.15, x = b[i * 3]; p.setXYZ(i, x * (1 + d * 0.25), y * (1 - d * lift * 0.25), b[i * 3 + 2] - d * d * lift * 0.55 + Math.sin(t * 7 - d * 5 + x * 3) * 0.04 * d * (0.4 + run)); }
  p.needsUpdate = true; H.cape.geometry.computeVertexNormals();
  // hit flash on the steel
  H.flash = Math.max(0, H.flash - dt * 4); steel.emissive.setRGB(H.flash * 0.9, H.flash * 0.15, H.flash * 0.1);
}
// where the sword point is in the world (for the swing trail)
export function swordTip(H, v) { return H.tip.getWorldPosition(v); }
