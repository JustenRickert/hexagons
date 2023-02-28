import { useCallback, useMemo } from "preact/hooks";
import { ifElse, lensPath, lensProp, set, when } from "ramda";
import { makeAtom, useAtom } from "../game/state";
import { Axial, Hex } from "../grid";
import { assert, pipeM } from "../util";

export type PieceId = `piece-${string}`;

export interface Piece {
  id: PieceId;
  hexId: Hex.Id;
}

export interface T {
  selectedPieceId: "" | PieceId;
  grid: Record<Hex.Id, Hex.T>;
  pieces: Record<PieceId, Piece>;
}

function piecesRing(dist: number, piece: Piece, board: T) {
  const hex = board.grid[piece.hexId];
  assert(hex);
  const pieces = Object.values(board.pieces);
  return Axial.ring(dist, hex.pos)
    .map((pos) => pieces.find((p) => p.hexId === Axial.id(pos)))
    .filter(Boolean);
}

export function piecesNeighbors(piece: Piece, board: T) {
  return piecesRing(1, piece, board);
}

const UNSELECTED_HEX_COLOR = "lightgray";
const SELECTED_HEX_COLOR = "yellow";

const defaultHexes = [
  Hex.make({ pos: { q: 0, r: 0 }, color: UNSELECTED_HEX_COLOR }),
  ...Axial.ring(1, { q: 0, r: 0 }).map((pos) =>
    Hex.make({ pos, color: UNSELECTED_HEX_COLOR })
  ),
].map(Hex.make);

const defaultPieces: Piece[] = [
  {
    id: "piece-automaton",
    hexId: defaultHexes[0].id,
  },
  {
    id: "piece-mom",
    hexId: defaultHexes[1].id,
  },
  {
    id: "piece-dad",
    hexId: defaultHexes[2].id,
  },
];

export function make(): T {
  return {
    selectedPieceId: "",
    pieces: Object.fromEntries(defaultPieces.map((p) => [p.id, p])),
    grid: Object.fromEntries(defaultHexes.map((hex) => [hex.id, hex])),
  };
}

export const atom = makeAtom({
  key: "chesslike-board",
  defaultValue: make(),
  effects: [],
});

export function useBoard() {
  const [board, setBoard] = useAtom(atom);
  const { selectedPieceId, pieces } = board;

  const pieceSelected = useMemo(
    () => (selectedPieceId ? pieces[selectedPieceId] : null),
    [selectedPieceId, pieces]
  );

  const highlightHex = useCallback(
    (hexId: Hex.Id, highlight: boolean, board: T) =>
      set(
        lensPath(["grid", hexId, "color"]),
        highlight ? SELECTED_HEX_COLOR : UNSELECTED_HEX_COLOR,
        board
      ),
    []
  );

  return {
    board,
    pieceSelected,
    selectPiece: useCallback(
      (piece: Piece) => {
        const toggleSelected = pipeM<T>(
          (b) => highlightHex(piece.hexId, false, b),
          set(lensProp("selectedPieceId"), "")
        );

        const selectNewHex = pipeM<T>(
          when(
            () => Boolean(pieceSelected),
            (b) => highlightHex(pieceSelected!.hexId, false, b)
          ),
          (b) => highlightHex(piece.hexId, true, b),
          set(lensProp("selectedPieceId"), piece.id)
        );

        setBoard(
          ifElse(
            (b) => b.selectedPieceId === piece.id,
            toggleSelected,
            selectNewHex
          )
        );
      },
      [pieceSelected, highlightHex]
    ),
    moveSelectedPiece: useCallback(
      (hex: Hex.T) => {
        if (!pieceSelected) return;
        setBoard(
          pipeM(
            (b) => highlightHex(pieceSelected.hexId, false, b),
            set(lensPath(["pieces", pieceSelected.id, "hexId"]), hex.id),
            set(lensProp("selectedPieceId"), "")
          )
        );
      },
      [pieceSelected]
    ),
  };
}

export function useBoardPiece(pieceId: PieceId) {
  const [board, setBoard] = useAtom(atom);
  const piece = board.pieces[pieceId];
  assert(piece, {
    piece,
    board,
  });
  return {
    ...piece,
    pos: board.grid[piece.hexId].pos,
  };
}
