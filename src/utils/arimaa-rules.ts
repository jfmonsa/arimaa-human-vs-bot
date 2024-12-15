import { genEmptyBoard, isSamePosition } from "./arimaa-utils";

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

export type Position = [number, number];

export type GoldRank = 1 | 2;

export type SilverRank = 7 | 8;

// export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
// export type File = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";
// export type SquarePosition = `${File}${Rank}`;

export class Arimaa {
  /** Board stores the current state of the game */
  private board: PieceWithSide[][] = genEmptyBoard();
  private turn: Side = GOLD;
  /**
   * The number of turns that have been taken in the game.
   */
  private turnCount: number = 1;
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

  /**
   * Represents the next square that the current player has to move to during a push or pull action.
   * @type {[Position,Position] | null} - A tuple of two positions representing the starting and ending positions of the push or pull action.
   */
  private pushPullNextSquareCurrentPlayerHasToMove: Position | null = null;

  // TODO: should we use a constructor to initialize and check the two forms of initialization of the board: loadBoard and initializeBoard?

  public loadBoard(board: PieceWithSide[][]): Arimaa {
    this.board = board;
    return this;
  }

  /** place gold and silver pieces on the board for the initial setup */
  public setup(goldSetup: Piece[], silverSetup: Piece[]): Arimaa {
    const board = genEmptyBoard();
    this.placePieces(board, GOLD, goldSetup, 1, 2);
    this.placePieces(board, SILVER, silverSetup, 7, 8);
    this.board = board;
    return this;
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

    if (this.isGameOver()) return false;

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
    // Check if previous move was a push or pull
    // Check if there are pieces that the current player must move due to a previous push or pull
    if (this.pushPullPossiblePiecesCurentPlayerHasToMove.length > 0) {
      // Ensure the square being moved to is one of the required squares

      const fromHasToMove = this.pushPullNextSquareCurrentPlayerHasToMove;
      if (!fromHasToMove) return false;

      // new move to square must be the same as the previous move from square of the pushed piece
      if (!isSamePosition(to, fromHasToMove)) return false;

      const isCurrentPieceNotARequired =
        !this.pushPullPossiblePiecesCurentPlayerHasToMove.some((pos) =>
          isSamePosition(pos, from)
        );
      // Ensure the piece being moved is one of the required pieces
      if (isCurrentPieceNotARequired) {
        return false;
      } else {
        // If the clean the list of pieces that must be moved
        this.pushPullPossiblePiecesCurentPlayerHasToMove = [];
        this.pushPullNextSquareCurrentPlayerHasToMove = null;
      }
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
    // 2. current player has avaliable steps in the current turn?
    if (4 - this.steps.length < 2) return false;
    // 1. enemy piece has stroger current's players pieces neighbors
    const strongerNeighbors = this.getStrongerNeighbors(from);

    if (strongerNeighbors.length === 0) return false;

    // store the pieces that the current player must move in the next step
    this.pushPullPossiblePiecesCurentPlayerHasToMove = strongerNeighbors;
    // store the next square that the current player has to move to
    this.pushPullNextSquareCurrentPlayerHasToMove = from;
    console.log("Is a push move" + this.getPiece(from), "move:", [from, to]);
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
      [x - 1, y], // up
      [x + 1, y], // down
      [x, y - 1], // Left
      [x, y + 1], // Right
    ];
  }
  // TODO: change notation to algebraic or i,j (matrix notation) because x,y is confusing since we aren't using a cartesian plane

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
   * Determines the winner of the game.
   *
   * @returns {Side | null} The winning side (GOLD or SILVER) if the game is over, otherwise null.
   */
  public getWinner(): Side | null {
    if (!this.isGameOver()) return null;

    return this.turn === GOLD ? SILVER : GOLD;
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
    // Switch turn
    this.switchTurn();
    this.steps = []; // Reset steps
    this.turnCount++;
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
    const clone = new Arimaa();
    clone.board = this.board.map((row) => [...row]);
    clone.turn = this.turn;
    clone.turnCount = this.turnCount;
    clone.steps = this.steps.map((step) => [...step]);
    clone.pushPullPossiblePiecesCurentPlayerHasToMove =
      this.pushPullPossiblePiecesCurentPlayerHasToMove.map((pos) => [...pos]);
    clone.pushPullNextSquareCurrentPlayerHasToMove = this
      .pushPullNextSquareCurrentPlayerHasToMove
      ? [...this.pushPullNextSquareCurrentPlayerHasToMove]
      : null;
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
          if (!piece) continue;

          const neighbors = gameCopy.getNeighbors([x, y]);
          neighbors.forEach(([nx, ny]) => {
            const move: [Position, Position] = [
              [x, y],
              [nx, ny],
            ];
            currentMoves.push(move);

            // Create a new copy of the game state
            const newGameCopy = gameCopy.clone();
            const result = newGameCopy.makeMove([x, y], [nx, ny]); // Apply the move using makeMove
            if (result) {
              generateMoves(currentMoves, depth + 1, newGameCopy);
            }
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
   * Applies a series of moves to the current game state. Does not check if the moves are legal or not.
   *
   * @param moves - An array of move pairs, where each pair consists of `from` and `to` positions.
   */
  public applyMoves(turnSteps: [Position, Position][]): void {
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
    const [row, col] = position;
    this.board[row][col] = piece;
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
  public ascii(side: Side = GOLD): string {
    const boardToRender =
      side === GOLD ? this.board.slice().reverse() : this.board;
    return boardToRender
      .map((row) => row.map((cell) => cell || ".").join(" "))
      .join("\n");
  }

  public getBoard(): PieceWithSide[][] {
    return this.board;
  }

  public getTurn(): Side {
    return this.turn;
  }

  public getCurrentTurnStepsCount(): number {
    return this.steps.length;
  }

  public getTurnCount(): number {
    return this.turnCount;
  }
}
