import "./index.css";

import { useCallback, useEffect, useRef } from "preact/hooks";

import { Axial, Hex } from "../grid";

import { GameBoard } from "./board/component";
import { getSelectedPiece } from "./board/hooks";
import { useGameState } from "./state-provider";
import { PieceCard } from "./piece-card";
import { State } from "./types";
import { Icon } from "./svg-assets";

// TODO I think aesthetically I don't want this. We'll see
// function useDragPiece(view: RefObject<SVGElement>) {
//   useEffect(() => {
//     if (!view.current) return;

//     let down: null | [number, number];

//     const unsubscribe = mouseEvents(view.current, {
//       onDown(e) {
//         console.log(e);
//         down = [e.offsetX, e.offsetY];
//       },
//       onMove() {
//         assert(view.current);
//         if (!down) return;
//         // view.current.setAttribute(
//         //   "transform",
//         //   `translate(${-down[0]}, ${-down[1]})`
//         // );
//       },
//       onUp() {
//         assert(view.current);
//         down = null;
//         // view.current.setAttribute("transform", `translate(0, 0)`);
//       },
//     });

//     return unsubscribe;
//   }, []);
// }

namespace Game {
  function getGame(state: State.T) {
    return {
      automaton: state.automaton,
    };
  }

  export function useGame() {
    const { automaton } = useGameState(getGame);

    return {
      automaton,
    };
  }
}

// function ConnectionSquigglyLineSvg({ from, to }: { from: Hex.T; to: Hex.T }) {
//   const p1 = Axial.cartesian(from.pos);
//   const p2 = Axial.cartesian(to.pos);
//   const mid = Cartesian.mid(p1, p2);
//   const dist = Cartesian.dist(p1, p2);
//   const d = Cartesian.delta(p1, p2);
//   const dp = Cartesian.unit(Cartesian.perpendicular(d));
//   const c1 = { x: mid.x + (dist / 3) * dp.x, y: mid.y + (dist / 3) * dp.y };
//   const c2 = { x: mid.x - (dist / 3) * dp.x, y: mid.y - (dist / 3) * dp.y };

//   const path = [
//     `M ${p1.x} ${p1.y}`,
//     `C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`,
//   ].join(" ");

//   const opposite = [
//     `M ${p1.x} ${p1.y}`,
//     `C ${c2.x} ${c2.y}, ${c1.x} ${c1.y}, ${p2.x} ${p2.y}`,
//   ].join(" ");

//   const dur = useRef(deviate(3, 0.2) + "s");

//   const priorPath = useRef({
//     path,
//     opposite,
//   });

//   useEffect(() => {
//     dur.current = deviate(3, 0.2) + "s";

//     priorPath.current = {
//       path,
//       opposite,
//     };
//   }, [from, to]);

//   const id = `${from.id},${to.id}`;

//   return (
//     <path id={id} stroke="black" fill="transparent">
//       <animate
//         href={`#${id}`}
//         attributeName="d"
//         values={[path, opposite, path].join(";")}
//         dur={dur.current}
//         repeatCount="indefinite"
//       />
//     </path>
//   );
// }

function ConnectionIndicator({ from, to }: { from: Hex.T; to: Hex.T }) {
  const p1 = Axial.cartesian(from.pos);
  const p2 = Axial.cartesian(to.pos);

  const d = [`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`].join(" ");

  const priorD = useRef(d);

  useEffect(() => {
    priorD.current = d;
  }, [from, to]);

  const id = `${from.id},${to.id}`;

  return (
    <path
      d={d}
      id={id}
      stroke="black"
      style={{
        strokeDasharray: 10,
      }}
    >
      <animate
      // href={`#${id}`}
      // attributeName="d"
      // attributeType="XML"
      // from={priorD.current}
      // to={d}
      // // repeatCount={1}
      // // values={[priorD.current, d].join(";")}
      // dur="1s"
      // fill="freeze"
      />
    </path>
  );
}

function useSelectionWindowState() {
  const { automaton } = Game.useGame();
  const selected = useGameState(useCallback(getSelectedPiece, []));

  return {
    automaton,
    selected,
  };
}

function SelectionWindow() {
  const { automaton, selected } = useSelectionWindowState();

  console.log({
    automaton,
  });

  return (
    <div
      style={{
        position: "absolute",
      }}
    >
      <div class="card">
        <section>
          <Icon type="language" />
          {automaton.language.current}
          <Icon type="music" />
          {automaton.music.current}
          <Icon type="mathematics" />
          {automaton.mathematics.current}
        </section>
      </div>

      {selected && <PieceCard piece={selected} />}
    </div>
  );
}

export default function ChessLikeGame() {
  return (
    <div>
      <SelectionWindow />
      <GameBoard />
    </div>
  );
}
