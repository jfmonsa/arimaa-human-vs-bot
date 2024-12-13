import { useState } from "react";
import { PieceWithSide, GOLD, Position, SILVER } from "../utils/arimaa-rules";
import { genEmptyBoard, isTrap } from "../utils/arimaa-utils";
import Styles from "./Board.module.css";

const getPieceImage = (cell: PieceWithSide | null) => {
  if (!cell) return null;
  const piece = cell[1].toLowerCase();
  const player = cell[0] === GOLD ? GOLD : SILVER;
  return `/Arimaa_${piece}${player}.svg`;
};

interface BoardProps {
  board?: PieceWithSide[][];
  makeMove?: (from: Position, to: Position) => boolean;
  // side?: Side;
  // disabled?: boolean;
}

export function Board({ board = genEmptyBoard(), makeMove }: BoardProps) {
  /** Represents the currently selected square. */
  const [squareSelected, setSquareSelected] = useState<Position | null>(null);

  /** Represents the currently selected piece. */
  //const [selectedPiece, setSelectedPiece] = useState<string | null>(null);

  /** Represents the square selected after a move (source square). */
  // const [squareSelectedAfterMove, setSquareSelectedAfterMove] =
  //   useState<Position | null>(null);

  /** Represents the square selected before a move (target square). */
  // const [squareSelectedBeforeMove, setSquareSelectedBeforeMove] =
  //   useState<Position | null>(null);

  const handleSquareClick = (row: number, col: number) => {
    const piece = board[row][col];
    const isChangingSelectedPiece =
      piece &&
      squareSelected &&
      piece[0] === board[squareSelected[0]][squareSelected[1]]?.[0]; // pieces are from the same player

    if (!squareSelected) {
      setSquareSelected([row, col]);
    } else if (isChangingSelectedPiece) {
      console.log("Changing selected piece");
      setSquareSelected([row, col]);
    } else {
      console.log("Trying to make a move");
      if (!makeMove) return;

      const move = makeMove(squareSelected, [row, col]);

      // move was successful
      if (move) {
        setSquareSelected(null);
        return;
        //setSquareSelectedAfterMove(sourceSquare);
        //setSquareSelectedBeforeMove(targetSquare);
      }

      // Handle push/pull logic
      // const targetPiece = board[row][col];
      // if (piece && targetPiece && targetPiece[0] !== piece[0]) {
      //   // Check if it's a valid push/pull move
      //   const dx = row - squareSelected[0];
      //   const dy = col - squareSelected[1];
      //   const pushTarget: Position = [row + dx, col + dy];
      //   const pullTarget: Position = [
      //     squareSelected[0] - dx,
      //     squareSelected[1] - dy,
      //   ];

      //   if (makeMove(squareSelected, [row, col])) {
      //     if (
      //       makeMove([row, col], pushTarget) ||
      //       makeMove([row, col], pullTarget)
      //     ) {
      //       setSquareSelected(null);
      //     }
      //   }
      // }
    }
  };

  return (
    <div className={Styles.board}>
      {board.map((row, rowIndex) => (
        <div key={rowIndex} className={Styles["board-row"]}>
          {row.map((cell, colIndex) => (
            <div
              key={colIndex}
              className={`${Styles["board-cell"]} ${
                isTrap(rowIndex, colIndex) ? Styles.trap : ""
              } ${
                squareSelected &&
                squareSelected[0] === rowIndex &&
                squareSelected[1] === colIndex
                  ? Styles.selected
                  : ""
              }`}
              onClick={() => handleSquareClick(rowIndex, colIndex)}
            >
              {cell && (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundImage: `url(${getPieceImage(cell) || ""})`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    backgroundSize: "80%",
                    cursor: "grab",
                  }}
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
