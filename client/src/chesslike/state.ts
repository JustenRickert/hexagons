import { add, lensPath, over, set } from "ramda";
import { distinct, from, map, mergeMap, Observable } from "rxjs";

import { Axial, Hex } from "../grid";
import * as Util from "../util";

import { neighbors } from "./board/hooks";
import {
  getPieceConfig,
  getPieceInteractionConfig,
} from "./board/piece-config";
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
    baseGives: c.gives,
    id: c.id,
    strayMovement: c.strayMovement,
  };
}

const defaultPieces: Piece.T[] = [
  fromConfig("piece-automaton"),
  fromConfig("piece-mom"),
  fromConfig("piece-dad"),
].map((piece, i) => ({
  ...piece,
  hexId: defaultHexes[i].id,
  interactionsCompleted: {},
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
    language: 0,
    language_alltime: 0,
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

type GivesLanguage<T> = T & { gives: { language: number } };

export function neighborsGivesLanguage({
  board,
}: Pick<State.T, "board">): GivesLanguage<Piece.T>[] {
  return neighbors(1, board.pieces["piece-automaton"], board)
    .filter((n) => n.piece?.baseGives.language)
    .map((n) => n.piece! as GivesLanguage<Piece.T>);
}

function sumRecords<K extends string>(records: Record<K, number>[]) {
  const ss: Record<string, number> = {};
  for (const r of records)
    for (const [k, n] of Util.entries(r)) {
      if (!(k in ss)) ss[k] = 0;
      ss[k] += n;
    }
  return ss;
}

export function pieceGives(pieceId: Piece.Id, state: State.T) {
  const piece = state.board.pieces[pieceId];
  const giveKeys: (keyof Piece.Gives)[] = ["language"];
  const base = fromEntries(
    giveKeys.map((key) => [key, piece.baseGives[key] ?? 0])
  );

  const interactions = Util.keys(piece.interactionsCompleted).map((intId) =>
    getPieceInteractionConfig(pieceId, intId)
  );

  const bonus = fromEntries(
    giveKeys.map((giveKey) => [
      giveKey,
      sumWith((int) => int.gives[giveKey] ?? 0, interactions),
    ])
  );

  return {
    base,
    bonus,
  };
}

// function givesN(pieceIds: Piece.Id[], state: State.T) {
//   const eachGives = pieceIds.map((pieceId) => gives(pieceId, state));
//   return {
//     base: sumRecords(eachGives.map((gives) => gives.base)),
//     bonus: sumRecords(eachGives.map((gives) => gives.bonus)),
//   };
// }

export const effects: StateEffect[] = [
  function automatonLanguageGiving(_state$) {
    return interval(1e3).pipe(
      map(() => (state) => {
        const neighbors = neighborsGivesLanguage(state);
        const language_base = sumWith((n) => n.baseGives.language, neighbors);
        if (!language_base) return state;
        const language_bonus = sumWith(
          (n) =>
            sumWith(
              (intId) =>
                getPieceInteractionConfig(n.id, intId).gives.language ?? 0,
              Util.keys(n.interactionsCompleted)
            ),
          neighbors
        );
        const language_delta = language_base + language_bonus;
        const xf = Util.pipeM(
          over(lensPath(["automaton", "language"]), add(language_delta)),
          over(lensPath(["automaton", "language_alltime"]), add(language_delta))
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
            (pieceId) => state.board.pieces[pieceId].strayMovement
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
        const piece = state.board.pieces[pieceId];
        const possible = neighbors(1, piece, state.board).filter(
          (n) => !n.piece
        );
        if (!possible.length) return state;
        const hex = Util.sample(possible).hex;
        return set(
          lensPath(["board", "pieces", pieceId, "hexId"]),
          hex.id,
          state
        );
      })
    );
  },
];
