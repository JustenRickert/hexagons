import "./component.css";

import { memo } from "preact/compat";
import { useCallback, useRef } from "preact/hooks";

import { Axial, Hex } from "../../grid";
import { HexSvg } from "../../grid/hex-svg";
import { ViewSvg } from "../../grid/view-svg";
import { Piece } from "../types";

import {
  useBoard,
  useBoardPiece,
  useHex,
  usePieceConnection,
  useSelectedPiece,
} from "./hooks";

const HexGridHex = memo(function HexGridHex({
  hexId,
  onClick,
  onRightClick,
}: {
  hexId: Hex.Id;
  onRightClick?: (h: Hex.T) => void;
  onClick: (h: Hex.T) => void;
}) {
  const { hex, selected } = useHex(hexId);
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
  const { board } = useBoard();
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
  const { pos } = useBoardPiece(piece.id);

  const connection = usePieceConnection(piece.id);

  const borderColor = connection.language ? "lightblue" : "black";

  const el = (
    <image
      style={{
        transform: "translate(-50px, -50px)",
      }}
      height={100}
      width={100}
      href={piece.image_path}
    />
  );

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
  const pieceSelected = useSelectedPiece();
  const {
    board: { pieces, grid },
    selectPiece,
    moveSelectedPiece,
  } = useBoard();

  const handleSelectHex = useCallback<(h: Hex.T) => void>(
    (hex) => {
      const pieceAtHex = Object.values(pieces).find((p) => p.hex_id === hex.id);
      if (pieceSelected && pieceSelected.hex_id !== hex.id) {
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
