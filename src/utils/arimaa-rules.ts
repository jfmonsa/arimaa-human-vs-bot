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

export interface MakeMoveExtraOptions {
  needToPassTurnAfterMoveDone?: boolean;
}
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
  /**
   * Represents the state of the board before the current turn started.
   *
   * @remarks
   * This property is necessary to validate that a player does not make a move equivalent to passing the whole turn.
   * By comparing the current state of the board with this initial state at the end of the turn, we can ensure that
   * the player has made meaningful moves and not just passed the turn without any actual movement.
   */
  private boardBeforeTurn: PieceWithSide[][] = genEmptyBoard();

  private isCurrentMoveAPushOrPull = false;
  private hasAPushOrPullBeenMadeInPreviousTurn = false;

  // TODO: should we use a constructor to initialize and check the two forms of initialization of the board: loadBoard and initializeBoard?
  public loadBoard(board: PieceWithSide[][]): Arimaa {
    this.board = board;
    return this;
  }

  /** place gold and silver pieces on the board for the initial setup */
  public setup(goldSetup: Piece[], silverSetup: Piece[]): Arimaa {
    this.placePieces(this.board, GOLD, goldSetup, 1, 2);
    this.placePieces(this.boardBeforeTurn, GOLD, goldSetup, 1, 2);
    this.placePieces(this.board, SILVER, silverSetup, 7, 8);
    this.placePieces(this.boardBeforeTurn, SILVER, silverSetup, 7, 8);
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
  public makeMove(
    from: Position,
    to: Position,
    extraOptions?: MakeMoveExtraOptions
  ): boolean {
    console.log(
      "makeMove",
      JSON.stringify([from, to]),
      "turn:",
      this.turn,
      "piece:",
      this.getPiece(from),
      "steps:",
      this.steps.length,
      "turn number:",
      this.turnCount
    );
    if (!this.validateMove(from, to)) return false;

    this.movePiece(from, to, this.getPiece(from));

    this.steps.push([from, to]);

    this.handleTraps();

    // Check if the turn should end
    if (
      this.steps.length === 4 ||
      (extraOptions && extraOptions.needToPassTurnAfterMoveDone)
    ) {
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

    const dx = Math.abs(fx - tx);
    const dy = Math.abs(fy - ty);

    // Only orthogonal moves allowed and must be one square away
    if (dx + dy !== 1) return false;

    // Check if:
    // A player may push or pull the opponent's rabbit into the goal
    // row it is trying to reach. If at the end of the turn the rabbit remains there,
    // the player loses. However if the opponent's rabbit is moved back out of the goal
    if (this.steps.length === 0 && this.hasAPushOrPullBeenMadeInPreviousTurn) {
      this.hasAPushOrPullBeenMadeInPreviousTurn = false;
      if (this.isGameOver()) return false;
    }

    let prevMoveWasAPull = false;
    // Check if previous move was a push or pull
    // Check if there are pieces that the current player must move due to a previous push or pull
    if (this.pushPullPossiblePiecesCurentPlayerHasToMove.length > 0) {
      // Ensure the square being moved to is one of the required squares

      console.log("validating push / pull");
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
        if (this.turn !== this.getSide(piece)) {
          prevMoveWasAPull = true;
        }
      }
    }
    // Check if the piece belongs to the current player
    if (this.getSide(piece) === this.turn) {
      // Check if the piece is frozen
      if (this.isPieceFrozen(from)) {
        return false;
      }
      this.checkIfIsPull(from, to); // don't return false because even if is not a pull move, is a valid move
    } else {
      // Check if it's a valid push move
      const pushValidation = this.checkIfIsPush(from, to);
      if (!prevMoveWasAPull && !pushValidation) {
        console.log("Not a valid push move", !prevMoveWasAPull, pushValidation);
        return false;
      }
    }

    // Check: A player may no make a move equivalent to passsing the whole turn without moving
    if (this.steps.length === 3) {
      // if is in the 3rd step of the turn
      const copy = this.clone();
      copy.movePiece(from, to, piece);
      const movesEqToPassTheWholeTurn = copy.isBoardEqualToCurrent(
        this.boardBeforeTurn
      );
      if (movesEqToPassTheWholeTurn) return false;
    }

    // Rabbits cannot move backward
    if (
      !this.isCurrentMoveAPushOrPull &&
      this.getPieceType(piece) === RABBIT &&
      ((this.turn === GOLD && tx < fx) || (this.turn === SILVER && tx > fx))
    ) {
      return false;
    }

    console.log("hola");
    console.log("sequence", JSON.stringify([...this.steps, [from, to]]));

    // Check if:
    // A player may push or pull the opponent's rabbit into the goal
    // row it is trying to reach. If at the end of the turn the rabbit remains there,
    // the player loses. However if the opponent's rabbit is moved back out of the goal
    // row before the end of the turn, the player does not lose.
    if (
      this.isCurrentMoveAPushOrPull &&
      this.pushPullPossiblePiecesCurentPlayerHasToMove.length === 0
    ) {
      // Clean isCurrentMoveAPushOrPull flag when the second part of a push or pull move is made (push / pull move completed)
      this.hasAPushOrPullBeenMadeInPreviousTurn = true;
    }

    if (!this.hasAPushOrPullBeenMadeInPreviousTurn && this.isGameOver())
      return false;
    return true;
  }

  private checkIfIsPush(from: Position, to: Position): boolean {
    // 2. current player has avaliable steps in the current turn?
    if (4 - this.steps.length < 2) return false;
    // 1. enemy piece has stroger current's players pieces neighbors
    const strongerNeighbors = this.getStrongerNeighbors(from);

    if (strongerNeighbors.length === 0) return false;

    // Check if in the next move the player will make a move that is equivalent to pass the whole turn
    const isNextMoveEquivalentToPassTheWholeTurn =
      this.steps.length > 1 &&
      isSamePosition(from, this.steps[0][0]) &&
      JSON.stringify(this.steps[1]) === JSON.stringify([to, from]);

    if (isNextMoveEquivalentToPassTheWholeTurn) {
      console.log(
        "Is a push move that is equivalent to pass the whole turn (previous move was a pull from the same square)"
      );
      return false;
    }
    // store data to validate the second part (2nd step) of a push move
    this.pushPullPossiblePiecesCurentPlayerHasToMove = strongerNeighbors;
    this.pushPullNextSquareCurrentPlayerHasToMove = from;
    this.isCurrentMoveAPushOrPull = true;
    console.log("Is a push move" + this.getPiece(from), "move:", [from, to]);
    return true;
  }

  private checkIfIsPull(from: Position, to: Position): boolean {
    // 2. current player has avaliable steps in the current turn?
    if (4 - this.steps.length < 2) return false;
    // 1. enemy piece has stroger current's players pieces neighbors
    const weakerAdjacentEnemies = this.getWeakerNeighbouringEnemies(from);

    if (weakerAdjacentEnemies.length === 0) return false;

    // Check if in the next move the player will make a move that is equivalent to pass the whole turn
    const isNextMoveEquivalentToPassTheWholeTurn =
      this.steps.length > 1 &&
      isSamePosition(from, this.steps[0][0]) &&
      JSON.stringify(this.steps[1]) === JSON.stringify([to, from]);

    if (isNextMoveEquivalentToPassTheWholeTurn) {
      console.log(
        "Is a pull move that is equivalent to pass the whole turn (previous move was a push from the same square)"
      );
      return false;
    }
    // store data to validate the second part (2nd step) of a pull move
    this.pushPullPossiblePiecesCurentPlayerHasToMove = weakerAdjacentEnemies;
    this.pushPullNextSquareCurrentPlayerHasToMove = from;
    this.isCurrentMoveAPushOrPull = true;
    console.log("Is a pull move" + this.getPiece(from), "move:", [from, to]);
    return true;
  }

  /**
   * Checks if a piece is frozen.
   * @param position - The position of the piece to check.
   * @returns `true` if the piece is frozen, `false` otherwise.
   */
  private isPieceFrozen(position: Position): boolean {
    const piece = this.getPiece(position);
    if (!piece) return false;

    const side = this.getSide(piece);
    const neighbors = this.getNeighbors(position);

    // Check if there is a friendly neighbor
    const hasFriendlyNeighbor = neighbors.some(
      (neighbor) =>
        this.checkIfPositionIsInBoard(neighbor) &&
        this.getSide(this.getPiece(neighbor)) === side
    );

    if (hasFriendlyNeighbor) return false;

    // Check if there is a stronger enemy neighbor
    const isFrozen = neighbors.some(
      (neighbor) =>
        this.checkIfPositionIsInBoard(neighbor) &&
        this.getSide(this.getPiece(neighbor)) !== side &&
        this.getPieceStrength(
          this.getPieceType(this.getPiece(neighbor)) as Piece
        ) > this.getPieceStrength(this.getPieceType(piece) as Piece)
    );

    return isFrozen;
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
      if (!this.checkIfPositionIsInBoard(neighbor)) continue;
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

  private getWeakerNeighbouringEnemies(position: Position): Position[] {
    const currentPiece = this.getPiece(position);
    if (!currentPiece) return [];

    const neighbors = this.getNeighbors(position);
    const weakerNeighbors: Position[] = [];

    for (const neighbor of neighbors) {
      if (!this.checkIfPositionIsInBoard(neighbor)) continue;
      const neighborPiece = this.getPiece(neighbor);

      if (
        neighborPiece &&
        this.getSide(neighborPiece) !== this.turn &&
        this.getPieceStrength(this.getPieceType(currentPiece) as Piece) >
          this.getPieceStrength(this.getPieceType(neighborPiece) as Piece)
      ) {
        weakerNeighbors.push(neighbor);
      }
    }

    return weakerNeighbors;
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
    // 1. Check if a rabbit reached the opposing goal row
    const goldWins = this.board[7].some((cell) => cell === "gR");
    const silverWins = this.board[0].some((cell) => cell === "sR");

    if (goldWins || silverWins) return true;

    // 2. Check if either side has no rabbits left
    const goldHasRabbits = this.board.flat().some((cell) => cell === "gR");
    const silverHasRabbits = this.board.flat().some((cell) => cell === "sR");

    if (!goldHasRabbits || !silverHasRabbits) return true;
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
    // TODO: wasBot is a workaround for the bot, fix this

    if (this.steps.length === 0) {
      throw new Error("Cannot pass the entire turn without moving.");
    }

    if (this.pushPullPossiblePiecesCurentPlayerHasToMove.length > 0) {
      throw new Error(
        "Cannot pass the entire turn without moving the required pieces because a push / pull move has made."
      );
    }

    // if is in the 2nd step and is passing turn, check if is trying to pass the whole turn without moving
    if (
      this.steps.length === 2 &&
      this.isBoardEqualToCurrent(this.boardBeforeTurn)
    ) {
      throw new Error(
        "Cannot pass the entire turn without moving. moves are equivalent to pass the whole turn."
      );
    }

    // Switch turn
    this.switchTurn();
    this.steps = []; // Reset steps
    this.boardBeforeTurn = this.board.map((row) => [...row]); // make a copy of the current board
    this.turnCount++;
  }

  private isBoardEqualToCurrent(board: PieceWithSide[][]): boolean {
    return JSON.stringify(this.board) === JSON.stringify(board);
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
    clone.boardBeforeTurn = this.boardBeforeTurn.map((row) => [...row]);
    clone.isCurrentMoveAPushOrPull = this.isCurrentMoveAPushOrPull;
    clone.hasAPushOrPullBeenMadeInPreviousTurn =
      this.hasAPushOrPullBeenMadeInPreviousTurn;
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

            // Create a new copy of the game state
            const newGameCopy = gameCopy.clone();
            const result = newGameCopy.makeMove([x, y], [nx, ny]); // Apply the move using makeMove
            if (result) {
              currentMoves.push(move);
              generateMoves(currentMoves, depth + 1, newGameCopy);
              currentMoves.pop();
            }
          });
        }
      }

      if (depth > 0) {
        // For gen turns with less than 4 steps -> 1, 2, 3
        try {
          gameCopy.giveUpTurn();
          moves.push([...currentMoves]);
        } catch {
          // If an error occurs, don't add the turn to the list of turns
        }
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
