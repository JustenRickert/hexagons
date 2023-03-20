import { PieceConfig } from "../types";

export const INTERACTIONS = [];

const CONFIG: PieceConfig = {
  id: "piece-dad",
  name: "Dad",
  description: "The automaton's father",
  gives: {
    language: 1,
  },
  stray_movement: true,
  unlocked: true,
  interactions: INTERACTIONS,
};

export default CONFIG;
