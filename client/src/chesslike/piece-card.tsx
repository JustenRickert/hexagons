import { useCallback } from "preact/hooks";
import { add, lensPath, over, set } from "ramda";

import { assert, entries, pipeM } from "../util";

import {
  getPieceConfig,
  getAllPieceInteractions,
  getPieceInteractionConfig,
} from "./pieces";
import { pieceGives } from "./state";
import { useGameState, useSetGameState } from "./state-provider";
import { Icon } from "./svg-assets";
import { Piece } from "./types";
import { fromEntries } from "./util";

function Interactions({ interactions }: { interactions: Piece.Interaction[] }) {
  const setState = useSetGameState();
  const automaton = useGameState(useCallback((state) => state.automaton, []));

  const interactionList = useGameState(
    useCallback(
      ({ automaton: { language }, board: { pieces } }) =>
        interactions
          .map((int) => {
            assert(int.owner in pieces, {
              interaction: int,
              pieces,
            });
            return {
              int,
              config: getPieceInteractionConfig(int.owner, int.id),
            };
          })
          .filter(({ int, config }) => {
            const metRequirements = config.requirements.every((req) =>
              Boolean(pieces[req.owner].interactions_completed[req.id])
            );
            const metCost =
              (1 / 10) * (config.cost.language ?? 0) < language.alltime;
            const alreadyCompleted =
              pieces[int.owner].interactions_completed[int.id];
            return metRequirements && metCost && !alreadyCompleted;
          }),
      [interactions]
    )
  );

  const doInteraction = useCallback((int: Piece.Interaction) => {
    const config = getPieceInteractionConfig(int.owner, int.id);

    const setIntCompleted = set(
      lensPath([
        "board",
        "pieces",
        int.owner,
        "interactions_completed",
        int.id,
      ]),
      true
    );

    const spendCost = pipeM(
      ...entries(config.cost).map(([key, cost = 0]) =>
        over(lensPath(["automaton", key, "current"]), add(-cost))
      )
    );

    setState(pipeM(setIntCompleted, spendCost));
  }, []);

  console.log({
    interactionList,
  });

  return (
    <ul>
      {interactionList.map(({ int, config }) => (
        <li key={int.id}>
          <button
            title={config.flavor_text}
            disabled={
              (config.cost.language ?? 0) > automaton.language.current ||
              (config.cost.mathematics ?? 0) > automaton.mathematics.current ||
              (config.cost.music ?? 0) > automaton.music.current
            }
            onClick={() => doInteraction(int)}
          >
            <div>{config.name}</div>
            {config.cost.language && <div>{config.cost.language} Language</div>}
            {config.cost.mathematics && (
              <div>{config.cost.mathematics} Math</div>
            )}
            {config.cost.music && <div>{config.cost.music} Music</div>}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function PieceCard({ piece }: { piece: Piece.WithHex }) {
  const config = getPieceConfig(piece.id);
  const gives = useGameState((state) => pieceGives(piece, state));
  const interactions = getAllPieceInteractions(piece.id);

  return (
    <div class="card">
      <section>
        <h3>{piece.id}</h3>

        {entries(gives)
          .map(([key, gives]) => ({
            key,
            gives,
          }))
          .filter(({ gives }) => Boolean(gives))
          .map(({ key, gives }) => (
            <p>
              {gives} <Icon type={key} />
            </p>
          ))}
        <p>{config.description}</p>
        <Interactions interactions={interactions} />
      </section>
    </div>
  );
}
