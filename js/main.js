// Abyss of Bones: down through the floors of a cave full of the dead. Each floor: find the obelisk, wake it, and
// survive while it charges (on every third floor the Bone King rises instead); then the portal opens to the camp
// and the next floor down. Kill, level up, learn and rank skills, pick up loot and wear the best of it.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { makeFloor, bfs, cellOf, centre, CELL, solid, slide, sight } from './cave.js?v=2';
import { buildWorld, glowTexture, rockGeometry } from './world.js?v=2';
import { makeHero, poseHero, swordTip, setHeroEnv } from './hero.js?v=2';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Horde, KINDS } from './foes.js?v=2';
import { FX } from './fx.js?v=2';
import { SKILLS, PASSIVES, MAX_RANK, skillIcon, cast, slash, stepSkills } from './skills.js?v=2';
import { SLOTS, SLOT_NAME, RARITY, LEGENDS, makeItem, itemName, itemLines, score, price } from './items.js?v=2';
import { sound } from './audio.js?v=2';

const $ = (id) => document.getElementById(id);
const KEY = 'abyss.v1', GAME = 'abyss';
let lang = (() => { try { return localStorage.getItem('abyss.lang') || (/^zh/i.test(navigator.language || 'zh') ? 'zh' : 'en'); } catch (e) { return 'zh'; } })();
const L = (zh, en) => (lang === 'zh' ? zh : en), T = (o) => o[lang];
const FLOOR_NAMES = [['被遺忘的墓穴', 'The Forgotten Crypt'], ['骸骨長廊', 'Hall of Bones'], ['骸骨之王的王座', 'Throne of the Bone King'], ['淹沒的墳場', 'The Drowned Graves'], ['灰燼礦坑', 'The Ash Mines'], ['屍骨祭壇', 'Altar of the Dead'], ['無光深淵', 'The Lightless Deep'], ['哀嚎迴廊', 'Galleries of Wailing'], ['永夜王座', 'Throne of Endless Night']];
const NUM = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const floorLabel = (d) => L(`第${d <= 10 ? NUM[d] : d}層`, `Floor ${d}`);
const floorName = (d) => { const n = FLOOR_NAMES[(d - 1) % FLOOR_NAMES.length]; return L(n[0], n[1]) + (d > FLOOR_NAMES.length ? ' ' + 'I'.repeat(Math.ceil(d / FLOOR_NAMES.length)) : ''); };

// ------------------------------------------------------------------ the save
const fresh = () => ({ v: 1, level: 1, xp: 0, points: 1, offers: null, skills: {}, slots: [null, null, null, null], passives: {}, runes: { power: 0, life: 0, swift: 0 }, equip: { weapon: { id: 'start', slot: 'weapon', rar: 0, base: { zh: '老兵長劍', en: 'Veteran’s Longsword' }, lvl: 1, aff: {}, dmg: 12 } }, bag: [], gold: 0, souls: 0, potions: 3, depth: 1, best: 1, kills: 0, seed: Math.floor(Math.random() * 1e6) });
let S = load();
function load() { try { const v = JSON.parse(localStorage.getItem(KEY)); if (v && v.v === 1) return { ...fresh(), ...v }; } catch (e) { /* none */ } return fresh(); }
let cloud = null;
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* full */ } if (cloud) cloud.touch(GAME, KEY); }

// ------------------------------------------------------------------ three.js
const canvas = $('view'), renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
const scene = new THREE.Scene(); scene.background = new THREE.Color('#030404'); scene.fog = new THREE.FogExp2('#040606', 0.028);
const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 200);
scene.add(new THREE.AmbientLight('#4a6a68', 0.5)); scene.add(new THREE.HemisphereLight('#5a7a80', '#1a1410', 0.5));
const moon = new THREE.DirectionalLight('#8ab0c0', 0.35); moon.position.set(-20, 40, 10); scene.add(moon);
const heroLight = new THREE.PointLight('#ffd0a0', 42, 26, 1.2); scene.add(heroLight);
const fxLights = []; for (let k = 0; k < 4; k++) { const l = new THREE.PointLight('#ff8a3a', 0, 16, 1.5); scene.add(l); fxLights.push(l); }
let lightReq = [];
const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.45, 0.9); composer.addPass(bloom); composer.addPass(new OutputPass());
const fx = new FX(scene), horde = new Horde(scene);
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); composer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); fx.setScale(h * renderer.getPixelRatio(), camera.fov); }
addEventListener('resize', resize); resize();

// ------------------------------------------------------------------ the hero and the game state
const H = makeHero(); scene.add(H.root);
// something for the steel to reflect (only metals use it, so the cave stays dark)
const envTex = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture; setHeroEnv(envTex); horde.setEnv(envTex);
const G = {
  scene, fx, horde, sound, active: [], skills: S.skills, st: null, F: null, W: null,
  h: { x: 0, z: 0, yaw: 0, hp: 100, mana: 100, swing: -1, swingCd: 0, castT: -1, dash: -1, dashCd: 0, whirl: 0, hitT: 0, dead: false, deadT: 0, alive: true, potCd: 0, cds: {}, buff: {} },
  hit: (e, d, o) => hitFoe(e, d, o), mana: (n) => { G.h.mana = Math.min(G.st.maxMana, G.h.mana + n); },
  light: (x, y, z, color, i) => lightReq.push({ x, y, z, color, i }),
  hammerMesh: () => { const g = new THREE.Group(), gm = new THREE.MeshStandardMaterial({ color: '#ffd860', emissive: '#c89020', emissiveIntensity: 1.2, metalness: 0.8, roughness: 0.3 }); const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.3), gm), hd = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6), gm); hd.position.y = -0.35; g.add(head, hd); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: '#ffd060', blending: THREE.AdditiveBlending, depthWrite: false })); s.scale.setScalar(1.6); g.add(s); scene.add(g); return g; },
  meteorMesh: () => { const m = new THREE.Mesh(rockGeometry(9, 1), new THREE.MeshStandardMaterial({ color: '#3a2418', emissive: '#ff4a00', emissiveIntensity: 1.2, flatShading: true })); m.scale.setScalar(1.1); scene.add(m); return m; },
  drops: [], shots: [], ev: null, kills: 0, flow: null, flowT: 0, seen: null, paused: true, t: 0, boss: null,
};
let spikes = null;
{ const geo = new THREE.ConeGeometry(0.22, 1.6, 5); spikes = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: '#bfefff', emissive: '#4ab8ff', emissiveIntensity: 0.9, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.85, flatShading: true }), 400); spikes.count = 0; spikes.frustumCulled = false; scene.add(spikes); }

// stats: everything the hero is, added up
function stats() {
  const eq = Object.values(S.equip).filter(Boolean), aff = {}; let wdmg = 4, armor = 0; const legend = {};
  for (const it of eq) { if (it.dmg) wdmg = it.dmg; armor += it.armor || 0; for (const [k, v] of Object.entries(it.aff)) aff[k] = (aff[k] || 0) + v; if (it.legend) legend[it.legend] = true; }
  const p = (k) => S.passives[k] || 0, a = (k) => aff[k] || 0, r = S.runes;
  return {
    dmg: (wdmg + S.level * 1.4) * (1 + a('dmgPct') / 100 + 0.12 * p('might') + 0.05 * r.power), spell: 1 + a('spell') / 100,
    maxHp: Math.round((130 + (S.level - 1) * 14 + a('hp') + 25 * p('vigor')) * (1 + 0.05 * r.life)), maxMana: 100 + 15 * p('wisdom'),
    manaRegen: 7 * (1 + a('mana') / 100 + 0.25 * p('wisdom')), atk: 1 + a('atk') / 100 + 0.1 * p('swift'), move: 6.4 * (1 + a('move') / 100 + 0.07 * p('fleet') + 0.03 * r.swift),
    crit: 0.05 + a('crit') / 100 + 0.05 * p('keen'), leech: a('leech') / 100 + 0.02 * p('leech'), armor: armor + a('armor'), regen: 1.2 + a('regen'),
    gold: 1 + a('gold') / 100 + 0.25 * p('greed'), pickup: 2.4 + p('greed'), legend,
  };
}
function restat() { const old = G.st; G.st = stats(); if (old) { G.h.hp = Math.min(G.st.maxHp, G.h.hp + Math.max(0, G.st.maxHp - old.maxHp)); } }
G.st = stats(); G.h.hp = G.st.maxHp;

// ------------------------------------------------------------------ a floor
function loadFloor(depth) {
  if (G.W) G.W.dispose(); horde.clear(); fx.clear(); for (const d of G.drops) removeDrop(d); G.drops = []; for (const s of G.shots) scene.remove(s.mesh); G.shots = [];
  for (const a of G.active) if (a.mesh) scene.remove(a.mesh); G.active = []; G.boss = null; $('bossbar').hidden = true;
  const F = makeFloor(depth, S.seed + depth * 7919); G.F = F; G.W = buildWorld(F, scene); G.seen = new Uint8Array(F.W * F.H); G.ev = null; G.done = false; G.depth = depth;
  const h = G.h; h.x = centre(F.start[0]); h.z = centre(F.start[1]); h.yaw = 0; h.dead = false; h.alive = true; h.hp = G.st.maxHp; h.mana = G.st.maxMana; h.swing = -1; h.dash = -1; h.whirl = 0; h.moveTo = null; h.target = null;
  // the dead wait in the dark in packs
  for (const p of F.packs) { const kinds = depth < 2 ? ['skel', 'skel', 'runner'] : depth < 4 ? ['skel', 'skel', 'runner', 'archer'] : ['skel', 'runner', 'archer', 'mage', 'skel']; for (let k = 0; k < p.n; k++) { const x = centre(p.i) + (Math.random() - 0.5) * 3, z = centre(p.j) + (Math.random() - 0.5) * 3; if (!solid(F, x, z)) horde.spawn(kinds[Math.floor(Math.random() * kinds.length)], x, z, { depth, sleep: true }); }
    if (p.elite) { const kind = depth >= 2 && Math.random() < 0.5 ? 'brute' : 'skel'; horde.spawn(kind, centre(p.i), centre(p.j), { depth, sleep: true, elite: true }); } }
  G.flow = bfs(F.grid, F.W, F.H, cellOf(h.x), cellOf(h.z)); G.flowT = 0;
  $('floorName').textContent = floorLabel(depth); banner(floorLabel(depth), floorName(depth));
  hint(L('找到方尖碑（地圖上的橘色記號）', 'Find the obelisk (the orange mark on the map)'), 6);
  S.depth = depth; S.best = Math.max(S.best, depth); save(); updateSlots();
}

