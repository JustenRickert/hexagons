import { PieceConfig } from "../types";
import IMAGE_PATH from "../svg-assets/automaton.svg";

const CONFIG: PieceConfig = {
  id: "piece-automaton",
  name: "The automaton",
  unlocked: false,
  description: "The robot",
  gives: {},
  interactions: [],
  stray_movement: false,
  image_path: IMAGE_PATH,
};

export default CONFIG;
