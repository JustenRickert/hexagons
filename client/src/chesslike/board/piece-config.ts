import { assert } from "../../util";
import { Piece } from "../types";

const pieceConfigs = import.meta.glob("../pieces/piece-*.ts", { eager: true });

interface PieceConfig {
  id: Piece.Id;
  description: string;
  gives: Piece.T["gives"];
  interactions: Record<Piece.InteractionId, Piece.Interaction>;
  strayMovement: boolean;
  svg: string;
}

export function getPieceConfig(pieceId: Piece.Id): PieceConfig {
  const importId = `../pieces/${pieceId}.ts`;
  assert(importId in pieceConfigs, "`importId` %s not found", importId);
  const record = pieceConfigs[importId] as any;
  [
    "id",
    "description",
    "gives",
    "interactions",
    "strayMovement",
    // "svg", // TODO Standardize thing for every config
  ].forEach((key) => {
    assert(key in record, `need "%s" in %s config`, key, pieceId);
  });
  return record as PieceConfig;
}

export function getPieceInteractionConfig(
  pieceId: Piece.Id,
  interactionId: Piece.InteractionId
) {
  const interactions = getPieceConfig(pieceId).interactions;
  assert(interactionId in interactions);
  return interactions[interactionId];
}

export function usePieceConfig(pieceId: Piece.Id | undefined) {
  if (!pieceId) return null;
  return getPieceConfig(pieceId);
}