// ------------------------------------------------------------------ combat
function hitFoe(e, d, o = {}) {
  if (e.dead) return; const st = G.st, crit = Math.random() < st.crit; let dmg = d * (crit ? 1.75 : 1) * (0.92 + Math.random() * 0.16);
  e.hp -= dmg; e.flash = 1;
  if (o.knock && !e.boss) { const dx = e.x - G.h.x, dz = e.z - G.h.z, l = Math.hypot(dx, dz) || 1; e.kx += dx / l * o.knock / e.scale; e.kz += dz / l * o.knock / e.scale; }
  if (o.ember) { e.burn = 2; e.burnDmg = st.dmg * 0.2; }
  if (st.leech) G.h.hp = Math.min(st.maxHp, G.h.hp + dmg * st.leech);
  if (e.state === 'idle') e.state = 'chase';
  if (!o.quiet || crit) floater(Math.round(dmg), e.x, 2.1 * e.scale, e.z, crit ? 'crit' : o.fire ? 'fire' : o.frost ? 'frost' : o.shock ? 'shock' : o.holy ? 'holy' : '');
  fx.spark(e.x, 1.1 * e.scale, e.z, o.fire ? '#ff8a3a' : o.frost ? '#bfefff' : '#f4ecd8', o.quiet ? 2 : 5, { speed: 3.5, life: 0.3, size: 0.25 });
  if (e.hp <= 0) die(e);
}
function die(e) {
  horde.kill(e, G.h, null); G.kills++; S.kills++; sound.play('bones');
  fx.puff(e.x, 0.6, e.z, '#b8b0a0', 5, { size: 0.5, size1: 1.4, a: 0.4 });
  const K = e.K, d = G.depth;
  gainXp(K.xp * (1 + (d - 1) * 0.18) * (e.elite ? 4 : 1));
  if (Math.random() < (e.elite ? 1 : 0.45)) dropGold(e.x, e.z, Math.round(K.gold * (1 + d * 0.35) * (e.elite ? 5 : 1) * (0.6 + Math.random() * 0.8) * G.st.gold));
  if (e.elite || e.boss) { S.souls += e.boss ? 10 : 1 + Math.floor(Math.random() * 2); fx.spark(e.x, 1.5, e.z, '#c87aff', 24, { speed: 3, up: 5, life: 1, size: 0.4, grav: -2 }); }
  if (Math.random() < (e.elite ? 1 : 0.03)) dropItem(e.x, e.z, makeItem(d, { boost: e.elite ? 1 : 0 }));
  if (e.elite && Math.random() < 0.5) dropItem(e.x + 1, e.z, makeItem(d, { boost: 1 }));
  if (Math.random() < (e.elite ? 1 : 0.05)) dropGlobe(e.x, e.z);
  if (G.st.legend.bloodlust) G.h.hp = Math.min(G.st.maxHp, G.h.hp + G.st.maxHp * 0.02);
  if (e.boss) bossDown(e);
}
function hurtHero(dmg, from) {
  const h = G.h; if (h.dead || h.dash >= 0 || G.done === 'camp' || G.god) return;
  const red = G.st.armor / (G.st.armor + 60 + G.depth * 12); dmg *= 1 - red;
  h.hp -= dmg; h.hitT = 0.25; H.flash = 1; floater(Math.round(dmg), h.x, 2.4, h.z, 'me'); sound.play('hurt', 0.8); fx.shake(0.12, 0.15);
  if (h.hp <= 0) heroDies();
}
function heroDies() {
  const h = G.h; h.hp = 0; h.dead = true; h.alive = false; h.deadT = 0; sound.play('death'); sound.ambient(false);
  const lost = Math.floor(S.gold * 0.2); S.gold -= lost; save();
  setTimeout(() => panel(`<h2>${L('你倒下了', 'You have fallen')}</h2><p class="help" style="text-align:center">${L(`失去 ${lost} 金幣。骸骨們會在原地等你。`, `You lost ${lost} gold. The dead will be waiting.`)}</p><div class="row"><button class="pb" id="rez">${L('從本層起點復活', 'Rise again at the start of this floor')}</button></div>`, { noClose: true, onShow: () => { $('rez').onclick = () => { closePanel(); restat(); loadFloor(G.depth); sound.ambient(true); }; } }), 1800);
}
const ENEMY_SHOT = { arrow: { speed: 17, color: '#d8c8a0', size: 0.25 }, bolt: { speed: 9, color: '#4ab0ff', size: 0.6 } };
const C = {
  get player() { return G.h; }, get F() { return G.F; }, get flow() { return G.flow; },
  hurt: (d, e) => hurtHero(d, e), damage: (e, d, o) => hitFoe(e, d, o), wake: () => {},
  shoot: (e, kind) => { const S0 = ENEMY_SHOT[kind], dx = G.h.x - e.x, dz = G.h.z - e.z, l = Math.hypot(dx, dz) || 1;
    const mesh = kind === 'arrow' ? new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 4).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#e8dcc0' })) : new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: S0.color, blending: THREE.AdditiveBlending, depthWrite: false }));
    if (kind === 'bolt') mesh.scale.setScalar(1.2); mesh.position.set(e.x, 1.3 * e.scale, e.z); mesh.lookAt(G.h.x, 1.3, G.h.z); scene.add(mesh);
    G.shots.push({ kind, x: e.x, z: e.z, vx: dx / l * S0.speed, vz: dz / l * S0.speed, dmg: e.dmg, mesh, t: 0 }); sound.play(kind === 'arrow' ? 'arrow' : 'bolt2', 0.6); },
  slam: (e) => { const r = e.K.slam * e.scale * 0.6 + 0.6, fx0 = e.x + Math.sin(e.yaw) * 1.2 * e.scale, fz0 = e.z + Math.cos(e.yaw) * 1.2 * e.scale; if (Math.hypot(G.h.x - fx0, G.h.z - fz0) < r) hurtHero(e.dmg, e); fx.decal('ring', fx0, fz0, r, 0.4, { color: '#c8a070' }); fx.puff(fx0, 0.3, fz0, '#6a5a48', 10, { speed: 4, size: 0.8, size1: 2 }); fx.shake(0.2, 0.2); sound.play('boom', 0.5); },
  bossSlam: (e) => { const x = e.x, z = e.z; sound.play('roar'); fx.decal('warn', x, z, 6, 1.2, { cb: () => { if (Math.hypot(G.h.x - x, G.h.z - z) < 6) hurtHero(e.dmg * 1.6, e); fx.decal('ring', x, z, 7, 0.6, { color: '#ff8a40' }); fx.spark(x, 0.5, z, '#ffa040', 60, { speed: 12, up: 5, life: 0.7 }); fx.puff(x, 0.4, z, '#4a3a2a', 18, { speed: 6, size: 1.2, size1: 3.5 }); fx.shake(0.6, 0.5); sound.play('boom'); } }); },
  summon: (e) => { sound.play('rise'); for (let k = 0; k < 4 + Math.floor(G.depth / 3); k++) { const a = Math.random() * 6.28, d = 3 + Math.random() * 3, x = e.x + Math.cos(a) * d, z = e.z + Math.sin(a) * d; if (!solid(G.F, x, z)) { horde.spawn(Math.random() < 0.3 ? 'archer' : 'skel', x, z, { depth: G.depth }); fx.puff(x, 0.2, z, '#3a3028', 6, { speed: 2, size: 0.8, size1: 2 }); } } },
};

