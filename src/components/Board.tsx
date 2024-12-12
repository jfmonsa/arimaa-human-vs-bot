import { useState } from "react";
import { PieceWithSide, GOLD } from "../utils/arimaa-rules";
import { genEmptyBoard, isTrap } from "../utils/arimaa-utils";
import Styles from "./Board.module.css";

const getPieceImage = (cell: PieceWithSide | null) => {
  if (!cell) return null;
  const piece = cell[1].toLowerCase();
  const player = cell[0] === GOLD ? "g" : "s";
  return `/Arimaa_${piece}${player}.svg`;
};

interface BoardProps {
  board?: PieceWithSide[][];
  makeMove?: (from: [number, number], to: [number, number]) => boolean;
  // side?: Side;
  // disabled?: boolean;
}

export function Board({ board = genEmptyBoard(), makeMove }: BoardProps) {
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(
    null
  );

  const handleCellClick = (row: number, col: number) => {
    if (selectedCell) {
      if (!makeMove) return;
      // Si ya hay una celda seleccionada, intenta hacer el movimiento
      if (makeMove(selectedCell, [row, col])) {
        setSelectedCell(null); // Reinicia la selección después de un movimiento exitoso
      }
    } else {
      // Selecciona la celda inicial
      setSelectedCell([row, col]);
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
                selectedCell &&
                selectedCell[0] === rowIndex &&
                selectedCell[1] === colIndex
                  ? Styles.selected
                  : ""
              }`}
              onClick={() => handleCellClick(rowIndex, colIndex)}
            >
              {cell && (
                <img
                  src={getPieceImage(cell) || ""}
                  alt={cell}
                  className={Styles["piece"]}
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
