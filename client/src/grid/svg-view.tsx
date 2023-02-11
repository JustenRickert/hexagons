import { MutableRef, useEffect, useRef, useState } from "preact/hooks";
import { JSX } from "preact/jsx-runtime";
import { assert, mouseEvents } from "../util";

const VIEW_HEIGHT = 2000;

/**
 * TODO Need to preserve drag offset after window resize events
 */
function useScreenPanning(
  view: MutableRef<SVGSVGElement | null>,
  screen: { width: number; height: number; dpi: number }
) {
  useEffect(() => {
    assert(view.current);
    let down = false;
    let start: [number, number] = [
      view.current.viewBox.baseVal.x / screen.dpi,
      view.current.viewBox.baseVal.y / screen.dpi,
    ];

    const unsubscribe = mouseEvents(view.current, {
      onDown(e) {
        assert(view.current);
        // don't pan on right click
        if (e.which === 3) return;
        down = true;
        start = [
          e.offsetX + view.current.viewBox.baseVal.x / screen.dpi,
          e.offsetY + view.current.viewBox.baseVal.y / screen.dpi,
        ];
      },
      onMove(e) {
        assert(view.current);
        if (!down) return;

        assert(view.current);
        const dpi = screen.dpi;
        view.current.viewBox.baseVal.x = dpi * (start[0] - e.offsetX);
        view.current.viewBox.baseVal.y = dpi * (start[1] - e.offsetY);
      },
      onUp() {
        down = false;
      },
      onLeave() {
        down = false;
      },
    });

    return unsubscribe;
  }, [screen]);
}

function useScreen(view: MutableRef<SVGSVGElement | null>) {
  const [state, setState] = useState(() => ({
    height: window.innerHeight,
    width: window.innerWidth,
    dpi:
      (window.innerWidth / window.innerHeight) *
      (VIEW_HEIGHT / window.innerWidth),
  }));

  useEffect(() => {
    const handle = () => {
      assert(view.current);
      setState({
        height: window.innerHeight,
        width: window.innerWidth,
        dpi: view.current.viewBox.baseVal.width / window.innerWidth,
      });
    };
    window.addEventListener("resize", handle);
    return () => {
      window.removeEventListener("resize", handle);
    };
  }, []);

  useScreenPanning(view, state);

  return state;
}

function handleContextMenu(e: JSX.TargetedMouseEvent<SVGSVGElement>) {
  e.preventDefault();
}

export function SvgView({
  children,
}: {
  children: JSX.Element | JSX.Element[];
}) {
  const view = useRef<SVGSVGElement>(null);
  const screen = useScreen(view);
  const width = (screen.width / screen.height) * VIEW_HEIGHT;
  const viewBox = [
    (-1 / 2) * width,
    (-1 / 2) * VIEW_HEIGHT,
    width,
    VIEW_HEIGHT,
  ].join(" ");
  return (
    <svg
      onContextMenu={handleContextMenu}
      ref={view}
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}