// ------------------------------------------------------------------ loot on the ground
const coinGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.04, 10), coinMat = new THREE.MeshStandardMaterial({ color: '#ffd040', emissive: '#a06a00', emissiveIntensity: 0.8, metalness: 0.9, roughness: 0.3 });
function dropGold(x, z, n) { if (n <= 0) return; const g = new THREE.Group(); for (let k = 0; k < Math.min(6, 1 + Math.floor(n / 6)); k++) { const c = new THREE.Mesh(coinGeo, coinMat); c.position.set((Math.random() - 0.5) * 0.4, 0.03 + k * 0.03, (Math.random() - 0.5) * 0.4); c.rotation.set((Math.random() - 0.5) * 0.4, 0, (Math.random() - 0.5) * 0.4); g.add(c); } placeDrop({ kind: 'gold', n, mesh: g }, x, z); }
function dropGlobe(x, z) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), new THREE.MeshStandardMaterial({ color: '#ff3a2a', emissive: '#c80a0a', emissiveIntensity: 1.6 })); m.position.y = 0.4; const g = new THREE.Group(); g.add(m); placeDrop({ kind: 'globe', mesh: g, bob: m }, x, z); }
const SLOT_SHAPE = { weapon: () => new THREE.BoxGeometry(0.08, 0.9, 0.04), helm: () => new THREE.SphereGeometry(0.22, 10, 8, 0, 6.3, 0, 1.7), armor: () => new THREE.BoxGeometry(0.5, 0.55, 0.2), gloves: () => new THREE.BoxGeometry(0.22, 0.25, 0.12), boots: () => new THREE.BoxGeometry(0.2, 0.3, 0.3), ring: () => new THREE.TorusGeometry(0.14, 0.04, 6, 14), amulet: () => new THREE.OctahedronGeometry(0.17) };
function dropItem(x, z, it) {
  const R = RARITY[it.rar], g = new THREE.Group(), m = new THREE.Mesh(SLOT_SHAPE[it.slot](), new THREE.MeshStandardMaterial({ color: '#b8b4ac', metalness: 0.8, roughness: 0.35, emissive: R.color, emissiveIntensity: 0.25 })); m.position.y = 0.4; m.rotation.z = it.slot === 'weapon' ? 1.2 : 0; g.add(m);
  if (it.rar >= 1) { const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.22, it.rar >= 2 ? 9 : 3, 8, 1, true), new THREE.MeshBasicMaterial({ color: R.color, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); beam.position.y = it.rar >= 2 ? 4.5 : 1.5; g.add(beam); }
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: R.color, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.8 })); glow.position.y = 0.3; glow.scale.setScalar(1.4); g.add(glow);
  const lbl = document.createElement('div'); lbl.className = 'lbl'; lbl.style.color = R.color; lbl.textContent = itemName(it, lang); $('floaters').appendChild(lbl);
  placeDrop({ kind: 'item', it, mesh: g, bob: m, lbl }, x, z);
  if (it.rar === 3) { sound.play('legend'); toast(L('傳說裝備掉落了！', 'A legendary item dropped!'), R.color); } else if (it.rar === 2) sound.play('item', 0.7);
}
function placeDrop(d, x, z) { // pop out a little way, onto open floor
  const a = Math.random() * 6.28, r = 0.4 + Math.random() * 1.2; let nx = x + Math.cos(a) * r, nz = z + Math.sin(a) * r; if (solid(G.F, nx, nz)) { nx = x; nz = z; }
  d.x = nx; d.z = nz; d.t = 0; d.mesh.position.set(x, 0, z); d.from = [x, z]; scene.add(d.mesh); G.drops.push(d);
}
function removeDrop(d) { scene.remove(d.mesh); if (d.lbl) d.lbl.remove(); }
function stepDrops(dt) {
  const h = G.h, st = G.st;
  for (const d of G.drops) {
    d.t += dt; const k = Math.min(1, d.t / 0.4); if (k < 1) d.mesh.position.set(d.from[0] + (d.x - d.from[0]) * k, Math.sin(k * Math.PI) * 1.2, d.from[1] + (d.z - d.from[1]) * k); else d.mesh.position.set(d.x, 0, d.z);
    if (d.bob) { d.bob.position.y = 0.4 + Math.sin(d.t * 3) * 0.08; d.bob.rotation.y = d.t * 1.5; }
    if (h.dead || k < 1) continue;
    const dist = Math.hypot(d.x - h.x, d.z - h.z);
    if (d.kind === 'gold' && dist < st.pickup) { d.x += (h.x - d.x) * Math.min(1, dt * 10); d.z += (h.z - d.z) * Math.min(1, dt * 10); if (dist < 0.6) { S.gold += d.n; d.gone = true; floater(`${d.n} ${L('金幣', 'gold')}`, h.x, 2.6, h.z, 'gold'); sound.play('coin', 0.6); } }
    if (d.kind === 'globe' && dist < 1.2) { const n = Math.round(st.maxHp * 0.2); h.hp = Math.min(st.maxHp, h.hp + n); d.gone = true; floater('+' + n, h.x, 2.6, h.z, 'heal'); sound.play('globe'); fx.spark(h.x, 1, h.z, '#ff6a5a', 16, { speed: 2, up: 3, grav: -2, life: 0.7 }); }
    if (d.kind === 'item' && dist < 1.3) { if (S.bag.length >= 30) { if (!d.warned) { toast(L('背包滿了（按 I 整理）', 'Your bag is full (press I)')); d.warned = true; } continue; } d.gone = true; pickUp(d.it); }
  }
  G.drops = G.drops.filter((d) => { if (d.gone) removeDrop(d); return !d.gone; });
}
function pickUp(it) {
  if (!S.equip[it.slot]) { S.equip[it.slot] = it; restat(); toast(L(`裝備了 ${itemName(it, lang)}`, `Equipped ${itemName(it, lang)}`), RARITY[it.rar].color); }
  else { S.bag.push(it); const better = score(it) > score(S.equip[it.slot]); toast(`${itemName(it, lang)}${better ? '  ▲' : ''}`, RARITY[it.rar].color); }
  sound.play(it.rar >= 2 ? 'item' : 'coin', 0.7); save();
}

// ------------------------------------------------------------------ levels and skills
const need = (lv) => Math.round(40 * Math.pow(lv, 1.45));
function gainXp(n) { S.xp += n; while (S.xp >= need(S.level)) { S.xp -= need(S.level); S.level++; S.points++; restat(); G.h.hp = G.st.maxHp; G.h.mana = G.st.maxMana; sound.play('level'); banner(L(`等級 ${S.level}`, `Level ${S.level}`), L('獲得一個技能點', 'A skill point to spend'), 2.2); fx.spark(G.h.x, 0.5, G.h.z, '#ffe890', 70, { speed: 3, up: 9, grav: 2, life: 1.2, size: 0.4 }); fx.decal('ring', G.h.x, G.h.z, 4, 0.8, { color: '#ffe080' }); } }
function makeOffers() {
  const owned = Object.keys(S.skills), free = S.slots.filter((s) => !s).length, pool = [];
  for (const id of Object.keys(SKILLS)) { if (!S.skills[id] && free) pool.push({ type: 'new', id, w: 3 }); else if (S.skills[id] && S.skills[id] < MAX_RANK) pool.push({ type: 'rank', id, w: 2 }); }
  for (const id of Object.keys(PASSIVES)) pool.push({ type: 'passive', id, w: owned.length ? 1.2 : 0 });
  const out = []; while (out.length < 3 && pool.length) { const sum = pool.reduce((s, o) => s + o.w, 0); let r = Math.random() * sum, i = 0; while (i < pool.length - 1 && (r -= pool[i].w) > 0) i++; out.push(pool.splice(i, 1)[0]); }
  return out.map(({ type, id }) => ({ type, id }));
}
function levelPanel() {
  if (!S.points) return; if (!S.offers) { S.offers = makeOffers(); save(); }
  const card = (o, i) => {
    if (o.type === 'passive') { const P = PASSIVES[o.id]; return `<button class="choice" data-c="${i}"><span class="pic">${P.icon}</span><b>${T(P.name)}</b><small>${T(P.desc)}</small><em>${L('被動', 'Passive')} ${(S.passives[o.id] || 0) ? '· ' + L('目前', 'now') + ' ' + S.passives[o.id] : ''}</em></button>`; }
    const K = SKILLS[o.id], r = (S.skills[o.id] || 0) + 1; return `<button class="choice" data-c="${i}"><img src="${skillIcon(o.id)}"><b>${T(K.name)}${o.type === 'rank' ? ` ${'I'.repeat(r)}` : ''}</b><small>${T(K.desc(r))}</small><small>${L('法力', 'Mana')} ${K.mana} · ${L('冷卻', 'Cooldown')} ${K.cd}s</small><em>${o.type === 'new' ? L('新技能', 'New skill') : L(`升到 ${r} 級`, `Rank ${r}`)}</em></button>`;
  };
  panel(`<h2>${L('選擇一項', 'Choose one')}</h2><p class="help" style="text-align:center">${L(`還有 ${S.points} 點`, `${S.points} point${S.points > 1 ? 's' : ''} to spend`)}</p><div class="choices">${S.offers.map(card).join('')}</div>`, { onShow: () => document.querySelectorAll('[data-c]').forEach((b) => b.onclick = () => choose(S.offers[+b.dataset.c])) });
}
function choose(o) {
  if (o.type === 'passive') S.passives[o.id] = (S.passives[o.id] || 0) + 1;
  else { if (!S.skills[o.id]) { const i = S.slots.indexOf(null); S.slots[i] = o.id; } S.skills[o.id] = (S.skills[o.id] || 0) + 1; }
  S.points--; S.offers = null; G.skills = S.skills; restat(); save(); updateSlots(); sound.play('shrine');
  if (S.points) levelPanel(); else closePanel();
}

