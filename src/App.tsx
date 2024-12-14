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

  /** excecute pending moves made by bot  */
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
      }, 1000);
      return () => clearTimeout(timeoutId);
    }

    // Only generate moves if it's the computer's turn and the turn has changed
    if (turn === SILVER && turn !== turnRef.current) {
      const newMoves = getBestMove(game, 1); // Depth 1 for now

      if (newMoves.length > 0) {
        setMovesToExecute(newMoves);
        turnRef.current = turn;
      }

      newMoves.forEach(([from, to]) => {
        console.log(`Computer move: ${from} -> ${to}`);
      });
    }

    // Update turnRef.current to the current turn
    turnRef.current = turn;

    // timeout cleanup
    return () => clearTimeout(timeoutId);
  }, [turn, game, movesToExecute.length, processNextMove]);

  // show alert when the game is over
  useEffect(() => {
    if (!game.isGameOver()) return;

    const timeoutId = setTimeout(() => {
      alert(
        `Game Over - Winner: ${game.getWinner()} in ${game.getTurn()} turns`
      );
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [game]);
  /*
  const {
    loadBoard,
    board: boardToDebug,
    handleMakeMove: makeMoveDebug,
    game: gameToDebug,
  } = useArimaaGame();

  useEffect(() => {
    loadBoard([
      ["gR", null, "gR", null, "gR", null, null, "gR"],
      ["gD", "gD", "gR", null, null, null, null, "gR"],
      [null, null, "gM", "gC", "gR", null, null, null],
      [null, null, null, "gH", "gH", null, "gR", "gC"],
      [null, null, null, null, "gE", null, null, null],
      [null, null, null, null, null, null, "sR", null],
      ["sH", null, null, null, null, null, null, "sC"],
      ["sC", "sM", "sD", "sE", null, null, "sH", "sD"],
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
      <h1> Arimaa Game: Human vs Computer</h1>
      <p>Turn: {turn}</p>
      <Board board={board} makeMove={handleMakeMove} />
      <Button onClick={handleGiveUpTurn}>Finish My Turn</Button>
      {/* <Board board={boardToDebug} makeMove={makeMoveDebug} /> */}
    </main>
  );
}
