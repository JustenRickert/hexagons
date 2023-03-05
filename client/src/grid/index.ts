import { assert, range, sample } from "../util";
import * as Axial from "./axial";
import * as Hex from "./hex";
import { PriorityQueue } from "./priority";
import * as Radian from "./radian";

export { Axial, Hex, Radian };

export namespace Grid {
  export interface T {
    ids: Axial.Id[];
    hexes: Record<Axial.Id, Hex.T>;
  }
}

function gridRingEmpties(dist: number, hex: Hex.T, grid: Grid.T): Axial.T[] {
  assert(dist > 0);
  return Axial.ring(dist, hex.pos).filter((ax) => !grid.hexes[Axial.id(ax)]);
}

function gridRing(dist: number, hex: Hex.T, grid: Grid.T): Hex.T[] {
  return Axial.ring(dist, hex.pos)
    .map((ax) => grid.hexes[Axial.id(ax)])
    .filter(Boolean);
}

// can probably by memoized ?
function neighbors(hex: Hex.T | Hex.Id, grid: Grid.T) {
  return gridRing(1, hex, grid);
}

function breadthFirst(
  grid: Grid.T,
  origin: Hex.T,
  options: {
    tap: (hex: Hex.T, extra: { neighbors: Hex.T[] }) => void;
    while?: (hex: Hex.T) => boolean;
  }
) {
  const frontier: Hex.T[] = [origin];
  const reached: Record<Axial.Id, Hex.T> = {};

  while (frontier.length) {
    let current = frontier.pop();
    if (!current) return;
    if (options.while && !options.while(current)) return;
    const ns = neighbors(current, grid);
    options.tap(current, {
      neighbors: ns,
    });
    reached[current.id] = current;
    for (const n of ns) {
      if (!reached[n.id]) frontier.unshift(n);
    }
  }
}

function traverse(
  grid: Grid.T,
  options: {
    tap?: (hex: Hex.T, extra: { neighbors: Hex.T[] }) => void;
    while?: (hex: Hex.T) => boolean;
  }
) {
  return breadthFirst(grid, Hex.ORIGIN, {
    tap: options.tap ?? (() => {}),
    while: () => true,
    ...options,
  });
  // let dist = 0;
  // tap(Hex.ORIGIN);
  // let hexes: Hex.T[];
  // do {
  //   dist++;
  //   hexes = gridRing(dist, Hex.ORIGIN, grid);
  //   hexes.forEach(tap);
  // } while (hexes.length);
}

function boundaryHexes(grid: Grid.T): Grid.T {
  const boundingHexes: Record<Axial.Id, Hex.T> = {};
  const boundingIds: Axial.Id[] = [];
  traverse(grid, {
    tap: (hex) => {
      const ns = neighbors(hex, grid);
      if (ns.length < 6) {
        if (hex.id in boundaryHexes) throw new Error("?");
        boundingIds.push(hex.id);
        boundingHexes[hex.id] = hex;
      }
    },
  });
  return {
    ids: boundingIds,
    hexes: boundingHexes,
  };
}

const GRAPH_COST = 1;

function path(from: Hex.T, to: Hex.T, grid: Grid.T) {
  const frontier = new PriorityQueue<Hex.T>();
  frontier.push(0, from);
  const cameFrom: Record<Hex.Id, Hex.T | null> = {};
  const costSoFar: Record<Hex.Id, number> = {};
  cameFrom[from.id] = null;
  costSoFar[from.id] = 0;

  let i = 0;
  while (frontier.size) {
    if (++i > 10e3) throw new Error("loop");
    const current = frontier.pop();
    if (current === to) break;
    for (const next of neighbors(current, grid)) {
      const newCost = costSoFar[current.id] + GRAPH_COST;
      if (!(next.id in costSoFar) || newCost < costSoFar[next.id]) {
        costSoFar[next.id] = newCost;
        const distance = Axial.distance(to.pos, next.pos);
        const priority = newCost + distance;
        frontier.push(priority, next);
        cameFrom[next.id] = current;
      }
    }
  }

  const path: Hex.T[] = [];
  let node: null | Hex.T = to;
  while (node) {
    path.unshift(node);
    node = cameFrom[node.id];
  }

  return path;
}

function fromHexes(hexes: Hex.T[]): Grid.T {
  const grid: Grid.T = {
    ids: [],
    hexes: {},
  };
  hexes.forEach((hex) => {
    grid.ids.push(hex.id);
    grid.hexes[hex.id] = hex;
  });
  return grid;
}

function add(g1: Grid.T, g2: Grid.T): Grid.T {
  // TODO add assertions about uniqueness?
  return {
    ids: [...g1.ids, ...g2.ids],
    hexes: {
      ...g1.hexes,
      ...g2.hexes,
    },
  };
}

function randomHexGrid(
  opts: { size: number },
  grid: Grid.T = {
    ids: [Hex.ORIGIN.id],
    hexes: {
      [Hex.ORIGIN.id]: Hex.ORIGIN,
    },
  }
): Grid.T {
  if (grid.ids.length >= opts.size) return grid;
  const remaining = opts.size - grid.ids.length;
  const bounds = boundaryHexes(grid);
  const from = grid.hexes[sample(bounds.ids)];
  let tries = 0;
  while (++tries < 50) {
    const distance = sample(range(1, Math.min(remaining + 1, 5)));
    const emptyOutOfBounds = gridRingEmpties(distance, from, grid);
    if (!emptyOutOfBounds.length) continue; // retry...
    const to = sample(emptyOutOfBounds);
    const newGrid = fromHexes(
      Axial.between(from.pos, to)
        .concat(to)
        .filter((a) => !grid.hexes[Axial.id(a)])
        .map((a) =>
          Hex.make({
            pos: a,
            color: "gray",
          })
        )
    );
    return randomHexGrid(opts, add(grid, newGrid));
  }
  throw new Error("didn't find out-of-bounds spot"); // TODO probably just retry from the top lol. Shouldn't realistically be possible
}

export const Grid = {
  randomHexGrid,
  // ring: gridRing,
  neighbors,
  traverse,
  path,
};
