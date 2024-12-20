import { useState, useCallback } from "react";
import { generateRandomArimaaSetup } from "../utils/arimaa-utils";
import { Arimaa, PieceWithSide, Position } from "../utils/arimaa-rules";

/**
 * Custom hook to manage an Arimaa game.
 */
export function useArimaaGame() {
  /** stores Arimaa game instance */
  const [game, setGame] = useState<Arimaa>(() => {
    // Generate a random Arimaa setup for gold and silver.
    const goldSetup = generateRandomArimaaSetup();
    const silverSetup = generateRandomArimaaSetup();
    const newGame = new Arimaa().setup(goldSetup, silverSetup);
    return newGame;
  });

  /**
   * Make a move from one position to another.
   * @returns Whether the move was successful.
   */
  const handleMakeMove = useCallback(
    (
      from: Position,
      to: Position,
      extraOptions?: { needToPassTurnAfterMoveDone: boolean }
    ): boolean => {
      const copyGame = game.clone();

      const result = copyGame.makeMove(from, to, extraOptions);
      if (!result) return false;

      const stepCount =
        game.getCurrentTurnStepsCount() === 3 &&
        copyGame.getCurrentTurnStepsCount() === 0
          ? 4
          : copyGame.getCurrentTurnStepsCount();

      console.log(
        `move made (step) turn: #${copyGame.getTurnCount()}  step: #${stepCount} by ${game.getTurn()} piece ${copyGame.getPiece(
          to
        )}`
      );
      console.log(copyGame.ascii());
      console.log(JSON.stringify(copyGame.getBoard()));

      setGame(copyGame);
      return true;
    },
    [game]
  );

  const handleGiveUpTurn = useCallback(() => {
    try {
      game.giveUpTurn();
      setGame(game.clone());
    } catch (e) {
      console.warn(e);
      if (e instanceof Error) alert(e.message);
    }
  }, [game]);

  const loadBoard = useCallback(
    (board: PieceWithSide[][]) => {
      const newGame = new Arimaa().loadBoard(board);
      setGame(newGame);
    },
    [setGame]
  );

  return {
    board: game.getBoard(),
    game,
    handleMakeMove,
    turn: game.getTurn(),
    handleGiveUpTurn,
    loadBoard,
  };
}
