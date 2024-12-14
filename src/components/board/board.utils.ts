import { GOLD, PieceWithSide, SILVER } from "../../utils/arimaa-rules";

export function getPieceImage(cell: PieceWithSide | null) {
  if (!cell) return null;
  const piece = cell[1].toLowerCase();
  const player = cell[0] === GOLD ? GOLD : SILVER;
  return `/Arimaa_${piece}${player}.svg`;
}
