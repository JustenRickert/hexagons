import { Observable, Subject } from "rxjs";
import { assert } from "../util";

function randomFloat(low: number, high: number) {
  const r = low + Math.random() * (high - low);
  assert(low <= r && r <= high);
  return r;
}

/**
 * deviate number `n` +/- percent `deviation`
 */
function deviate(n: number, deviation: number) {
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
