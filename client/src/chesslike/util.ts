import { useEffect, useRef, useState } from "preact/hooks";
import { distinctUntilChanged, Observable } from "rxjs";
import { assert } from "../util";

function randomFloat(low: number, high: number) {
  const r = low + Math.random() * (high - low);
  assert(low <= r && r <= high);
  return r;
}

/**
 * deviate number `n` +/- percent `deviation`
 */
export function deviate(n: number, deviation: number) {
  return n * (1 + deviation * randomFloat(-1, 1));
}

function makeInterval(
  callback: (since: number) => void,
  period: number,
  { deviation = 0, offset = 0 } = {}
) {
  let last = performance.now();
  let t: number;
  const go = (offset = 0) => {
    const timeout = deviate(period, deviation) - offset;
    t = setTimeout(() => {
      const now = performance.now();
      const since = now - last;
      callback(since);
      last = now;
      go();
    }, timeout);
  };
  go(offset);
  return function stop() {
    clearTimeout(t);
  };
}

/**
 * `makeIntervalObservable`
 */
export function interval(
  period: number,
  { deviation = 0.1, offset = Math.random() * period } = {}
) {
  return new Observable<number>((subscriber) => {
    const stop = makeInterval((since) => subscriber.next(since), period, {
      deviation,
      offset,
    });
    return stop;
  });
}

export function truthy<T>(t: T | undefined): t is T {
  return Boolean(t);
}

export function useLatest<T>(
  stream: Observable<T>,
  defaultValue: T | (() => T)
) {
  const [state, setState] = useState(defaultValue);
  useEffect(() => {
    stream.pipe(distinctUntilChanged()).subscribe({
      next: setState,
    });
  }, []);
  return state;
}

export function fromEntries<K extends string, T>(entries: [K, T][]) {
  return Object.fromEntries(entries) as Record<K, T>;
}

export function fromIdArray<K extends string, T extends { id: K }>(ts: T[]) {
  return fromEntries(ts.map((t) => [t.id, t]));
}

export function useChangedDebug(name: string, values: Record<string, any>) {
  const prior = useRef<Record<string, any>>(values);
  useEffect(() => {
    if (!prior.current) {
      prior.current = values;
      return;
    }

    const changed = Object.keys(values)
      .map((key) => {
        const n = values[key];
        const o = prior.current[key];
        return {
          key,
          old: n,
          new: o,
          changed: n !== o,
        };
      })
      .filter((o) => o.changed);

    if (changed.length) {
      console.log("%s values changed %s name", changed.length, name, changed);
    }

    prior.current = values;
  }, Object.values(values));
}

export function formatted([s]: TemplateStringsArray) {
  return s.trim().replace(/\n+/g, (s) => {
    switch (s.length) {
      case 1:
        return " ";
      default:
        return "\n";
    }
  });
}
