import { makeFloor, bfs, solid, centre } from '../js/cave.js';
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } };
for (let d = 1; d <= 12; d++) {
  const F = makeFloor(d), dist = bfs(F.grid, F.W, F.H, F.start[0], F.start[1]);
  const reach = ([i, j]) => dist[i + j * F.W] >= 0;
  ok(reach(F.arena), `arena reachable d${d}`); ok(F.packs.every((p) => reach([p.i, p.j])), `packs d${d}`); ok(F.chests.every(reach), 'chests'); ok(F.shrines.every(reach), 'shrines');
  ok(!solid(F, centre(F.start[0]), centre(F.start[1])), 'start open'); ok(!solid(F, centre(F.arena[0]), centre(F.arena[1])), 'arena open');
  const walk = dist[F.arena[0] + F.arena[1] * F.W];
  console.log(`floor ${d}: ${F.W}x${F.H}, open ${F.open}, start→obelisk ${walk} cells, packs ${F.packs.length}, chests ${F.chests.length}, braziers ${F.braziers.length}${F.boss ? ', BOSS' : ''}`);
  ok(walk > F.W * 0.5, `obelisk far enough d${d}`);
}
console.log(fail ? `${fail} failed` : 'all ok'); process.exit(fail ? 1 : 0);