// ------------------------------------------------------------------ the obelisk event, the boss, the portal
function startEvent() {
  const boss = G.F.boss; G.ev = { t: 0, prog: 0, need: boss ? 1 : 45 + G.depth * 5, spawnT: 1, elites: 0, boss }; sound.play('obelisk'); fx.shake(0.3, 0.6);
  G.W.obelisk.runeMat.emissiveIntensity = 1.8; G.W.obelisk.circleMat.opacity = 0.6;
  if (boss) {
    const e = horde.spawn('king', G.W.obelisk.x, G.W.obelisk.z + 4, { depth: G.depth }); G.boss = e; e.yaw = Math.PI; sound.play('roar'); banner(L('骸骨之王', 'The Bone King'), L('他從王座下爬了出來', 'He climbs up from beneath his throne'), 3);
    $('bossbar').hidden = false; $('bossName').textContent = L('骸骨之王', 'THE BONE KING');
  } else banner(L('方尖碑甦醒了', 'The obelisk wakes'), L('守在它旁邊，直到充能完成', 'Stay close until it is fully charged'), 3);
  $('event').hidden = false; hint('', 0);
}
function stepEvent(dt) {
  const ev = G.ev, ob = G.W.obelisk, h = G.h;
  if (!ev) { if (!G.done && Math.hypot(h.x - ob.x, h.z - ob.z) < 6) startEvent(); return; }
  if (ev.done) return;
  ev.t += dt; const near = Math.hypot(h.x - ob.x, h.z - ob.z) < 14;
  if (ev.boss) { ev.prog = 1 - (G.boss ? Math.max(0, G.boss.hp) / G.boss.max : 0); }
  else if (near && !h.dead) ev.prog = Math.min(ev.need, ev.prog + dt);
  // waves rise out of the ground around the arena
  ev.spawnT -= dt;
  const alive = horde.list.length, cap = ev.boss ? 30 : 36 + G.depth * 7;
  if (ev.spawnT <= 0 && alive < cap) {
    const k = ev.boss ? 0.5 : ev.prog / ev.need; ev.spawnT = ev.boss ? 3.5 : Math.max(0.8, 2.6 - k * 1.4 - G.depth * 0.08);
    const n = ev.boss ? 2 : 1 + Math.floor(k * 3 + G.depth * 0.35), kinds = G.depth < 2 ? ['skel', 'skel', 'runner'] : ['skel', 'skel', 'runner', 'archer', ...(G.depth >= 3 ? ['mage'] : [])];
    for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, d = 9 + Math.random() * 7, x = ob.x + Math.cos(a) * d, z = ob.z + Math.sin(a) * d; if (!solid(G.F, x, z) && Math.hypot(x - h.x, z - h.z) > 6) { horde.spawn(kinds[Math.floor(Math.random() * kinds.length)], x, z, { depth: G.depth }); fx.puff(x, 0.2, z, '#3a3228', 4, { speed: 1.5, size: 0.7, size1: 1.8 }); } }
    if (!ev.boss && ev.elites < 2 && k > (ev.elites + 1) / 3) { ev.elites++; const a = Math.random() * 6.28, x = ob.x + Math.cos(a) * 10, z = ob.z + Math.sin(a) * 10; if (!solid(G.F, x, z)) { horde.spawn(G.depth >= 2 ? 'brute' : 'skel', x, z, { depth: G.depth, elite: true }); toast(L('精英出現了！', 'An elite has risen!'), '#ffd84a'); } }
    sound.play('rise', 0.4);
  }
  G.W.obelisk.light.intensity = 14 + ev.prog / ev.need * 26 + Math.sin(G.t * 8) * 3; G.W.obelisk.core.scale.setScalar(1 + ev.prog / ev.need * 0.6);
  if (!ev.boss && Math.random() < 0.5) fx.spark(ob.x + (Math.random() - 0.5), 8.6, ob.z + (Math.random() - 0.5), '#ff8a3a', 1, { speed: 1, up: 1, grav: -3, life: 0.8, size: 0.5 });
  if (!ev.boss && ev.prog >= ev.need) finishEvent();
}
function finishEvent() {
  const ev = G.ev, ob = G.W.obelisk; ev.done = true; G.done = true;
  if (!ev.boss) { for (const e of horde.alive) if (!e.elite && Math.hypot(e.x - ob.x, e.z - ob.z) < 20) die(e); fx.decal('ring', ob.x, ob.z, 20, 1, { color: '#9ad0ff' }); fx.shake(0.5, 0.6); }
  ob.runeMat.color.set('#6ab0ff'); ob.runeMat.emissive.set('#3a8aff'); ob.light.color.set('#6ab8ff'); ob.circleMat.color.set('#4a9aff'); ob.core.material.emissive.set('#3a8aff');
  for (let k = 0; k < 2 + Math.floor(G.depth / 4); k++) dropItem(ob.x + 2, ob.z + 1, makeItem(G.depth, { boost: 1 + (ev.boss ? 1 : 0) }));
  dropGold(ob.x - 2, ob.z, Math.round((60 + G.depth * 40) * G.st.gold));
  G.W.portal.group.visible = true; sound.play('portal'); $('event').hidden = true;
  banner(L('方尖碑充能完成', 'The obelisk is charged'), L('傳送門開啟了：走進去前往營地', 'A portal has opened: step in to reach the camp'), 3.5);
}
function bossDown(e) {
  G.boss = null; $('bossbar').hidden = true; fx.shake(0.8, 0.8); sound.play('boom');
  for (let k = 0; k < 3; k++) dropItem(e.x, e.z, makeItem(G.depth, { boost: 2, rarity: k === 0 ? 3 : undefined }));
  dropGold(e.x, e.z, Math.round(300 * G.depth * G.st.gold)); banner(L('骸骨之王倒下了', 'The Bone King has fallen'), '', 3); finishEvent();
}

// ------------------------------------------------------------------ the camp between floors
function camp() {
  G.done = 'camp'; sound.play('portal'); restat(); G.h.hp = G.st.maxHp; G.h.mana = G.st.maxMana; save(); draw();
  function draw() {
    const next = G.depth + 1, potCost = 30 + G.depth * 10, gamble = 120 + G.depth * 50, junk = S.bag.filter((it) => it.rar <= 1), junkVal = junk.reduce((s, it) => s + price(it), 0), rc = (k) => 3 + S.runes[k] * 2;
    panel(`<h2>🔥 ${L('營火', 'The Camp')}</h2><p class="help" style="text-align:center">${L('火光讓骸骨不敢靠近。休息一下，準備往下走。', 'The firelight keeps the dead away. Rest, then go deeper.')}</p>
      <h3>${L('商人', 'Merchant')} · 💰 ${S.gold}</h3><div class="shop">
        <span>${L(`生命藥水（${S.potions}/5）`, `Health potion (${S.potions}/5)`)}</span><button class="pb sm" id="cPot" ${S.potions >= 5 || S.gold < potCost ? 'disabled' : ''}>${potCost} ${L('金幣', 'gold')}</button>
        <span>${L('神秘裝備（賭一把！）', 'A mystery item (take a gamble!)')}</span><button class="pb sm" id="cGamble" ${S.gold < gamble || S.bag.length >= 30 ? 'disabled' : ''}>${gamble} ${L('金幣', 'gold')}</button>
        <span>${L(`賣掉普通和魔法裝備（${junk.length} 件）`, `Sell common and magic items (${junk.length})`)}</span><button class="pb sm" id="cSell" ${junk.length ? '' : 'disabled'}>+${junkVal}</button></div>
      <h3>${L('骸骨祭壇', 'Bone Altar')} · 🟣 ${S.souls} ${L('靈魂', 'souls')}</h3><div class="shop">
        <span>${L(`力量符文 ${S.runes.power} 級：傷害 +5%`, `Rune of Power ${S.runes.power}: +5% damage`)}</span><button class="pb sm" data-rune="power" ${S.souls < rc('power') ? 'disabled' : ''}>${rc('power')} 🟣</button>
        <span>${L(`生命符文 ${S.runes.life} 級：生命 +5%`, `Rune of Life ${S.runes.life}: +5% life`)}</span><button class="pb sm" data-rune="life" ${S.souls < rc('life') ? 'disabled' : ''}>${rc('life')} 🟣</button>
        <span>${L(`迅捷符文 ${S.runes.swift} 級：移動 +3%`, `Rune of Swiftness ${S.runes.swift}: +3% speed`)}</span><button class="pb sm" data-rune="swift" ${S.souls < rc('swift') ? 'disabled' : ''}>${rc('swift')} 🟣</button></div>
      <div class="row"><button class="pb" id="cBag">🎒 ${L('背包', 'Inventory')}</button><button class="pb" id="cGo">⬇ ${floorLabel(next)}：${floorName(next)}</button></div>`, { noClose: true, onShow: () => {
      $('cPot').onclick = () => { S.gold -= potCost; S.potions++; sound.play('coin'); save(); draw(); };
      $('cGamble').onclick = () => { S.gold -= gamble; const it = makeItem(G.depth + 1, { boost: 1.5 }); S.bag.push(it); sound.play(it.rar >= 3 ? 'legend' : 'item'); toast(itemName(it, lang), RARITY[it.rar].color); save(); draw(); };
      $('cSell').onclick = () => { S.bag = S.bag.filter((it) => it.rar > 1); S.gold += junkVal; sound.play('coin'); save(); draw(); };
      document.querySelectorAll('[data-rune]').forEach((b) => b.onclick = () => { const k = b.dataset.rune; S.souls -= rc(k); S.runes[k]++; restat(); sound.play('shrine'); save(); draw(); });
      $('cBag').onclick = () => bagPanel(draw);
      $('cGo').onclick = () => { closePanel(); G.done = false; loadFloor(next); };
    } });
  }
}

