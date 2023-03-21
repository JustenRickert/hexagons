import { memoizeWith } from "ramda";
import { assert } from "../../util";
import { Piece, PieceConfig, PieceInteractionConfig } from "../types";
import { PieceId } from "./constant";

const pieceConfigs = import.meta.glob("../pieces/piece-*.ts", { eager: true });

function assertPieceConfig(
  record: any,
  { importId }: { importId: string }
): asserts record is PieceConfig {
  [
    "id",
    "name",
    "description",
    "interactions",
    "gives",
    "stray_movement",
    "unlocked",
  ].forEach((key) => {
    assert(key in record, `missing "%s" in %s config`, key, importId, {
      record,
    });
  });
}

export function getPieceConfig(pieceId: Piece.Id): PieceConfig {
  const importId = `./${pieceId}.ts`;
  assert(importId in pieceConfigs, "import %s not found", importId, {
    pieceConfigs,
  });
  const record = pieceConfigs[importId] as any;
  assert("default" in record, "need default export");
  assertPieceConfig(record.default, { importId });
  return record.default;
}

/**
 * A bit funny to have a separation between `PieceInteraction` and
 * `PieceInteractionConfig`. The idea is that a config should have sparse
 * attributes, so they're easy to write, and then the non-config should have
 * defaulted values so the interface is easy to use.
 */

export const getPieceInteraction_inner = memoizeWith<
  (
    pieceId: Piece.Id,
    interactionConfig: PieceInteractionConfig
  ) => Piece.Interaction
>(
  (pieceId, int) => `${pieceId}.${int.id}`,
  (pieceId, int) => {
    return {
      owner: pieceId,
      ...int,
      gives: {
        language: 0,
        mathematics: 0,
        music: 0,
        ...int.gives,
      },
    };
  }
);

export function getPieceInteractionConfig(
  pieceId: Piece.Id,
  interactionId: Piece.InteractionId
) {
  const interactions = getPieceConfig(pieceId).interactions;
  const int = interactions.find((int) => int.id === interactionId);
  assert(int, "interaction not found");
  return int;
}

export function getPieceInteraction(
  pieceId: PieceId,
  interactionId: Piece.InteractionId
) {
  return getPieceInteraction_inner(
    pieceId,
    getPieceInteractionConfig(pieceId, interactionId)
  );
}

export const getAllPieceInteractions = memoizeWith<
  (piece: Piece.Id) => Piece.Interaction[]
>(String, (pieceId) =>
  getPieceConfig(pieceId).interactions.map((int) =>
    getPieceInteraction_inner(pieceId, int)
  )
);

// export function usePieceInteractions(pieceId: Piece.Id) {
//   return getPieceConfig(pieceId).interactions.map((int) =>
//     makePieceInteraction(pieceId, int)
//   );
// }
