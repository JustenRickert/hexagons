import { Piece } from "../types";
import { fromIdArray } from "../util";
import svgpath from "../svg-assets/mom.svg";

export const id: Piece.Id = "piece-mom";

export const description = `The automaton's mother`;

export const strayMovement = true;

export const gives = {
  language: 1,
};

export const interactions = fromIdArray<Piece.InteractionId, Piece.Interaction>(
  (
    [
      {
        id: "interaction-first-words",
        name: "Mama",
        cost: {
          language: 10,
        },
        gives: {
          language: 1,
        },
        flavor_text: "Baby's first words",
      },
      {
        id: "interaction-first-story",
        name: "How they met",
        cost: {
          language: 1000,
        },
        gives: {
          language: 1,
        },
        flavor_text: "Ask mom about dad",
      },
    ] as const
  ).map((int) => ({
    ...int,
    owner: id,
  }))
);

export const svg = svgpath;
