import * as Axial from "./axial";

export type Id = Axial.Id;

export interface T {
  id: Id;
  // color: string;
  pos: Axial.T;
}

export function make({
  pos,
}: // color,
{
  pos: { q: number; r: number };
  // color: string;
}): T {
  return {
    id: `${pos.q},${pos.r}`,
    pos,
    // color,
  };
}

export const ORIGIN = make({
  pos: {
    q: 0,
    r: 0,
  },
  // color: "lightblue",
});
