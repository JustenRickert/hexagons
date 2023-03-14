import { Hex } from "../grid";

export namespace Piece {
  export type Id = `piece-${string}`;
  export type InteractionId = `interaction-${string}`;

  export interface Interaction {
    id: InteractionId;
    owner: Piece.Id;
    name: string;
    cost: {
      language?: number;
    };
    gives: {
      language?: number;
    };
    flavor_text: string;
  }

  export interface Gives {
    language?: number;
  }

  export interface T {
    id: Id;
    hexId: Hex.Id;
    baseGives: Piece.Gives;
    strayMovement: boolean;
    interactionsCompleted: Record<InteractionId, true | undefined>;
  }

  export type WithHex = T & { hex: Hex.T };
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
    language_alltime: number;
  }
}

export namespace State {
  export interface T {
    automaton: Automaton.T;
    board: Board.T;
  }
}
