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

export const TRAP_SQUARES: Position[] = [
  [2, 2], // c3
  [2, 5], // f3
  [5, 2], // c6
  [5, 5], // f6
];

export const DIRECTIONS: Position[] = [
  [0, 1], // Right
  [0, -1], // Left
  [1, 0], // Down
  [-1, 0], // Up
];

export const PIECES_STRENGTH: Record<Piece, number> = {
  [RABBIT]: 1,
  [CAT]: 2,
  [DOG]: 3,
  [HORSE]: 4,
  [CAMEL]: 5,
  [ELEPHANT]: 6,
};

export type Piece =
  | typeof RABBIT
  | typeof CAT
  | typeof DOG
  | typeof HORSE
  | typeof CAMEL
  | typeof ELEPHANT;

export type Side = typeof GOLD | typeof SILVER;

export type PieceWithSide = `${Side}${Piece}` | null;

export type Position = [number, number];

export type GoldRank = 1 | 2;

export type SilverRank = 7 | 8;

export interface MakeMoveExtraOptions {
  needToPassTurnAfterMoveDone?: boolean;
}

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
   */
  private pushPullNextSquareCurrentPlayerHasToMove: Position | null = null;

  /**
   * Represents the state of the board before the current turn started.
   * @remarks
   * This property is necessary to validate that a player does not make a move equivalent to passing the whole turn.
   */
  private boardBeforeTurn: PieceWithSide[][] = genEmptyBoard();

  /**
   * Indicates whether the current move is part of a push or pull sequence.
   * A push or pull requires two consecutive steps within the same turn.
   * This property helps track if the first step of a push or pull has been made.
   */
  private isCurrentMoveAPushOrPull = false;

  /**
   * Indicates whether a push or pull move has been made in the previous turn.
   * This property helps enforce the rule that a push or pull must be completed
   * within the same turn and cannot be carried over to the next turn.
   */
  private hasPushOrPullBeenMadeInTheTurn = false;

  private wasPreviousStepTheFirstPartOfAPull = false;
  private pieceWhichHasMoved: PieceWithSide = null;

  /**
   * deep copy of the Arimaa instance
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
    clone.hasPushOrPullBeenMadeInTheTurn = this.hasPushOrPullBeenMadeInTheTurn;
    clone.wasPreviousStepTheFirstPartOfAPull =
      this.wasPreviousStepTheFirstPartOfAPull;
    clone.pieceWhichHasMoved = this.pieceWhichHasMoved;
    return clone;
  }

  /** Loads the given board configuration into the current Arimaa game instance. */
  public loadBoard(board: PieceWithSide[][]): Arimaa {
    this.board = board;
    this.boardBeforeTurn = board.map((row) => [...row]);
    return this;
  }

  /** place gold and silver pieces on the board for the initial setup */
  public setup(goldSetup: Piece[], silverSetup: Piece[]): Arimaa {
    this.placePieces(GOLD, goldSetup, 1, 2);
    this.placePieces(SILVER, silverSetup, 7, 8);
    this.boardBeforeTurn = this.board.map((row) => [...row]);
    return this;
  }

  /**
   * Places pieces on the board for a given player according to the provided setup.
   *
   * @remarks
   * The setup array should contain the pieces in the order they should be placed on the board.
   */
  private placePieces(
    player: Side,
    setup: Piece[],
    row1: GoldRank | SilverRank,
    row2: GoldRank | SilverRank
  ): void {
    const rows = [row1, row2];
    let index = 0;

    rows.forEach((row) => {
      for (let col = 1; col <= 8; col++) {
        const position: Position = [row - 1, col - 1];
        const piece: PieceWithSide = `${player}${setup[index]}`;
        this.putPiece(position, piece);
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
    if (!this.validateMove(from, to)) return false;

    this.movePiece(from, to, this.getPiece(from));

    this.steps.push([from, to]);

    this.handleTraps();

    // Check if the turn should end
    if (this.steps.length === 4 || extraOptions?.needToPassTurnAfterMoveDone) {
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
    this.pieceWhichHasMoved = piece;
    const targetSquare = this.getPiece(to);

    // Empty square or target square is not empty
    if (!piece || targetSquare) return false;

    const dx = Math.abs(fx - tx);
    const dy = Math.abs(fy - ty);

    // Only orthogonal moves allowed and must be one square away
    if (dx + dy !== 1) return false;

    // Check if previous move was a push or pull (Validate second part of push / pull)
    // Check if there are pieces that the current player must move due to a previous push or pull
    if (this.pushPullPossiblePiecesCurentPlayerHasToMove.length > 0) {
      // Ensure the square being moved to is one of the required squares

      // Ensure the piece being moved is one of the required pieces
      // -> is only required to move one of the pieces stored at pushPullPossiblePiecesCurentPlayerHasToMove
      //    if the previous move was a push
      if (!this.wasPreviousStepTheFirstPartOfAPull) {
        const fromHasToMove = this.pushPullNextSquareCurrentPlayerHasToMove;
        if (!fromHasToMove) return false;

        // new move to square must be the same as the previous move from square of the pushed piece
        if (!isSamePosition(to, fromHasToMove)) return false;

        const isCurrentPieceNotARequired =
          !this.pushPullPossiblePiecesCurentPlayerHasToMove.some((pos) =>
            isSamePosition(pos, from)
          );
        if (isCurrentPieceNotARequired) return false;
      }
      // clean if the push /pull was successful
      // If the clean the list of pieces that must be moved
      this.pushPullPossiblePiecesCurentPlayerHasToMove = [];
      this.pushPullNextSquareCurrentPlayerHasToMove = null;
    }

    // Check if the piece belongs to the current player
    if (this.getSide(piece) === this.turn) {
      // Check if the piece is frozen
      if (this.isPieceFrozen(from)) return false;

      this.checkIfIsPull(from, to); // don't return false because even if is not a pull move, is a valid move
    } else {
      // Check if it's a valid push move

      if (
        !this.wasPreviousStepTheFirstPartOfAPull &&
        !this.checkIfIsPush(from, to)
      ) {
        //console.log("Invalid move: Finish the pull move or make a push");
        return false;
      }
      // Only the second part of a pull would reach this point
      // -> update flag to false after the second part of a pull move is made
      this.wasPreviousStepTheFirstPartOfAPull = false;
    }
    // Check: A player may no make a move equivalent to passsing the whole turn without moving (check every 2nd step)
    if (this.steps.length === 3) {
      // if is in the 3rd step of the turn
      const copy = this.clone();
      copy.movePiece(from, to, piece);
      const movesEqToPassTheWholeTurn = copy.isBoardEqualToCurrent(
        this.boardBeforeTurn
      );
      if (movesEqToPassTheWholeTurn) return false;
    }

    // Rabbits cannot move backward except if are pulled / pushed by rival
    const isRabbitMovingBackward =
      (this.getPieceType(piece) === RABBIT && this.turn === GOLD && tx < fx) ||
      (this.turn === SILVER && tx > fx);

    if (!this.isCurrentMoveAPushOrPull && isRabbitMovingBackward) {
      return false;
    }

    if (this.isGameOver()) return false;

    // store this flag to validate the special case of rabbit reaching the goal
    // row in the middle of a turn where push / pull moves are made
    if (this.isCurrentMoveAPushOrPull) {
      this.hasPushOrPullBeenMadeInTheTurn = true;
    }

    // Update this flag to false after the second part of a push or pull move is made
    this.isCurrentMoveAPushOrPull = false;
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
      //console.log("Is a push move that is equivalent to pass the whole turn (previous move was a pull from the same square)");
      return false;
    }
    // store data to validate the second part (2nd step) of a push move
    this.pushPullPossiblePiecesCurentPlayerHasToMove = strongerNeighbors;
    this.pushPullNextSquareCurrentPlayerHasToMove = from;
    this.isCurrentMoveAPushOrPull = true;
    //console.log("Is a push move" + this.getPiece(from), "move:", [from, to]);
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
      //console.log("Is a pull move that is equivalent to pass the whole turn (previous move was a push from the same square)");
      return false;
    }
    // store data to validate the second part (2nd step) of a pull move
    this.pushPullPossiblePiecesCurentPlayerHasToMove = weakerAdjacentEnemies;
    this.pushPullNextSquareCurrentPlayerHasToMove = from;
    this.isCurrentMoveAPushOrPull = true;
    this.wasPreviousStepTheFirstPartOfAPull = true;
    //console.log("Is a pull move" + this.getPiece(from), "move:", [from, to]);
    return true;
  }

  /**
   * Checks if a piece is frozen.
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

    // Check if there is a stronger enemy neighbor than the current piece
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
  // TODO: avoid repetition of code in getStrongerNeighbors and getWeakerNeighbouringEnemies methods
  // TODO: change notation to algebraic or i,j (matrix notation) because x,y is confusing since we aren't using a cartesian plane

  /**
   * Checks the victory conditions for the Arimaa game.
   *
   * This method evaluates the current state of the board to determine if either
   * the gold or silver player has won the game. The victory conditions checked are:
   * 1. If a rabbit of the gold player ("gR") has reached the opposing goal row (row 7).
   * 2. If a rabbit of the silver player ("sR") has reached the opposing goal row (row 0).
   * 3. If either side has no rabbits left on the board.
   * 4. If all pieces of the current player are frozen or blocked.
   *
   * @returns {boolean} - Returns `true` if any victory condition is met, otherwise `false`.
   */
  public isGameOver(): boolean {
    // 1. Check if a rabbit reached the opposing goal row

    // Check if:
    // A player may push or pull the opponent's rabbit into the goal
    // row it is trying to reach. If at the end of the turn the rabbit remains there,
    // the player loses. However if the opponent's rabbit is moved back out of the goal
    const isInTheMiddleOfAPushOrPullTurn =
      this.isCurrentMoveAPushOrPull || this.hasPushOrPullBeenMadeInTheTurn;

    if (!isInTheMiddleOfAPushOrPullTurn) {
      const goldWins = this.hasRabbitReachedGoal(7, "gR");
      const silverWins = this.hasRabbitReachedGoal(0, "sR");
      if (goldWins || silverWins) return true;
    } else {
      // Only check current if player's rabbit has reached the goal row
      if (!this.pieceWhichHasMoved) return false;
      const pieceSide = this.getSide(this.pieceWhichHasMoved);
      const goalRow = pieceSide === GOLD ? 7 : 0;
      const rabbit = pieceSide === GOLD ? "gR" : "sR";
      if (this.hasRabbitReachedGoal(goalRow, rabbit)) return true;
    }

    // 2. Check if either side has no rabbits left on the board
    // If both players lose all rabbits on the same move, the player making the move wins
    // If just have finished a turn
    // TODO: review Arimaa rules to check if this is correct
    if (this.steps.length === 0) {
      const goldRabbits = this.board
        .flat()
        .filter((piece) => piece === "gR").length;
      const silverRabbits = this.board
        .flat()
        .filter((piece) => piece === "sR").length;

      return goldRabbits === 0 || silverRabbits === 0;
    }

    // 3. Check if all pieces of the current player are frozen or blocked
    if (this.areAllPiecesFrozenOrBlocked(this.turn)) return true;

    return false;
  }

  private hasRabbitReachedGoal(row: number, rabbit: "gR" | "sR"): boolean {
    return this.board[row].some((cell) => cell === rabbit);
  }

  /**
   * Checks if all pieces of the given side are either frozen or blocked.
   */
  private areAllPiecesFrozenOrBlocked(side: Side): boolean {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.getPiece([row, col]);
        if (!piece || this.getSide(piece) !== side) continue;
        if (
          !this.isPieceFrozen([row, col]) &&
          this.countPotentialMoves([row, col]) > 0
        ) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Counts the number of potential moves from a given position.
   *
   * This method calculates the number of valid moves that can be made from the specified position
   * on the board. A move is considered valid if it stays within the boundaries of the board and
   * the target position is empty (i.e., does not contain a piece).
   */
  private countPotentialMoves(position: Position): number {
    const [row, col] = position;

    return DIRECTIONS.filter(([dRow, dCol]) => {
      const newRow = row + dRow;
      const newCol = col + dCol;

      return (
        this.checkIfPositionIsInBoard([newRow, newCol]) &&
        !this.getPiece([newRow, newCol])
      );
    }).length;
  }

  /**
   * Determines the winner of the game.
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

    if (
      !this.wasPreviousStepTheFirstPartOfAPull &&
      this.pushPullPossiblePiecesCurentPlayerHasToMove.length > 0
    ) {
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

    // if turn has finished, then reset the flag
    if (
      this.hasPushOrPullBeenMadeInTheTurn &&
      this.pushPullPossiblePiecesCurentPlayerHasToMove.length === 0
    ) {
      this.hasPushOrPullBeenMadeInTheTurn = false;
    }

    // Switch turn
    this.switchTurn();
    this.steps = []; // Reset steps
    this.boardBeforeTurn = this.board.map((row) => [...row]); // make a copy of the current board
    this.turnCount++;
  }

  private switchTurn(): void {
    this.turn = this.turn === GOLD ? SILVER : GOLD;
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
          const from: Position = [x, y];
          const piece = gameCopy.getPiece(from);
          if (!piece) continue;

          const neighbors = gameCopy.getNeighbors(from);
          neighbors.forEach((to) => {
            // Create a new copy of the game state
            const newGameCopy = gameCopy.clone();
            const result = newGameCopy.makeMove(from, to); // Apply the move using makeMove
            if (result) {
              currentMoves.push([from, to]);
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

  public getPieceStrength(piece: Piece): number {
    return PIECES_STRENGTH[piece];
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

  private checkIfPositionIsInBoard(position: Position): boolean {
    const [x, y] = position;
    return x >= 0 && x < 8 && y >= 0 && y < 8;
  }

  private isBoardEqualToCurrent(board: PieceWithSide[][]): boolean {
    return JSON.stringify(this.board) === JSON.stringify(board);
  }

  /**
   * Returns the neighboring positions of a given position on the board.
   */
  private getNeighbors([x, y]: Position): Position[] {
    return DIRECTIONS.map(([dx, dy]) => [x + dx, y + dy]);
  }
}
