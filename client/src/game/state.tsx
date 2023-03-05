import { ComponentChildren, createContext } from "preact";
import { memo } from "preact/compat";
import { useContext, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { lensProp, over, zip } from "ramda";
import { Observable, Subject, Subscription } from "rxjs";
import { distinctUntilChanged, map } from "rxjs/operators";
import { assert } from "../util";

interface Atom<S> {
  key: string;
  defaultValue: S;
  effects?: ((stream: Observable<S>) => Observable<(s: S) => S>)[];
  // effects: ((state: S, setState: (fn: (s: S) => S) => void) => () => void)[];
}

interface AtomRegistration<S> {
  defaultValue: S;
  effects?: ((state: Observable<S>) => Observable<(state: S) => S>)[];
}

// interface ComputedAtom<S, T> {
//   parent: Atom<S>;
//   lens: {
//     get: (s: S) => T;
//     set: (s: S, t: T) => S;
//   };
// }

export function useAtomObservable<S>(atom: Atom<S>) {
  const [state] = useAtom(atom);
  const subscription = useMemo(() => new Subject<S>(), []);
  const observable = useMemo(() => subscription.asObservable(), [subscription]);
  useEffect(() => {
    subscription.next(state);
  }, [subscription, state]);
  return observable;
}

export function useChangedDebug(values: any[]) {
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
  const state$ = useAtomObservable(atom);
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

const AtomContext = createContext<
  [Record<string, Atom<any>>, (state: any) => any]
>([{}, () => {}]);

function RegisteredAtomRuntime_impl({ atom }: { atom: Atom<any> }) {
  console.log("running but changed", atom);
  useAtomEffects(atom);
  return null;
}

export const RegisteredAtomRuntime = memo(
  RegisteredAtomRuntime_impl,
  (prev, next) => true
);

const atomRegistration: Record<string, AtomRegistration<any>> = {};

const record$ = new Subject<Record<string, any>>();

export function AtomProvider({ children }: { children: ComponentChildren }) {
  // HACK: In developement, module reloading saves react state but not module
  // state. So here we save module state in react state to not lose information
  // that was only recorded on the module level. It works! Though one will need
  // to do a hard reload when using new `makeAtom`s while developing, which
  // isn't obvious.
  const [providerAtomRegistration] = useState(() => atomRegistration);
  const [record, setRecord] = useState(() =>
    Object.fromEntries(
      Object.entries(atomRegistration).map(([key, atom]) => [
        key,
        atom.defaultValue,
      ])
    )
  );

  useEffect(() => {
    record$.next(record);
  }, [record]);

  useEffect(() => {
    const subs: Subscription[] = [];
    for (const [key, { effects }] of Object.entries(providerAtomRegistration)) {
      if (!effects) continue;
      for (const effect of effects) {
        subs.push(
          effect(
            record$.pipe(
              map((record) => record[key]),
              distinctUntilChanged()
            )
          ).subscribe({
            next(reducer) {
              setRecord(over(lensProp(key), reducer));
            },
          })
        );
      }
    }

    return () => {
      subs.forEach((sub) => sub.unsubscribe());
    };
  }, []);

  return (
    <AtomContext.Provider value={[record, setRecord]}>
      {children}
    </AtomContext.Provider>
  );
}

export function makeAtom<S>({
  key,
  defaultValue,
  effects = [],
}: {
  key: string;
  defaultValue: S;
  effects?: Atom<S>["effects"];
}): Atom<S> {
  assert(!(key in atomRegistration), "duplicate atom key `%s`", key);
  atomRegistration[key] = {
    effects,
    defaultValue,
  };
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

export function useAtomSetState<S>(atom: Atom<S>) {}
