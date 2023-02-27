import { useCallback } from "preact/hooks";
import { delay, filter, map, tap } from "rxjs";
import { Grid, Hex, Radian } from "../grid";
import { assert, pipeM } from "../util";
import * as Board from "./board";
import { makeAtom, useAtom } from "./state";

namespace Movement {
  export interface T {
    start: Hex.T;
    moves: Hex.T[];
  }

  export function make(path: Hex.T[]): T {
    const [start, ...rest] = path;
    assert(start);
    return {
      start,
      moves: rest,
    };
  }

  export function step(t: T): T {
    const { moves } = t;
    const [newStart, ...remainingMoves] = moves;
    return {
      start: newStart,
      moves: remainingMoves,
    };
  }
}

export interface T {
  hexId: Hex.Id;
  rot: Radian.T;
  movement: Movement.T | null;
}

// function startMovement(player: T): T {
//   assert (player.movement?.current === player.hexId)
//   return {
//     ...player,
//     hexId: player.movement.current
//   }
// }

function stepMovement(player: T): T {
  assert(player.movement);
  const next = Movement.step(player.movement);
  return {
    ...player,
    hexId: next.start.id,
    movement: next,
  };
}

export const atom = makeAtom<T>(
  "player",
  {
    hexId: Hex.ORIGIN.id,
    rot: 0,
    movement: null,
  },
  [
    (state$) => {
      const movePlayer$ = state$.pipe(
        filter((player) => Boolean(player.movement)),
        tap((s) => console.log("HERE?")),
        delay(3e3),
        map<T, (t: T) => T>(() => (player) => {
          assert(player.movement);
          console.log({ player });
          return stepMovement(player);
          // return {
          //   ...player,
          //   hexId: nextHex.id,
          //   movement: stepMovement(player.movement),
          // };
        })
      );

      const update$ = movePlayer$;

      state$.subscribe({
        next: (state) => {
          console.log("NEXT", state);
        },
      });

      return update$;
    },
    // (state, setState) => {
    //   if (state.movement) {
    //     console.log("MOVEMENT UPDATE", state);
    //   }
    //   return () => {
    //     // unsub
    //   };
    // },
  ]
);

export function usePlayer() {
  const [player, setPlayer] = useAtom(atom);
  const [board] = useAtom(Board.atom);

  const movement = useCallback(
    (to: Hex.T, player: T): T => {
      const path = Grid.path(board.grid.hexes[player.hexId], to, board.grid);
      assert(path.length >= 2);
      return stepMovement({
        ...player,
        movement: Movement.make(path),
      });
    },
    [board]
  );

  return {
    value: player,
    move: useCallback(
      (to: Hex.T) =>
        setPlayer(
          pipeM(
            // (state) => turn(to, state),
            (state) => movement(to, state)
          )
        ),
      [movement]
    ),
  };
}
