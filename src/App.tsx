import { useEffect, useRef, useState, useCallback } from "react";
import "./App.css";
import { Board } from "./components/board/Board";
import { Button } from "./components/button/Button";
import { useArimaaGame } from "./hooks/useArimaaGame";
import { getBestMove } from "./algos/minimax";
import { Position, SILVER } from "./utils/arimaa-rules";

export default function App() {
  const { board, handleMakeMove, handleGiveUpTurn, turn, game } =
    useArimaaGame();

  const [movesToExecute, setMovesToExecute] = useState<[Position, Position][]>(
    []
  );
  const turnRef = useRef(turn);

  const processNextMove = useCallback(() => {
    setMovesToExecute((currentMoves) => {
      if (currentMoves.length === 0) return [];

      const [nextMove] = currentMoves;
      const [from, to] = nextMove;
      handleMakeMove(from, to);

      return currentMoves.slice(1);
    });
  }, [handleMakeMove]);

  // Handles Bot's turn (SILVER) player
  useEffect(() => {
    // if there are moves to execute, then execute next move
    let timeoutId: number;

    if (movesToExecute.length > 0) {
      // Delay of 500ms for more natural moves
      timeoutId = setTimeout(() => {
        processNextMove();
      }, 500);
      return () => clearTimeout(timeoutId);
    }

    // Only generate moves if it's the computer's turn and the turn has changed
    if (turn === SILVER && turn !== turnRef.current) {
      const newMoves = getBestMove(game, 1); // Depth 1 for now

      if (newMoves.length > 0) {
        setMovesToExecute(newMoves);
        turnRef.current = turn;
      }
    }

    // Update turnRef.current to the current turn
    turnRef.current = turn;

    // timeout cleanup
    return () => clearTimeout(timeoutId);
  }, [turn, game, movesToExecute.length, processNextMove]);

  /*const {
    loadBoard,
    board: boardToDebug,
    handleMakeMove: makeMoveDebug,
  } = useArimaaGame();

  useEffect(() => {
    loadBoard([
      ["gM", "gC", "gR", "gE", "gR", "gR", "gH", "gC"],
      ["gD", null, "gR", null, null, "gH", "gD", "gR"],
      ["sR", "gR", null, null, null, null, null, null],
      [null, null, null, "gR", "gR", null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, "sR", "sD", "sC", "sH", "sM", "sR", "sR"],
      ["sE", "sR", "sD", "sC", "sR", "sH", "sR", "sR"],
    ]);
  }, [loadBoard]);
*/
  /*  useEffect(() => {
    console.log(gameToDebug.ascii());
    getBestMove(gameToDebug, 1);
  }, [gameToDebug]);
*/
  return (
    <main>
      <h1> Arimmaa Game: Human vs Computer</h1>
      <p>Turn: {turn}</p>
      <Board board={board} makeMove={handleMakeMove} />
      <Button onClick={handleGiveUpTurn}>Finish My Turn</Button>
      {/* <Board board={boardToDebug} makeMove={makeMoveDebug} /> */}
    </main>
  );
}
