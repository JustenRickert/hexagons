import { ComponentChildren, createContext } from "preact";
import { useContext, useState } from "preact/hooks";
import { assert } from "../util";

const AtomContext = createContext<[Record<string, any>, (state: any) => any]>([
  {},
  () => {},
]);

const registeredDefaultState: Record<string, any> = {};

export function AtomProvider({ children }: { children: ComponentChildren }) {
  const [record, setRecord] = useState(() => {
    return registeredDefaultState;
  });
  return (
    <AtomContext.Provider value={[record, setRecord]}>
      {children}
    </AtomContext.Provider>
  );
}

interface Atom<S> {
  key: string;
  state: S;
}

export function makeAtom<S>(key: string, defaultValue: S) {
  assert(!(key in registeredDefaultState));
  registeredDefaultState[key] = defaultValue;
  return {
    key,
    state: defaultValue,
  };
}

export function useAtom<S>(atom: Atom<S>) {
  const [record, setRecord] = useContext(AtomContext);
  return [
    record[atom.key],
    (reducer) =>
      setRecord((record: Record<string, any>) => ({
        ...record,
        [atom.key]: reducer(record[atom.key]),
      })),
  ] as [S, (fn: (s: S) => S) => S];
}
