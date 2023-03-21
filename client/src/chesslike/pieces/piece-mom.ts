import { PieceConfig, PieceInteractionConfig } from "../types";
import IMAGE_PATH from "../svg-assets/mom.svg";
import { Music, PieceId } from "./constant";

enum SignLanguage {
  One = "interaction-learn-sign-language-lesson-0",
}

enum MomTalk {
  FirstWords = "interaction-first-words",
  AboutDad = "interaction-about-dad",
}

const INTERACTIONS: PieceInteractionConfig[] = [
  {
    id: MomTalk.FirstWords,
    name: "Mama",
    flavor_text: "Baby's first words",
    cost: {
      language: 10,
    },
    gives: {
      language: 1,
    },
    requirements: [],
    // unlocks: [
    //   {
    //     type: "interaction",
    //     id: SignLanguage.One,
    //     owner: PieceId.Mom,
    //   },
    // ],
  },
  {
    id: SignLanguage.One,
    name: "Sign Language",
    flavor_text: 'Learn basic signs for like "feed me" or whatever',
    cost: {
      language: 50,
    },
    gives: {
      language: 1,
    },
    requirements: [],
  },
  {
    id: Music.FirstPianoTune,
    name: "Piano Song for Babies",
    flavor_text:
      "Moms who can play the piano can easily play piano songs for babies.",
    cost: {
      language: 250,
    },
    gives: {
      music: 1,
    },
    requirements: [],
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
    requirements: [
      {
        owner: PieceId.Mom,
        id: MomTalk.AboutDad,
      },
    ],
  },
];

const CONFIG: PieceConfig = {
  id: PieceId.Mom,
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