// ------------------------------------------------------------------ the inventory
function bagPanel(back) {
  let sel = null;
  const draw = () => {
    const st = G.st, it = sel && (sel.eq ? S.equip[sel.slot] : S.bag[sel.i]), cur = it && !sel.eq ? S.equip[it.slot] : null;
    const tip = it ? `<div class="tip"><b style="color:${RARITY[it.rar].color}">${itemName(it, lang)}</b> <small>${T(RARITY[it.rar].name)} ${T(SLOT_NAME[it.slot])} · ${L('等級', 'level')} ${it.lvl}</small><ul>${itemLines(it, lang).map((l) => `<li>${l}</li>`).join('')}</ul>${it.legend ? `<div class="leg">✦ ${T(LEGENDS[it.legend].desc)}</div>` : ''}
      ${cur ? `<div class="${score(it) >= score(cur) ? 'up' : 'down'}">${score(it) >= score(cur) ? '▲' : '▼'} ${L('比較目前', 'vs. worn')}: ${itemName(cur, lang)}</div>` : ''}
      <div class="row">${sel.eq ? '' : `<button class="pb sm" id="bEquip">${L('裝備', 'Equip')}</button>`}${sel.eq ? '' : `<button class="pb sm red" id="bSell">${L('賣出', 'Sell')} +${price(it)}</button>`}</div></div>` : `<div class="tip help">${L('點一件裝備看看。▲ 表示比身上的好。', 'Tap an item to look at it. ▲ means better than what you wear.')}</div>`;
    panel(`<h2>🎒 ${L('背包', 'Inventory')}</h2><div class="inv"><div><div class="paper">${SLOTS.map((s) => { const e = S.equip[s]; return `<button class="eq ${sel && sel.eq && sel.slot === s ? 'sel' : ''}" data-eq="${s}"><small>${T(SLOT_NAME[s])}</small>${e ? `<span style="color:${RARITY[e.rar].color}">${itemName(e, lang)}</span>` : '—'}</button>`; }).join('')}</div>
      <div class="stats"><span>${L('傷害', 'Damage')}</span><b>${Math.round(st.dmg)}</b><span>${L('生命', 'Life')}</span><b>${st.maxHp}</b><span>${L('護甲', 'Armour')}</span><b>${st.armor}</b><span>${L('暴擊', 'Critical')}</span><b>${Math.round(st.crit * 100)}%</b><span>${L('攻速', 'Attack speed')}</span><b>${Math.round(st.atk * 100)}%</b><span>${L('移動', 'Move')}</span><b>${Math.round(st.move / 6.4 * 100)}%</b><span>${L('吸血', 'Leech')}</span><b>${Math.round(st.leech * 100)}%</b><span>${L('金幣', 'Gold find')}</span><b>${Math.round(st.gold * 100)}%</b></div></div>
      <div><div class="bag">${S.bag.map((b, i) => `<button class="bi ${sel && !sel.eq && sel.i === i ? 'sel' : ''}" data-bi="${i}" style="color:${RARITY[b.rar].color}">${itemName(b, lang)}${score(b) > score(S.equip[b.slot]) ? ' <span style="color:#7aff7a">▲</span>' : ''}<br><small style="color:#8a7a60">${T(SLOT_NAME[b.slot])}</small></button>`).join('') || `<p class="help">${L('空的', 'Empty')}</p>`}</div>${tip}</div></div>${back ? `<div class="row"><button class="pb" id="bBack">${L('返回', 'Back')}</button></div>` : ''}`, { noClose: !!back, onShow: () => {
      document.querySelectorAll('[data-eq]').forEach((b) => b.onclick = () => { sel = S.equip[b.dataset.eq] ? { eq: true, slot: b.dataset.eq } : null; draw(); });
      document.querySelectorAll('[data-bi]').forEach((b) => b.onclick = () => { sel = { i: +b.dataset.bi }; draw(); });
      if ($('bEquip')) $('bEquip').onclick = () => { const it = S.bag[sel.i], old = S.equip[it.slot]; S.equip[it.slot] = it; S.bag.splice(sel.i, 1); if (old) S.bag.push(old); sel = null; restat(); save(); sound.play('item'); draw(); };
      if ($('bSell')) $('bSell').onclick = () => { S.gold += price(S.bag[sel.i]); S.bag.splice(sel.i, 1); sel = null; sound.play('coin'); save(); draw(); };
      if ($('bBack')) $('bBack').onclick = back;
    } });
  };
  draw();
}

// ------------------------------------------------------------------ input
const keys = {}, mouse = { x: 0, y: 0, down: false, right: false, ground: new THREE.Vector3() }, ray = new THREE.Raycaster(), groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
let touchMode = false, joy = { on: false, x: 0, y: 0, id: null };
addEventListener('keydown', (e) => {
  if (e.repeat) return; const k = e.code; keys[k] = true; sound.init();
  if (!$('panel').hidden) { if (k === 'Escape' || k === 'KeyI') { if (!$('panel').dataset.noclose) closePanel(); } return; }
  if (G.paused) return;
  if (k === 'Digit1' || k === 'Digit2' || k === 'Digit3' || k === 'Digit4') useSkill(+k.slice(5) - 1);
  if (k === 'Space') { e.preventDefault(); dash(); }
  if (k === 'KeyQ') potion();
  if (k === 'KeyI' || k === 'KeyB') bagPanel();
  if (k === 'KeyK' || k === 'KeyT') levelPanel();
  if (k === 'Tab') { e.preventDefault(); $('bigmap').hidden = !$('bigmap').hidden; }
  if (k === 'Escape') menuPanel();
});
addEventListener('keyup', (e) => { keys[e.code] = false; });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') { mouse.x = e.clientX; mouse.y = e.clientY; } });
canvas.addEventListener('pointerdown', (e) => { sound.init(); if (e.pointerType !== 'mouse') { setTouch(true); return; } setTouch(false); mouse.x = e.clientX; mouse.y = e.clientY; if (e.button === 0) mouse.down = true; if (e.button === 2) { mouse.right = true; useSkill(0, true); } });
addEventListener('pointerup', (e) => { if (e.button === 0) mouse.down = false; if (e.button === 2) mouse.right = false; });
function setTouch(on) { if (touchMode === on) return; touchMode = on; $('touch').hidden = !on; document.body.classList.toggle('touch', on); }
// the stick and the buttons
{ const J = $('joy'), K = $('joyKnob');
  J.addEventListener('pointerdown', (e) => { joy.on = true; joy.id = e.pointerId; J.setPointerCapture(e.pointerId); move(e); });
  const move = (e) => { if (!joy.on || e.pointerId !== joy.id) return; const r = J.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), l = Math.hypot(dx, dy), m = r.width / 2; joy.x = dx / Math.max(l, m) * Math.min(1, l / m) * (l > m ? m / l * l / m : 1); joy.y = dy / Math.max(l, m); const kx = Math.max(-1, Math.min(1, dx / m)), ky = Math.max(-1, Math.min(1, dy / m)); joy.x = kx; joy.y = ky; K.style.transform = `translate(${kx * m * 0.6}px, ${ky * m * 0.6}px)`; };
  J.addEventListener('pointermove', move); const up = (e) => { if (e.pointerId !== joy.id) return; joy.on = false; joy.x = joy.y = 0; K.style.transform = ''; }; J.addEventListener('pointerup', up); J.addEventListener('pointercancel', up);
  document.querySelectorAll('.tb').forEach((b) => { b.addEventListener('pointerdown', (e) => { e.preventDefault(); sound.init(); const t = b.dataset.t; if (t === 'attack') joy.attack = true; else if (t === 'dash') dash(); else if (t === 'potion') potion(); else useSkill(+t.slice(1)); }); b.addEventListener('pointerup', () => { if (b.dataset.t === 'attack') joy.attack = false; }); b.addEventListener('pointerleave', () => { if (b.dataset.t === 'attack') joy.attack = false; }); });
  document.querySelectorAll('#menuBtns button').forEach((b) => b.onclick = () => { sound.init(); const m = b.dataset.m; if (m === 'bag') bagPanel(); else if (m === 'map') $('bigmap').hidden = !$('bigmap').hidden; else menuPanel(); });
  $('pointsBtn').onclick = () => levelPanel(); }
function aimPoint() {
  if (touchMode) { const e = horde.nearest(G.h.x, G.h.z, 12); return e ? [e.x, e.z] : [G.h.x + Math.sin(G.h.yaw) * 6, G.h.z + Math.cos(G.h.yaw) * 6]; }
  return [mouse.ground.x, mouse.ground.z];
}
function useSkill(i) {
  const id = S.slots[i], h = G.h; if (!id || h.dead || G.paused || G.done === 'camp') return; const K = SKILLS[id];
  let cd = K.cd; if (id === 'frost' && G.st.legend.frostheart) cd *= 0.5;
  if ((h.cds[id] || 0) > 0) return; if (h.mana < K.mana) { toast(L('法力不足', 'Not enough mana'), '#6a9aff'); return; }
  h.mana -= K.mana; h.cds[id] = cd; h.cdMax = h.cdMax || {}; h.cdMax[id] = cd; cast(G, id, aimPoint());
}
function dash() { const h = G.h; if (h.dead || h.dashCd > 0 || G.paused) return; h.dash = 0; h.dashCd = 2.5; let dx = 0, dz = 0; const mv = moveInput(); if (mv) [dx, dz] = mv; else { dx = Math.sin(h.yaw); dz = Math.cos(h.yaw); } h.dashDir = [dx, dz]; h.yaw = Math.atan2(dx, dz); sound.play('dash'); fx.puff(h.x, 0.3, h.z, '#5a5248', 6, { speed: 2, size: 0.6, size1: 1.6 }); }
function potion() { const h = G.h; if (h.dead || h.potCd > 0 || G.paused) return; if (!S.potions) { toast(L('沒有藥水了', 'No potions left')); return; } if (h.hp >= G.st.maxHp) return; S.potions--; h.potCd = 1.5; h.potHeal = G.st.maxHp * 0.7; sound.play('potion'); fx.spark(h.x, 1, h.z, '#ff4a3a', 20, { speed: 1.5, up: 4, grav: -2, life: 0.8 }); save(); updateSlots(); }
function moveInput() { let x = 0, z = 0; if (keys.KeyW || keys.ArrowUp) z -= 1; if (keys.KeyS || keys.ArrowDown) z += 1; if (keys.KeyA || keys.ArrowLeft) x -= 1; if (keys.KeyD || keys.ArrowRight) x += 1; if (joy.on && Math.hypot(joy.x, joy.y) > 0.15) { x = joy.x; z = joy.y; } const l = Math.hypot(x, z); return l > 0.1 ? [x / Math.max(1, l), z / Math.max(1, l)] : null; }

