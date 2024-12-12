import React from "react";
import { Cell, GOLD, Side } from "../utils/arimaa-rules";
import { genEmptyBoard } from "../utils/arimaa-utils";
import Styles from "./Board.module.css";

interface BoardProps {
  board?: Cell[][];
  side?: Side;
  disabled?: boolean;
}

const trapPositions: [number, number][] = [
  [2, 2], // c3
  [2, 5], // f3
  [5, 2], // c6
  [5, 5], // f6
];

const getPieceImage = (cell: Cell | null) => {
  if (!cell) return null;
  const piece = cell[1].toLowerCase();
  const player = cell[0] === GOLD ? "g" : "s";
  return `/Arimaa_${piece}${player}.svg`;
};

const isTrap = (row: number, col: number) => {
  return trapPositions.some(
    ([trapRow, trapCol]) => trapRow === row && trapCol === col
  );
};

export function Board({
  board = genEmptyBoard(),
  side = GOLD,
  disabled = false,
}: BoardProps) {
  return (
    <div className={Styles.board}>
      {board.map((row, rowIndex) => (
        <div key={rowIndex} className={Styles["board-row"]}>
          {row.map((cell, colIndex) => (
            <div
              key={colIndex}
              className={`${Styles["board-cell"]} ${
                isTrap(rowIndex, colIndex) ? Styles.trap : ""
              }`}
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
