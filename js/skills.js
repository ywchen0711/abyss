// What the hero can do. The sword (left mouse), a dodge roll (space), and up to four skills on 1–4 / right mouse,
// learned and ranked up as he levels: a pillar of fire, a frost nova, chain lightning, the whirlwind, spiralling
// blessed hammers and a meteor. Each has its look (fire rising, ice spikes, forked bolts, a spinning blade ring,
// golden hammers, a burning rock from above), its cost in mana and its cooldown.
import * as THREE from 'three';
import { solid } from './cave.js?v=3';

const L2 = (zh, en) => ({ zh, en });
export const SKILLS = {
  fire:   { name: L2('火焰柱', 'Pillar of Fire'), mana: 22, cd: 4, color: '#ff7a2a', desc: (r) => L2(`在指定位置召喚 3 秒的火柱，每秒 ${pct(2.4 + 0.6 * r)} 武器傷害並點燃敵人`, `A 3-second column of fire where you aim: ${pct(2.4 + 0.6 * r)} weapon damage a second, and sets the dead alight`) },
  frost:  { name: L2('冰霜新星', 'Frost Nova'), mana: 18, cd: 7, color: '#8ad8ff', desc: (r) => L2(`冰環向外炸開，${pct(1.5 + 0.4 * r)} 武器傷害，冰凍敵人 ${(1.6 + 0.3 * r).toFixed(1)} 秒`, `A ring of ice bursts out: ${pct(1.5 + 0.4 * r)} weapon damage, freezing them for ${(1.6 + 0.3 * r).toFixed(1)}s`) },
  bolt:   { name: L2('連鎖閃電', 'Chain Lightning'), mana: 9, cd: 0.8, color: '#b0e0ff', desc: (r) => L2(`閃電在 ${4 + r} 個敵人之間跳躍，每次 ${pct(1.2 + 0.25 * r)} 武器傷害`, `Lightning leaps between ${4 + r} enemies, ${pct(1.2 + 0.25 * r)} weapon damage each`) },
  whirl:  { name: L2('旋風斬', 'Whirlwind'), mana: 16, cd: 6, color: '#e8e0c8', desc: (r) => L2(`旋轉 ${(2.5 + 0.3 * r).toFixed(1)} 秒，持續斬擊周圍，每秒 ${pct(2.6 + 0.5 * r)} 武器傷害，移動更快`, `Spin for ${(2.5 + 0.3 * r).toFixed(1)}s, cutting all around you: ${pct(2.6 + 0.5 * r)} weapon damage a second, and move faster`) },
  hammer: { name: L2('祝福之錘', 'Blessed Hammer'), mana: 10, cd: 0.7, color: '#ffd860', desc: (r) => L2(`${1 + Math.floor(r / 2)} 把金錘繞著你向外盤旋，每次 ${pct(1.1 + 0.25 * r)} 武器傷害`, `${1 + Math.floor(r / 2)} golden hammer${r >= 2 ? 's' : ''} spiral out around you, ${pct(1.1 + 0.25 * r)} weapon damage a hit`) },
  meteor: { name: L2('隕石術', 'Meteor'), mana: 35, cd: 9, color: '#ff5a1a', desc: (r) => L2(`一顆燃燒的隕石砸下：${pct(6 + 1.5 * r)} 武器傷害，留下燃燒的地面`, `A burning rock falls from above: ${pct(6 + 1.5 * r)} weapon damage, and leaves the ground on fire`) },
};
export const PASSIVES = {
  might:  { name: L2('力量', 'Might'), desc: L2('傷害 +12%', 'Damage +12%'), icon: '⚔️' },
  vigor:  { name: L2('體魄', 'Vigour'), desc: L2('最大生命 +25', 'Max life +25'), icon: '❤️' },
  swift:  { name: L2('迅捷', 'Swiftness'), desc: L2('攻擊速度 +10%', 'Attack speed +10%'), icon: '💨' },
  fleet:  { name: L2('疾行', 'Fleet foot'), desc: L2('移動速度 +7%', 'Move speed +7%'), icon: '👢' },
  keen:   { name: L2('精準', 'Keen eye'), desc: L2('暴擊率 +5%', 'Critical chance +5%'), icon: '🎯' },
  leech:  { name: L2('吸血', 'Life leech'), desc: L2('造成傷害的 2% 回復生命', 'Heal 2% of damage dealt'), icon: '🩸' },
  wisdom: { name: L2('智慧', 'Wisdom'), desc: L2('最大法力 +15，法力回復 +25%', 'Max mana +15, mana regen +25%'), icon: '🔮' },
  greed:  { name: L2('貪婪', 'Greed'), desc: L2('金幣 +25%，拾取範圍 +1 公尺', 'Gold +25%, pick-up range +1 m'), icon: '💰' },
};
const pct = (k) => Math.round(k * 100) + '%';
export const MAX_RANK = 5;

