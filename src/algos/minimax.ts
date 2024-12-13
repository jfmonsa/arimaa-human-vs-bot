import { Arimaa, Position } from "../utils/arimaa-rules";
import { evaluateBoard } from "./position-evaluation";

/**
 * Minimax algorithm to decide the best move for the current player.
 * @param game - The current state of the Arimaa game.
 * @param depth - The depth of the search tree.
 * @param maximizingPlayer - Whether the current player is maximizing or minimizing.
 * @returns The best sequence of moves and its evaluation score.
 */
export function minimax(
  game: Arimaa,
  depth: number,
  maximizingPlayer: boolean,
  alpha: number = -Infinity,
  beta: number = Infinity
): { score: number; moves: [Position, Position][] } {
  if (depth === 0 || game.isGameOver()) {
    // TODO: pass side dinamically
    return { score: evaluateBoard(game, "g"), moves: [] };
  }
  const legalMoves = game.generateLegalMoves();

  if (maximizingPlayer) {
    let maxEval = -Infinity;
    let bestMoves: [Position, Position][] = [];

    for (const move of legalMoves) {
      const clonedGame = game.clone(); // Clone the game state.
      clonedGame.applyMoves([move]); // Apply the move.
      const { score } = minimax(clonedGame, depth - 1, false, alpha, beta);

      if (score > maxEval) {
        maxEval = score;
        bestMoves = [move];
      }

      alpha = Math.max(alpha, maxEval);
      if (beta <= alpha) {
        break; // Beta cut-off.
      }
    }

    return { score: maxEval, moves: bestMoves };
  } else {
    let minEval = Infinity;
    let bestMoves: [Position, Position][] = [];

    for (const move of legalMoves) {
      const clonedGame = game.clone(); // Clone the game state.
      clonedGame.applyMoves([move]); // Apply the move.
      const { score } = minimax(clonedGame, depth - 1, true, alpha, beta);

      if (score < minEval) {
        minEval = score;
        bestMoves = [move];
      }

      beta = Math.min(beta, minEval);
      if (beta <= alpha) {
        break; // Alpha cut-off.
      }
    }

    return { score: minEval, moves: bestMoves };
  }
}
