import React from 'react';
import { BoardSize, PieceType, Colour } from './Constants';
import Square from './Square';

export interface BoardProps {
  currentTurn: Colour,
  board: number[][],
  onMove: (startRow: number, startCol: number, endRow: number, endCol: number, piece: PieceType) => void;
}

function Board(props: BoardProps) { 
    const renderSquare = (row: number, col: number, colour: Colour, piece: PieceType, turn: Colour) => {
      console.log("Current turn in renderSquare: " + turn)
      return <Square key={row + "," + col} row={row} col={col} colour={colour} piece={piece} 
                     currentTurn={turn} onMove={props.onMove} />;
    }

    const renderRow = (row: number) => {
        let squares: React.ReactElement[] = [];

        for (var col = 0; col < BoardSize; col++) {
          let colour = Colour.White;
          if (col % 2 === 0) {
            colour = row % 2 === 0 ? Colour.White : Colour.Black;
          } else {
            colour = row % 2 === 0 ? Colour.Black : Colour.White;
          }

          squares.push(renderSquare(row, col, colour, props.board && props.board[row] && props.board[row][col], props.currentTurn));
        }

        return (
            <div key={row}>
                {squares}
            </div>
        );
    }
  
    console.log("Getting currentTurn: " + props.currentTurn);
    const status = 'Next player: ' + props.currentTurn;

    let rows: React.ReactElement[] = [];
    for (var row = 0; row < BoardSize; row++) {
        rows.push(renderRow(row))
    }

    return (
        <div>
          <div className="status">{status}</div>
          {rows}
        </div>
    );
}

export default Board;