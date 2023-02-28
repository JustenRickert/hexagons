import { JSX, RefObject } from "preact";
import { useCallback, useEffect, useMemo, useRef } from "preact/hooks";

import { makeAtom, useAtom } from "../game/state";
import { Axial, Hex } from "../grid";
import { HexSvg } from "../grid/hex-svg";
import { ViewSvg } from "../grid/view-svg";
import { assert, mouseEvents } from "../util";

import * as Board from "./board";

// TODO
function useDragPiece(view: RefObject<SVGElement>) {
  useEffect(() => {
    if (!view.current) return;

    let down: null | [number, number];

    const unsubscribe = mouseEvents(view.current, {
      onDown(e) {
        console.log(e);
        down = [e.offsetX, e.offsetY];
      },
      onMove() {
        assert(view.current);
        if (!down) return;
        // view.current.setAttribute(
        //   "transform",
        //   `translate(${-down[0]}, ${-down[1]})`
        // );
      },
      onUp() {
        assert(view.current);
        down = null;
        // view.current.setAttribute("transform", `translate(0, 0)`);
      },
    });

    return unsubscribe;
  }, []);
}

function PieceSvg({ piece }: { piece: Board.Piece }) {
  const { pos } = Board.useBoardPiece(piece.id);
  let el: JSX.Element;
  switch (piece.id) {
    case "piece-automaton":
      el = <circle r={25} />;
      break;
    case "piece-mom":
      el = <polygon points="0,-34 34,0 0,34 -34,0" />;
      break;
    case "piece-dad":
      el = <polygon points="-25,-25 25,-25 25,25 -25,25" />;
      break;
    default:
      console.error("id `%s` not found", piece.id);
      throw new Error();
  }
  return (
    <g
      style={{
        transition: "transform 100ms",
        pointerEvents: "none",
      }}
      transform={Axial.translatef(pos)}
    >
      {el}
    </g>
  );
}

function HexGrid({
  onClickHex,
  onRightClickHex,
}: {
  onRightClickHex?: (h: Hex.T) => void;
  onClickHex: (h: Hex.T) => void;
}) {
  const [board] = useAtom(Board.atom);
  return (
    <>
      <g class="hexes">
        {Object.values(board.grid).map((hex) => (
          <HexSvg
            key={hex.id}
            hex={hex}
            onClick={onClickHex}
            onRightClick={onRightClickHex}
          />
        ))}
      </g>
    </>
  );
}

namespace Game {
  const atom = makeAtom({
    key: "automaton",
    defaultValue: {
      automaton: {
        language: 0,
      },
    },
  });

  export function useAutomatonLanguageGeneration() {
    const { board } = Board.useBoard();
    const automaton = board.pieces["piece-automaton"];
    const neighbors = useMemo(
      () => Board.piecesNeighbors(automaton, board),
      [automaton, board]
    );
  }

  export function useGame() {
    const [game, setGame] = useAtom(atom);
    return {
      game,
    };
  }
}

export default function ChessLikeGame() {
  const ref = useRef<SVGSVGElement>(null);
  const {
    board: { pieces, grid },
    pieceSelected,
    selectPiece,
    moveSelectedPiece,
  } = Board.useBoard();

  const { game } = Game.useGame();

  const handleSelectHex = useCallback<(h: Hex.T) => void>(
    (hex) => {
      const pieceAtHex = Object.values(pieces).find((p) => p.hexId === hex.id);
      if (pieceSelected && pieceSelected.hexId !== hex.id) {
        if (!pieceAtHex) moveSelectedPiece(hex);
        return;
      }
      if (!pieceAtHex) return;
      selectPiece(pieceAtHex);
    },
    [pieces, grid, selectPiece, pieceSelected, moveSelectedPiece]
  );

  return (
    <div>
      <div style={{ position: "absolute" }}>
        Acquired language: {game.automaton.language}
      </div>
      <ViewSvg svgRef={ref} disabledPanning>
        <HexGrid onClickHex={handleSelectHex} />
        <PieceSvg piece={pieces["piece-automaton"]} />
        <PieceSvg piece={pieces["piece-mom"]} />
        <PieceSvg piece={pieces["piece-dad"]} />
      </ViewSvg>
    </div>
  );
}
