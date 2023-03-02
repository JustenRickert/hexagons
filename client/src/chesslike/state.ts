import { add, lensPath, over } from "ramda";
import {
  of,
  map,
  distinctUntilChanged,
  // interval,
  sample,
  withLatestFrom,
  mergeMap,
  from,
  distinct,
} from "rxjs";
import { makeAtom } from "../game/state";
import { Axial, Hex } from "../grid";
import { keys } from "../util";
import { interval } from "./util";
import * as Board from "./board";
import { UNSELECTED_HEX_COLOR } from "./constants";
import { Automaton, Piece, State } from "./types";

const defaultHexes = [
  Hex.make({ pos: { q: 0, r: 0 }, color: UNSELECTED_HEX_COLOR }),
  ...Axial.ring(1, { q: 0, r: 0 }).map((pos) =>
    Hex.make({ pos, color: UNSELECTED_HEX_COLOR })
  ),
].map(Hex.make);

const defaultPieces: Piece.T[] = [
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
  };
}

function make(): State.T {
  return {
    automaton: makeAutomaton(),
    board: makeBoard(),
  };
}

export const atom = makeAtom({
  key: "chesslike-state",
  defaultValue: make(),
  effects: [
    function automatonLanguageGeneration(state$) {
      // const neighbors$ = state$.pipe(
      //   distinctUntilChanged((prev, next) => prev.board === next.board),
      //   map(({ board }) =>
      //     Board.piecesNeighbors(board.pieces["piece-automaton"], board)
      //   )
      // );

      return state$.pipe(
        sample(interval(1e3)),
        map((state) => {
          const neighbors = Board.piecesNeighbors(
            state.board.pieces["piece-automaton"],
            state.board
          );
          const points = neighbors.length;
          if (!points) return (state) => state;
          return over(
            lensPath(["automaton", "language"]),
            add(neighbors.length)
          );
        })
      );
    },

    function pieceStrayMovement(state$) {
      return state$.pipe(
        mergeMap((state) => from(keys(state.board.pieces))),
        distinct(),
        mergeMap((pieceId) =>
          interval(10e3, { deviation: 0.8 }).pipe(
            map((since) => ({
              since,
              pieceId,
            }))
          )
        ),
        map(({ since, pieceId }) => (state) => {
          // TODO please implement me
          console.log("TODO should move piece randomly here");
          return state;
        })
      );
    },
  ],
});
