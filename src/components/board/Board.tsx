import { useState } from "react";
import {
  PieceWithSide,
  GOLD,
  Position,
  SILVER,
  Side,
} from "../../utils/arimaa-rules";
import { genEmptyBoard, isTrap } from "../../utils/arimaa-utils";
import Styles from "./Board.module.css";
import { getPieceImage } from "./board.utils";

interface BoardProps {
  board?: PieceWithSide[][];
  makeMove?: (from: Position, to: Position) => boolean;
  side?: Side;
  // disabled?: boolean;
}

export function Board({
  board = genEmptyBoard(),
  makeMove,
  side = GOLD,
}: BoardProps) {
  /** Represents the currently selected square. */
  const [squareSelected, setSquareSelected] = useState<Position | null>(null);

  const handleSquareClick = (row: number, col: number) => {
    const piece = board[row][col];

    // prevent not beign able to select a piece after selecting an empty square
    // if the square is empty, deselect
    if (!piece) {
      if (!squareSelected) {
        // If there is no previously selected piece, deselect
        setSquareSelected(null);
      } else {
        // If there is a previously selected piece, try to make the move
        if (!makeMove) return;

        const move = makeMove(squareSelected, [row, col]);

        // If the move was successful, deselect the square
        if (move) {
          setSquareSelected(null);
        }
      }
      return;
    }

    // prevent not being able to select a piece after a turn switch
    if (squareSelected) {
      // Check if the selected piece belongs to the current player
      const selectedPiece = board[squareSelected[0]][squareSelected[1]];
      if (selectedPiece && piece && selectedPiece[0] !== piece[0]) {
        // Deselect if the selected piece does not belong to the current player
        setSquareSelected(null);
      }
    }

    const isChangingSelectedPiece =
      piece &&
      squareSelected &&
      piece[0] === board[squareSelected[0]][squareSelected[1]]?.[0]; // pieces are from the same player

    if (!squareSelected) {
      console.log("Selecting square");
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
        // idea: color previous and current square to show the move
        //setSquareSelectedAfterMove(sourceSquare);
        //setSquareSelectedBeforeMove(targetSquare);
      }
    }
  };

  const renderCell = (
    cell: PieceWithSide | null,
    rowIndex: number,
    colIndex: number
  ) => {
    // Flip board if player is GOLD
    // Only invert row index, column index is equal when the board is flipped
    const actualRowIndex = side === SILVER ? rowIndex : 7 - rowIndex;
    const actualColIndex = side === SILVER ? colIndex : colIndex;

    return (
      <div
        key={colIndex}
        className={`${Styles["board-cell"]} ${
          isTrap(actualRowIndex, colIndex) ? Styles.trap : ""
        } ${
          squareSelected &&
          squareSelected[0] === actualRowIndex &&
          squareSelected[1] === actualColIndex
            ? Styles.selected
            : ""
        }`}
        onClick={() => handleSquareClick(actualRowIndex, colIndex)}
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
    );
  };

  const renderBoard = () => {
    // Flip board if player is GOLD
    const rows = side === SILVER ? board : [...board].reverse();
    return rows.map((row, rowIndex) => (
      <div key={rowIndex} className={Styles["board-row"]}>
        {row.map((cell, colIndex) => renderCell(cell, rowIndex, colIndex))}
      </div>
    ));
  };

  return <div className={Styles.board}>{renderBoard()}</div>;
}
