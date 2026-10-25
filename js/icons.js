// Item pictures for the paper doll and the bag: each base drawn as a little painting (a longsword, an axe, a great
// helm, a winged helm, a mail shirt, gauntlets, greaves, rings, amulets…) on a backdrop the colour of its rarity.
import { RARITY, baseKey } from './items.js?v=3';

const CACHE = {};
export function itemIcon(it) {
  if (!it) return '';
  const k = baseKey(it), key = it.slot + ':' + k + ':' + it.rar + ':' + (it.legend || '');
  if (CACHE[key]) return CACHE[key];
  const c = document.createElement('canvas'); c.width = c.height = 96; const g = c.getContext('2d'), R = RARITY[it.rar];
  const bg = g.createRadialGradient(48, 48, 4, 48, 48, 66); bg.addColorStop(0, shade(R.color, 0.32)); bg.addColorStop(1, '#070605'); g.fillStyle = bg; g.fillRect(0, 0, 96, 96);
  const steel = it.rar === 3 ? ['#5a5660', '#2a282e'] : it.rar === 1 ? ['#b8c8e8', '#5a6a8a'] : ['#e0e4ea', '#7a7e86'], trim = it.rar === 3 ? '#ff8a2a' : it.rar === 2 ? '#f0c040' : it.rar === 1 ? '#7aa8ff' : '#a89070';
  const metal = (x0, y0, x1, y1) => { const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, steel[0]); gr.addColorStop(1, steel[1]); return gr; };
  g.save(); g.translate(48, 48); g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = '#0a0806'; g.lineWidth = 2;
  const poly = (pts, fill) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fillStyle = fill; g.fill(); g.stroke(); };
  const leather = '#6a4428', dleather = '#3a2414', bone = '#e8dcc0';
  if (it.slot === 'weapon') {
    g.rotate(-Math.PI / 4);
    if (k === 'axe' || k === 'hammer') { poly([[-3, -10], [3, -10], [4, 40], [-4, 40]], dleather);
      if (k === 'axe') { g.beginPath(); g.moveTo(2, -30); g.quadraticCurveTo(34, -36, 30, -8); g.quadraticCurveTo(26, 14, 2, 6); g.closePath(); g.fillStyle = metal(0, -30, 30, 10); g.fill(); g.stroke(); poly([[-2, -24], [-14, -18], [-2, -10]], steel[1]); }
      else { poly([[-18, -34], [18, -34], [18, -14], [-18, -14]], metal(-18, -34, 18, -14)); poly([[-20, -26], [20, -26], [20, -22], [-20, -22]], trim); poly([[-3, -34], [0, -44], [3, -34]], steel[1]); } }
    else if (k === 'flail') { poly([[-3, 10], [3, 10], [4, 42], [-4, 42]], dleather); g.strokeStyle = steel[1]; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 10); g.quadraticCurveTo(10, -6, 4, -18); g.stroke(); g.lineWidth = 2; g.strokeStyle = '#0a0806'; g.beginPath(); g.arc(4, -28, 12, 0, 7); g.fillStyle = metal(-8, -40, 16, -16); g.fill(); g.stroke(); for (let q = 0; q < 8; q++) { const a = q / 8 * 6.28; poly([[4 + Math.cos(a) * 10, -28 + Math.sin(a) * 10], [4 + Math.cos(a + 0.2) * 19, -28 + Math.sin(a + 0.2) * 19], [4 + Math.cos(a + 0.4) * 10, -28 + Math.sin(a + 0.4) * 10]], steel[1]); } }
    else { const L = k === 'greatsword' ? 70 : k === 'broadsword' ? 46 : 56, W = k === 'broadsword' ? 8 : 6;
      poly([[-W, 18], [W, 18], [W, 18 - L], [0, 18 - L - 10], [-W, 18 - L]], metal(-W, 0, W, 0)); g.strokeStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.moveTo(0, 14); g.lineTo(0, 22 - L); g.stroke(); g.strokeStyle = '#0a0806';
      poly([[-16, 18], [16, 18], [16, 23], [-16, 23]], trim); poly([[-3, 23], [3, 23], [3, 38], [-3, 38]], dleather); g.beginPath(); g.arc(0, 41, 5, 0, 7); g.fillStyle = trim; g.fill(); g.stroke(); }
  }
  if (it.slot === 'helm') {
    if (k === 'great') { poly([[-22, -26], [22, -26], [24, 26], [-24, 26]], metal(-22, -26, 22, 26)); g.beginPath(); g.ellipse(0, -26, 22, 8, 0, Math.PI, 0); g.fillStyle = steel[0]; g.fill(); poly([[-16, -4], [-3, -4], [-3, 0], [-16, 0]], '#050404'); poly([[3, -4], [16, -4], [16, 0], [3, 0]], '#050404'); poly([[-2, -30], [2, -30], [2, 24], [-2, 24]], trim); }
    else if (k === 'kettle') { g.beginPath(); g.arc(0, 6, 26, Math.PI, 0); g.closePath(); g.fillStyle = metal(-26, -20, 26, 6); g.fill(); g.stroke(); poly([[-30, 6], [30, 6], [30, 11], [-30, 11]], trim); poly([[-3, 8], [3, 8], [3, 28], [-3, 28]], steel[1]); }
    else if (k === 'circlet') { g.beginPath(); g.ellipse(0, 6, 28, 10, 0, 0, 7); g.lineWidth = 6; g.strokeStyle = bone; g.stroke(); g.lineWidth = 2; g.strokeStyle = '#0a0806'; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * 20, 0); g.quadraticCurveTo(sd * 40, -20, sd * 26, -38); g.quadraticCurveTo(sd * 30, -18, sd * 12, 0); g.fillStyle = bone; g.fill(); g.stroke(); } g.beginPath(); g.arc(0, 2, 9, 0, 7); g.fillStyle = bone; g.fill(); g.stroke(); g.fillStyle = it.rar === 3 ? '#ff6a1a' : '#100804'; g.fillRect(-5, 0, 3, 3); g.fillRect(2, 0, 3, 3); }
    else { g.beginPath(); g.arc(0, 6, 22, Math.PI, 0); g.closePath(); g.fillStyle = metal(-22, -16, 22, 6); g.fill(); g.stroke(); poly([[-22, 6], [22, 6], [18, 26], [-18, 26]], steel[1]); for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * 20, -4); for (let q = 0; q < 4; q++) { g.lineTo(sd * (30 + q * 5), -12 - q * 8); g.lineTo(sd * (26 + q * 4), -8 - q * 7); } g.lineTo(sd * 20, -10); g.closePath(); g.fillStyle = trim; g.fill(); g.stroke(); } }
  }
  if (it.slot === 'armor') {
    const body = k === 'chain' || k === 'scale' ? (() => { const p = g.createPattern(pattern(k, steel), 'repeat'); return p; })() : k === 'templar' ? '#e8e4dc' : metal(-24, -30, 24, 30);
    poly([[-14, -32], [14, -32], [30, -24], [26, 2], [20, 30], [-20, 30], [-26, 2], [-30, -24]], body);
    if (k === 'plate' || k === 'templar') { poly([[-34, -28], [-14, -32], [-16, -16], [-34, -12]], metal(-34, -30, -14, -12)); poly([[34, -28], [14, -32], [16, -16], [34, -12]], metal(14, -30, 34, -12)); poly([[-3, -24], [3, -24], [3, 10], [-3, 10]], k === 'templar' ? '#a81818' : trim); poly([[-11, -12], [11, -12], [11, -7], [-11, -7]], k === 'templar' ? '#a81818' : trim); }
    poly([[-20, 24], [20, 24], [20, 30], [-20, 30]], trim);
  }
  if (it.slot === 'gloves') { const m = k === 'leather' ? leather : k === 'bonegrip' ? dleather : metal(-20, -20, 20, 20);
    poly([[-16, 30], [10, 30], [12, 4], [22, -2], [24, 6], [16, 16], [16, -22], [10, -26], [6, -20], [2, -30], [-4, -30], [-6, -22], [-12, -24], [-16, -18]], m);
    poly([[-18, 22], [12, 22], [12, 30], [-18, 30]], trim); if (k === 'bonegrip') for (let q = 0; q < 4; q++) poly([[-12 + q * 7, -22], [-9 + q * 7, -34], [-6 + q * 7, -22]], bone); if (k === 'gauntlets') for (let q = 0; q < 3; q++) { g.strokeStyle = 'rgba(0,0,0,0.4)'; g.beginPath(); g.moveTo(-14, -6 + q * 8); g.lineTo(14, -6 + q * 8); g.stroke(); } }
  if (it.slot === 'boots') { const m = k === 'leather' ? leather : metal(-20, -30, 20, 30); poly([[-14, -32], [8, -32], [8, 14], [28, 18], [30, 30], [-14, 30]], m); poly([[-16, -32], [10, -32], [10, -24], [-16, -24]], k === 'leather' ? dleather : trim); if (k !== 'leather') { g.beginPath(); g.arc(-3, -10, 7, 0, 7); g.fillStyle = steel[0]; g.fill(); g.stroke(); } }
  if (it.slot === 'ring') { g.lineWidth = 7; g.strokeStyle = k === 'bone' ? bone : trim; g.beginPath(); g.arc(0, 8, 20, 0, 7); g.stroke(); g.lineWidth = 2; g.strokeStyle = '#0a0806'; g.beginPath(); g.arc(0, -14, 9, 0, 7); g.fillStyle = { iron: '#9a9a9a', bone: '#e8dcc0', ruby: '#ff2a3a', moon: '#bfe8ff' }[k] || '#fff'; g.shadowColor = g.fillStyle; g.shadowBlur = 10; g.fill(); g.stroke(); }
  if (it.slot === 'amulet') { g.lineWidth = 3; g.strokeStyle = trim; g.beginPath(); g.moveTo(-22, -34); g.quadraticCurveTo(0, 0, 22, -34); g.stroke(); g.lineWidth = 2; g.strokeStyle = '#0a0806';
    if (k === 'fang') poly([[-7, 6], [7, 6], [0, 36]], bone); else if (k === 'holy') { poly([[-4, 0], [4, 0], [4, 34], [-4, 34]], trim); poly([[-14, 8], [14, 8], [14, 15], [-14, 15]], trim); } else { g.beginPath(); g.arc(0, 16, 12, 0, 7); g.fillStyle = ['#c8c8d0', '#4a8aff', '#ffd040', '#ff6a1a'][it.rar]; g.shadowColor = g.fillStyle; g.shadowBlur = 14; g.fill(); g.stroke(); } }
  g.restore();
  g.strokeStyle = R.color; g.globalAlpha = 0.85; g.lineWidth = 3; g.strokeRect(1.5, 1.5, 93, 93); g.globalAlpha = 1;
  return (CACHE[key] = c.toDataURL());
}
function pattern(k, steel) { const c = document.createElement('canvas'); c.width = c.height = 8; const g = c.getContext('2d'); g.fillStyle = steel[1]; g.fillRect(0, 0, 8, 8); g.strokeStyle = steel[0]; g.lineWidth = 1.2; if (k === 'chain') { g.beginPath(); g.arc(4, 4, 2.6, 0, 7); g.stroke(); } else { g.beginPath(); g.moveTo(0, 2); g.quadraticCurveTo(4, 9, 8, 2); g.stroke(); } return c; }
function shade(hex, k) { const n = parseInt(hex.slice(1), 16); return `rgb(${((n >> 16) & 255) * k | 0},${((n >> 8) & 255) * k | 0},${(n & 255) * k | 0})`; }
