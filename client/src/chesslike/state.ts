import { add, lensPath, over, set } from "ramda";
import { distinct, from, map, mergeMap, Observable } from "rxjs";

import { Axial, Hex } from "../grid";
import * as Util from "../util";

import { neighbors } from "./board/hooks";
import { getPieceConfig, getAllPieceInteractions } from "./pieces";
import { PieceId } from "./pieces/constant";
import { Automaton, Board, Piece, State } from "./types";
import { fromEntries, interval } from "./util";

export type T = State.T;

const defaultHexes = [
  Hex.make({ pos: { q: 0, r: 0 } }),
  ...Axial.ring(1, { q: 0, r: 0 }).map((pos) => Hex.make({ pos })),
].map(Hex.make);

function fromConfig(id: Piece.Id) {
  const c = getPieceConfig(id);
  return {
    base_gives: {
      language: 0,
      mathematics: 0,
      music: 0,
      ...c.gives,
    },
    id: c.id,
    stray_movement: c.stray_movement,
    interactions_completed: {},
    image_path: c.image_path ?? "../svg-assets/mom.svg",
  };
}

const defaultPieces: Piece.T[] = [
  fromConfig("piece-automaton"),
  fromConfig("piece-mom"),
  fromConfig("piece-dad"),
].map((piece, i) => ({
  ...piece,
  hex_id: defaultHexes[i].id,
}));

export function makeBoard(): Board.T {
  return {
    selectedPieceId: "",
    pieces: Object.fromEntries(defaultPieces.map((p) => [p.id, p])),
    grid: Object.fromEntries(defaultHexes.map((hex) => [hex.id, hex])),
  };
}

function makeAutomaton(): Automaton.T {
  return {
    language: {
      current: 1e3,
      alltime: 1e3,
    },
    mathematics: {
      current: 0,
      alltime: 0,
    },
    music: {
      current: 0,
      alltime: 0,
    },
  };
}

function make(): State.T {
  return {
    automaton: makeAutomaton(),
    board: makeBoard(),
  };
}

export const defaultState = make();

function sumWith<T>(fn: (t: T) => number, ts: T[]) {
  return ts.reduce((ss, t) => fn(t) + ss, 0);
}

type StateEffect = (
  state$: Observable<State.T>
) => Observable<(reducer: State.T) => State.T>;

export function pieceGives(piece: Piece.T, state: State.T) {
  const giveKeys = ["language", "mathematics", "music"] as const;

  const interactions = getAllPieceInteractions(piece.id).filter((int) =>
    interactionCompleted(int, state)
  );

  const fromPiece = fromEntries(
    giveKeys.map((key) => [key, piece.base_gives[key] ?? 0])
  );

  const fromInteractions = sumRecords(interactions.map((int) => int.gives));

  return sumRecords([fromPiece, fromInteractions]);
}

function sumRecords<K extends string>(records: Record<K, number>[]) {
  const ss: Record<string, number> = {};
  for (const r of records)
    for (const [k, n] of Util.entries(r)) {
      if (!(k in ss)) ss[k] = 0;
      ss[k] += n;
    }
  return ss as Record<K, number>;
}

function interactionCompleted(int: Piece.Interaction, state: State.T) {
  return state.board.pieces[int.owner].interactions_completed[int.id] ?? false;
}

export const effects: StateEffect[] = [
  function automatonLanguageGiving(_state$) {
    return interval(1e3).pipe(
      map(() => (state) => {
        const ns = neighbors(1, PieceId.Automaton, state.board);
        const interactions = ns
          .flatMap(({ piece }) =>
            piece ? getAllPieceInteractions(piece.id) : []
          )
          .filter((int) => interactionCompleted(int, state));

        const gives_base_piece_delta = sumRecords(
          ns.flatMap((n) => (n.piece ? n.piece.base_gives : []))
        );
        const gives_interaction_delta = sumRecords(
          interactions.map((int) => int.gives)
        );
        const delta = sumRecords([
          gives_base_piece_delta,
          gives_interaction_delta,
        ]);

        const xf = Util.pipeM(
          ...Util.entries(delta).flatMap(([key, gives]) =>
            Util.pipeM(
              over(lensPath(["automaton", key, "current"]), add(gives)),
              over(lensPath(["automaton", key, "alltime"]), add(gives))
            )
          )
        );

        return xf(state);
      })
    );
  },

  function pieceStrayMovement(state$) {
    return state$.pipe(
      mergeMap((state) =>
        from(
          Util.keys(state.board.pieces).filter(
            (pieceId) => state.board.pieces[pieceId].stray_movement
          )
        )
      ),
      distinct(),
      mergeMap((pieceId) =>
        interval(10e3, { deviation: 0.8 }).pipe(
          map((since) => ({
            since,
            pieceId,
          }))
        )
      ),
      map(({ since: _since, pieceId }) => (state) => {
        const possible = neighbors(1, pieceId, state.board).filter(
          (n) => !n.piece
        );
        if (!possible.length) return state;
        const hex = Util.sample(possible).hex;
        return set(
          lensPath(["board", "pieces", pieceId, "hex_id"]),
          hex.id,
          state
        );
      })
    );
  },
];
