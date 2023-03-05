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
import { distinctUntilChanged, map } from "rxjs";

import { Axial, Hex } from "../../grid";
import { assert, pipeM } from "../../util";

import { SELECTED_HEX_COLOR, UNSELECTED_HEX_COLOR } from "../constants";
import * as State from "../state";
import { StateContext } from "../state-provider";
import { Board, Piece } from "../types";
import { fromEntries, truthy, useLatest } from "../util";

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

function toPiece(pieceId: Piece.Id, state: Pick<State.T, "board">) {
  const { board } = state;
  const piece = board.pieces[pieceId];
  assert(piece);
  return {
    ...piece,
    hex: board.grid[piece.hexId],
  };
}

function toPieces(state: State.T) {
  const {
    board: { pieces },
  } = state;
  return fromEntries(
    Object.values(pieces).map((piece) => [piece.id, toPiece(piece.id, state)])
  );
}

export function usePieces() {
  const { stream, defaultState } = useContext(StateContext);
  return useLatest(
    stream.pipe(
      distinctUntilChanged((s1, s2) => equalsAtKeys(["board"], s1, s2)),
      map(toPieces)
    ),
    () => toPieces(defaultState)
  );
}

export function usePiece(pieceId: Piece.Id) {
  const { stream, defaultState } = useContext(StateContext);
  return useLatest(
    stream.pipe(
      map((state) => toPiece(pieceId, state)),
      distinctUntilChanged(shallowEquals)
    ),
    () => toPiece(pieceId, defaultState)
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

export function useBoard() {
  const { stream, setState, defaultState } = useContext(StateContext);

  const { board, pieceSelected } = useLatest(
    stream.pipe(map(getBoardState)),
    () => getBoardState(defaultState)
  );

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
  const { stream, defaultState } = useContext(StateContext);
  const [{ hex, selected }, setLocal] = useState(() =>
    getHex(hexId, defaultState)
  );

  useEffect(() => {
    stream
      .pipe(
        map((state) => getHex(hexId, state)),
        distinctUntilChanged(shallowEquals)
      )
      .subscribe({
        next: setLocal,
      });
  }, [stream, hexId]);

  return {
    hex,
    selected,
  };
}

export function usePieceConnection(pieceId: Piece.Id) {
  const { stream, defaultState } = useContext(StateContext);

  const toLanguageConnection = (state: State.T) => {
    const automaton = toPiece("piece-automaton", state);
    const piece = toPiece(pieceId, state);
    return piece.gives.language &&
      Axial.distance(automaton.hex.pos, piece.hex.pos) <= 1
      ? piece.gives.language
      : 0;
  };

  const languageConnection = useLatest(
    stream.pipe(map((state) => toLanguageConnection(state))),
    () => toLanguageConnection(defaultState)
  );

  return {
    language: languageConnection,
  };
}

function toConnection(state: Pick<State.T, "board">) {
  return State.givesLanguage({ board: state.board }).map((piece) =>
    toPiece(piece.id, state)
  );
}

export function useConnections() {
  const { stream, defaultState } = useContext(StateContext);
  const languageConnections = useLatest(
    stream.pipe(
      distinctUntilChanged((s1, s2) => equalsAtKeys(["board"], s1, s2)),
      map((state) => toConnection({ board: state.board }))
    ),
    () => toConnection(defaultState)
  );
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
