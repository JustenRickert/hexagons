import "./component.css";

import { JSX, memo } from "preact/compat";
import { useCallback, useRef } from "preact/hooks";

import { Axial, Hex } from "../../grid";
import { HexSvg } from "../../grid/hex-svg";
import { ViewSvg } from "../../grid/view-svg";
import { Piece } from "../types";

import * as Board from "./board";

const HexGridHex = memo(function HexGridHex({
  hexId,
  onClick,
  onRightClick,
}: {
  hexId: Hex.Id;
  onRightClick?: (h: Hex.T) => void;
  onClick: (h: Hex.T) => void;
}) {
  const { hex, selected } = Board.useHex(hexId);
  return (
    <HexSvg
      selected={selected}
      hex={hex}
      onClick={onClick}
      onRightClick={onRightClick}
    />
  );
});

function HexGrid({
  onClickHex,
  onRightClickHex,
}: {
  onRightClickHex?: (h: Hex.T) => void;
  onClickHex: (h: Hex.T) => void;
}) {
  const { board } = Board.useBoard();
  return (
    <>
      <g class="hexes">
        {Object.values(board.grid).map((hex) => (
          <HexGridHex
            hexId={hex.id}
            key={hex.id}
            onClick={onClickHex}
            onRightClick={onRightClickHex}
          />
        ))}
      </g>
    </>
  );
}

function classes(cs: Record<string, boolean>) {
  return Object.entries(cs)
    .filter(([, c]) => c)
    .map(([k]) => k)
    .join(" ");
}

function PieceSvg({ piece }: { piece: Piece.T }) {
  const { pos } = Board.useBoardPiece(piece.id);
  let el: JSX.Element;

  const connection = Board.usePieceConnection(piece.id);

  const borderColor = connection.language ? "lightblue" : "black";

  // const pulseBorder = <animate attributeName="strokeWidth"></animate>

  switch (piece.id) {
    case "piece-automaton":
      el = <circle stroke={borderColor} r={25} />;
      break;
    case "piece-mom":
      el = (
        <polygon
          class={classes({
            "language-connection": Boolean(connection.language),
          })}
          points="0,-34 34,0 0,34 -34,0"
        />
      );
      break;
    case "piece-dad":
      el = (
        <polygon
          class={classes({
            "language-connection": Boolean(connection.language),
          })}
          stroke={borderColor}
          points="-25,-25 25,-25 25,25 -25,25"
        />
      );
      break;
    default:
      console.error("id `%s` not found", piece.id);
      throw new Error();
  }

  return (
    <g
      id={piece.id}
      class="piece-svg"
      style={{
        // filter: connection.language
        //   ? "drop-shadow(0 0 40px rgb(0 0 255 / 0.8))"
        //   : undefined,
        transform: Axial.translatef(pos, "px"),
      }}
    >
      {el}
    </g>
  );
}

export function GameBoard() {
  const ref = useRef<SVGSVGElement>(null);
  const {
    board: { pieces, grid },
    pieceSelected,
    selectPiece,
    moveSelectedPiece,
  } = Board.useBoard();

  const handleSelectHex = useCallback<(h: Hex.T) => void>(
    (hex) => {
      const pieceAtHex = Object.values(pieces).find((p) => p.hexId === hex.id);
      if (pieceSelected && pieceSelected.hexId !== hex.id) {
        if (!pieceAtHex) {
          console.log("moving?", { hex, pieceSelected });
          moveSelectedPiece(hex);
        }
        return;
      }
      if (!pieceAtHex) return;
      selectPiece(pieceAtHex);
    },
    [pieces, grid, selectPiece, pieceSelected, moveSelectedPiece]
  );

  return (
    <ViewSvg svgRef={ref} disabledPanning>
      <HexGrid onClickHex={handleSelectHex} />
      <PieceSvg piece={pieces["piece-automaton"]} />
      <PieceSvg piece={pieces["piece-mom"]} />
      <PieceSvg piece={pieces["piece-dad"]} />
    </ViewSvg>
  );
}
