import "./app.css";

import ChessLikeGame from "./chesslike";
import { useAtom } from "./game/state";
import { Hex } from "./grid";
import * as State from "./chesslike/state";
import { useContext } from "preact/hooks";
import { StateContext } from "./chesslike/state-provider";

function timeFn<F extends (a: any) => any>(name: string, fn: F) {
  return (...args: Parameters<F>) => {
    const start = performance.now();
    const result = fn.apply(null, args);
    console.log("%s took %sms", name, performance.now() - start);
    return result;
  };
}

/**
 * TODO
 */

// const socket = new WebSocket(`ws://${window.location.host}/ws`);

// socket.addEventListener("close", console.error);

// console.log(socket);

export function App() {
  const context = useContext(StateContext);
  return (
    <div>
      <ChessLikeGame />
    </div>
  );
}
