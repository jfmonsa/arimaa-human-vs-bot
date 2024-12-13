import { useEffect, useState } from "react";
import "./App.css";
import { Arimaa } from "./utils/arimaa-rules";
import { Board } from "./components/Board";
import { generateRandomArimaaSetup } from "./utils/arimaa-utils";

export default function App() {
  const [game, setGame] = useState<Arimaa | null>(null);

  useEffect(() => {
    const goldSetup = generateRandomArimaaSetup();
    console.log("goldSetup", goldSetup);
    const silverSetup = generateRandomArimaaSetup();
    console.log("silverSetup", silverSetup);
    const newGame = new Arimaa(goldSetup, silverSetup);
    setGame(newGame);
    console.log(newGame.ascii());
  }, []);

  const handleMakeMove = (
    from: [number, number],
    to: [number, number]
  ): boolean => {
    if (game) {
      return game.makeMove(from, to);
    }
    return false;
  };

  return (
    <>
      <h1> Arimmaa Game: Human vs Computer</h1>
      <p>Turn: {game?.getTurn()}</p>
      <Board board={game?.getBoard()} makeMove={handleMakeMove} />
    </>
  );
}
