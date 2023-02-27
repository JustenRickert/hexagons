import { assert, range } from "../util";

export type Id = `${number},${number}`;

export function id(a: T): Id {
  return `${a.q},${a.r}`;
}

export interface T {
  q: number;
  r: number;
}

export function cartesian({ q, r }: T) {
  const x = 100 * (3 / 2) * r;
  const y = 100 * ((Math.sqrt(3) / 2) * r + Math.sqrt(3) * q);
  return {
    x,
    y,
  };
}

function minus(a1: T, a2: T): T {
  return {
    q: a1.q - a2.q,
    r: a1.r - a2.r,
  };
}

export function angle(a1: T, a2: T) {
  const c1 = cartesian(a1);
  const c2 = cartesian(a2);
  const dy = c2.y - c1.y;
  const dx = c2.x - c1.x;
  console.log({
    dx,
    dy,
    atan2: Math.atan2(dy, dx),
    angle: (180 / Math.PI) * Math.atan2(dy, dx),
  });
  return (180 / Math.PI) * Math.atan2(dy, dx) + 90;
}

export function translatef(a: T) {
  const { x, y } = cartesian(a);
  return `translate(${x}, ${y})`;
}

export function distance(a1: T, a2: T) {
  return (
    (1 / 2) *
    (Math.abs(a1.q - a2.q) +
      Math.abs(a1.q + a1.r - (a2.q + a2.r)) +
      Math.abs(a1.r - a2.r))
  );
}

export function lerp(a1: T, a2: T, t: number) {
  const dq = a2.q - a1.q;
  const dr = a2.r - a1.r;
  return {
    q: a1.q + t * dq,
    r: a1.r + t * dr,
  };
}

export function between(a1: T, a2: T): T[] {
  const dist = distance(a1, a2);
  const r = 1 / dist;
  return range(1, dist)
    .map((i) => lerp(a1, a2, r * i))
    .map(round);
}

export function round(frac: T) {
  const frac_s = -frac.q - frac.r;

  let q = Math.round(frac.q);
  let r = Math.round(frac.r);
  let s = Math.round(frac_s);

  const dq = Math.abs(q - frac.q);
  const dr = Math.abs(r - frac.r);
  const ds = Math.abs(s - frac_s);

  if (dq > dr && dq > ds) {
    q = -r - s;
  } else if (dr > ds) {
    r = -q - s;
  }

  return {
    q,
    r,
  };
}

// export function axial({ q, r }: { q: number; r: number }): T {
//   return {
//     q,
//     r,
//   };
// }

export const DIRECTIONS: T[] = [
  {
    q: -1,
    r: 1,
  },
  {
    q: 0,
    r: 1,
  },
  {
    q: 1,
    r: 0,
  },
  {
    q: 1,
    r: -1,
  },
  {
    q: 0,
    r: -1,
  },
  {
    q: -1,
    r: 0,
  },
];

export function add(a1: T, a2: T) {
  return {
    q: a1.q + a2.q,
    r: a1.r + a2.r,
  };
}

export function coordEqual(a1: T, a2: T) {
  return a1.q === a2.q && a2.q === a2.r;
}

export function scale(n: number, a: T) {
  return {
    q: n * a.q,
    r: n * a.r,
  };
}

export function ring(dist: number, a: T) {
  assert(dist > 0);
  const axials: T[] = [];
  let h = add(a, scale(dist, DIRECTIONS[4]));
  DIRECTIONS.slice(0, 6).forEach((d) => {
    range(0, dist).forEach(() => {
      h = add(h, d);
      axials.push(h);
    });
  });
  return axials;
}

// function neighbor(a: Axial, direction: number) {
//   const d = DIRECTIONS[direction];
//   return add(a, d);
// }
