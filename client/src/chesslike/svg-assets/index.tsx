import "./index.css";

import LANGUAGE_ICON from "./icon-language.svg";

const SOURCE_MAP = {
  language: LANGUAGE_ICON,
  mathematics: "/TODO.svg",
  music: "/TODO.svg",
};

export function Icon({ type }: { type: keyof typeof SOURCE_MAP }) {
  return <img class="icon" src={SOURCE_MAP[type]} height={24} width={24} />;
}
