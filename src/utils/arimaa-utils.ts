import {
  CAMEL,
  CAT,
  Piece,
  DOG,
  ELEPHANT,
  HORSE,
  RABBIT,
  PieceWithSide,
  TRAP_SQUARES,
} from "./arimaa-rules";
import { shuffleArray } from "./shuffle-array";

export function generateRandomArimaaSetup(): Piece[] {
  const pieces = [
    RABBIT,
    RABBIT,
    RABBIT,
    RABBIT,
    RABBIT,
    RABBIT,
    RABBIT,
    RABBIT,
    CAT,
    CAT,
    DOG,
    DOG,
    HORSE,
    HORSE,
    CAMEL,
    ELEPHANT,
  ];
  return shuffleArray(pieces) as Piece[];
}

export function genEmptyBoard(): PieceWithSide[][] {
  return Array.from({ length: 8 }, () => Array(8).fill(null));
}

export const isTrap = (row: number, col: number) => {
  return TRAP_SQUARES.some(
    ([trapRow, trapCol]) => trapRow === row && trapCol === col
  );
};
