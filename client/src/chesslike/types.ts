import { Hex } from "../grid";

export namespace Piece {
  export type Id = `piece-${string}`;

  export interface T {
    id: Id;
    hexId: Hex.Id;
    gives: { language?: number };
    strayMovement: boolean;
  }
}

export namespace Board {
  export interface T {
    selectedPieceId: "" | Piece.Id;
    grid: Record<Hex.Id, Hex.T>;
    pieces: Record<Piece.Id, Piece.T>;
  }
}

export namespace Automaton {
  export interface T {
    language: number;
  }
}

export namespace State {
  export interface T {
    automaton: Automaton.T;
    board: Board.T;
  }
}
