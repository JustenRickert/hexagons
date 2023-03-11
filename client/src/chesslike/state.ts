import { add, lensPath, over, pick, set } from "ramda";
import { distinct, from, map, mergeMap, Observable } from "rxjs";

import { Axial, Hex } from "../grid";
import * as Util from "../util";

import { neighbors } from "./board/hooks";
import {
  getPieceConfig,
  getPieceInteractionConfig,
} from "./board/piece-config";
import { Automaton, Board, Piece, State } from "./types";
import { interval } from "./util";

export type T = State.T;

const defaultHexes = [
  Hex.make({ pos: { q: 0, r: 0 } }),
  ...Axial.ring(1, { q: 0, r: 0 }).map((pos) => Hex.make({ pos })),
].map(Hex.make);

function fromConfig(id: Piece.Id) {
  return pick(["id", "gives", "strayMovement"], getPieceConfig(id));
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
    .filter((n) => n.piece?.gives.language)
    .map((n) => n.piece! as GivesLanguage<Piece.T>);
}

export const effects: StateEffect[] = [
  function automatonLanguageGiving(_state$) {
    return interval(1e3).pipe(
      map(() => (state) => {
        const neighbors = neighborsGivesLanguage(state);
        const language_base = sumWith((n) => n.gives.language, neighbors);
        if (!language_base) return state;
        const language_bonus = sumWith(
          (n) =>
            sumWith(
              (intId) =>
                getPieceInteractionConfig(n.id, intId).adds.language ?? 0,
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
