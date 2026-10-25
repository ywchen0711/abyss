// loot rules: every slot and rarity rolls, names and lines in both languages, prices and scores are sane
import { makeItem, itemName, itemLines, score, price, SLOTS, RARITY, rollRarity } from '../js/items.js';
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } };
const counts = [0, 0, 0, 0];
for (let k = 0; k < 4000; k++) counts[rollRarity(0)]++;
console.log('rarity of 4000 drops:', RARITY.map((r, i) => `${r.id} ${counts[i]}`).join(', '));
ok(counts[0] > counts[1] && counts[1] > counts[2] && counts[2] > counts[3] && counts[3] > 0, 'rarities get rarer');
for (const slot of SLOTS) for (let rar = 0; rar < 4; rar++) for (const L of [1, 5, 12]) {
  const it = makeItem(L, { slot, rarity: rar });
  ok(it.slot === slot && it.rar === rar, 'slot and rarity');
  ok(itemName(it, 'zh') && itemName(it, 'en'), 'names');
  ok(itemLines(it, 'zh').every((l) => typeof l === 'string' && !l.includes('undefined')), 'lines zh ' + JSON.stringify(it));
  ok(itemLines(it, 'en').every((l) => typeof l === 'string' && !l.includes('undefined') && !l.includes('NaN')), 'lines en');
  ok(price(it) > 0 && score(it) >= 0, 'price');
  if (slot === 'weapon') ok(it.dmg > 0, 'weapon damage'); if (rar === 3) ok(!!it.legend, 'legendary power');
  ok(Object.keys(it.aff).length >= RARITY[rar].aff[0], 'affix count');
}
const a = makeItem(1, { slot: 'weapon', rarity: 0 }), b = makeItem(10, { slot: 'weapon', rarity: 3 });
ok(score(b) > score(a), 'a deep legendary beats a shallow common');
console.log(fail ? `${fail} failed` : 'all ok'); process.exit(fail ? 1 : 0);
