import {
  Arimaa,
  CAMEL,
  CAT,
  DIRECTIONS,
  DOG,
  ELEPHANT,
  GOLD,
  HORSE,
  RABBIT,
  Side,
  SILVER,
  TRAP_SQUARES,
} from "../utils/arimaa-rules";

// Piece values for evaluation
const PIECE_VALUES: Record<string, number> = {
  [RABBIT]: 1, // Rabbits are the most valuable strategically
  [CAT]: 3,
  [DOG]: 4,
  [HORSE]: 5,
  [CAMEL]: 7,
  [ELEPHANT]: 10, // Elephants are the strongest
};

export function evaluateBoard(game: Arimaa, perspective: Side): number {
  const board = game.getBoard();
  let goldScore = 0;
  let silverScore = 0;

  // Evaluate pieces and positions
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) continue;

      const [side, type] = [piece[0], piece[1]] as [Side, string];
      const pieceValue = PIECE_VALUES[type];

      // Base value of the piece
      if (side === GOLD) {
        goldScore += pieceValue;
      } else {
        silverScore += pieceValue;
      }

      // Bonus for rabbits near their goal
      if (type === RABBIT) {
        if (side === GOLD) {
          // Bonus for approaching the top rows
          goldScore += (7 - row) * 2;
        } else {
          // Bonus for approaching the bottom rows
          silverScore += row * 2;
        }
      }

      // Bonus for center control
      const centerBonus = calculateCenterControlBonus(row, col);
      if (side === GOLD) {
        goldScore += centerBonus;
      } else {
        silverScore += centerBonus;
      }

      // Penalty for trapped pieces
      if (isPieceTrapped(game, [row, col])) {
        if (side === GOLD) {
          goldScore -= pieceValue / 2;
        } else {
          silverScore -= pieceValue / 2;
        }
      }
    }
  }

  // Bonus for piece mobility
  goldScore += calculateMobilityBonus(game, GOLD);
  silverScore += calculateMobilityBonus(game, SILVER);

  // Adjustment for player's perspective
  return perspective === GOLD
    ? goldScore - silverScore
    : silverScore - goldScore;
}

// Calculate bonus for center control
function calculateCenterControlBonus(row: number, col: number): number {
  const centerDistance = Math.max(Math.abs(row - 3.5), Math.abs(col - 3.5));
  return Math.max(0, 4 - centerDistance);
}

// Check if a piece is trapped
function isPieceTrapped(game: Arimaa, position: [number, number]): boolean {
  const board = game.getBoard();
  const piece = board[position[0]][position[1]];
  if (!piece) return false;

  const [row, col] = position;

  // Check if it is on a trap square
  return TRAP_SQUARES.some(
    ([trapRow, trapCol]) => row === trapRow && col === trapCol
  );
}

// Calculate bonus for piece mobility
function calculateMobilityBonus(game: Arimaa, side: Side): number {
  let mobilityScore = 0;
  const board = game.getBoard();

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece || piece[0] !== side) continue;

      // Count potential moves
      const potentialMoves = countPotentialMoves(game, [row, col]);
      mobilityScore += potentialMoves;
    }
  }

  return mobilityScore;
}

// Count potential moves for a piece
function countPotentialMoves(game: Arimaa, position: [number, number]): number {
  // Simplified implementation of potential moves
  // In a real implementation, this would be more complex
  const board = game.getBoard();
  const piece = board[position[0]][position[1]];
  if (!piece) return 0;

  const [row, col] = position;

  return DIRECTIONS.filter(([dRow, dCol]) => {
    const newRow = row + dRow;
    const newCol = col + dCol;

    // Basic movement checks
    return (
      newRow >= 0 &&
      newRow < 8 &&
      newCol >= 0 &&
      newCol < 8 &&
      board[newRow][newCol] === null
    );
  }).length;
}
