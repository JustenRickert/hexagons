import "./index.css";

import { useCallback, useEffect, useRef } from "preact/hooks";
import { add, lensPath, over, set } from "ramda";
import { map } from "rxjs";

import { Axial, Hex } from "../grid";
import { assert, pipeM } from "../util";

import { GameBoard } from "./board/component";
import { useGameStreamState, useSelectedPiece } from "./board/hooks";
import { usePieceConfig } from "./board/piece-config";
import { useGameState, useSetGameState } from "./state-provider";
import { Piece, State } from "./types";

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

function Interactions({
  interactions,
}: {
  interactions: Record<Piece.InteractionId, Piece.Interaction>;
}) {
  const setState = useSetGameState();
  const automaton = useGameState(useCallback((state) => state.automaton, []));

  const interactionList = useGameStreamState(
    useCallback(
      (stream) =>
        stream.pipe(
          map(({ board: { pieces }, automaton: { language_alltime } }) =>
            Object.values(interactions).filter((int) => {
              assert(int.owner in pieces, {
                interaction: int,
                pieces,
              });
              return (
                !pieces[int.owner].interactionsCompleted[int.id] &&
                (1 / 10) * int.cost.language < language_alltime
              );
            })
          )
        ),
      []
    ),
    []
  );

  const interaction = useCallback(
    (int: Piece.Interaction) =>
      setState(
        pipeM(
          set(
            lensPath([
              "board",
              "pieces",
              int.owner,
              "interactionsCompleted",
              int.id,
            ]),
            true
          ),
          over(lensPath(["automaton", "language"]), add(-int.cost.language))
        )
      ),
    []
  );

  return (
    <ul>
      {interactionList.map((int) => (
        <li key={int.id}>
          <button
            title={int.flavor_text}
            disabled={int.cost.language > automaton.language}
            onClick={() => interaction(int)}
          >
            <div>{int.name}</div>
            <div>{int.cost.language}</div>
          </button>
        </li>
      ))}
    </ul>
  );
}

function Description({ selectedPiece }: { selectedPiece: Piece.WithHex }) {
  const config = usePieceConfig(selectedPiece?.id);
  if (!config) return null;
  return (
    <>
      {config && <p>{config.description}</p>}
      <Interactions interactions={config.interactions} />
    </>
  );
}

function SelectionWindow() {
  const { automaton } = Game.useGame();
  const selectedPiece = useSelectedPiece();

  return (
    <div
      style={{
        position: "absolute",
      }}
    >
      <div class="card">
        <section>Acquired language: {automaton.language}</section>
      </div>

      {selectedPiece && (
        <div class="card">
          <section>
            <h3>{selectedPiece.id}</h3>
            <Description selectedPiece={selectedPiece} />
          </section>
        </div>
      )}
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
