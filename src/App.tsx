import "./App.css";
import { Board } from "./components/board/Board";
import { Button } from "./components/button/Button";
import { useArimaaGame } from "./hooks/useArimaaGame";

export default function App() {
  const { board, handleMakeMove, handleGiveUpTurn, turn } = useArimaaGame();

  return (
    <>
      <h1> Arimmaa Game: Human vs Computer</h1>
      <p>Turn: {turn}</p>
      <Button onClick={handleGiveUpTurn}>Finish My Turn</Button>
      <Board board={board} makeMove={handleMakeMove} />
    </>
  );
}
