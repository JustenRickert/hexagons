import { Hex } from "../grid";

export interface PieceInteractionConfig {
  id: Piece.InteractionId;
  name: string;
  cost: Partial<Piece.Gives>;
  gives: Partial<Piece.Gives>;
  flavor_text: string;
  unlocked?: boolean;
  unlocks?: Piece.InteractionUnlock[];
}

export interface PieceConfig {
  id: Piece.Id;
  name: string;
  description: string;
  interactions: PieceInteractionConfig[];
  gives: Partial<Piece.Gives>;
  stray_movement: boolean;
  unlocked: boolean;
  image_path?: string;
}

export namespace Piece {
  export type Id = `piece-${string}`;
  export type InteractionId = `interaction-${string}`;

  export interface InteractionUnlock {
    type: "interaction";
    id: InteractionId;
    owner: Piece.Id;
  }

  export interface Gives {
    language: number;
    mathematics: number;
  }

  export interface Interaction {
    id: InteractionId;
    owner: Piece.Id;
    base_gives: Piece.Gives;
    unlocked: boolean;
    unlocks: InteractionUnlock[];
  }

  export interface T {
    id: Id;
    hex_id: Hex.Id;
    base_gives: Piece.Gives;
    stray_movement: boolean;
    interactions_completed: Record<InteractionId, true | undefined>;
    image_path: string;
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
    language: {
      current: number;
      alltime: number;
    };
    mathematics: {
      current: number;
      alltime: number;
    };
  }
}

export namespace State {
  export interface T {
    automaton: Automaton.T;
    board: Board.T;
  }
}
