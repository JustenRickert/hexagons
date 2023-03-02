import { useCallback, useMemo } from "preact/hooks";
import { ifElse, lensPath, lensProp, over, set, when } from "ramda";
import { useAtom } from "../game/state";
import { Axial, Hex } from "../grid";
import { assert, pipeM } from "../util";
import { SELECTED_HEX_COLOR, UNSELECTED_HEX_COLOR } from "./constants";
import * as State from "./state";
import { Board, Piece } from "./types";

export type T = Board.T;

function truthy<T>(t: T | undefined): t is T {
  return Boolean(t);
}

function piecesRing(dist: number, piece: Piece.T, board: T) {
  const hex = board.grid[piece.hexId];
  assert(hex);
  const pieces = Object.values(board.pieces);
  return Axial.ring(dist, hex.pos)
    .map((pos) => pieces.find((p) => p.hexId === Axial.id(pos)))
    .filter(truthy);
}

export function piecesNeighbors(piece: Piece.T, board: T) {
  return piecesRing(1, piece, board);
}

// export function useGridIdList() {
//   const [{ board }] = useAtom(State.atom);
//     return useMemo(() => Object.values(board.grid), []) ;
// }

export function useBoard() {
  const [
    {
      board,
      board: { selectedPieceId, pieces },
    },
    setState,
  ] = useAtom(State.atom);

  const setBoard = useCallback(
    (reducer: (state: T) => T) => setState(over(lensProp("board"), reducer)),
    []
  );

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
      (piece: Piece.T) => {
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

export function useBoardPiece(pieceId: Piece.Id) {
  const { board } = useBoard();
  const piece = board.pieces[pieceId];
  assert(piece);
  return useMemo(() => {
    return {
      ...piece,
      pos: board.grid[piece.hexId].pos,
    };
  }, [piece, board]);
}
