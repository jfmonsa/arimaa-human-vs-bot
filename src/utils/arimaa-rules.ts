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
   * Each Player can move up to 4 times in a turn. If a player moves 4 times, the turn musth switch.
   */
  private steps: [number, number][][] = [];

  /**
   * Stores the positions of pieces that the current player must move if there are
   * multiple pieces adjacent to a rival piece that has been pushed or pulled in
   * the previous move. This ensures that the current player adheres to the rules
   * of the game by moving one of the pieces stored in this array.
   */
  private pushPullPossiblePiecesCurentPlayerHasToMove: Position[] = [];

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
    if (!this.validateMove(from, to)) return false;

    this.movePiece(from, to, this.getPiece(from));

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
   * Validates a move from one position to another on the Arimaa board.
   *
   * @param from - The starting position as a tuple [x, y].
   * @param to - The target position as a tuple [x, y].
   * @returns `true` if the move is valid, `false` otherwise.
   */
  public validateMove(from: Position, to: Position): boolean {
    const [fx, fy] = from;
    const [tx, ty] = to;

    // Check if previous move was a push or pull
    // Check if there are pieces that the current player must move due to a previous push or pull
    if (this.pushPullPossiblePiecesCurentPlayerHasToMove.length > 0) {
      // Ensure the piece being moved is one of the required pieces
      if (
        !this.pushPullPossiblePiecesCurentPlayerHasToMove.some(
          (pos) => pos[0] === fx && pos[1] === fy
        )
      ) {
        return false;
      } else {
        // If the clean the list of pieces that must be moved
        this.pushPullPossiblePiecesCurentPlayerHasToMove = [];
      }
    }

    // Check if positions are within board limits
    if (
      !this.checkIfPositionIsInBoard(from) ||
      !this.checkIfPositionIsInBoard(to)
    )
      return false;

    const piece = this.getPiece(from);
    const targetSquare = this.getPiece(to);

    // Empty square or target square is not empty
    if (!piece || targetSquare) return false;

    const dx = Math.abs(fx - tx);
    const dy = Math.abs(fy - ty);

    // Only orthogonal moves allowed and must be one square away
    if (dx + dy !== 1) return false;

    // Rabbits cannot move backward
    if (
      this.getPieceType(piece) === RABBIT &&
      ((this.turn === GOLD && tx < fx) || (this.turn === SILVER && tx > fx))
    ) {
      return false;
    }

    // Check if the piece belongs to the current player
    if (this.getSide(piece) === this.turn) {
      return true;
    } else {
      // Check if it's a valid push move
      return this.checkIfIsPush(from, to);
    }
  }

  private checkIfIsPush(from: Position, to: Position): boolean {
    // 2. has avaliable steps?
    if (this.steps.length > 2) return false;
    // 1. enemy piece has stroger current's players pieces neighbors (get neighbors and store them if satisfies the conditions)
    const strongerNeighbors = this.getStrongerNeighbors(from);
    // guardarlos para luego solo poder ejecutar los movimientos en el siguiente step con estos neighbors

    if (strongerNeighbors.length === 0) return false;
    this.pushPullPossiblePiecesCurentPlayerHasToMove = strongerNeighbors;
    return true;
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
    const neighbors = this.getNeighbors([x, y]);
    return neighbors.some(
      (neighborPos) =>
        this.checkIfPositionIsInBoard(neighborPos) &&
        this.getSide(this.getPiece(neighborPos)) === side
    );
  }

  /**
   * Retrieves the positions of neighboring current player's pieces that are stronger than the enemy piece at the given position.
   * This is used to determine if a push move can be made on the enemy piece.
   * If no stronger neighbors are found, returns an empty array.
   */
  private getStrongerNeighbors(position: Position): Position[] {
    const enemyPiece = this.getPiece(position);
    if (!enemyPiece) return [];

    const neighbors = this.getNeighbors(position);
    const strongerNeighbors: Position[] = [];

    for (const neighbor of neighbors) {
      if (!this.checkIfPositionIsInBoard(neighbor)) break;
      const neighborPiece = this.getPiece(neighbor);

      if (
        neighborPiece &&
        this.getSide(neighborPiece) === this.turn &&
        this.getPieceStrength(this.getPieceType(enemyPiece) as Piece) <
          this.getPieceStrength(this.getPieceType(neighborPiece) as Piece)
      ) {
        strongerNeighbors.push(neighbor);
      }
    }

    return strongerNeighbors;
  }

  /**
   * Returns the neighboring positions of a given position on the board.
   */
  private getNeighbors([x, y]: Position): Position[] {
    return [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ];
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

    if (this.pushPullPossiblePiecesCurentPlayerHasToMove.length > 0) {
      throw new Error(
        "Cannot pass the entire turn without moving the required pieces because a push / pull move has made."
      );
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
   * Generates all possible legal turns for the board state up to a depth of 4 steps.
   * Each turn is represented as an array of steps, where each step is a tuple containing
   * the starting and ending positions of a piece.
   *
   * @returns {Array<[Position, Position][]>} An array of turns, where each turn is an array of steps.
   */
  public generateLegalMoves(): [Position, Position][][] {
    const moves: [Position, Position][][] = [];

    const generateMoves = (
      currentMoves: [Position, Position][],
      depth: number,
      gameCopy: Arimaa
    ) => {
      if (depth === 4) {
        moves.push([...currentMoves]);
        return;
      }

      for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
          const piece = gameCopy.getPiece([x, y]);
          if (!piece || gameCopy.getSide(piece) !== gameCopy.turn) continue;

          const neighbors = gameCopy.getNeighbors([x, y]);
          neighbors.forEach(([nx, ny]) => {
            if (!gameCopy.checkIfPositionIsInBoard([nx, ny])) return;
            if (!gameCopy.validateMove([x, y], [nx, ny])) return;

            const move: [Position, Position] = [
              [x, y],
              [nx, ny],
            ];
            currentMoves.push(move);
            gameCopy.movePiece([x, y], [nx, ny], piece); // Apply the move
            generateMoves(currentMoves, depth + 1, gameCopy);
            gameCopy.movePiece([nx, ny], [x, y], piece); // Undo the move
            currentMoves.pop();
          });
        }
      }

      if (depth > 0) {
        moves.push([...currentMoves]);
      }
    };

    const gameCopy = this.clone(); // Create a copy of the game state
    generateMoves([], 0, gameCopy);

    return moves;
  }

  /**
   * Applies a series of moves to the current game state.
   *
   * @param moves - An array of move pairs, where each pair consists of `from` and `to` positions.
   */
  public applyMoves(turnSteps: [Position, Position][]): void {
    // TODO: should we use movePiece instead trusting that are moves to apply are legal? or makeMove
    for (const [from, to] of turnSteps) {
      this.movePiece(from, to, this.getPiece(from));
    }
  }

  private checkIfPositionIsInBoard(position: Position): boolean {
    const [x, y] = position;
    return x >= 0 && x < 8 && y >= 0 && y < 8;
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

  public getSide(piece: PieceWithSide): Side | null {
    return piece ? (piece[0] as Side) : null;
  }

  public getPieceType(piece: PieceWithSide): Piece | null {
    return piece ? (piece[1] as Piece) : null;
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
