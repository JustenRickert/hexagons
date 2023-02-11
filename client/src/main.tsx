import { render } from "preact";
import { App } from "./app";
import { AtomProvider } from "./game/state";
import "./index.css";

render(
  <AtomProvider>
    <App />
  </AtomProvider>,
  document.getElementById("app") as HTMLElement
);
