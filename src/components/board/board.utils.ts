import {
  GOLD,
  PieceWithSide,
  Position,
  Side,
  SILVER,
} from "../../utils/arimaa-rules";

export function getPieceImage(cell: PieceWithSide | null) {
  if (!cell) return null;
  const piece = cell[1].toLowerCase();
  const player = cell[0] === GOLD ? GOLD : SILVER;
  return `/Arimaa_${piece}${player}.svg`;
}

export function convertToInternal(
  visualRow: number,
  visualCol: number,
  side: Side
): Position {
  return side === SILVER
    ? [visualRow, visualCol]
    : [7 - visualRow, 7 - visualCol];
}

export function convertToVisual(
  internalRow: number,
  internalCol: number,
  side: Side
): Position {
  return side === SILVER
    ? [internalRow, internalCol]
    : [7 - internalRow, 7 - internalCol];
}
