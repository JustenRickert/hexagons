import { last } from "ramda";

export function assert(condition: any, ...msgs: any[]): asserts condition {
  if (!condition) {
    console.error(...msgs);
    throw new Error("ASSERTION_ERROR");
  }
}
export function sample<T>(ts: T[]) {
  assert(ts.length, "Can't sample empty array");
  return ts[Math.floor(Math.random() * ts.length)];
}

export function mouseEvents(
  view: SVGElement,
  {
    onDown,
    onMove,
    onUp,
    onLeave,
    onOut,
  }: // onClick,
  {
    onDown: (e: MouseEvent) => void;
    onUp?: (e: MouseEvent) => void;
    onOut?: (e: MouseEvent) => void;
    onLeave?: (e: MouseEvent) => void;
    onMove: (e: MouseEvent) => void;
    // onClick?: (e: MouseEvent) => void;
  }
) {
  view.addEventListener("mousedown", onDown);
  if (onUp) view.addEventListener("mouseup", onUp);
  if (onOut) view.addEventListener("mouseout", onOut);
  if (onLeave) view.addEventListener("mouseleave", onLeave);
  view.addEventListener("mousemove", onMove);
  // if (onClick) view.addEventListener("click", onClick);
  return () => {
    view.removeEventListener("mousedown", onDown);
    if (onUp) view.removeEventListener("mouseup", onUp);
    if (onLeave) view.removeEventListener("mouseleave", onLeave);
    view.removeEventListener("mousemove", onMove);
    // if (onClick) view.removeEventListener("click", onClick);
  };
}

export function range(from: number, to: number) {
  return Array.from({ length: to - from }).map((_, i) => from + i);
}

export const keys: <O extends {}>(o: O) => (keyof O)[] = Object.keys;

export const entries: <K extends string, T>(o: Record<K, T>) => [K, T][] =
  Object.entries;

export function thru<T>(t: T, ...xfs: ((t: T) => T)[]) {
  return xfs.reduce((t, xf) => xf(t), t);
}

export function pipeM<T>(...xfs: ((t: T) => T)[]) {
  return (t: T) => xfs.reduce((t, xf) => xf(t), t);
}

// export function filename() {
//   const url = new URL(import.meta.url);
//   const fname = last(url.pathname.split("/"));
//   assert(fname);
//   return fname;
// }
