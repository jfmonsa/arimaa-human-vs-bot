import { Arimaa, Position, SILVER } from "../utils/arimaa-rules";
import { evaluateBoard, transpositionTable } from "./position-evaluation";

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
    console.log(
      "Nodes (Boards) stored in transposition table",
      transpositionTable.size
    );
    return { score: evaluateBoard(game, SILVER), moves: [] };
  }
  const legalMoves = game.generateLegalMoves();
  console.log(`minimax: Nodes ${legalMoves.length} in depth = ${depth}`);

  if (maximizingPlayer) {
    let maxEval = -Infinity;
    let bestMoves: [Position, Position][] = [];

    for (const turn of legalMoves) {
      const clonedGame = game.clone(); // Clone the game state.
      clonedGame.applyMoves(turn); // Apply the turn.
      const { score } = minimax(clonedGame, depth - 1, false, alpha, beta);

      if (score > maxEval) {
        maxEval = score;
        bestMoves = turn;
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

    for (const turn of legalMoves) {
      const clonedGame = game.clone(); // Clone the game state.
      clonedGame.applyMoves(turn); // Apply the turn.
      const { score } = minimax(clonedGame, depth - 1, true, alpha, beta);

      if (score < minEval) {
        minEval = score;
        bestMoves = turn;
      }

      beta = Math.min(beta, minEval);
      if (beta <= alpha) {
        break; // Alpha cut-off.
      }
    }

    return { score: minEval, moves: bestMoves };
  }
}

// Abstracts the minimax algorithm to get the best move.
export function getBestMove(
  game: Arimaa,
  depth: number
): [Position, Position][] {
  const { moves } = minimax(game, depth, true);
  return moves;
}
