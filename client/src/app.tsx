import { useState } from "preact/hooks";
import "./app.css";
import { makeAtom, useAtom } from "./game/state";
import { Axial, Grid, Hex, HexGrid } from "./grid";
import { ORIGIN } from "./grid/hex";
import { SvgView } from "./grid/svg-view";

// export interface Grid {
//   hexes: Record<AxialId, Hex>;
// }

// const DEFAULT_HEXES: Record<AxialId, Hex> = {
//   [`0,0`]: ORIGIN,
//   ...ring(1, ORIGIN.pos).reduce((neighbors, a) => {
//     const h = hex({
//       pos: a,
//       color: sample(["red", "yellow", "green", "orange"]),
//     });
//     return {
//       ...neighbors,
//       [h.id]: h,
//     };
//   }, {} as Record<AxialId, Hex>),
//   ...ring(2, ORIGIN.pos).reduce((neighbors, a) => {
//     const h = hex({
//       pos: a,
//       color: "gray",
//     });
//     return {
//       ...neighbors,
//       [h.id]: h,
//     };
//   }, {} as Record<AxialId, Hex>),
// };

// const DEFAULT_GRID = {
//   ids: keys(DEFAULT_HEXES),
//   hexes: DEFAULT_HEXES,
// };

function timeFn<F extends (a: any) => any>(name: string, fn: F) {
  return (...args: Parameters<F>) => {
    const start = performance.now();
    const result = fn.apply(null, args);
    console.log("%s took %sms", name, performance.now() - start);
    return result;
  };
}

function LeftMenu({ hex }: { hex: Hex.T }) {
  return (
    <div className="left-menu">
      {hex.color}
      {"HEX SELECTED"}
    </div>
  );
}

function MenuMode() {}

const defaultGrid = Grid.randomHexGrid({
  size: 50,
});

// let i = 0;
// const start = performance.now();
// Grid.traverse(defaultGrid, {
//   tap(hex) {
//     i++;
//     hex.color = `rgb(${255 - (255 / 40) * i}, 0, 0)`;
//     if (i === 15) return false;
//   },
//   while: () => i < 40,
// });
// console.log("took %sms", performance.now() - start);

interface Player {
  hexId: Hex.Id;
}

const player$ = makeAtom<Player>("player", {
  hexId: ORIGIN.id,
});

function Player({ grid }: { grid: Grid.T }) {
  const [player] = useAtom(player$);
  const hex = grid.hexes[player.hexId];

  return (
    <g class="player" transform={Axial.translatef(hex.pos)}>
      <polygon points="-25,25 25,25 0,-25" />;
    </g>
  );
}

// function move(player: Player, hex: Hex.T) {
//   return {
//     ...player,
//     hexId: hex.id,
//   };
// }

function GameMode() {
  const [selectedHex, setSelectedHex] = useState<null | Hex.T>(null);
  const [grid, setGrid] = useState<Grid.T>(defaultGrid);
  const [, setPlayer] = useAtom(player$);

  const rightClickHex = (hex: Hex.T) => {
    setPlayer((state) => ({
      ...state,
      hexId: hex.id,
    }));
  };

  return (
    <div>
      {selectedHex && <LeftMenu hex={selectedHex} />}
      <SvgView>
        <HexGrid
          hexes={grid.hexes}
          onClickHex={setSelectedHex}
          onRightClickHex={rightClickHex}
        />
        <Player grid={grid} />
      </SvgView>
    </div>
  );
}

export function App() {
  return (
    <div>
      <GameMode />
    </div>
  );
}
