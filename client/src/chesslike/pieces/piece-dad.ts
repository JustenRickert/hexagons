import { PieceConfig, PieceInteractionConfig } from "../types";
import { Music, PieceId } from "./constant";

enum StoryTime {
  One = "interaction-story-time-0",
  Two = "interaction-story-time-1",
  Three = "interaction-story-time-2",
}

enum Transportation {
  Bike = "interaction-bike",
}

export const INTERACTIONS: PieceInteractionConfig[] = [
  {
    id: StoryTime.One,
    name: "Bedtime Story",
    cost: {
      language: 15,
    },
    gives: {
      language: 1,
    },
    flavor_text:
      "It is tradition that one of the parents assumes the duty of telling the offspring stories before bedtime.",
    requirements: [],
  },
  {
    id: StoryTime.Two,
    name: "Early Life Advice",
    cost: {
      language: 50,
    },
    gives: {
      language: 1,
    },
    flavor_text: "Dad's wise words on life. Keep these specially.",
    requirements: [
      {
        owner: PieceId.Dad,
        id: StoryTime.One,
      },
    ],
  },
  {
    id: Transportation.Bike,
    name: "A Bicycle Gift",
    cost: {
      language: 200,
    },
    gives: {},
    flavor_text: "No more driving the munchkin around.",
    requirements: [],
    // TODO should unlock more hexagons on the board
  },
  {
    id: StoryTime.Three,
    name: "Have The Talk",
    cost: {
      language: 150,
    },
    gives: { language: 2 },
    flavor_text:
      "One parent must give the child The Talk, which traditionally precedes one's early romantic encounters.",
    requirements: [
      {
        owner: PieceId.Dad,
        id: StoryTime.Two,
      },
    ],
  },
  {
    id: Music.FirstMusicalInstrument,
    name: "Ask for a Guitar",
    flavor_text:
      "After hearing how cool music can be, one wants to play something cool themself.",
    cost: {
      music: 100,
    },
    gives: {
      music: 1,
    },
    requirements: [
      {
        owner: PieceId.Mom,
        id: Music.FirstPianoTune,
      },
    ],
    // unlocks: [
    //   {
    //     type: "interaction",
    //     owner: PieceId.Dad,
    //     id: Music.FirstMusicLesson,
    //   },
    // ],
  },
  {
    id: Music.FirstMusicLesson,
    name: "Ask for Music Lessons",
    flavor_text: "Playing is one thing. Practice is everything.",
    cost: {
      music: 500,
    },
    gives: {
      music: 2,
    },
    requirements: [
      {
        owner: PieceId.Dad,
        id: Music.FirstMusicalInstrument,
      },
    ],
  },
];

const CONFIG: PieceConfig = {
  id: PieceId.Dad,
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