// ------------------------------------------------------------------ the hero each frame
const vA = new THREE.Vector3(), vB = new THREE.Vector3();
function stepHero(dt) {
  const h = G.h, st = G.st; let speed = 0;
  h.swingCd -= dt; h.dashCd -= dt; h.potCd -= dt; h.hitT -= dt; for (const k in h.cds) h.cds[k] -= dt;
  if (h.dead) { h.deadT += dt; return; }
  h.mana = Math.min(st.maxMana, h.mana + st.manaRegen * dt); h.hp = Math.min(st.maxHp, h.hp + st.regen * dt);
  if (h.potHeal > 0) { const n = Math.min(h.potHeal, st.maxHp * 0.7 * dt / 0.8); h.hp = Math.min(st.maxHp, h.hp + n); h.potHeal -= n; }
  // the dodge roll
  if (h.dash >= 0) { h.dash += dt / 0.38; [h.x, h.z] = slide(G.F, h.x, h.z, h.dashDir[0] * 17 * dt, h.dashDir[1] * 17 * dt, 0.4); if (h.dash >= 1) h.dash = -1; return; }
  // where to go: keys / stick, or click to move (or to attack the one under the cursor)
  const mv = moveInput(); let dir = mv;
  if (!touchMode && mouse.down && !mv) {
    const under = horde.nearest(mouse.ground.x, mouse.ground.z, 1.4);
    if (under || keys.ShiftLeft || keys.ShiftRight) { h.target = under || { x: mouse.ground.x, z: mouse.ground.z, ground: true }; h.moveTo = null; }
    else { h.moveTo = [mouse.ground.x, mouse.ground.z]; h.target = null; }
  }
  if (touchMode && joy.attack) { h.target = horde.nearest(h.x, h.z, 9) || { x: h.x + Math.sin(h.yaw), z: h.z + Math.cos(h.yaw), ground: true }; }
  if (mv) { h.moveTo = null; if (!(touchMode && joy.attack)) h.target = null; }
  if (h.target && (h.target.dead || (!h.target.ground && !mouse.down && !joy.attack && h.swing < 0))) h.target = null;
  if (!dir && h.target) { const dx = h.target.x - h.x, dz = h.target.z - h.z, d = Math.hypot(dx, dz); if (d > 2.4 && !h.target.ground) dir = [dx / d, dz / d]; else if (h.swingCd <= 0 && h.whirl <= 0) { h.yaw = Math.atan2(dx, dz); swing(); } }
  if (!dir && h.moveTo) { const dx = h.moveTo[0] - h.x, dz = h.moveTo[1] - h.z, d = Math.hypot(dx, dz); if (d < 0.3) h.moveTo = null; else dir = [dx / d, dz / d]; }
  if (dir && h.swing < 0 || dir && h.whirl > 0) {
    const sp = st.move * (h.whirl > 0 ? 1.15 : 1) * (G.buffs.haste > 0 ? 1.3 : 1); const [nx, nz] = slide(G.F, h.x, h.z, dir[0] * sp * dt, dir[1] * sp * dt, 0.4);
    speed = Math.hypot(nx - h.x, nz - h.z) / dt / 6.4; if (speed < 0.05 && h.moveTo) h.moveTo = null; h.x = nx; h.z = nz; if (h.whirl <= 0) h.yaw = turnTo(h.yaw, Math.atan2(dir[0], dir[1]), dt * 14);
  }
  if (h.swing >= 0) { h.swing += dt * 2.6 * st.atk; if (h.swing >= 0.45 && !h.cut) { h.cut = true; slash(G, h.yaw); } if (h.swing >= 1) h.swing = -1; }
  if (h.castT >= 0) { h.castT += dt * 3; if (h.castT >= 1) h.castT = -1; }
  if (h.whirl > 0) h.whirl -= dt;
  h.speed = Math.min(1, speed);
}
function swing() { const h = G.h; h.swing = 0; h.cut = false; h.swingCd = 0.62 / G.st.atk; sound.play('swing', 0.7); }
const turnTo = (a, b, k) => { const d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return a + d * Math.min(1, k); };

// shots from the archers and mages
function stepShots(dt) {
  const h = G.h;
  for (const s of G.shots) {
    s.t += dt; if (s.kind === 'bolt' && !h.dead) { const dx = h.x - s.x, dz = h.z - s.z, l = Math.hypot(dx, dz) || 1, sp = Math.hypot(s.vx, s.vz); s.vx += (dx / l * sp - s.vx) * dt * 0.8; s.vz += (dz / l * sp - s.vz) * dt * 0.8; fx.spark(s.x, 1.3, s.z, '#4ab0ff', 1, { speed: 0.4, up: 0.2, life: 0.35, size: 0.5, grav: 0 }); G.light(s.x, 1.5, s.z, '#3a8aff', 8); }
    s.x += s.vx * dt; s.z += s.vz * dt; s.mesh.position.x = s.x; s.mesh.position.z = s.z;
    if (solid(G.F, s.x, s.z) || s.t > 4) { s.gone = true; fx.spark(s.x, 1.2, s.z, s.kind === 'bolt' ? '#4ab0ff' : '#c8b890', 5, { speed: 2, life: 0.25 }); continue; }
    if (!h.dead && Math.hypot(h.x - s.x, h.z - s.z) < 0.6) { s.gone = true; hurtHero(s.dmg, null); fx.spark(s.x, 1.3, s.z, s.kind === 'bolt' ? '#6ac0ff' : '#ff6a4a', 8, { speed: 3, life: 0.3 }); }
  }
  G.shots = G.shots.filter((s) => { if (s.gone) scene.remove(s.mesh); return !s.gone; });
}
// chests, shrines and the portal
G.buffs = {};
function stepThings(dt) {
  const h = G.h; if (h.dead) return;
  for (const c of G.W.chests) { if (c.open) { c.lid.rotation.x = Math.max(-1.9, c.lid.rotation.x - dt * 5); continue; } if (Math.hypot(c.x - h.x, c.z - h.z) < 1.8) { c.open = true; sound.play('chest'); dropGold(c.x, c.z, Math.round((20 + G.depth * 18) * G.st.gold * (0.7 + Math.random() * 0.6))); dropItem(c.x, c.z, makeItem(G.depth, { boost: 0.6 })); if (Math.random() < 0.5) dropItem(c.x, c.z, makeItem(G.depth)); if (Math.random() < 0.4) dropGlobe(c.x, c.z); fx.spark(c.x, 0.8, c.z, '#ffd860', 30, { speed: 3, up: 6, life: 0.9 }); } }
  for (const s of G.W.shrines) { if (s.used || Math.hypot(s.x - h.x, s.z - h.z) > 1.8) continue; s.used = true; sound.play('shrine'); fx.spark(s.x, 2, s.z, s.color, 40, { speed: 4, up: 5, life: 1 }); s.orb.material.emissiveIntensity = 0.2;
    const name = { fury: L('狂怒神殿：傷害 +50%（30 秒）', 'Shrine of Fury: +50% damage (30s)'), mana: L('法力神殿：法力無限（20 秒）', 'Shrine of Mana: endless mana (20s)'), haste: L('疾風神殿：移動和攻擊加快（30 秒）', 'Shrine of Haste: faster in all things (30s)'), fortune: L('財富神殿：金幣雨！', 'Shrine of Fortune: it rains gold!') }[s.kind];
    banner(name.split(/[：:]/)[0], name.split(/[：:]/)[1] || '', 2.5);
    if (s.kind === 'fortune') for (let k = 0; k < 8; k++) dropGold(s.x, s.z, Math.round((8 + G.depth * 6) * G.st.gold)); else G.buffs[s.kind] = s.kind === 'mana' ? 20 : 30; }
  for (const k in G.buffs) { G.buffs[k] -= dt; if (G.buffs[k] <= 0) { delete G.buffs[k]; restat(); } }
  if (G.buffs.mana) h.mana = G.st.maxMana;
  if (G.W.portal.group.visible && Math.hypot(G.W.portal.x - h.x, G.W.portal.z - h.z) < 1.6 && G.done !== 'camp') camp();
}

