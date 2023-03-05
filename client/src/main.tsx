import { render } from "preact";
import { App } from "./app";
import { StateProvider } from "./chesslike/state-provider";
import "./index.css";

render(
  <StateProvider>
    <App />
  </StateProvider>,
  document.getElementById("app") as HTMLElement
);
