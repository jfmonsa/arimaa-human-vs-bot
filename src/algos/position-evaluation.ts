import {
  Arimaa,
  CAMEL,
  CAT,
  DIRECTIONS,
  DOG,
  ELEPHANT,
  GOLD,
  HORSE,
  PieceWithSide,
  RABBIT,
  Side,
  SILVER,
  TRAP_SQUARES,
} from "../utils/arimaa-rules";

/** The values assigned to each piece type for evaluation purposes. */
const PIECE_VALUES: Record<string, number> = {
  [RABBIT]: 4,
  [CAT]: 8,
  [DOG]: 10,
  [HORSE]: 14,
  [CAMEL]: 18,
  [ELEPHANT]: 24,
};

/**
 * A transposition table to store previously evaluated positions in the game.
 * The table uses a Map where the keys are string representations of game positions
 * and the values are the evaluation scores of those positions.
 */
export const transpositionTable = new Map<string, number>();

let transpositionTableHits = 0;

// Function to generate a hash for the board state
function hashBoard(board: PieceWithSide[][]): string {
  return board.flat().join("");
}

export function evaluateBoard(game: Arimaa, perspective: Side): number {
  const board = game.getBoard();
  const boardHash = hashBoard(board);

  // Check if the board state is already evaluated
  if (transpositionTable.has(boardHash)) {
    ++transpositionTableHits;
    console.log(`Transposition table hit! # ${transpositionTableHits}`);
    return transpositionTable.get(boardHash)!;
  }

  // intialize scores
  // Eval material
  let goldScore = calculateHarLogMaterial(game, GOLD);
  let silverScore = calculateHarLogMaterial(game, SILVER);

  // Evaluate pieces and positions
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = game.getPiece([row, col]);
      if (!piece) continue;

      const pieceSide = game.getSide(piece);
      const pieceType = game.getPieceType(piece);

      if (pieceType === null) continue;
      const pieceValue = PIECE_VALUES[pieceType];

      // Base value of the piece
      if (pieceSide === GOLD) {
        goldScore += pieceValue;
      } else {
        silverScore += pieceValue;
      }

      // Bonus for rabbits near their goal
      if (pieceType === RABBIT) {
        if (pieceSide === GOLD) {
          // Bonus for approaching the top rows
          goldScore += (7 - row) * 2;
        } else {
          // Bonus for approaching the bottom rows
          silverScore += row * 2;
        }
      }

      // Bonus for center control
      const centerBonus = calculateCenterControlBonus(row, col);
      if (pieceSide === GOLD) {
        goldScore += centerBonus;
      } else {
        silverScore += centerBonus;
      }
    }
  }

  // Bonus for piece mobility
  goldScore += calculateMobilityBonus(game, GOLD);
  silverScore += calculateMobilityBonus(game, SILVER);

  // Bonus for trap control
  goldScore += calculateTrapControl(game, GOLD);
  silverScore += calculateTrapControl(game, SILVER);

  // Penalize material difference
  const materialDifference = goldScore - silverScore;
  const materialPenalty = Math.abs(materialDifference) * 0.7;
  if (materialDifference > 0) {
    silverScore += materialPenalty;
  } else {
    goldScore += materialPenalty;
  }

  // Adjustment for player's perspective
  const score =
    perspective === GOLD ? goldScore - silverScore : silverScore - goldScore;

  // Store the evaluated score in the transposition table
  transpositionTable.set(boardHash, score);

  return score;
}

// Calculate bonus for center control
function calculateCenterControlBonus(row: number, col: number): number {
  const centerDistance = Math.max(Math.abs(row - 3.5), Math.abs(col - 3.5));
  return Math.max(0, 4 - centerDistance);
}

/**
 * Calculates the mobility bonus for a given side in the Arimaa game.
 * The mobility bonus is determined by counting the potential moves for each piece of the given side.
 */
function calculateMobilityBonus(game: Arimaa, side: Side): number {
  let mobilityScore = 0;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = game.getPiece([row, col]);
      if (!piece || game.getSide(piece) !== side) continue;

      // Count potential moves
      const potentialMoves = countPotentialMoves(game, [row, col]);
      mobilityScore += potentialMoves;
    }
  }

  return mobilityScore;
}

/**
 * Counts the number of potential moves for a piece at a given position in the Arimaa game.
 */
function countPotentialMoves(game: Arimaa, position: [number, number]): number {
  const piece = game.getPiece(position);
  if (!piece) return 0;

  const [row, col] = position;

  return DIRECTIONS.filter(([dRow, dCol]) => {
    const newRow = row + dRow;
    const newCol = col + dCol;

    // Basic movement checks
    return (
      game.checkIfPositionIsInBoard([newRow, newCol]) &&
      game.getPiece([newRow, newCol]) === null
    );
  }).length;
}

/**
 * Calculates the HarLog material value for a given side in an Arimaa game.
 *
 * The HarLog material value is a heuristic used to evaluate the material strength
 * of a player's position, taking into account the number of rabbits and non-rabbits,
 * as well as the presence of stronger opponent pieces.
 *
 * @see https://icosahedral.net/downloads/djwu2015arimaa.pdf (page 15)
 */
function calculateHarLogMaterial(game: Arimaa, side: Side): number {
  const G = 0.6314442034;
  const Q = 1.447530126;
  const pieces = game
    .getBoard()
    .flat()
    .filter((piece) => piece && game.getSide(piece) === side);
  const rabbits = pieces.filter(
    (piece) => game.getPieceType(piece) === RABBIT
  ).length;
  const nonRabbits = pieces.filter(
    (piece) => game.getPieceType(piece) !== RABBIT
  ).length;

  let harLog = G * Math.log((rabbits * nonRabbits) / (rabbits * nonRabbits));

  for (const piece of pieces) {
    if (game.getPieceType(piece) !== RABBIT) {
      const strongerOpponents = game
        .getBoard()
        .flat()
        .filter(
          (opponent) =>
            opponent &&
            game.getSide(opponent) !== side &&
            game.getPieceStrength(game.getPieceType(opponent)!) >
              game.getPieceStrength(game.getPieceType(piece)!)
        ).length;
      const Cp = strongerOpponents === 0 ? 1 : 0;
      harLog += (1 + Cp) / (Q + strongerOpponents);
    }
  }

  return harLog;
}

/**
 * Calculates the control score of the traps for a given side in an Arimaa game.
 * The control score is determined by the proximity and strength of the pieces
 * of the given side around each trap square.
 */
function calculateTrapControl(game: Arimaa, side: Side): number {
  let trapControlScore = 0;

  for (const [trapRow, trapCol] of TRAP_SQUARES) {
    let localControl = 0;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = game.getPiece([row, col]);
        if (!piece || game.getSide(piece) !== side) continue;

        const distance = Math.abs(row - trapRow) + Math.abs(col - trapCol);
        const strengthFactor = game.getPieceStrength(game.getPieceType(piece)!);

        localControl += strengthFactor / (distance + 1);
      }
    }

    trapControlScore += 1 / (1 + Math.exp(-localControl));
  }

  return trapControlScore;
}
