import { useMemo } from "preact/hooks";
import { Grid, Hex } from "../grid";
import { makeAtom, useAtom } from "./state";

interface Border {
  sides: [Hex.Id, Hex.Id];
}

type BorderId = `${Hex.Id},${Hex.Id}`;

interface T {
  grid: Grid.T;
  borders: Record<BorderId, Border>;
}

function makeBorders(grid: Grid.T) {
  const borders: Record<BorderId, Border> = {};
  Grid.traverse(grid, {
    tap(hex, { neighbors }) {
      for (const n of neighbors) {
        const id: BorderId = `${n.id},${hex.id}`;
        const idi: BorderId = `${hex.id},${n.id}`;
        if (!(id in borders) && !(idi in borders)) {
          borders[id] = {
            sides: [n.id, hex.id],
          };
        }
      }
    },
  });
  return borders;
}

const defaultGrid = Grid.randomHexGrid({ size: 50 });

const defaultBoard = {
  grid: defaultGrid,
  borders: makeBorders(defaultGrid),
};

// export const atom = makeAtom<T>("board", defaultBoard);

export function useHexIds() {
  const [
    {
      grid: { ids },
    },
    setBoard,
  ] = useAtom(atom);
  return useMemo(
    () => [
      ids,
      (ids: Hex.Id[]) =>
        setBoard((board) => ({
          ...board,
          ids,
        })),
    ],
    [ids]
  );
}

export function useHex(id: Hex.Id) {
  const [
    {
      grid: { hexes },
    },
    setBoard,
  ] = useAtom(atom);
  const hex = hexes[id];
  return useMemo(
    () => [
      hex,
      (xf: (h: Hex.T) => Hex.T) =>
        setBoard((board) => ({
          ...board,
          grid: {
            ...board.grid,
            hexes: {
              ...board.grid.hexes,
              [id]: xf(hexes[id]),
            },
          },
        })),
    ],
    [hex]
  );
}
