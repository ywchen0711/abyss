// A floor of the abyss: a cave grown from noise (cellular automata), the biggest open region kept, a start, the
// obelisk arena as far from the start as the cave allows, chests, shrines, braziers, bone piles and the packs of the
// dead that wait in the dark. Pure data, no three.js: it is tested in Node.
//   grid[i + j * W]: 1 = rock, 0 = floor.  Cell (i, j) covers world x in [i*CELL, (i+1)*CELL), z likewise.
export const CELL = 2;

export function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

export function makeFloor(depth, seed = depth * 7919 + 13) {
  const R = rng(seed), W = Math.min(96, 64 + depth * 4), H = W;
  let grid, region, tries = 0;
  do {
    grid = new Uint8Array(W * H);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) grid[i + j * W] = i < 2 || j < 2 || i >= W - 2 || j >= H - 2 || R() < 0.46 ? 1 : 0;
    for (let it = 0; it < 5; it++) {
      const next = new Uint8Array(W * H);
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
        if (i < 1 || j < 1 || i >= W - 1 || j >= H - 1) { next[i + j * W] = 1; continue; }
        let n = 0; for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) if (a || b) n += grid[i + a + (j + b) * W];
        next[i + j * W] = n >= 5 || (it < 3 && n <= 1 && R() < 0.5) ? 1 : n <= 3 ? 0 : grid[i + j * W];
      }
      grid = next;
    }
    region = largest(grid, W, H);
    tries++;
  } while (region.size < W * H * 0.34 && tries < 30);
  // everything not in the biggest region is rock
  for (let k = 0; k < W * H; k++) if (!region.has(k)) grid[k] = 1;
  const floorCells = [...region];
  // the start: a floor cell near a corner; the obelisk: the floor cell farthest from it (by walking)
  const corner = floorCells.reduce((b, k) => ((k % W) + Math.floor(k / W) < (b % W) + Math.floor(b / W) ? k : b), floorCells[0]);
  const start = clearRound(grid, W, H, corner % W, Math.floor(corner / W), 2.5);
  let dist = bfs(grid, W, H, start[0], start[1]);
  let far = 0; for (let k = 0; k < W * H; k++) if (dist[k] > dist[far]) far = k;
  const arena = clearRound(grid, W, H, far % W, Math.floor(far / W), 5.5);
  dist = bfs(grid, W, H, start[0], start[1]);
  const open = []; for (let k = 0; k < W * H; k++) if (!grid[k] && dist[k] >= 0) open.push(k);
  const at = (k) => [k % W, Math.floor(k / W)], away = (k, [x, y], r) => { const [i, j] = at(k); return Math.hypot(i - x, j - y) > r; };
  const pickSpots = (n, minD, test) => { const out = []; for (let t = 0; t < n * 40 && out.length < n; t++) { const k = open[Math.floor(R() * open.length)]; if (test && !test(k)) continue; if (out.some((o) => !away(k, at(o), minD))) continue; out.push(k); } return out.map(at); };
  const nearWall = (k) => { const [i, j] = at(k); let n = 0; for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) n += grid[i + a + (j + b) * W]; return n >= 2; };
  const farFromEnds = (k) => away(k, start, 7) && away(k, arena, 9);
  const boss = depth % 3 === 0;
  const packs = pickSpots(8 + depth * 2, 7, farFromEnds).map(([i, j], n) => ({ i, j, n: 3 + Math.floor(R() * 4) + Math.floor(depth / 2), elite: n % 4 === 0 }));
  const chests = pickSpots(3 + Math.floor(depth / 3), 10, (k) => nearWall(k) && farFromEnds(k));
  const shrines = pickSpots(2, 14, farFromEnds);
  const braziers = pickSpots(Math.floor(open.length / 85), 6, nearWall);
  const bones = pickSpots(Math.floor(open.length / 9), 1.5);
  const crystals = pickSpots(6 + Math.floor(open.length / 160), 6, nearWall);
  const slabs = pickSpots(Math.floor(open.length / 12), 1.4);
  const pillars = pickSpots(Math.floor(open.length / 140), 6, (k) => nearWall(k) && farFromEnds(k));
  const tombs = pickSpots(Math.floor(open.length / 120), 3, farFromEnds);
  const candles = pickSpots(Math.floor(open.length / 75), 3, nearWall);
  // the obelisk arena gets a ring of braziers
  const ring = []; for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + 0.3, i = Math.round(arena[0] + Math.cos(a) * 4.6), j = Math.round(arena[1] + Math.sin(a) * 4.6); if (!grid[i + j * W]) ring.push([i, j]); }
  return { depth, seed, W, H, grid, start, arena, boss, packs, chests, shrines, braziers: [...braziers, ...ring], pillars, tombs, candles, bones, crystals, slabs, open: open.length };
}
function largest(grid, W, H) {
  const seen = new Uint8Array(W * H); let best = new Set();
  for (let k = 0; k < W * H; k++) {
    if (grid[k] || seen[k]) continue;
    const set = new Set([k]), st = [k]; seen[k] = 1;
    while (st.length) { const c = st.pop(), i = c % W, j = (c - i) / W; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = i + a + (j + b) * W; if (i + a < 0 || j + b < 0 || i + a >= W || j + b >= H || grid[n] || seen[n]) continue; seen[n] = 1; set.add(n); st.push(n); } }
    if (set.size > best.size) best = set;
  }
  return best;
}
function clearRound(grid, W, H, ci, cj, r) {
  // pull the spot in from the edge so the whole circle fits
  ci = Math.max(Math.ceil(r) + 2, Math.min(W - Math.ceil(r) - 3, ci)); cj = Math.max(Math.ceil(r) + 2, Math.min(H - Math.ceil(r) - 3, cj));
  for (let j = Math.floor(cj - r); j <= cj + r; j++) for (let i = Math.floor(ci - r); i <= ci + r; i++) if (Math.hypot(i - ci, j - cj) <= r) grid[i + j * W] = 0;
  return [ci, cj];
}
// walking distance in cells from a cell to every other (-1 = can't get there)
export function bfs(grid, W, H, si, sj, out) {
  const d = out || new Int16Array(W * H); d.fill(-1); const q = new Int32Array(W * H); let h = 0, t = 0;
  const s = si + sj * W; if (grid[s]) return d; d[s] = 0; q[t++] = s;
  while (h < t) { const c = q[h++], i = c % W, j = (c - i) / W, dc = d[c] + 1;
    if (i > 0 && !grid[c - 1] && d[c - 1] < 0) { d[c - 1] = dc; q[t++] = c - 1; }
    if (i < W - 1 && !grid[c + 1] && d[c + 1] < 0) { d[c + 1] = dc; q[t++] = c + 1; }
    if (j > 0 && !grid[c - W] && d[c - W] < 0) { d[c - W] = dc; q[t++] = c - W; }
    if (j < H - 1 && !grid[c + W] && d[c + W] < 0) { d[c + W] = dc; q[t++] = c + W; } }
  return d;
}
// how much rock there is at a world point (0 open floor .. 1 solid rock), smooth between cell centres
export function density(F, x, z) {
  const u = x / CELL - 0.5, v = z / CELL - 0.5, i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, g = (a, b) => (a < 0 || b < 0 || a >= F.W || b >= F.H ? 1 : F.grid[a + b * F.W]);
  return (g(i, j) * (1 - fu) + g(i + 1, j) * fu) * (1 - fv) + (g(i, j + 1) * (1 - fu) + g(i + 1, j + 1) * fu) * fv;
}
export const solid = (F, x, z) => density(F, x, z) > 0.45;
export const cellOf = (x) => Math.floor(x / CELL);
export const centre = (i) => (i + 0.5) * CELL;
// slide a circle of radius r from (x, z) by (dx, dz) without walking into rock
export function slide(F, x, z, dx, dz, r) {
  const ok = (px, pz) => !solid(F, px + r * 0.7, pz) && !solid(F, px - r * 0.7, pz) && !solid(F, px, pz + r * 0.7) && !solid(F, px, pz - r * 0.7);
  let nx = x + dx, nz = z;
  if (!ok(nx, nz)) nx = x;
  nz = z + dz; if (!ok(nx, nz)) nz = z;
  return [nx, nz];
}
// a straight line between two points with no rock in the way
export function sight(F, x0, z0, x1, z1) { const d = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(d / 0.8); for (let k = 1; k < n; k++) if (solid(F, x0 + (x1 - x0) * k / n, z0 + (z1 - z0) * k / n)) return false; return true; }
