import { ComponentChildren, createContext } from "preact";
import { useContext, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { zip } from "ramda";
import { Observable, Subject } from "rxjs";
import { assert } from "../util";

const AtomContext = createContext<[Record<string, any>, (state: any) => any]>([
  {},
  () => {},
]);

const registeredDefaultValues: Record<string, any> = {};

export function AtomProvider({ children }: { children: ComponentChildren }) {
  const [record, setRecord] = useState(() => {
    return registeredDefaultValues;
  });
  return (
    <AtomContext.Provider value={[record, setRecord]}>
      {children}
    </AtomContext.Provider>
  );
}

interface Atom<S> {
  key: string;
  defaultValue: S;
  effects?: ((stream: Observable<S>) => Observable<(s: S) => S>)[];
  // effects: ((state: S, setState: (fn: (s: S) => S) => void) => () => void)[];
}

// interface ComputedAtom<S, T> {
//   parent: Atom<S>;
//   lens: {
//     get: (s: S) => T;
//     set: (s: S, t: T) => S;
//   };
// }

export function makeAtom<S>({
  key,
  defaultValue,
  effects = [],
}: {
  key: string;
  defaultValue: S;
  effects?: Atom<S>["effects"];
}): Atom<S> {
  assert(!(key in registeredDefaultValues), "duplicate atom key `%s`", key);
  registeredDefaultValues[key] = defaultValue;
  return {
    key,
    defaultValue,
    effects,
  };
}

// export function makeComputed<S, T>({
//   atom,
//   key,
//   lens,
// }: {
//   atom: Atom<S>;
//   key: string;
//   lens: {
//     get: (s: S) => T;
//     set: (s: S, T: T) => S;
//   };
// }): ComputedAtom<S, T> {
//   assert(!(key in registeredDefaultValues), "duplicate atom key `%s`", key);
//   return {
//     parent,
//     key,
//     defaultValue: lens.get(atom.defaultValue),
//     lens,
//   };
// }

// function useComputed<S, T>(atom: ComputedAtom<S, T>) {
//   const [record, setRecord] = useContext(AtomContext);
//   atom.lens.get(record[atom.parent.key])
//   return [
//   ];
// }

export function useAtom<S>(atom: Atom<S>) {
  const [record, setRecord] = useContext(AtomContext);
  return [
    record[atom.key],
    (reducer) =>
      setRecord((record: Record<string, any>) => ({
        ...record,
        [atom.key]: reducer(record[atom.key]),
      })),
  ] as [S, (fn: (s: S) => S) => void];
}

function useStateObservable<S>(atom: Atom<S>) {
  const [state, setState] = useAtom(atom);
  const subscription = useMemo(() => new Subject<S>(), []);
  const observable = useMemo(() => subscription.asObservable(), [subscription]);
  useEffect(() => {
    subscription.next(state);
  }, [subscription, state]);
  return observable;
}

function useChangedDebug(values: any[]) {
  const prior = useRef<null | any[]>(values);
  useEffect(() => {
    if (!prior.current) {
      prior.current = values;
      return;
    }
    const changed = zip(prior.current, values)
      .map(([prior, value], i) => [prior !== value, i])
      .filter(([changed]) => changed);

    console.log("%s values changed", changed.length);

    prior.current = values;
  }, values);
}

export function useAtomEffects<S>(atom: Atom<S>) {
  const [, setState] = useAtom(atom);
  const state$ = useStateObservable(atom);
  // useChangedDebug([atom, state$]);
  useEffect(() => {
    if (!atom.effects) return;
    const subs = atom.effects.map((effect) =>
      effect(state$).subscribe({
        next(reducer) {
          setState(reducer);
        },
      })
    );
    return () => {
      subs.forEach((sub) => sub.unsubscribe());
    };
  }, [atom, state$]);
}
