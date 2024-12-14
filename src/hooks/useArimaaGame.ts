import { useState, useCallback } from "react";
import { generateRandomArimaaSetup } from "../utils/arimaa-utils";
import { Arimaa, Position } from "../utils/arimaa-rules";

/**
 * Custom hook to manage an Arimaa game.
 */
export function useArimaaGame() {
  /** stores Arimaa game instance */
  const [game, setGame] = useState<Arimaa>(() => {
    // Generate a random Arimaa setup for gold and silver.
    const goldSetup = generateRandomArimaaSetup();
    const silverSetup = generateRandomArimaaSetup();
    const newGame = new Arimaa(goldSetup, silverSetup);
    return newGame;
  });

  const handleMakeMove = useCallback(
    (from: Position, to: Position): boolean => {
      const copyGame = game.clone();

      const result = copyGame.makeMove(from, to);
      if (!result) return false;

      setGame(copyGame);
      return true;
    },
    [game]
  );

  const handleGiveUpTurn = useCallback(() => {
    game.giveUpTurn();
  }, [game]);

  return {
    board: game.getBoard(),
    game,
    handleMakeMove,
    turn: game.getTurn(),
    handleGiveUpTurn,
  };
}
