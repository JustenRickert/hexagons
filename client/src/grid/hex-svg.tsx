import { useCallback, useLayoutEffect, useRef } from "preact/hooks";
import { assert } from "../util";
import * as Axial from "./axial";
import { T } from "./hex";

export function HexSvg({
  hex,
  onClick = () => {},
  onRightClick = () => {},
  showCoordinate = false,
}: {
  hex: T;
  onClick?: (hex: T) => void;
  onRightClick?: (hex: T) => void;
  showCoordinate?: boolean;
}) {
  const ref = useRef<SVGPolygonElement>(null);
  // useEffect(() => {
  //   assert(ref.current);

  //   // TODO Is it even worth it to do this? I'm starting to rethink it...
  //   // const UNACCEPTABLE_TRAVEL_DISTANCE = 500;

  //   let last: null | [number, number] = null;
  //   let down = false;
  //   // let travel = 0;

  //   const unsubscribe = mouseEvents(ref.current, {
  //     onDown: (e) => {
  //       if (e.which === 3) return;
  //       down = true;
  //       last = [e.offsetX, e.offsetY];
  //     },
  //     onUp: () => {
  //       down = false;
  //       // if (travel < UNACCEPTABLE_TRAVEL_DISTANCE) onClick(hex);
  //       // travel = 0;
  //       last = null;
  //     },
  //     onMove: (e) => {
  //       if (!down) return;
  //       assert(last);
  //       const dist = Math.sqrt(
  //         (last[0] - e.offsetX) ** 2 + (last[1] - e.offsetY) ** 2
  //       );
  //       // travel += dist;
  //     },
  //   });

  //   return unsubscribe;
  // }, [onClick, hex]);

  const textRef = useRef<SVGTextElement>(null);
  const textBackgroundRef = useRef<SVGRectElement>(null);

  useLayoutEffect(() => {
    if (!showCoordinate) return;
    assert(textRef.current);
    assert(textBackgroundRef.current);
    let bb = textRef.current.getBBox();
    textRef.current.setAttribute("x", String(-bb.width / 2));
    textRef.current.setAttribute("y", String(bb.height / 3.5));
    bb = textRef.current.getBBox();
    textBackgroundRef.current.setAttribute("x", String(bb.x - 4));
    textBackgroundRef.current.setAttribute("y", String(bb.y));
    textBackgroundRef.current.setAttribute("width", String(bb.width + 8));
    textBackgroundRef.current.setAttribute("height", String(bb.height));
  });

  const rightClick = useCallback(() => {
    onRightClick(hex);
  }, [hex, onClick]);

  return (
    <g transform={Axial.translatef(hex.pos)}>
      <polygon
        transform="scale(0.95)"
        onContextMenu={rightClick}
        ref={ref}
        // TODO Not sure yet if there are benefits to the above alternative way
        // to do this
        onClick={() => onClick(hex)}
        fill={hex.color}
        points="100,0 50,-87 -50,-87 -100,-0 -50,87 50,87"
      />
      {showCoordinate && (
        <>
          <rect ref={textBackgroundRef} fill="white" />
          <text ref={textRef} font-size="40px">
            {hex.pos.q},{hex.pos.r}
          </text>
        </>
      )}
    </g>
  );
}
