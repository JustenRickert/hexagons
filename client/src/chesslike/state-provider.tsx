import { ComponentChildren, createContext } from "preact";
import { useContext, useEffect, useMemo, useState } from "preact/hooks";
import {
  distinctUntilChanged,
  EMPTY,
  merge,
  Observable,
  Subject,
  filter,
} from "rxjs";
import * as State from "./state";

interface T {
  stream: Observable<State.T>;
  setState: (reducer: (state: State.T) => State.T) => void;
  getState: () => State.T;
  // defaultState: State.T;
  // latestWith: <S>(selector: (state: State.T) => S) => Observable<S>;
}

export const StateContext = createContext<T>({
  stream: EMPTY,
  setState: () => {},
  getState: () => State.defaultState,
  // defaultState: State.defaultState,
  // latestWith: () => EMPTY,
});

let state = State.defaultState;

const stateSubject = new Subject<State.T>();

const stream = stateSubject.asObservable();

function setState(reducer: (state: State.T) => State.T) {
  state = reducer(state);
  stateSubject.next(state);
}

function getState() {
  return state;
}

export function StateProvider({ children }: { children: ComponentChildren }) {
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
  }, []);

  const value = useMemo<T>(
    () => ({
      stream,
      setState,
      getState,
      // defaultState: State.defaultState,
      // latestWith: function latestWith(selector) {
      //   return stream.pipe(map(selector), distinctUntilChanged());
      // },
    }),
    []
  );

  return (
    <StateContext.Provider value={value}>{children}</StateContext.Provider>
  );
}

export function useGameState<S>(
  selector: (s: State.T) => S,
  options?: {
    filter?: (s: State.T) => boolean;
    distinct?: (s1: State.T, s2: State.T) => boolean;
  }
) {
  const { stream, getState } = useContext(StateContext);

  const [local, setLocal] = useState<S>(() => selector(getState()));

  useEffect(() => {
    const sub = stream
      .pipe(
        filter(options?.filter ?? (() => true)),
        distinctUntilChanged(options?.distinct)
      )
      .subscribe({
        next(state) {
          setLocal(selector(state));
        },
      });
    return () => sub.unsubscribe();
  }, [selector, stream]);

  return local;
}

export function useSetGameState() {
  return setState;
}
