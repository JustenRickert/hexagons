import "./app.css";

import ChessLikeGame from "./chesslike";
import { Hex } from "./grid";

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

// export const HexGrid = memo(function HexGrid({
//   onClickHex,
// }: {
//   onClickHex: (hex: Hex.T) => void;
// }) {
//   const [board] = useAtom(Board.atom);
//   const player = usePlayer();
//   return (
//     <>
//       <g class="hexes">
//         {Object.values(board.grid.hexes).map((hex) => (
//           <HexSvg
//             key={hex.id}
//             hex={hex}
//             onClick={onClickHex}
//             onRightClick={player.move}
//           />
//         ))}
//       </g>
//     </>
//   );
// });

// function LinePathSvg({ path }: { path: Hex.T[] }) {
//   console.log(path);
//   return (
//     <g class="line-path">
//       {aperture(2, path).map(([from, to]) => {
//         const { x: x1, y: y1 } = Axial.cartesian(from.pos);
//         const { x: x2, y: y2 } = Axial.cartesian(to.pos);
//         return (
//           <line
//             key={`${from.id},${to.id}`}
//             x1={x1}
//             y1={y1}
//             x2={x2}
//             y2={y2}
//             stroke="black"
//             strokeWidth={8}
//             strokeLinecap="round"
//           />
//         );
//       })}
//     </g>
//   );
// }

// function PlayerGrid() {
//   const {
//     value: { rot, hexId, movement },
//   } = usePlayer();
//   const [board] = useAtom(Board.atom);
//   const hex = board.grid.hexes[hexId];

//   return (
//     <>
//       <g
//         class="player"
//         transform={[Axial.translatef(hex.pos), Radian.rotatef(rot)].join(" ")}
//       >
//         <polygon points="-25,25 25,25 0,-25" />;
//       </g>
//       {movement && <LinePathSvg path={[movement.start, ...movement.moves]} />}
//     </>
//   );
// }

// function move(player: Player, hex: Hex.T) {
//   return {
//     ...player,
//     hexId: hex.id,
//   };
// }

// function GameMode() {
//   const [selectedHex, setSelectedHex] = useState<null | Hex.T>(null);

//   useAtomEffects(Player.atom);

//   return (
//     <div>
//       {selectedHex && <LeftMenu hex={selectedHex} />}
//       <ViewSvg>
//         <HexGrid onClickHex={setSelectedHex} />
//         <PlayerGrid />
//       </ViewSvg>
//     </div>
//   );
// }
// <GameMode />

export function App() {
  return (
    <div>
      <ChessLikeGame />
    </div>
  );
}
