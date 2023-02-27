import { RefObject } from "preact";
import { useCallback, useEffect, useRef } from "preact/hooks";
import { ifElse, lensPath, lensProp, set, when } from "ramda";
import { makeAtom, useAtom } from "../game/state";
import { Axial, Hex } from "../grid";
import { HexSvg } from "../grid/hex-svg";
import { ViewSvg } from "../grid/view-svg";
import { assert, mouseEvents, pipeM } from "../util";

interface Piece {
  id: string;
  pos: Axial.T;
}

namespace Board {
  export interface T {
    selectedHexId: "" | Hex.Id;
    grid: Record<Hex.Id, Hex.T>;
    pieces: Record<string, Piece>;
  }

  const UNSELECTED_HEX_COLOR = "lightgray";
  const SELECTED_HEX_COLOR = "yellow";

  const defaultPieces = [
    {
      id: "first",
      pos: { q: 1, r: 1 },
    },
  ];

  const defaultHexes = [
    ...[1, 2, 3].flatMap((ringSize) =>
      Axial.ring(ringSize, { q: 0, r: 0 }).map((pos) =>
        Hex.make({ pos, color: UNSELECTED_HEX_COLOR })
      )
    ),
  ].map(Hex.make);

  export function make(): T {
    return {
      selectedHexId: "",
      pieces: defaultPieces.reduce<Record<string, Piece>>(
        (grid, hex) => ({
          ...grid,
          [hex.id]: hex,
        }),
        {}
      ),
      // grid: xprod(range(-2, 2), range(-2, 2))
      //   .map(([q, r]) =>
      //     Hex.make({
      //       // pos: { q: q - Math.floor(r / 2), r },
      //       pos: { q, r },
      //       color: "gray",
      //     })
      //   )
      grid: defaultHexes.reduce<Record<Hex.Id, Hex.T>>(
        (grid, hex) => ({
          ...grid,
          [hex.id]: hex,
        }),
        {}
      ),
    };
  }

  export const atom = makeAtom("chesslike-board", Board.make(), []);

  export function useBoard() {
    const [board, setBoard] = useAtom(atom);

    return {
      board,
      selectHex: useCallback((hex: Hex.T) => {
        const toggleSelected = pipeM<T>(
          set(lensPath(["grid", hex.id, "color"]), UNSELECTED_HEX_COLOR),
          set(lensProp("selectedHexId"), "")
        );

        const selectNewHex = pipeM<T>(
          when(
            (b) => Boolean(b.selectedHexId),
            (b) =>
              set(
                lensPath(["grid", b.selectedHexId, "color"]),
                UNSELECTED_HEX_COLOR,
                b
              )
          ),
          set(lensPath(["grid", hex.id, "color"]), SELECTED_HEX_COLOR),
          set(lensProp("selectedHexId"), hex.id)
        );

        setBoard(
          ifElse(
            (b) => b.selectedHexId === hex.id,
            toggleSelected,
            selectNewHex
          )
        );
      }, []),
    };
  }
}

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

function PieceSvg({ piece }: { piece: Piece }) {
  const { x, y } = Axial.cartesian(piece.pos);
  return (
    <circle
      style={{
        pointerEvents: "none",
      }}
      cx={x}
      cy={y}
      r={40}
    />
  );
}

function HexGrid({ onClick }: { onClick: (h: Hex.T) => void }) {
  const [board] = useAtom(Board.atom);
  return (
    <>
      <g class="hexes">
        {Object.values(board.grid).map((hex) => (
          <HexSvg
            key={hex.id}
            hex={hex}
            onClick={onClick}
            // onRightClick={}
          />
        ))}
      </g>
    </>
  );
}

export default function ChessLikeGame() {
  const ref = useRef<SVGSVGElement>(null);
  const {
    board: { pieces, grid },
    selectHex,
  } = Board.useBoard();

  const handleSelectHex = useCallback<(h: Hex.T) => void>(
    (hex) => {
      // TODO need better way to do this?
      const isPieceAtHex = Object.values(pieces).some(
        (p) => Axial.id(p.pos) === hex.id
      );
      if (isPieceAtHex) selectHex(hex);
    },
    [pieces, grid, selectHex]
  );

  return (
    <div>
      <ViewSvg svgRef={ref} disabledPanning>
        <HexGrid onClick={handleSelectHex} />
        <PieceSvg piece={pieces["first"]} />
      </ViewSvg>
    </div>
  );
}
