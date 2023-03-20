import { Piece, PieceConfig, PieceInteractionConfig } from "../types";
import IMAGE_PATH from "../svg-assets/mom.svg";

const INT_LEARN_SIGN_LANGUAGE_0: Piece.InteractionId =
  "interaction-learn-sign-language-lesson-0";

const INTERACTIONS: PieceInteractionConfig[] = [
  {
    id: "interaction-first-words",
    name: "Mama",
    flavor_text: "Baby's first words",
    cost: {
      language: 10,
    },
    gives: {
      language: 1,
    },
    unlocked: true,
    unlocks: [
      {
        type: "interaction",
        id: INT_LEARN_SIGN_LANGUAGE_0,
        owner: "piece-mom",
      },
    ],
  },

  {
    id: INT_LEARN_SIGN_LANGUAGE_0,
    name: "Sign Language",
    flavor_text: 'Learn basic signs for like "feed me" or whatever',
    cost: {
      language: 50,
    },
    gives: {
      language: 1,
    },
  },
  {
    id: "interaction-first-story",
    name: "How they met",
    flavor_text: "Ask mom about dad",
    cost: {
      language: 1000,
    },
    gives: {
      language: 1,
    },
  },
];

const CONFIG: PieceConfig = {
  id: "piece-mom",
  name: "Mom",
  description: "The automaton's mother",
  gives: {
    language: 1,
  },
  stray_movement: true,
  unlocked: true,
  interactions: INTERACTIONS,
  image_path: IMAGE_PATH,
};

export default CONFIG;
