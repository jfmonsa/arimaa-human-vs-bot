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

export const TRAP_SQUARES: Position[] = [
  [2, 2],
  [2, 5],
  [5, 2],
  [5, 5],
];

//type IndexRange = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type Position = [number, number];

export type GoldRank = 1 | 2;

export type SilverRank = 7 | 8;

// export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
// export type File = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";
// export type SquarePosition = `${File}${Rank}`;

export class Arimaa {
  /** Board stores the current state of the game */
  private board: PieceWithSide[][];
  private turn: Side = GOLD;
  private moveCount: number = 0;
  /**
   * Stores the steps taken during the current turn.
   *
   * @remarks
   * In Arimaa, a turn consists of up to four steps. Each step is a move of a piece from one position to another.
   * The `steps` array keeps track of these steps for the current turn. Each step is represented as a tuple of
   * two positions: the starting position and the ending position.
   *
   * @example
   * // Example of steps for a turn:
   * // Move a piece from (2, 3) to (2, 4), then from (2, 4) to (2, 5)
   * this.steps = [
   *   [[2, 3], [2, 4]],
   *   [[2, 4], [2, 5]]
   * ];
   *
   * @type {[Position][][]}
   */
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
  public makeMove(from: Position, to: Position): boolean {
    if (this.steps.length >= 4) {
      console.log("Maximum steps reached for this turn.");
      console.log(this.turn);
      return false;
    }

    if (!this.validateMove(from, to)) return false;

    const piece = this.getPiece(from);
    const targetPiece = this.getPiece(to);

    // Handle push/pull
    if (targetPiece) {
      const dx = to[0] - from[0]; // +1 for right, -1 for left
      const dy = to[1] - from[1]; // +1 for down, -1 for up

      // Determine if it's a push or pull
      const pushTarget: Position = [to[0] + dx, to[1] + dy];
      const pullTarget: Position = [from[0] - dx, from[1] - dy];

      // Check if push or pull is possible
      const isPushTargetEmpty =
        this.board[pushTarget[0]] &&
        this.board[pushTarget[0]][pushTarget[1]] === null;

      const isPullTargetEmpty =
        this.board[pullTarget[0]] &&
        this.board[pullTarget[0]][pullTarget[1]] === null;

      if (isPushTargetEmpty) {
        this.movePiece(to, pushTarget, targetPiece); // Move target to next square
        this.movePiece(from, to, piece); // Move piece to target square
      } else if (isPullTargetEmpty) {
        // is this correct?
        this.movePiece(to, pullTarget, piece); // Move piece to target square
        this.movePiece(from, to, targetPiece); // Move target to previous square

        // or what is correct?
        //this.movePiece(from, to, piece);
        //this.movePiece(to, pullTarget, targetPiece);
      } else {
        // Invalid move if neither push nor pull is possible
        return false;
      }
    } else {
      // Normal move
      this.movePiece(from, to, piece);
    }

    this.removePiece(from);
    this.steps.push([from, to]);

    this.handleTraps();

    // Check if the turn should end
    if (this.steps.length === 4) {
      this.giveUpTurn();
    }

    return true;
  }

  /**
   * Moves a piece from one position to another on the Arimaa board.
   */
  private movePiece(from: Position, to: Position, piece: PieceWithSide): void {
    this.putPiece(to, piece);
    this.removePiece(from);
  }

  /**
   * Places a piece on the board at the specified position.
   */
  public putPiece(position: Position, piece: PieceWithSide): void {
    this.board[position[0]][position[1]] = piece;
  }

  /**
   * Retrieves the piece located at the specified position on the board.
   */
  public getPiece(position: Position): PieceWithSide {
    return this.board[position[0]][position[1]];
  }

  /**
   * Removes a piece from the specified position on the board.
   */
  public removePiece(position: Position): void {
    this.putPiece(position, null);
  }

