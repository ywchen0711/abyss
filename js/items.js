// Loot. Seven slots, four rarities (white, blue magic, yellow rare, orange legendary), random affixes, and
// legendary powers that change how the skills behave. Stats add up into the hero's sheet.
const L2 = (zh, en) => ({ zh, en });
export const SLOTS = ['weapon', 'helm', 'armor', 'gloves', 'boots', 'ring', 'amulet'];
export const SLOT_NAME = { weapon: L2('武器', 'Weapon'), helm: L2('頭盔', 'Helm'), armor: L2('胸甲', 'Armour'), gloves: L2('手套', 'Gloves'), boots: L2('靴子', 'Boots'), ring: L2('戒指', 'Ring'), amulet: L2('項鍊', 'Amulet') };
export const RARITY = [
  { id: 'common', name: L2('普通', 'Common'), color: '#d8d4cc', k: 1, aff: [0, 0] },
  { id: 'magic', name: L2('魔法', 'Magic'), color: '#6a9aff', k: 1.15, aff: [1, 2] },
  { id: 'rare', name: L2('稀有', 'Rare'), color: '#ffd84a', k: 1.3, aff: [3, 4] },
  { id: 'legend', name: L2('傳說', 'Legendary'), color: '#ff8a2a', k: 1.5, aff: [4, 4] },
];
const B = (k, zh, en) => ({ k, zh, en });
export const BASES = {
  weapon: [B('longsword', '長劍', 'Longsword'), B('broadsword', '闊劍', 'Broadsword'), B('axe', '戰斧', 'War Axe'), B('flail', '鏈錘', 'Flail'), B('greatsword', '巨劍', 'Greatsword'), B('hammer', '戰錘', 'Warhammer')],
  helm: [B('kettle', '鐵盔', 'Iron Helm'), B('great', '巨盔', 'Great Helm'), B('circlet', '骨冠', 'Bone Circlet'), B('winged', '翼盔', 'Winged Helm')],
  armor: [B('chain', '鎖子甲', 'Chain Mail'), B('plate', '板甲', 'Plate'), B('scale', '鱗甲', 'Scale Mail'), B('templar', '聖騎士胸甲', 'Templar Cuirass')],
  gloves: [B('leather', '皮手套', 'Leather Gloves'), B('gauntlets', '鐵手甲', 'Gauntlets'), B('bonegrip', '骨爪手套', 'Bonegrip Gloves')],
  boots: [B('leather', '皮靴', 'Leather Boots'), B('war', '戰靴', 'War Boots'), B('greaves', '板靴', 'Plated Greaves')],
  ring: [B('iron', '鐵戒', 'Iron Ring'), B('bone', '骨戒', 'Bone Ring'), B('ruby', '紅寶石戒指', 'Ruby Ring'), B('moon', '月光戒指', 'Moonstone Ring')],
  amulet: [B('talisman', '護身符', 'Talisman'), B('holy', '聖徽', 'Holy Symbol'), B('fang', '獸牙項鍊', 'Fang Necklace')],
};
// which look an item has (older saves stored the base without its key)
export function baseKey(it) { if (!it) return null; if (it.base && it.base.k) return it.base.k; const b = (BASES[it.slot] || []).find((x) => it.base && x.en === it.base.en); return b ? b.k : (BASES[it.slot] || [{ k: null }])[0].k; }
// affixes: what a roll can give (value at item level L)
export const AFFIX = {
  dmgPct: { name: (v) => L2(`傷害 +${v}%`, `+${v}% damage`), roll: (L) => 5 + Math.round(Math.random() * (6 + L)) },
  hp:     { name: (v) => L2(`生命 +${v}`, `+${v} life`), roll: (L) => 10 + Math.round(Math.random() * (8 + L * 6)) },
  crit:   { name: (v) => L2(`暴擊率 +${v}%`, `+${v}% critical chance`), roll: () => 2 + Math.round(Math.random() * 4) },
  atk:    { name: (v) => L2(`攻擊速度 +${v}%`, `+${v}% attack speed`), roll: () => 4 + Math.round(Math.random() * 6) },
  move:   { name: (v) => L2(`移動速度 +${v}%`, `+${v}% move speed`), roll: () => 3 + Math.round(Math.random() * 5) },
  leech:  { name: (v) => L2(`吸血 ${v}%`, `${v}% life leech`), roll: () => 1 + Math.round(Math.random() * 2) },
  mana:   { name: (v) => L2(`法力回復 +${v}%`, `+${v}% mana regen`), roll: () => 10 + Math.round(Math.random() * 20) },
  spell:  { name: (v) => L2(`技能傷害 +${v}%`, `+${v}% skill damage`), roll: (L) => 6 + Math.round(Math.random() * (8 + L)) },
  gold:   { name: (v) => L2(`金幣 +${v}%`, `+${v}% gold found`), roll: () => 10 + Math.round(Math.random() * 30) },
  armor:  { name: (v) => L2(`護甲 +${v}`, `+${v} armour`), roll: (L) => 4 + Math.round(Math.random() * (4 + L * 2)) },
  regen:  { name: (v) => L2(`每秒回復 ${v} 生命`, `+${v} life a second`), roll: (L) => 1 + Math.round(Math.random() * (1 + L * 0.5)) },
};
export const LEGENDS = {
  ember:      { name: L2('灰燼之誓', 'Oath of Ashes'), desc: L2('揮砍會點燃敵人', 'Your sword sets the dead on fire') },
  storm:      { name: L2('風暴之心', 'Heart of the Storm'), desc: L2('揮砍有 12% 機率放出連鎖閃電', 'Sword hits have a 12% chance to unleash chain lightning') },
  frostheart: { name: L2('永凍之環', 'Rime Eternal'), desc: L2('冰霜新星冷卻減半，冰凍更久', 'Frost Nova recharges twice as fast and freezes longer') },
  bloodlust:  { name: L2('嗜血者', 'The Bloodthirsty'), desc: L2('每次擊殺回復 2% 生命', 'Every kill heals 2% of your life') },
  twin:       { name: L2('雙生烈焰', 'Twin Flames'), desc: L2('火焰柱會出現兩道', 'Pillar of Fire comes in twos') },
  avalanche:  { name: L2('天崩', 'Skyfall'), desc: L2('隕石術一次落下三顆', 'Meteor brings down three') },
};
const pick = (a) => a[Math.floor(Math.random() * a.length)];
export function rollRarity(boost = 0) { const r = Math.random() * (100 - boost * 30); return r < 3 + boost * 6 ? 3 : r < 14 + boost * 10 ? 2 : r < 44 ? 1 : 0; }
export function makeItem(L, o = {}) {
  const slot = o.slot || pick(SLOTS), rar = o.rarity ?? rollRarity(o.boost || 0), R = RARITY[rar], base = pick(BASES[slot]);
  const it = { id: Math.random().toString(36).slice(2, 9), slot, rar, base, lvl: L, aff: {} };
  if (slot === 'weapon') it.dmg = Math.round((7 + L * 3.2) * (0.85 + Math.random() * 0.3) * R.k);
  else if (slot !== 'ring' && slot !== 'amulet') it.armor = Math.round((3 + L * 1.8) * (0.85 + Math.random() * 0.3) * R.k);
  const [a, b] = R.aff, n = a + Math.floor(Math.random() * (b - a + 1)) + (slot === 'ring' || slot === 'amulet' ? (rar ? 1 : 1) : 0), keys = Object.keys(AFFIX).sort(() => Math.random() - 0.5);
  for (const k of keys.slice(0, n)) it.aff[k] = AFFIX[k].roll(L);
  if (rar === 3) it.legend = o.legend || pick(Object.keys(LEGENDS));
  return it;
}
export function itemName(it, lang) { return it.legend ? LEGENDS[it.legend].name[lang] : (it.rar === 2 ? (lang === 'zh' ? '稀有的' : 'Rare ') : it.rar === 1 ? (lang === 'zh' ? '魔法' : 'Enchanted ') : '') + it.base[lang]; }
export function itemLines(it, lang) {
  const out = []; if (it.dmg) out.push(lang === 'zh' ? `${it.dmg} 武器傷害` : `${it.dmg} weapon damage`); if (it.armor) out.push(lang === 'zh' ? `${it.armor} 護甲` : `${it.armor} armour`);
  for (const [k, v] of Object.entries(it.aff)) out.push(AFFIX[k].name(v)[lang]);
  return out;
}
// a rough worth, to compare two items in the same slot (and to price them)
export function score(it) { if (!it) return 0; let s = (it.dmg || 0) * 3 + (it.armor || 0) * 1.5; const W = { dmgPct: 2.2, hp: 0.45, crit: 3, atk: 2, move: 1.8, leech: 5, mana: 0.5, spell: 1.8, gold: 0.3, armor: 1.3, regen: 2.5 }; for (const [k, v] of Object.entries(it.aff)) s += (W[k] || 1) * v; if (it.legend) s += 40; return Math.round(s); }
export const price = (it) => Math.round(5 + score(it) * (1 + it.rar * 0.6) * 0.4);
