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
/*
export function piecePositionToIndex(
  position: SquarePosition
): [number, number] {
  const file = position.charCodeAt(0) - "a".charCodeAt(0);
  const rank = 8 - parseInt(position[1]);
  return [rank, file];
}

export function pieceIndexToPosition(index: [number, number]): SquarePosition {
  const file = String.fromCharCode(index[1] + "a".charCodeAt(0));
  const rank = 8 - index[0];
  return `${file}${rank}` as SquarePosition;
}*/
