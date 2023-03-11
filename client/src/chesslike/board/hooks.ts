import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "preact/hooks";
import {
  ifElse,
  keys,
  lensPath,
  lensProp,
  over,
  range,
  set,
  when,
} from "ramda";
import { Observable } from "rxjs";

import { Axial, Hex } from "../../grid";
import { assert, pipeM } from "../../util";

import { SELECTED_HEX_COLOR, UNSELECTED_HEX_COLOR } from "../constants";
import * as State from "../state";
import { StateContext, useGameState } from "../state-provider";
import { Board, Piece } from "../types";
import { fromEntries, truthy } from "../util";

function equalsAtKeys<O extends {}>(fields: (keyof O)[], o1: O, o2: O) {
  return fields.every((k) => o1[k] === o2[k]);
}

function shallowEquals<O extends {}>(o1: O, o2: O) {
  return (
    keys(o1).every((k) => o1[k] === o2[k]) &&
    keys(o2).every((k) => o1[k] === o2[k])
  );
}

export type T = Board.T;

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

/**
 * Everything within `dist` except `piece` itself
 */
export function neighbors(dist: number, piece: Piece.T, board: T) {
  const hex = board.grid[piece.hexId];
  const pieces = Object.values(board.pieces);
  return range(1, dist + 1).flatMap((dist) =>
    Axial.ring(dist, hex.pos)
      .filter((a) => {
        const hexId = Axial.id(a);
        return Boolean(board.grid[hexId]);
      })
      .map((a) => {
        const hexId = Axial.id(a);
        return {
          hex: board.grid[hexId],
          piece: pieces.find((p) => p.hexId === hexId) ?? null,
        };
      })
  );
}

function toPiece(
  pieceId: Piece.Id,
  state: Pick<State.T, "board">
): Piece.WithHex {
  const { board } = state;
  const piece = board.pieces[pieceId];
  assert(piece);
  return {
    ...piece,
    hex: board.grid[piece.hexId],
  };
}

function toPieces(state: { board: State.T["board"] }) {
  const {
    board: { pieces },
  } = state;
  return fromEntries(
    Object.values(pieces).map((piece) => [piece.id, toPiece(piece.id, state)])
  );
}

export function usePieces() {
  return useGameState(toPieces, {
    distinct: (s1, s2) => s1.board.pieces === s2.board.pieces,
  });
}

export function usePiece(pieceId: Piece.Id) {
  return useGameState(
    useCallback((state) => toPiece(pieceId, state), [pieceId])
  );
}

function getBoardState(state: State.T) {
  const board = state.board;

  const pieceSelected = board.selectedPieceId
    ? board.pieces[board.selectedPieceId]
    : null;

  return {
    board,
    pieceSelected,
  };
}

function getSelectedPiece({ board }: Pick<State.T, "board">) {
  return board.selectedPieceId
    ? toPiece(board.selectedPieceId, { board })
    : null;
}

export function useStreamState<T>(stream: Observable<T>, defaultValue: T) {
  const [state, setState] = useState<T>(defaultValue);

  useEffect(() => {
    const sub = stream.subscribe({
      next: setState,
    });
    return () => sub.unsubscribe();
  }, [stream]);

  return state;
}

export function useGameStreamState<T>(
  xf: (stream: Observable<State.T>) => Observable<T>,
  defaultValue: T
) {
  const { stream } = useContext(StateContext);
  return useStreamState(
    useMemo(() => xf(stream), [stream, xf]),
    defaultValue
  );
}

export function useSelectedPiece() {
  return useGameState(getSelectedPiece);
}

export function useBoard() {
  const { setState } = useContext(StateContext);
  const selectedPiece = useSelectedPiece();
  const { board } = useGameState(getBoardState);

  const setBoard = useCallback(
    (reducer: (state: T) => T) => setState(over(lensProp("board"), reducer)),
    []
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

    selectedPiece,

    selectPiece: useCallback(
      (piece: Piece.T) => {
        const toggleSelected = pipeM<T>(
          (b) => highlightHex(piece.hexId, false, b),
          set(lensProp("selectedPieceId"), "")
        );

        const selectNewHex = pipeM<T>(
          when(
            () => Boolean(selectedPiece),
            (b) => highlightHex(selectedPiece!.hexId, false, b)
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
      [selectedPiece, highlightHex]
    ),

    moveSelectedPiece: useCallback(
      (hex: Hex.T) => {
        if (!selectedPiece) return;
        setBoard(
          pipeM(
            (b) => highlightHex(selectedPiece!.hexId, false, b),
            set(lensPath(["pieces", selectedPiece.id, "hexId"]), hex.id),
            set(lensProp("selectedPieceId"), "")
          )
        );
      },
      [selectedPiece, setBoard]
    ),
  };
}

function getHex(hexId: Hex.Id, state: State.T) {
  const {
    board: { grid, selectedPieceId, pieces },
  } = state;
  const hex = grid[hexId];
  const selected = Boolean(
    selectedPieceId && hexId === pieces[selectedPieceId].hexId
  );
  return {
    hex,
    selected,
  };
}

export function useHex(hexId: Hex.Id) {
  const { hex, selected } = useGameState(
    useCallback((state) => getHex(hexId, state), [hexId])
  );

  return {
    hex,
    selected,
  };
}

export function usePieceConnection(pieceId: Piece.Id) {
  const toLanguageConnection = useCallback(
    (state: State.T) => {
      const automaton = toPiece("piece-automaton", state);
      const piece = toPiece(pieceId, state);
      return piece.gives.language &&
        Axial.distance(automaton.hex.pos, piece.hex.pos) <= 1
        ? piece.gives.language
        : 0;
    },
    [pieceId]
  );

  return {
    language: useGameState(toLanguageConnection),
  };
}

function toConnection(state: Pick<State.T, "board">) {
  return State.neighborsGivesLanguage({ board: state.board }).map((piece) =>
    toPiece(piece.id, state)
  );
}

export function useConnections() {
  const languageConnections = useGameState(toConnection);
  return useMemo(
    () => ({
      language: languageConnections,
    }),
    [languageConnections]
  );
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
