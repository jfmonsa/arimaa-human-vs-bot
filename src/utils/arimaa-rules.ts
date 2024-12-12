import { genEmptyBoard } from "./arimaa-utils";

// sides
export const GOLD = "g" as const;
export const SILVER = "s" as const;

// pieces
export const RABBIT = "R" as const;
export const CAT = "C" as const;
export const DOG = "D" as const;
export const HORSE = "H" as const;
export const CAMEL = "M" as const;
export const ELEPHANT = "E" as const;

export type Piece =
  | typeof RABBIT
  | typeof CAT
  | typeof DOG
  | typeof HORSE
  | typeof CAMEL
  | typeof ELEPHANT;

export type Side = typeof GOLD | typeof SILVER;

export type PieceWithSide = `${Side}${Piece}` | null;

export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type File = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";

export type SquarePosition = `${File}${Rank}`;

export type GoldRank = 1 | 2;

export type SilverRank = 7 | 8;

export class Arimaa {
  private board: PieceWithSide[][];

  constructor(goldSetup: Piece[], silverSetup: Piece[]) {
    this.board = this.initializeBoard(goldSetup, silverSetup);
  }

  private initializeBoard(
    goldSetup: Piece[],
    silverSetup: Piece[]
  ): PieceWithSide[][] {
    const board = genEmptyBoard();

    // Colocar las piezas de GOLD en las dos primeras filas
    this.placePieces(board, GOLD, goldSetup, 1, 2);

    // Colocar las piezas de SILVER en las dos últimas filas
    this.placePieces(board, SILVER, silverSetup, 7, 8);

    return board;
  }

  private placePieces(
    board: PieceWithSide[][],
    player: Side,
    setup: Piece[],
    row1: GoldRank | SilverRank,
    row2: GoldRank | SilverRank
  ): void {
    const rows = [row1, row2];
    let index = 0;

    rows.forEach((row) => {
      for (let col = 1; col <= 8; col++) {
        board[row-1][col-1] = `${player}${setup[index]}`;
        index++;
      }
    });
  }

  // Método para validar movimientos
  public validateMove(_from: [number, number], _to: [number, number]): boolean {
    // Implementar la lógica de validación de movimientos
    return true;
  }

  // Método para ejecutar movimientos
  public makeMove(from: [number, number], to: [number, number]): boolean {
    if (this.validateMove(from, to)) {
      // Mover la pieza en el tablero
      this.board[to[0]][to[1]] = this.board[from[0]][from[1]];
      this.board[from[0]][from[1]] = null;
      return true;
    }
    return false;
  }

  // Método para imprimir el tablero (opcional, para depuración)
  public ascii(): string {
    return this.board
      .map((row) => row.map((cell) => cell || ".").join(" "))
      .join("\n");
  }

  public getBoard(): PieceWithSide[][] {
    return this.board;
  }
}