// ------------------------------------------------------------------ HUD
const floaters = []; const flLayer = $('floaters');
function floater(text, x, y, z, cls) { let f = floaters.find((o) => o.t >= o.life); if (!f) { if (floaters.length > 90) return; const el = document.createElement('div'); flLayer.appendChild(el); f = { el }; floaters.push(f); } f.el.className = 'fl ' + (cls || ''); f.el.textContent = text; Object.assign(f, { x: x + (Math.random() - 0.5) * 0.5, y, z, t: 0, life: cls === 'gold' ? 1.4 : 0.9, vy: cls === 'gold' ? 1 : 2.4 }); f.el.style.display = ''; }
const proj = new THREE.Vector3();
function stepFloaters(dt) {
  const W = innerWidth, Hh = innerHeight;
  for (const f of floaters) { if (f.t >= f.life) { f.el.style.display = 'none'; continue; } f.t += dt; f.y += f.vy * dt; f.vy *= 0.94; proj.set(f.x, f.y, f.z).project(camera); const k = f.t / f.life, sc = f.t < 0.12 ? 1.5 - f.t * 4 : 1; f.el.style.transform = `translate(${(proj.x * 0.5 + 0.5) * W}px, ${(-proj.y * 0.5 + 0.5) * Hh}px) translate(-50%, -50%) scale(${sc})`; f.el.style.opacity = k > 0.7 ? (1 - k) / 0.3 : 1; }
  for (const d of G.drops) { if (!d.lbl) continue; proj.set(d.mesh.position.x, 1.05, d.mesh.position.z).project(camera); const dist = Math.hypot(d.x - G.h.x, d.z - G.h.z); d.lbl.style.display = dist < 20 && proj.z < 1 ? '' : 'none'; d.lbl.style.transform = `translate(${(proj.x * 0.5 + 0.5) * W}px, ${(-proj.y * 0.5 + 0.5) * Hh}px) translate(-50%, -100%)`; }
}
function updateSlots() {
  const box = $('slots'), keysL = ['1', '2', '3', '4'];
  box.innerHTML = `<div class="slot small" style="background-image:url(${skillIcon('potion')})" id="slotPot"><span class="key">Q</span><span class="num" id="potN">${S.potions}</span><div class="cd" id="cdPot"></div></div>
    <div class="slot small" style="background-image:url(${skillIcon('slash')})"><span class="key">${touchMode ? '' : 'LMB'}</span></div>
    <div class="slot small" style="background-image:url(${skillIcon('dash')})"><span class="key">␣</span><div class="cd" id="cdDash"></div></div><div class="sep"></div>` +
    S.slots.map((id, i) => `<div class="slot ${id ? '' : 'empty'}" id="slot${i}" ${id ? `style="background-image:url(${skillIcon(id)})" title="${T(SKILLS[id].name)}"` : ''}><span class="key">${keysL[i]}${i === 0 && !touchMode ? ' / RMB' : ''}</span>${id ? `<span class="rk">${'I'.repeat(S.skills[id])}</span><div class="cd" id="cd${i}"></div>` : ''}</div>`).join('');
  document.querySelectorAll('.tb').forEach((b) => { const t = b.dataset.t; const icon = t === 'attack' ? 'slash' : t === 'dash' ? 'dash' : t === 'potion' ? 'potion' : S.slots[+t.slice(1)]; b.style.backgroundImage = icon ? `url(${skillIcon(icon)})` : 'none'; b.style.visibility = icon ? 'visible' : 'hidden'; });
}
function hud() {
  const h = G.h, st = G.st;
  $('hpLiq').style.height = Math.max(0, h.hp / st.maxHp * 100) + '%'; $('hpTxt').textContent = `${Math.ceil(Math.max(0, h.hp))} / ${st.maxHp}`;
  $('mpLiq').style.height = h.mana / st.maxMana * 100 + '%'; $('mpTxt').textContent = `${Math.floor(h.mana)} / ${st.maxMana}`;
  $('xpFill').style.width = S.xp / need(S.level) * 100 + '%'; $('xpTxt').textContent = `${Math.floor(S.xp)} / ${need(S.level)}`; $('lvl').textContent = L(`等級 ${S.level}`, `Level ${S.level}`);
  $('cSouls').textContent = S.souls; $('cKills').textContent = G.kills; $('cGold').textContent = S.gold;
  $('pointsBtn').hidden = !S.points; $('pointsN').textContent = S.points;
  S.slots.forEach((id, i) => { if (!id) return; const el = $('cd' + i), cd = Math.max(0, h.cds[id] || 0), mx = (h.cdMax && h.cdMax[id]) || 1; if (el) el.style.transform = `scaleY(${cd / mx})`; const s = $('slot' + i); if (s) s.classList.toggle('nomana', h.mana < SKILLS[id].mana); });
  if ($('cdDash')) $('cdDash').style.transform = `scaleY(${Math.max(0, h.dashCd) / 2.5})`; if ($('cdPot')) $('cdPot').style.transform = `scaleY(${Math.max(0, h.potCd) / 1.5})`; if ($('potN')) $('potN').textContent = S.potions;
  if (G.ev && !G.ev.done) { const ev = G.ev, left = ev.boss ? 0 : ev.need - ev.prog; $('evTime').textContent = ev.boss ? '' : `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(Math.floor(left % 60)).padStart(2, '0')}`; const k = ev.prog / ev.need * 100; $('evFill').style.width = k + '%'; $('evSkull').style.left = k + '%';
    const away = !ev.boss && Math.hypot(h.x - G.W.obelisk.x, h.z - G.W.obelisk.z) >= 14; $('evText').textContent = ev.boss ? L('打倒骸骨之王', 'Destroy the Bone King') : away ? L('回到方尖碑旁邊！', 'Get back to the obelisk!') : L('存活至方尖碑充能完成', 'Survive until the obelisk is charged'); $('evText').classList.toggle('away', away); }
  if (G.boss) $('bossFill').style.width = Math.max(0, G.boss.hp / G.boss.max * 100) + '%';
}
const mm = $('minimap').getContext('2d'), bm = $('bigmap').getContext('2d');
function drawMap(g, size, zoom, all) {
  const F = G.F, h = G.h, cx = h.x / CELL, cz = h.z / CELL, s = size / zoom; g.clearRect(0, 0, size, size); g.fillStyle = 'rgba(8,7,6,0.9)'; g.fillRect(0, 0, size, size);
  const i0 = Math.max(0, Math.floor(cx - zoom / 2) - 1), i1 = Math.min(F.W - 1, Math.ceil(cx + zoom / 2) + 1), j0 = Math.max(0, Math.floor(cz - zoom / 2) - 1), j1 = Math.min(F.H - 1, Math.ceil(cz + zoom / 2) + 1);
  const X = (i) => (i - cx) * s + size / 2, Y = (j) => (j - cz) * s + size / 2;
  g.fillStyle = 'rgba(120,110,90,0.35)'; for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const k = i + j * F.W; if (F.grid[k] || !G.seen[k]) continue; g.fillRect(X(i), Y(j), s + 0.5, s + 0.5); }
  g.fillStyle = 'rgba(210,190,150,0.8)'; for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const k = i + j * F.W; if (F.grid[k] || !G.seen[k]) continue; if (F.grid[k - 1]) g.fillRect(X(i), Y(j), 1.2, s); if (F.grid[k + 1]) g.fillRect(X(i + 1) - 1, Y(j), 1.2, s); if (F.grid[k - F.W]) g.fillRect(X(i), Y(j), s, 1.2); if (F.grid[k + F.W]) g.fillRect(X(i), Y(j + 1) - 1, s, 1.2); }
  const dot = (x, z, c, r = 3, shape) => { const px = (x / CELL - cx) * s + size / 2, pz = (z / CELL - cz) * s + size / 2; if (px < -4 || pz < -4 || px > size + 4 || pz > size + 4) return; g.fillStyle = c; g.beginPath(); if (shape === 'd') { g.moveTo(px, pz - r); g.lineTo(px + r, pz); g.lineTo(px, pz + r); g.lineTo(px - r, pz); } else g.arc(px, pz, r, 0, 7); g.fill(); };
  const seen = (x, z) => all || G.seen[cellOf(x) + cellOf(z) * F.W];
  for (const c of G.W.chests) if (!c.open && seen(c.x, c.z)) dot(c.x, c.z, '#ffd040', 2.5);
  for (const sh of G.W.shrines) if (!sh.used && seen(sh.x, sh.z)) dot(sh.x, sh.z, sh.color, 3);
  for (const e of horde.list) if ((e.elite || e.boss) && !e.dead && seen(e.x, e.z)) dot(e.x, e.z, '#ff3a2a', e.boss ? 6 : 4, 'd');
  dot(G.W.obelisk.x, G.W.obelisk.z, G.ev && G.ev.done ? '#6ab0ff' : '#ff8a2a', 6, 'd');
  if (G.W.portal.group.visible) dot(G.W.portal.x, G.W.portal.z, '#8ad0ff', 5);
  // the hero: an arrow
  g.save(); g.translate(size / 2, size / 2); g.rotate(-h.yaw + Math.PI); g.fillStyle = '#5affe0'; g.beginPath(); g.moveTo(0, -7); g.lineTo(5, 5); g.lineTo(0, 2); g.lineTo(-5, 5); g.fill(); g.restore();
}
function markSeen() { const F = G.F, ci = cellOf(G.h.x), cj = cellOf(G.h.z), r = 9; for (let j = cj - r; j <= cj + r; j++) for (let i = ci - r; i <= ci + r; i++) if (i >= 0 && j >= 0 && i < F.W && j < F.H && (i - ci) ** 2 + (j - cj) ** 2 <= r * r) G.seen[i + j * F.W] = 1; }
let bannerT = 0; function banner(big, small, t = 2.6) { $('bnBig').textContent = big; $('bnSmall').textContent = small || ''; $('banner').classList.add('on'); bannerT = t; }
let hintT = 0; function hint(text, t = 4) { $('hint').textContent = text; hintT = t; }
function toast(text, color) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = text; if (color) d.style.color = color; $('toasts').appendChild(d); setTimeout(() => d.remove(), 3300); while ($('toasts').children.length > 4) $('toasts').firstChild.remove(); }
function panel(html, o = {}) { $('pBody').innerHTML = html; $('panel').hidden = false; $('panel').dataset.noclose = o.noClose ? '1' : ''; $('pX').hidden = !!o.noClose; G.paused = true; if (o.onShow) o.onShow(); }
function closePanel() { $('panel').hidden = true; G.paused = false; }
$('pX').onclick = () => closePanel();
function menuPanel() {
  panel(`<h2>${L('暫停', 'Paused')}</h2><p class="help">${helpText()}</p><div class="row"><button class="pb" id="mGo">${L('繼續', 'Resume')}</button><button class="pb" id="mLang">${L('English', '中文')}</button><button class="pb" id="mSnd">${sound.on ? L('🔊 聲音：開', '🔊 Sound: on') : L('🔇 聲音：關', '🔇 Sound: off')}</button><button class="pb red" id="mTitle">${L('回到標題', 'Title screen')}</button></div>`, { onShow: () => {
    $('mGo').onclick = closePanel; $('mLang').onclick = () => { setLang(lang === 'zh' ? 'en' : 'zh'); menuPanel(); }; $('mSnd').onclick = () => { sound.on = !sound.on; sound.ambient(sound.on); menuPanel(); };
    $('mTitle').onclick = () => { closePanel(); save(); titleScreen(); };
  } });
}
const helpText = () => L('<b>移動</b>：WASD，或按住滑鼠左鍵點地面。<b>攻擊</b>：點骷髏（Shift + 左鍵原地揮砍）。<b>技能</b>：1–4（1 也可以按右鍵），朝滑鼠方向施放。<b>翻滾</b>：空白鍵（無敵）。<b>藥水</b>：Q。<b>背包</b>：I。<b>地圖</b>：Tab。<b>升級</b>：點左下的綠色 ✦ 或按 K 選技能。<br>找到方尖碑並守在旁邊直到充能完成，傳送門會帶你到營地；每三層會遇到骸骨之王。打倒精英掉裝備和靈魂，靈魂可以在營地的骸骨祭壇換永久符文。', '<b>Move</b>: WASD, or hold the left mouse on the ground. <b>Attack</b>: click a skeleton (Shift + click swings where you stand). <b>Skills</b>: 1–4 (1 is also the right mouse), cast toward the cursor. <b>Roll</b>: Space (untouchable). <b>Potion</b>: Q. <b>Inventory</b>: I. <b>Map</b>: Tab. <b>Level up</b>: the green ✦ or K to choose skills.<br>Find the obelisk and stay beside it until it is charged; the portal takes you to camp. Every third floor the Bone King waits. Elites drop loot and souls; trade souls at the camp’s Bone Altar for lasting runes.');