  /**
   * Validates a move from one position to another on the Arimaa board.
   *
   * @param from - The starting position as a tuple [x, y].
   * @param to - The target position as a tuple [x, y].
   * @returns `true` if the move is valid, `false` otherwise.
   *
   * The move is considered valid if:
   * - The starting position contains a piece belonging to the current player.
   * - The move is orthogonal (not diagonal) and only one square away.
   * - Rabbits do not move backward.
   * - The target square is empty.
   */
  public validateMove(from: Position, to: Position): boolean {
    const [fx, fy] = from;
    const [tx, ty] = to;

    // Check if positions are within board limits
    if (
      !this.checkIfPositionIsInBoard(from) ||
      !this.checkIfPositionIsInBoard(to)
    )
      return false;

    const piece = this.getPiece(from);

    if (!piece || piece[0] !== this.turn) return false; // Not your turn or empty square

    const dx = Math.abs(fx - tx);
    const dy = Math.abs(fy - ty);

    // Only orthogonal moves allowed and must be one square away
    if (dx + dy !== 1) return false;

    // Rabbits cannot move backward
    if (
      piece[1] === RABBIT &&
      ((this.turn === GOLD && tx < fx) || (this.turn === SILVER && tx > fx))
    ) {
      return false;
    }

    // Handle pushing or pulling
    const targetPiece = this.getPiece(to);

    if (targetPiece) {
      if (targetPiece[0] === this.turn) return false; // Can't push/pull friendly pieces
      // Validate push/pull logic
      const strength = this.getPieceStrength(piece[1] as Piece);
      const targetStrength = this.getPieceStrength(targetPiece[1] as Piece);
      if (strength <= targetStrength) return false; // Can only move weaker pieces
      // Check for valid push/pull positions
      const pushPullValid = this.validatePushPull(from, to, targetPiece);
      if (!pushPullValid) return false;
    }
    // Target square must be empty unless pushing/pulling
    if (!targetPiece && this.board[tx][ty]) return false;
    return true;
  }

  private checkIfPositionIsInBoard(position: Position): boolean {
    const [x, y] = position;
    return x >= 0 && x < 8 && y >= 0 && y < 8;
  }

  /**
   * Validates whether a push or pull move is possible from the given position.
   *
   * A push move requires the target piece to have an empty space to move into.
   * A pull move requires the original position to have an empty space in the opposite direction.
   *
   * @param from - The starting position of the piece.
   * @param to - The ending position of the piece.
   * @param targetPiece - The piece being pushed or pulled, including its side.
   * @returns `true` if the push or pull move is valid, otherwise `false`.
   */
  private validatePushPull(
    from: Position,
    to: Position,
    _targetPiece: PieceWithSide
  ): boolean {
    // TODO: verify if _targetPiece is needed

    const [fx, fy] = from;
    const [tx, ty] = to;
    // Determine the direction of the move
    const dx = tx - fx; // +1 for right, -1 for left
    const dy = ty - fy; // +1 for down, -1 for up
    // Validate push (target must have an empty space to move into)
    const pushTarget: Position = [tx + dx, ty + dy];
    if (
      this.checkIfPositionIsInBoard(pushTarget) &&
      !this.board[pushTarget[0]][pushTarget[1]]
    ) {
      return true;
    }
    // Validate pull (from must have an empty space in the opposite direction)
    const pullTarget: Position = [fx - dx, fy - dy];
    if (
      this.checkIfPositionIsInBoard(pullTarget) &&
      !this.board[pullTarget[0]][pullTarget[1]]
    ) {
      return true;
    }
    return false;
  }

  /**
   * Handles the trap squares on the board by checking each trap square
   * to see if there is a piece on it. If there is a piece and it does not
   * have a friendly neighbor, the piece is removed from the board.
   *
   * A trap square is a specific position on the board that can capture
   * a piece if it does not have a friendly neighbor. The friendly neighbor
   * is determined by the piece's owner.
   *
   * This method iterates over all predefined trap squares, checks if there
   * is a piece on each trap square, and then verifies if the piece has a
   * friendly neighbor. If the piece does not have a friendly neighbor, it
   * is removed from the board.
   *
   * @private
   */
  private handleTraps(): void {
    TRAP_SQUARES.forEach(([x, y]) => {
      const piece = this.getPiece([x, y]);
      if (piece && !this.hasFriendlyNeighbor([x, y], piece[0] as Side)) {
        this.removePiece([x, y]);
      }
    });
  }

