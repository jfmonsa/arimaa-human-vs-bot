import {
  Arimaa,
  CAMEL,
  CAT,
  DOG,
  ELEPHANT,
  GOLD,
  HORSE,
  RABBIT,
  Side,
  SILVER,
} from "../utils/arimaa-rules";

// Valores de las piezas para la evaluación
const PIECE_VALUES: Record<string, number> = {
  [RABBIT]: 1, // Conejos son los más valiosos estratégicamente
  [CAT]: 3,
  [DOG]: 4,
  [HORSE]: 5,
  [CAMEL]: 7,
  [ELEPHANT]: 10, // Elefantes son los más fuertes
};

export function evaluateBoard(game: Arimaa, perspective: Side): number {
  const board = game.getBoard();
  let goldScore = 0;
  let silverScore = 0;

  // Evaluar piezas y posiciones
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) continue;

      const [side, type] = [piece[0], piece[1]] as [Side, string];
      const pieceValue = PIECE_VALUES[type];

      // Valor base de la pieza
      if (side === GOLD) {
        goldScore += pieceValue;
      } else {
        silverScore += pieceValue;
      }

      // Bonus para conejos cerca de su objetivo
      if (type === RABBIT) {
        if (side === GOLD) {
          // Bonus por acercarse a las filas superiores
          goldScore += (7 - row) * 2;
        } else {
          // Bonus por acercarse a las filas inferiores
          silverScore += row * 2;
        }
      }

      // Bonus por control del centro
      const centerBonus = calculateCenterControlBonus(row, col);
      if (side === GOLD) {
        goldScore += centerBonus;
      } else {
        silverScore += centerBonus;
      }

      // Penalización por piezas inmovilizadas
      if (isPieceTrapped(game, [row, col])) {
        if (side === GOLD) {
          goldScore -= pieceValue / 2;
        } else {
          silverScore -= pieceValue / 2;
        }
      }
    }
  }

  // Bonus por movilidad de piezas
  goldScore += calculateMobilityBonus(game, GOLD);
  silverScore += calculateMobilityBonus(game, SILVER);

  // Ajuste para la perspectiva del jugador
  return perspective === GOLD
    ? goldScore - silverScore
    : silverScore - goldScore;
}

// Calcula bonus por control del centro
function calculateCenterControlBonus(row: number, col: number): number {
  const centerDistance = Math.max(Math.abs(row - 3.5), Math.abs(col - 3.5));
  return Math.max(0, 4 - centerDistance);
}

// Verifica si una pieza está atrapada
function isPieceTrapped(game: Arimaa, position: [number, number]): boolean {
  const board = game.getBoard();
  const piece = board[position[0]][position[1]];
  if (!piece) return false;

  const [row, col] = position;
  const trappedSquares = [
    [3, 2],
    [3, 5],
    [4, 2],
    [4, 5],
  ];

  // Verificar si está en una casilla trampa
  return trappedSquares.some(
    ([trapRow, trapCol]) => row === trapRow && col === trapCol
  );
}

// Calcula bonus por movilidad de piezas
function calculateMobilityBonus(game: Arimaa, side: Side): number {
  let mobilityScore = 0;
  const board = game.getBoard();

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece || piece[0] !== side) continue;

      // Contar movimientos potenciales
      const potentialMoves = countPotentialMoves(game, [row, col]);
      mobilityScore += potentialMoves;
    }
  }

  return mobilityScore;
}

// Cuenta movimientos potenciales para una pieza
function countPotentialMoves(game: Arimaa, position: [number, number]): number {
  // Implementación simplificada de movimientos potenciales
  // En una implementación real, esto sería más complejo
  const board = game.getBoard();
  const piece = board[position[0]][position[1]];
  if (!piece) return 0;

  const [row, col] = position;
  const directions = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ];

  return directions.filter(([dRow, dCol]) => {
    const newRow = row + dRow;
    const newCol = col + dCol;

    // Verificaciones básicas de movimiento
    return (
      newRow >= 0 &&
      newRow < 8 &&
      newCol >= 0 &&
      newCol < 8 &&
      board[newRow][newCol] === null
    );
  }).length;
}
