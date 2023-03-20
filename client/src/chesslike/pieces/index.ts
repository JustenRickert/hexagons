import { assert } from "../../util";
import { Piece, PieceConfig, PieceInteractionConfig } from "../types";

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

export function makePieceInteraction(
  config: PieceInteractionConfig,
  { pieceId }: { pieceId: Piece.Id }
): Piece.Interaction {
  return {
    id: config.id,
    owner: pieceId,
    base_gives: {
      language: 0,
      mathematics: 0,
      ...config.gives,
    },
    unlocked: config.unlocked ?? false,
    unlocks: config.unlocks ?? [],
  };
}

export function getPieceInteractionConfig(
  pieceId: Piece.Id,
  interactionId: Piece.InteractionId
) {
  const interactions = getPieceConfig(pieceId).interactions;
  const int = interactions.find((int) => int.id === interactionId);
  assert(int, "interaction not found");
  return int;
}

export function usePieceConfig(pieceId: Piece.Id | undefined) {
  if (!pieceId) return null;
  return getPieceConfig(pieceId);
}

export function usePieceInteractions(pieceId: Piece.Id | undefined) {
  if (!pieceId) return null;
  return getPieceConfig(pieceId).interactions.map((int) =>
    makePieceInteraction(int, { pieceId })
  );

  // usePieceConfig
}
