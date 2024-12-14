import { useState, useEffect, useCallback } from "react";
import { generateRandomArimaaSetup } from "../utils/arimaa-utils";
import { Arimaa } from "../utils/arimaa-rules";

/**
 * Custom hook to manage an Arimaa game.
 */
export function useArimaaGame() {
  const [game, setGame] = useState<Arimaa | null>(null);

  // Generate a random Arimaa setup for gold and silver.
  useEffect(() => {
    const goldSetup = generateRandomArimaaSetup();
    console.log("goldSetup", goldSetup);
    const silverSetup = generateRandomArimaaSetup();
    console.log("silverSetup", silverSetup);
    const newGame = new Arimaa(goldSetup, silverSetup);
    setGame(newGame);
  }, []);

  const handleMakeMove = useCallback(
    (from: [number, number], to: [number, number]): boolean => {
      if (game) {
        return game.makeMove(from, to);
      }
      return false;
    },
    [game]
  );

  const handleGiveUpTurn = useCallback(() => {
    game?.giveUpTurn();
  }, [game]);

  return {
    board: game?.getBoard(),
    game,
    handleMakeMove,
    turn: game?.getTurn(),
    handleGiveUpTurn,
  };
}