// skill icons painted on a canvas (the same look in the bar, the level-up choice and the book)
const ICONS = {};
export function skillIcon(id) {
  if (ICONS[id]) return ICONS[id];
  const c = document.createElement('canvas'); c.width = c.height = 96; const g = c.getContext('2d'), col = SKILLS[id] ? SKILLS[id].color : '#d8c090';
  const bg = g.createRadialGradient(48, 52, 4, 48, 48, 60); bg.addColorStop(0, shade(col, 0.55)); bg.addColorStop(1, '#0a0806'); g.fillStyle = bg; g.fillRect(0, 0, 96, 96);
  g.save(); g.translate(48, 48); g.shadowColor = col; g.shadowBlur = 16; g.fillStyle = col; g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round';
  if (id === 'fire') { for (const [x, s] of [[-14, 0.7], [12, 0.75], [0, 1]]) { g.save(); g.translate(x, 18); g.scale(s, s); g.beginPath(); g.moveTo(0, -60); g.bezierCurveTo(22, -30, 26, -6, 16, 8); g.quadraticCurveTo(0, 22, -16, 8); g.bezierCurveTo(-26, -6, -10, -26, 0, -60); const fg = g.createLinearGradient(0, -60, 0, 20); fg.addColorStop(0, '#fff4c0'); fg.addColorStop(0.5, '#ffa030'); fg.addColorStop(1, '#c82a00'); g.fillStyle = fg; g.fill(); g.restore(); } }
  if (id === 'frost') { g.lineWidth = 5; g.strokeStyle = '#d8f4ff'; for (let k = 0; k < 6; k++) { g.save(); g.rotate(k * Math.PI / 3); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -34); g.moveTo(0, -20); g.lineTo(-9, -28); g.moveTo(0, -20); g.lineTo(9, -28); g.stroke(); g.restore(); } g.fillStyle = '#ffffff'; g.beginPath(); g.arc(0, 0, 6, 0, 7); g.fill(); }
  if (id === 'bolt') { g.fillStyle = '#e8f8ff'; g.beginPath(); g.moveTo(8, -40); g.lineTo(-16, 4); g.lineTo(0, 4); g.lineTo(-10, 40); g.lineTo(18, -8); g.lineTo(2, -8); g.closePath(); g.fill(); }
  if (id === 'whirl') { g.lineWidth = 6; g.strokeStyle = '#f0ead8'; for (let k = 0; k < 3; k++) { g.save(); g.rotate(k * 2.1); g.beginPath(); g.arc(0, 0, 28, 0, 1.7); g.stroke(); g.beginPath(); g.moveTo(28, 0); g.lineTo(36, -8); g.lineTo(22, -6); g.fill(); g.restore(); } g.fillStyle = '#c8c0b0'; g.fillRect(-3, -16, 6, 32); }
  if (id === 'hammer') { g.rotate(-0.6); g.fillStyle = '#8a5a2a'; g.fillRect(-4, -8, 8, 46); const hg = g.createLinearGradient(-24, -30, 24, -8); hg.addColorStop(0, '#fff0a0'); hg.addColorStop(1, '#c89020'); g.fillStyle = hg; g.fillRect(-24, -32, 48, 24); g.strokeStyle = '#6a4a10'; g.lineWidth = 2; g.strokeRect(-24, -32, 48, 24); }
  if (id === 'meteor') { g.rotate(0.7); const tg = g.createLinearGradient(0, -44, 0, 20); tg.addColorStop(0, 'rgba(255,200,80,0)'); tg.addColorStop(1, '#ff6a10'); g.fillStyle = tg; g.beginPath(); g.moveTo(-14, 10); g.lineTo(0, -44); g.lineTo(14, 10); g.fill(); g.fillStyle = '#4a2a1a'; g.beginPath(); g.arc(0, 16, 15, 0, 7); g.fill(); g.strokeStyle = '#ff8a20'; g.lineWidth = 3; g.stroke(); }
  if (id === 'slash') { g.lineWidth = 7; g.strokeStyle = '#f4f0e8'; g.beginPath(); g.arc(-6, 10, 34, -1.9, -0.2); g.stroke(); g.fillStyle = '#c8c4bc'; g.save(); g.rotate(0.8); g.fillRect(-3, -40, 6, 52); g.fillStyle = '#d8a840'; g.fillRect(-12, 10, 24, 5); g.restore(); }
  if (id === 'dash') { g.fillStyle = '#e8e0d0'; for (let k = 0; k < 3; k++) { g.globalAlpha = 0.4 + k * 0.3; g.beginPath(); g.moveTo(-30 + k * 16, -20); g.lineTo(-14 + k * 16, 0); g.lineTo(-30 + k * 16, 20); g.lineTo(-24 + k * 16, 0); g.fill(); } }
  if (id === 'potion') { g.shadowBlur = 8; g.fillStyle = '#7a7a80'; g.fillRect(-6, -34, 12, 10); g.beginPath(); g.arc(0, 6, 24, 0, 7); const pg = g.createRadialGradient(-6, 0, 2, 0, 6, 24); pg.addColorStop(0, '#ff8a8a'); pg.addColorStop(1, '#a8101a'); g.fillStyle = pg; g.fill(); g.strokeStyle = '#d8d0c0'; g.lineWidth = 3; g.stroke(); }
  g.restore();
  g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 6; g.strokeRect(0, 0, 96, 96);
  return (ICONS[id] = c.toDataURL());
}
function shade(hex, k) { const n = parseInt(hex.slice(1), 16); return `rgb(${((n >> 16) & 255) * k | 0},${((n >> 8) & 255) * k | 0},${(n & 255) * k | 0})`; }

