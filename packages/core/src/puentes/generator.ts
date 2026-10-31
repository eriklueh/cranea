import { randInt, rngFrom, type Rng } from "../rng";
import { edgesCross, findEdges } from "./board";
import { solve } from "./solver";
import type { Island, PuentesConfig, PuentesPuzzle } from "./types";

const DIRS = [[0, 1], [1, 0], [0, -1], [-1, 0]] as const;

interface Draft {
  r: number;
  c: number;
}

/** Arma una red de puentes al azar: un árbol que crece desde una isla, más algunos ciclos. */
function buildNetwork(rng: Rng, cfg: PuentesConfig) {
  const { width: W, height: H } = cfg;
  const target = cfg.minIslands + randInt(rng, cfg.maxIslands - cfg.minIslands + 1);
  const cells = new Int16Array(W * H).fill(-1); // índice de isla
  const used = new Uint8Array(W * H); // celdas atravesadas por un puente
  const at = (r: number, c: number) => r * W + c;
  const inside = (r: number, c: number) => r >= 0 && r < H && c >= 0 && c < W;
  const islands: Draft[] = [];
  const links: { a: number; b: number; count: number }[] = [];

  const free = (r: number, c: number) => {
    if (!inside(r, c) || cells[at(r, c)] >= 0 || used[at(r, c)]) return false;
    // Sin islas pegadas: así cada puente se ve.
    return DIRS.every(([dr, dc]) => !inside(r + dr, c + dc) || cells[at(r + dr, c + dc)] < 0);
  };
  const add = (r: number, c: number) => {
    cells[at(r, c)] = islands.length;
    islands.push({ r, c });
    return islands.length - 1;
  };

  add(randInt(rng, H), randInt(rng, W));
  const maxDist = Math.max(2, Math.ceil(Math.max(W, H) / 2));
  for (let tries = 0; islands.length < target && tries < target * 60; tries++) {
    const from = randInt(rng, islands.length);
    const [dr, dc] = DIRS[randInt(rng, 4)];
    // Saltos cortos casi siempre: islas alineadas que se ven entre sí y abren alternativas.
    const dist = 2 + randInt(rng, rng() < 0.25 ? maxDist - 1 : Math.min(2, maxDist - 1));
    const { r, c } = islands[from];
    const tr = r + dr * dist;
    const tc = c + dc * dist;
    if (!free(tr, tc)) continue;
    let clear = true;
    for (let k = 1; k < dist && clear; k++) {
      const i = at(r + dr * k, c + dc * k);
      clear = cells[i] < 0 && !used[i];
    }
    if (!clear) continue;
    for (let k = 1; k < dist; k++) used[at(r + dr * k, c + dc * k)] = 1;
    const to = add(tr, tc);
    links.push({ a: from, b: to, count: rng() < cfg.doubleRate ? 2 : 1 });
  }
  if (islands.length < cfg.minIslands) return null;
  return { islands, links };
}

function tryBuild(rng: Rng, cfg: PuentesConfig): Omit<PuentesPuzzle, "id"> | null {
  const net = buildNetwork(rng, cfg);
  if (!net) return null;

  // Orden de lectura: fila por fila. Las conexiones se derivan de ese orden.
  const order = net.islands.map((_, i) => i).sort((x, y) => net.islands[x].r - net.islands[y].r || net.islands[x].c - net.islands[y].c);
  const rank = new Array<number>(order.length);
  order.forEach((old, i) => (rank[old] = i));
  const placed: Island[] = order.map((old) => ({ ...net.islands[old], n: 0 }));
  const edges = findEdges(placed);
  const bridges = edges.map(() => 0);
  const indexOf = (a: number, b: number) => edges.findIndex((e) => e.a === Math.min(a, b) && e.b === Math.max(a, b));
  for (const l of net.links) {
    const e = indexOf(rank[l.a], rank[l.b]);
    if (e < 0) return null;
    bridges[e] = l.count;
  }
  // Ciclos: puentes extra que no cortan a ninguno.
  edges.forEach((e, i) => {
    if (bridges[i] || rng() >= cfg.loopRate) return;
    if (edges.some((f, j) => bridges[j] && edgesCross(placed, e, f))) return;
    bridges[i] = rng() < cfg.doubleRate ? 2 : 1;
  });
  edges.forEach((e, i) => {
    placed[e.a].n += bridges[i];
    placed[e.b].n += bridges[i];
  });

  const res = solve(placed, edges, cfg.maxTier);
  if (!res.solved || res.tier < cfg.minTier) return null;
  if (res.bridges!.some((b, i) => b !== bridges[i])) return null;

  return {
    width: cfg.width,
    height: cfg.height,
    islands: placed,
    edges,
    solution: bridges,
    tier: res.tier,
    steps: res.steps,
    difficulty: res.steps + 3 * res.tier2Uses + 8 * res.tier3Uses + placed.length,
  };
}

/** Genera un tablero determinístico a partir de una semilla. */
export function generate(seed: string, cfg: PuentesConfig): PuentesPuzzle {
  const rng = rngFrom(seed);
  for (let attempt = 0; attempt < 4000; attempt++) {
    const p = tryBuild(rng, cfg);
    if (p) return { id: seed, ...p };
  }
  // Si la configuración es muy exigente, relajamos el mínimo de técnica.
  const relaxed = { ...cfg, minTier: 1 as const };
  for (let attempt = 0; attempt < 4000; attempt++) {
    const p = tryBuild(rng, relaxed);
    if (p) return { id: seed, ...p };
  }
  throw new Error(`No se pudo generar un tablero para ${seed}`);
}
