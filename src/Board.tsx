import React from 'react';
import { useEffect, useState } from 'react';
import { BoardSize, PieceType, Colour } from './Constants';
import Square from './Square';

function Board() { 
    const [board, setBoard] = useState<number[][]>([]);
    const [currentTurn, setCurrentTurn] = useState(Colour.White);
    
    useEffect(() => {
      let startingPosition: number[][] = new Array(BoardSize);
      for (var row = 0; row < startingPosition.length; row++)
      {
        startingPosition[row] = Array(BoardSize).fill(PieceType.None);
      }

      startingPosition[7][0] = PieceType.WhiteRook;
      startingPosition[7][1] = PieceType.WhiteNight;
      startingPosition[7][2] = PieceType.WhiteBishop;
      startingPosition[7][3] = PieceType.WhiteQueen;
      startingPosition[7][4] = PieceType.WhiteKing;
      startingPosition[7][5] = PieceType.WhiteBishop;
      startingPosition[7][6] = PieceType.WhiteNight;
      startingPosition[7][7] = PieceType.WhiteRook;
      startingPosition[0][0] = PieceType.BlackRook;
      startingPosition[0][1] = PieceType.BlackNight;
      startingPosition[0][2] = PieceType.BlackBishop;
      startingPosition[0][3] = PieceType.BlackQueen;
      startingPosition[0][4] = PieceType.BlackKing;
      startingPosition[0][5] = PieceType.BlackBishop;
      startingPosition[0][6] = PieceType.BlackNight;
      startingPosition[0][7] = PieceType.BlackRook;

      for (var col = 0; col < BoardSize; col++)
      {
        startingPosition[6][col] = PieceType.WhitePawn;
        startingPosition[1][col] = PieceType.BlackPawn;
      }

      console.log('Setting up board to initial position')
      setBoard(startingPosition);
    }, []);
    
    const handleMove = (startRow: number, startCol: number, endRow: number, endCol: number) => {
        console.log('handleMove called: ' + startRow + ',' + startCol + ' to ' + endRow + ',' + endCol);
        console.log('Length of board: ' + board.length);

        if (startRow !== endRow || startCol !== endCol) {          
          setBoard(currentBoard => {
            console.log('Length of current board: ' + currentBoard.length);
              var updatedBoard = currentBoard.map(arr => arr.slice());
              updatedBoard[endRow][endCol] = updatedBoard[startRow][startCol];
              updatedBoard[startRow][startCol] = PieceType.None;
              return updatedBoard;
            }
          );

          setCurrentTurn(turn => turn === Colour.White ? Colour.Black : Colour.White);
        };

        // TODO: Why does this not work? Why do I have to pass an arrow function to setBoard above?
        // var updatedBoard = board.map(arr => arr.slice());
        // updatedBoard[endRow][endCol] = updatedBoard[startRow][startCol];
        // updatedBoard[startRow][startCol] = PieceType.None;
        // setBoard(updatedBoard);
    }

    const renderSquare = (row: number, col: number, colour: Colour, piece: PieceType, turn: Colour) => {
      console.log("Current turn in renderSquare: " + turn)
      return <Square key={row + "," + col} row={row} col={col} colour={colour} piece={piece} 
                     currentTurn={turn} onMove={handleMove} />;
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

          squares.push(renderSquare(row, col, colour, board && board[row] && board[row][col], currentTurn));
        }

        return (
            <div key={row}>
                {squares}
            </div>
        );
    }
  
    console.log("Getting currentTurn: " + currentTurn);
    const status = 'Next player: ' + currentTurn;

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