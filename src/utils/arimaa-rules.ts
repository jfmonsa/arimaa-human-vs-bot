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

// export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// export type File = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";

//export type SquarePosition = `${File}${Rank}`;

export type GoldRank = 1 | 2;

export type SilverRank = 7 | 8;

export class Arimaa {
  private board: PieceWithSide[][];
  private turn: Side = GOLD;
  private steps: [number, number][][] = [];

  constructor(goldSetup: Piece[], silverSetup: Piece[]) {
    this.board = this.initializeBoard(goldSetup, silverSetup);
  }

  /** place gold and silver pieces on the board for the initial setup */
  private initializeBoard(
    goldSetup: Piece[],
    silverSetup: Piece[]
  ): PieceWithSide[][] {
    const board = genEmptyBoard();
    this.placePieces(board, GOLD, goldSetup, 1, 2);
    this.placePieces(board, SILVER, silverSetup, 7, 8);

    return board;
  }

  /**
   * Places pieces on the board for a given player according to the provided setup.
   *
   * @remarks
   * This function modifies the board by placing the pieces for the specified player
   * in the given rows. The setup array should contain the pieces in the order they
   * should be placed on the board.
   */
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
        board[row - 1][col - 1] = `${player}${setup[index]}`;
        index++;
      }
    });
  }

  /** Excecute an step of the turn of a player */
  public makeMove(from: [number, number], to: [number, number]): boolean {
    if (this.validateMove(from, to)) {
      this.board[to[0]][to[1]] = this.board[from[0]][from[1]];
      this.board[from[0]][from[1]] = null;
      this.steps.push([from, to]);
      return true;
    }
    return false;
  }

  /**
   * Ends the current player's turn if the number of steps taken is between 1 and 4.
   *
   * @throws {Error} If the number of steps is not between 1 and 4.
   */
  public endTurn(): void {
    if (this.steps.length > 0 && this.steps.length <= 4) {
      this.turn = this.turn === GOLD ? SILVER : GOLD;
      this.steps = [];
    } else {
      throw new Error("A turn must consist of 1 to 4 steps.");
    }
  }

  /**
   * Ends the current player's turn and switches to the other player.
   */
  public giveUpTurn(): void {
    this.turn = this.turn === GOLD ? SILVER : GOLD;
    this.steps = [];
  }

  // Método para validar movimientos
  public validateMove(_from: [number, number], _to: [number, number]): boolean {
    // Implementar la lógica de validación de movimientos
    return true;
  }

  /**
   * print board for debugging purpouses
   */
  public ascii(): string {
    return this.board
      .map((row) => row.map((cell) => cell || ".").join(" "))
      .join("\n");
  }

  public getBoard(): PieceWithSide[][] {
    return this.board;
  }

  public getTurn(): Side {
    return this.turn;
  }
}
