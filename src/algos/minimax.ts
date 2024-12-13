import { Arimaa } from "../utils/arimaa-rules";

export function minimax(
  game: Arimaa,
  depth: number,
  maximizingPlayer: boolean,
  alpha: number = -Infinity,
  beta: number = Infinity
): { score: number; move?: Move } {
  // Casos base
  if (depth === 0 || game.isGameOver()) {
    return { score: game.evaluateBoard() };
  }

  // Genera todos los movimientos posibles
  const moves = game.generateMoves();

  if (maximizingPlayer) {
    let maxEval = -Infinity;
    let bestMove: Move | undefined;

    for (const move of moves) {
      const gameCopy = game.makeMoveCopy(move);
      const { score } = minimax(gameCopy, depth - 1, false, alpha, beta);

      if (score > maxEval) {
        maxEval = score;
        bestMove = move;
      }

      // Poda alfa-beta
      alpha = Math.max(alpha, score);
      if (beta <= alpha) {
        break; // Corte beta
      }
    }

    return { score: maxEval, move: bestMove };
  } else {
    let minEval = Infinity;
    let bestMove: Move | undefined;

    for (const move of moves) {
      const gameCopy = game.makeMoveCopy(move);
      const { score } = minimax(gameCopy, depth - 1, true, alpha, beta);

      if (score < minEval) {
        minEval = score;
        bestMove = move;
      }

      // Poda alfa-beta
      beta = Math.min(beta, score);
      if (beta <= alpha) {
        break; // Corte alfa
      }
    }

    return { score: minEval, move: bestMove };
  }
}

// Función para obtener el mejor movimiento
export function getBestMove(game: Arimaa, depth: number): Move | undefined {
  const { move } = minimax(game, depth, true);
  return move;
}
