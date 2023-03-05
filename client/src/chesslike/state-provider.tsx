import { ComponentChildren, createContext } from "preact";
import { useCallback, useEffect, useMemo } from "preact/hooks";
import {
  distinctUntilChanged,
  EMPTY,
  merge,
  Observable,
  Subject,
  Subscription,
} from "rxjs";
import * as State from "./state";

export const StateContext = createContext<{
  stream: Observable<State.T>;
  setState: (reducer: (state: State.T) => State.T) => void;
  defaultState: State.T;
}>({
  stream: EMPTY,
  setState: () => {},
  defaultState: State.defaultState,
});

let state = State.defaultState;

const stateSubject = new Subject<State.T>();

const stream = stateSubject.asObservable();

export function StateProvider({ children }: { children: ComponentChildren }) {
  const setState = useCallback<(reducer: (state: State.T) => State.T) => void>(
    (reducer) => {
      state = reducer(state);
      stateSubject.next(state);
    },
    []
  );

  useEffect(() => {
    const sub = merge(
      ...State.effects.map((effect) =>
        effect(stream).pipe(distinctUntilChanged())
      )
    ).subscribe({
      next(reducer) {
        setState(reducer);
      },
    });

    return () => sub.unsubscribe();
  }, [setState]);

  const value = useMemo(
    () => ({
      stream: stream,
      setState,
      defaultState: State.defaultState,
    }),
    []
  );

  return (
    <StateContext.Provider value={value}>{children}</StateContext.Provider>
  );
}