// ------------------------------------------------------------------ casting
// G: the game (hero h, stats st, horde, fx, F, hit(e, dmg, o), sound, active[]), at: [x, z] where the mouse points
export function cast(G, id, at) {
  const h = G.h, r = G.skills[id] || 1, P = G.st.dmg, fx = G.fx, [ax, az] = at;
  const aim = Math.atan2(ax - h.x, az - h.z); h.yaw = aim; h.castT = 0;
  if (id === 'fire') {
    const d = Math.min(12, Math.hypot(ax - h.x, az - h.z)), x = h.x + Math.sin(aim) * d, z = h.z + Math.cos(aim) * d;
    const add = (x, z) => G.active.push({ id, x, z, t: 0, life: 3, tick: 0, r: 2.2 + 0.2 * r, dmg: P * (0.6 + 0.15 * r) * G.st.spell });
    add(x, z); if (G.st.legend.twin) add(x + Math.cos(aim) * 3, z - Math.sin(aim) * 3);
    fx.decal('glow', x, z, 3, 3.2, { color: '#ff5a10', a: 0.7 }); G.sound.play('fire');
  }
  if (id === 'frost') {
    const rad = 6 + 0.5 * r, freeze = (1.6 + 0.3 * r) * (G.st.legend.frostheart ? 1.6 : 1);
    for (const e of G.horde.near(h.x, h.z, rad)) { G.hit(e, P * (1.5 + 0.4 * r) * G.st.spell, { frost: true }); if (!e.dead && !e.boss) e.frozen = freeze; else if (!e.dead) e.slow = freeze * 1.5; }
    fx.decal('ring', h.x, h.z, rad, 0.6, { color: '#9ae0ff', a: 1 }); fx.decal('glow', h.x, h.z, rad, 1.8, { color: '#4ab0ff', a: 0.35 });
    for (let k = 0; k < 26; k++) { const a = k / 26 * Math.PI * 2, d = 1.5 + Math.random() * (rad - 1.5), x = h.x + Math.cos(a) * d, z = h.z + Math.sin(a) * d; if (!solid(G.F, x, z)) G.active.push({ id: 'spike', x, z, t: -d / rad * 0.25, life: 1.6, s: 0.6 + Math.random() * 0.8, yaw: Math.random() * 6 }); }
    fx.spark(h.x, 1, h.z, '#c8f0ff', 60, { speed: 12, up: 2, grav: 2, life: 0.7, size: 0.4 });
    G.sound.play('frost'); fx.shake(0.15);
  }
  if (id === 'bolt') {
    const hitSet = new Set(), pts = [[h.x, 1.4, h.z]]; let cx = ax, cz = az, from = [h.x, h.z];
    let e = G.horde.nearest(cx, cz, 4) || G.horde.nearest(h.x, h.z, 9);
    for (let k = 0; k < 4 + r && e; k++) { hitSet.add(e); pts.push([e.x, 1.2 * e.scale, e.z]); G.hit(e, P * (1.2 + 0.25 * r) * G.st.spell, { shock: true }); fx.spark(e.x, 1.2, e.z, '#c8ecff', 8, { speed: 4, life: 0.3 }); from = [e.x, e.z]; e = G.horde.nearest(from[0], from[1], 7, hitSet); }
    if (pts.length === 1) pts.push([h.x + Math.sin(aim) * 8, 1.2, h.z + Math.cos(aim) * 8]);
    fx.bolt(pts, '#b8e4ff', 0.22, 0.16); fx.bolt(pts, '#ffffff', 0.12, 0.05); G.sound.play('zap');
  }
  if (id === 'whirl') { G.active.push({ id, t: 0, life: 2.5 + 0.3 * r, tick: 0, dmg: P * (0.65 + 0.125 * r) }); h.whirl = 2.5 + 0.3 * r; G.sound.play('whirl'); }
  if (id === 'hammer') { const n = 1 + Math.floor(r / 2); for (let k = 0; k < n; k++) G.active.push({ id, t: 0, life: 2.6, a0: aim + k / n * Math.PI * 2, hits: new Map(), dmg: P * (1.1 + 0.25 * r) * G.st.spell, mesh: G.hammerMesh() }); G.sound.play('hammer'); }
  if (id === 'meteor') {
    const n = G.st.legend.avalanche ? 3 : 1;
    for (let k = 0; k < n; k++) { const d = Math.min(14, Math.hypot(ax - h.x, az - h.z)), x = h.x + Math.sin(aim) * d + (k ? (Math.random() - 0.5) * 6 : 0), z = h.z + Math.cos(aim) * d + (k ? (Math.random() - 0.5) * 6 : 0);
      G.active.push({ id, x, z, t: -k * 0.35, life: 1, dmg: P * (6 + 1.5 * r) * G.st.spell, mesh: G.meteorMesh() }); fx.decal('warn', x, z, 3.5, 1 + k * 0.35, { color: '#ff6a20' }); }
    G.sound.play('meteorIn');
  }
}
// the sword: a wide cut in front of the hero; every one caught in the arc takes the blow
export function slash(G, aim) {
  const h = G.h, st = G.st, range = 2.7, half = 1.25; let n = 0;
  for (const e of G.horde.near(h.x, h.z, range + 0.5)) {
    const a = Math.atan2(e.x - h.x, e.z - h.z); let d = Math.abs(((a - aim + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI);
    if (d > half && Math.hypot(e.x - h.x, e.z - h.z) > 1.1) continue;
    G.hit(e, st.dmg * (0.9 + Math.random() * 0.2), { melee: true, knock: 5, ember: st.legend.ember }); n++;
    if (st.legend.storm && Math.random() < 0.12) cast({ ...G, skills: { ...G.skills, bolt: 3 }, h: { ...h, yaw: 0 } }, 'bolt', [e.x, e.z]);
  }
  if (n) { G.mana(Math.min(12, 4 * n)); G.fx.shake(0.06 + n * 0.01, 0.12); G.sound.play('crunch'); }
  return n;
}
// the skills still at work: burning, spinning, falling
export function stepSkills(G, dt, t) {
  const fx = G.fx, h = G.h;
  for (const a of G.active) {
    a.t += dt; if (a.t < 0) continue;
    if (a.id === 'fire') {
      a.tick -= dt; if (a.tick <= 0) { a.tick = 0.25; for (const e of G.horde.near(a.x, a.z, a.r)) { G.hit(e, a.dmg, { fire: true, quiet: Math.random() < 0.5 }); if (!e.dead) { e.burn = 2; e.burnDmg = a.dmg * 0.4; } } }
      const k = a.t < 0.2 ? a.t / 0.2 : a.t > a.life - 0.4 ? (a.life - a.t) / 0.4 : 1;
      for (let n = 0; n < 5 * k; n++) { const ang = Math.random() * 6.28, d = Math.sqrt(Math.random()) * a.r * 0.85; fx.flame(a.x + Math.cos(ang) * d, 0.2 + Math.random() * 0.5, a.z + Math.sin(ang) * d, { rise: 7 + Math.random() * 6, life: 0.7, size: 1.3, r: 0.2 }); }
      if (Math.random() < 0.4) fx.puff(a.x, 3 + Math.random() * 3, a.z, '#1a1210', 1, { size: 1.4, size1: 3, up: 2, a: 0.35 });
      G.light(a.x, 2.5, a.z, '#ff7a2a', 50 * k);
    }
    if (a.id === 'spike') { /* drawn by G.drawSpikes */ }
    if (a.id === 'whirl') {
      a.tick -= dt; if (a.tick <= 0) { a.tick = 0.25; let n = 0; for (const e of G.horde.near(h.x, h.z, 3.2)) { G.hit(e, a.dmg, { melee: true, knock: 3, quiet: Math.random() < 0.4 }); n++; } if (n) { G.mana(2); G.sound.play('crunch'); } }
      for (let n = 0; n < 3; n++) { const ang = t * 14 + n * 2.1; fx.spark(h.x + Math.sin(ang) * 2.2, 0.8 + Math.random() * 0.6, h.z + Math.cos(ang) * 2.2, '#e8dcc0', 1, { speed: 1, up: 0.5, life: 0.25, size: 0.45, grav: 0 }); }
      fx.puff(h.x, 0.2, h.z, '#5a5248', 1, { speed: 4, size: 0.6, size1: 1.6, a: 0.3 });
    }
    if (a.id === 'hammer') {
      const k = a.t / a.life, rad = 0.8 + k * 6.5, ang = a.a0 + a.t * 6.2, x = h.x + Math.sin(ang) * rad, z = h.z + Math.cos(ang) * rad;
      a.mesh.position.set(x, 1.1, z); a.mesh.rotation.set(t * 16, ang, 0.4);
      fx.spark(x, 1.1, z, '#ffd860', 1, { speed: 0.5, up: 0.3, life: 0.35, size: 0.6, grav: 0 });
      for (const e of G.horde.near(x, z, 1.25)) { const last = a.hits.get(e) || -9; if (a.t - last < 0.45) continue; a.hits.set(e, a.t); G.hit(e, a.dmg, { holy: true, knock: 2.5 }); fx.spark(x, 1.1, z, '#fff0a0', 6, { speed: 4, life: 0.3 }); }
      G.light(x, 1.5, z, '#ffd060', 12);
    }
    if (a.id === 'meteor') {
      const k = Math.min(1, a.t / a.life); a.mesh.position.set(a.x - 6 * (1 - k), 0.5 + 24 * (1 - k), a.z - 3 * (1 - k)); a.mesh.rotation.x += dt * 8;
      fx.flame(a.mesh.position.x, a.mesh.position.y, a.mesh.position.z, { rise: 1, life: 0.4, size: 2, r: 0.6 }); fx.flame(a.mesh.position.x, a.mesh.position.y, a.mesh.position.z, { rise: 1, life: 0.5, size: 1.4, r: 0.8 });
      G.light(a.mesh.position.x, a.mesh.position.y, a.mesh.position.z, '#ff7a2a', 30);
      if (k >= 1 && !a.boom) {
        a.boom = true; a.mesh.visible = false;
        for (const e of G.horde.near(a.x, a.z, 3.5)) { G.hit(e, a.dmg, { fire: true, knock: 9 }); if (!e.dead) { e.burn = 3; e.burnDmg = a.dmg * 0.06; } }
        fx.spark(a.x, 0.5, a.z, '#ffb040', 90, { speed: 14, up: 9, life: 0.9, size: 0.6, grav: 14 }); fx.puff(a.x, 0.5, a.z, '#2a1e18', 16, { speed: 5, size: 1.5, size1: 4, up: 2.5, a: 0.55 });
        fx.decal('ring', a.x, a.z, 5, 0.5, { color: '#ffa040' }); fx.decal('glow', a.x, a.z, 3.5, 4, { color: '#a02a00', a: 0.9 });
        G.active.push({ id: 'fire', x: a.x, z: a.z, t: 0, life: 3, tick: 0.25, r: 3, dmg: a.dmg * 0.05 });
        fx.shake(0.5, 0.4); G.sound.play('boom'); a.life = a.t + 0.01;
      }
    }
  }
  G.active = G.active.filter((a) => { const keep = a.t < a.life; if (!keep && a.mesh) G.scene.remove(a.mesh); return keep; });
}
