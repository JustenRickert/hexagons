export class PriorityQueue<A> {
  #h: [number, A][];

  constructor() {
    this.#h = [];
  }

  #better(ai: number, bi: number) {
    const [ap] = this.#h[ai];
    const [bp] = this.#h[bi];
    return ap < bp;
  }

  #swap(ai: number, bi: number) {
    const a = this.#h[ai];
    const b = this.#h[bi];
    [this.#h[ai], this.#h[bi]] = [b, a];
  }

  #siftUp() {
    let n = this.#h.length - 1;
    while (n > 0) {
      const parent = Math.floor((n - 1) / 2);
      if (this.#better(parent, n)) return;
      this.#swap(n, parent);
      n = parent;
    }
  }

  #siftDown() {
    const max = this.#h.length;
    let n = 0;
    let best: number;
    while (n < max) {
      const c1 = 2 * n + 1;
      const c2 = c1 + 1;
      best = n;
      if (c1 < max && this.#better(c1, best)) best = c1;
      if (c2 < max && this.#better(c2, best)) best = c2;
      if (best === n) return;
      this.#swap(n, best);
      n = best;
    }
  }

  get size() {
    return this.#h.length;
  }

  push(priority: number, a: A) {
    this.#h.push([priority, a]);
    this.#siftUp();
  }

  pop() {
    if (!this.#h.length) throw new Error("PriorityQueue is empty");
    const [, first] = this.#h[0];
    const last = this.#h.pop()!;
    if (this.#h.length > 0) {
      this.#h[0] = last;
      this.#siftDown();
    }
    return first;
  }
}

// interface T<A> {
//   h: Record<string, A>;
// }

// function make<A>({
//   // id,
//   priority,
// }: {
//   // id: (a: A) => string;
//   priority: (a: A) => number;
// }) {
//   function better(a: A, b: A) {
//     return priority(a) < priority(b);
//   }

//   return {
//   };
// }

// export function empty<A>(queue: T<A>) {
//   return true;
// }

// export function insert<A>(a: A) {}

// export function pull() {}