// ------------------------------------------------------------------ the title
function setLang(l) { lang = l; try { localStorage.setItem('abyss.lang', l); } catch (e) { /* */ } document.documentElement.lang = l === 'zh' ? 'zh-Hant' : 'en'; texts(); updateSlots(); if (G.F) { $('floorName').textContent = floorLabel(G.depth); for (const d of G.drops) if (d.lbl) d.lbl.textContent = itemName(d.it, lang); } }
function texts() {
  $('tSub').textContent = L('深入骸骨洞窟，砍碎成群的亡者。守住方尖碑、撿起傳說裝備、學會火焰柱與連鎖閃電，一層一層往下，直到骸骨之王的王座。', 'Down into the caves of the dead. Hack through the hordes, hold the obelisks, take the loot, master fire and lightning, and go ever deeper — to the Bone King’s throne.');
  $('tPlay').textContent = S.level > 1 || S.depth > 1 ? L(`繼續：${floorLabel(S.depth)} · 等級 ${S.level}`, `Continue: floor ${S.depth} · level ${S.level}`) : L('進入深淵', 'Enter the abyss');
  $('tNew').textContent = L('新角色', 'New hero'); $('tNew').hidden = !(S.level > 1 || S.depth > 1); $('tLang').textContent = L('English', '中文'); $('tHelp').innerHTML = helpText();
  document.querySelector('.ctr.soul').title = L('靈魂', 'Souls'); document.querySelector('.ctr.kill').title = L('擊殺', 'Kills'); document.querySelector('.ctr.gold').title = L('金幣', 'Gold');
}
function titleScreen() { G.paused = true; $('title').hidden = false; $('hud').hidden = true; texts(); sound.ambient(false); }
function begin() {
  $('title').hidden = true; $('hud').hidden = false; sound.init(); sound.ambient(true); G.paused = false;
  restat(); loadFloor(S.depth);
  if (S.points && !Object.keys(S.skills).length) setTimeout(() => levelPanel(), 600);
}
$('tPlay').onclick = begin;
$('tNew').onclick = () => { if (!confirm(L('確定要重新開始一個新角色嗎？', 'Start over with a new hero?'))) return; S = fresh(); G.skills = S.skills; save(); begin(); };
$('tLang').onclick = () => setLang(lang === 'zh' ? 'en' : 'zh');

// ------------------------------------------------------------------ the loop
const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), CAM = new THREE.Vector3(0, 14.5, 8.6);
let lastT = performance.now(), saveT = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  if (!G.F) { renderer.render(scene, camera); return; }
  const run = !G.paused; G.t += run ? dt : 0;
  const h = G.h;
  // the mouse on the ground
  ray.setFromCamera(new THREE.Vector2(mouse.x / innerWidth * 2 - 1, -(mouse.y / innerHeight) * 2 + 1), camera); ray.ray.intersectPlane(groundPlane, mouse.ground);
  if (run) {
    G.st.buffK = (G.buffs.fury ? 1.5 : 1); const baseDmg = G.st.dmg; if (G.buffs.fury) G.st.dmg = baseDmg * 1.5; const baseAtk = G.st.atk; if (G.buffs.haste) G.st.atk = baseAtk * 1.3;
    stepHero(dt);
    // dust motes drifting in the light around him
    if (Math.random() < 0.3) { const a = Math.random() * 6.28, r = 2 + Math.random() * 7; fx.glow.emit({ x: h.x + Math.cos(a) * r, y: 0.4 + Math.random() * 3, z: h.z + Math.sin(a) * r, vx: (Math.random() - 0.5) * 0.3, vy: 0.08 + Math.random() * 0.2, vz: (Math.random() - 0.5) * 0.3, color: fx.C.set('#ffd8a0'), life: 3 + Math.random() * 2, size: 0.07, size1: 0.05, a: 0.45 }); }
    G.flowT -= dt; if (G.flowT <= 0) { G.flowT = 0.4; bfs(G.F.grid, G.F.W, G.F.H, cellOf(h.x), cellOf(h.z), G.flow); markSeen(); }
    horde.update(dt, C);
    // a brute about to slam shows where
    for (const e of horde.list) if (e.K.slam && e.atk >= 0 && !e.warned) { e.warned = true; fx.decal('warn', e.x + Math.sin(e.yaw) * 1.2 * e.scale, e.z + Math.cos(e.yaw) * 1.2 * e.scale, e.K.slam * e.scale * 0.6 + 0.6, 0.33, { color: '#ff3a1a' }); } else if (e.atk < 0) e.warned = false;
    stepSkills(G, dt, G.t); stepShots(dt); stepDrops(dt); stepEvent(dt); stepThings(dt);
    G.st.dmg = baseDmg; G.st.atk = baseAtk;
    saveT -= dt; if (saveT <= 0) { saveT = 20; save(); }
  }
  // draw: the hero
  H.root.position.set(h.x, 0, h.z); H.root.rotation.y = h.yaw;
  poseHero(H, { speed: h.speed || 0, attack: h.swing, cast: h.castT, spin: h.whirl > 0 ? G.t * 18 : null, dash: h.dash, hit: Math.max(0, h.hitT) * 4, dead: h.dead ? h.deadT * 2 : 0, t: G.t }, run ? dt : 0);
  H.root.updateMatrixWorld(true); H.chest.getWorldPosition(vA); vA.y += 0.2; swordTip(H, vB); fx.trailPush(H.arms[1].hand.getWorldPosition(new THREE.Vector3()), vB, h.swing >= 0.28 && h.swing < 0.62 || h.whirl > 0);
  heroLight.position.set(h.x, 6, h.z + 1); heroLight.intensity = h.dead ? 16 : 42;
  // ice spikes from the frost nova
  { let n = 0; const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(); for (const a of G.active) { if (a.id !== 'spike' || a.t < 0) continue; const k = a.t / a.life, grow = Math.min(1, a.t * 8), shrink = k > 0.8 ? (1 - k) / 0.2 : 1; p.set(a.x, 0.5 * a.s * grow * shrink, a.z); q.setFromEuler(new THREE.Euler(0.25, a.yaw, 0.2)); s.set(a.s, a.s * grow * shrink, a.s); spikes.setMatrixAt(n++, m4.compose(p, q, s)); if (n >= 400) break; } spikes.count = n; spikes.instanceMatrix.needsUpdate = true; }
  // the effect lights go to the brightest requests
  lightReq.sort((a, b) => b.i - a.i); fxLights.forEach((l, k) => { const r = lightReq[k]; if (r) { l.position.set(r.x, r.y, r.z); l.color.set(r.color); l.intensity = r.i; } else l.intensity = 0; }); lightReq = [];
  G.W.update(G.t, run ? dt : 0, h.x, h.z);
  horde.render(G.t, camera);
  // the camera, high and looking down
  camLook.set(h.x, 0.8, h.z); camPos.copy(camLook).addScaledVector(CAM, G.zoom || 1); camera.position.lerp(camPos, Math.min(1, dt * 6)); if (camera.position.distanceTo(camPos) > 20) camera.position.copy(camPos);
  camera.lookAt(camera.position.x - CAM.x * (G.zoom || 1), camera.position.y - CAM.y * (G.zoom || 1) + 0.8, camera.position.z - CAM.z * (G.zoom || 1));
  fx.update(run ? dt : 0, camera);
  composer.render();
  stepFloaters(run ? dt : 0);
  if (bannerT > 0) { bannerT -= dt; if (bannerT <= 0) $('banner').classList.remove('on'); } if (hintT > 0) { hintT -= dt; if (hintT <= 0) $('hint').textContent = ''; }
  hud(); drawMap(mm, 220, 64); if (!$('bigmap').hidden) drawMap(bm, 640, Math.max(G.F.W, G.F.H) * 1.05, false);
}
requestAnimationFrame(frame);
texts(); titleScreen();
// a backdrop for the title: the first floor, quietly lit
{ G.F = makeFloor(1, S.seed + 7919); G.W = buildWorld(G.F, scene); G.seen = new Uint8Array(G.F.W * G.F.H); G.depth = 1; G.h.x = centre(G.F.arena[0]) - 6; G.h.z = centre(G.F.arena[1]) + 2; G.flow = bfs(G.F.grid, G.F.W, G.F.H, cellOf(G.h.x), cellOf(G.h.z)); for (let k = 0; k < 14; k++) { const a = k / 14 * 6.28, x = G.h.x + Math.cos(a) * (4 + k % 3 * 2), z = G.h.z + Math.sin(a) * (4 + k % 3 * 2); if (!solid(G.F, x, z)) { const e = horde.spawn(k % 5 ? 'skel' : 'archer', x, z, { sleep: true }); if (e) e.yaw = Math.atan2(G.h.x - x, G.h.z - z); } } }
(async () => { try { cloud = await import('/save.js'); if (await cloud.pull(GAME, KEY)) { S = load(); G.skills = S.skills; restat(); texts(); } } catch (e) { cloud = null; } })();
window.ABYSS = { G, S: () => S, cast: (id, at) => cast(G, id, at), horde, begin, loadFloor, levelPanel, camp, bagPanel, choose, makeItem, dropItem, startEvent, finishEvent, hurtHero };