  /**
   * Checks if a given position has a neighboring piece of the same side.
   *
   * @param {Position} position - The position to check, represented as a tuple [x, y].
   * @param {Side} side - The side to check for friendly neighbors.
   * @returns {boolean} - Returns true if there is at least one neighboring piece of the same side, otherwise false.
   */
  private hasFriendlyNeighbor([x, y]: Position, side: Side): boolean {
    const neighbors: Position[] = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ];
    return neighbors.some(
      ([nx, ny]) =>
        nx >= 0 &&
        nx < 8 &&
        ny >= 0 &&
        ny < 8 &&
        this.board[nx][ny]?.[0] === side
    );
  }

  /**
   * Checks the victory conditions for the Arimaa game.
   *
   * This method evaluates the current state of the board to determine if either
   * the gold or silver player has won the game. The victory conditions checked are:
   * 1. If a rabbit of the gold player ("gR") has reached the opposing goal row (row 7).
   * 2. If a rabbit of the silver player ("sR") has reached the opposing goal row (row 0).
   * 3. If either side has no rabbits left on the board.
   *
   * Future win conditions such as freezing all pieces or repetition rules are not yet implemented.
   *
   * @returns {boolean} - Returns `true` if any victory condition is met, otherwise `false`.
   */
  public isGameOver(): boolean {
    // Check if a rabbit reached the opposing goal row
    const goldWins = this.board[7].some((cell) => cell === "gR");
    const silverWins = this.board[0].some((cell) => cell === "sR");

    if (goldWins || silverWins) return true;

    // Check if either side has no rabbits left
    const goldHasRabbits = this.board.flat().some((cell) => cell === "gR");
    const silverHasRabbits = this.board.flat().some((cell) => cell === "sR");

    if (!goldHasRabbits || !silverHasRabbits) return true;

    // Future: Add additional win conditions like freezing all pieces, repetition rules, etc.
    return false;
  }

  /**
   * Ends the current player's turn and switches to the other player.
   */
  public giveUpTurn(): void {
    if (this.steps.length === 0) {
      throw new Error("Cannot pass the entire turn without moving.");
    }

    // Check victory conditions before switching turns
    if (this.isGameOver()) {
      console.log(`${this.turn === GOLD ? SILVER : GOLD} wins the game!`);
      return;
    }

    // Switch turn
    this.switchTurn();
    this.steps = []; // Reset steps
    this.moveCount++;
  }

  public switchTurn(): void {
    this.turn = this.turn === GOLD ? SILVER : GOLD;
  }

  private getPieceStrength(piece: Piece): number {
    const strenghtLookup = {
      [RABBIT]: 1,
      [CAT]: 2,
      [DOG]: 3,
      [HORSE]: 4,
      [CAMEL]: 5,
      [ELEPHANT]: 6,
    };
    return strenghtLookup[piece];
  }

  /**
   * deep copy of the Arimaa instance
   *
   * @returns A new Arimaa instance with the board state after the move.
   */
  public clone(): Arimaa {
    const clone = new Arimaa([], []);
    clone.board = this.board.map((row) => [...row]);
    clone.turn = this.turn;
    clone.moveCount = this.moveCount;
    clone.steps = this.steps.map((step) => [...step]);
    return clone;
  }

  /**
   * Generates all legal moves for the current player based on the current board state.
   *
   * @returns An array of tuples, where each tuple contains two `Position` arrays. `from` and `to`
   */
  public generateLegalMoves(): [Position, Position][] {
    const moves: [Position, Position][] = [];
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        const piece = this.getPiece([x, y]);
        if (piece && piece[0] === this.turn) {
          const neighbors: Position[] = [
            [x - 1, y],
            [x + 1, y],
            [x, y - 1],
            [x, y + 1],
          ];
          neighbors.forEach(([nx, ny]) => {
            if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
              if (this.validateMove([x, y], [nx, ny])) {
                moves.push([
                  [x, y],
                  [nx, ny],
                ]);
              }
            }
          });
        }
      }
    }
    return moves;
  }

  /**
   * Applies a series of moves to the current game state.
   *
   * @param moves - An array of move pairs, where each pair consists of `from` and `to` positions.
   */
  public applyMoves(moves: Position[][]): void {
    for (const [from, to] of moves) {
      this.makeMove(from, to);
    }
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
