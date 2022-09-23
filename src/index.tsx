import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import './index.css';
import Board from './Board';
import MoveList, { Move } from './MoveList';
import { BoardSize, PieceType, Colour } from './Constants';

function Game() {
  const [currentTurn, setCurrentTurn] = useState(Colour.White);
  const [board, setBoard] = useState<number[][]>([]);
  const [moveList, setMoveList] = useState<Move[]>([]);

  useEffect(() => {
    let startingPosition: number[][] = new Array(BoardSize);
    for (var row = 0; row < startingPosition.length; row++)
    {
      startingPosition[row] = Array(BoardSize).fill(PieceType.None);
    }

    startingPosition[7][0] = PieceType.WhiteRook;
    startingPosition[7][1] = PieceType.WhiteKnight;
    startingPosition[7][2] = PieceType.WhiteBishop;
    startingPosition[7][3] = PieceType.WhiteQueen;
    startingPosition[7][4] = PieceType.WhiteKing;
    startingPosition[7][5] = PieceType.WhiteBishop;
    startingPosition[7][6] = PieceType.WhiteKnight;
    startingPosition[7][7] = PieceType.WhiteRook;
    startingPosition[0][0] = PieceType.BlackRook;
    startingPosition[0][1] = PieceType.BlackKnight;
    startingPosition[0][2] = PieceType.BlackBishop;
    startingPosition[0][3] = PieceType.BlackQueen;
    startingPosition[0][4] = PieceType.BlackKing;
    startingPosition[0][5] = PieceType.BlackBishop;
    startingPosition[0][6] = PieceType.BlackKnight;
    startingPosition[0][7] = PieceType.BlackRook;

    for (var col = 0; col < BoardSize; col++)
    {
      startingPosition[6][col] = PieceType.WhitePawn;
      startingPosition[1][col] = PieceType.BlackPawn;
    }

    console.log('Setting up board to initial position')
    setBoard(startingPosition);
  }, []);

  const handleMove = (startRow: number, startCol: number, endRow: number, endCol: number, piece: PieceType) => {
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

      setMoveList(moveList => {
        if (currentTurn === Colour.White) {
          var newMove: Move = {
            whiteMove: getMoveString(endRow, endCol, piece),
            blackMove: ""
          }
          var updatedMoveList = [...moveList, newMove]
          console.log(updatedMoveList);
        } else {
          // Black move
          updatedMoveList = [...moveList];
          updatedMoveList[updatedMoveList.length - 1].blackMove = getMoveString(endRow, endCol, piece);
        }

        return updatedMoveList;
      });

      setCurrentTurn(turn => turn === Colour.White ? Colour.Black : Colour.White);
    };

    // TODO: Why does this not work? Why do I have to pass an arrow function to setBoard above?
    // var updatedBoard = board.map(arr => arr.slice());
    // updatedBoard[endRow][endCol] = updatedBoard[startRow][startCol];
    // updatedBoard[startRow][startCol] = PieceType.None;
    // setBoard(updatedBoard);
  }

  return (
      <div className="game">
        <div className="game-board">
          <DndProvider backend={HTML5Backend}>
            <Board currentTurn={currentTurn} board={board} onMove={handleMove}/>
          </DndProvider>
        </div>
        <div className="move-list">
          <MoveList moves={moveList}/>
        </div>
        <div className="game-info">
          <div>{/* status */}</div>
          <ol>{/* TODO */}</ol>
        </div>
      </div>
    )
}

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<Game />);

function getMoveString(endRow: number, endCol: number, piece: PieceType): string {
  var pieceString: string = "";
  switch (piece)
  {
    case PieceType.WhitePawn:
    case PieceType.BlackPawn:
       pieceString = "";
       break;

    case PieceType.WhiteKnight:
    case PieceType.BlackKnight:
      pieceString = "N";
      break;
    
    case PieceType.WhiteBishop:
    case PieceType.BlackBishop:
      pieceString = "B";
      break;
    
    case PieceType.WhiteRook:
    case PieceType.BlackRook:
      pieceString = "R";
      break;
    
    case PieceType.WhiteQueen:
    case PieceType.BlackQueen:
      pieceString = "Q";
      break;
  
    case PieceType.WhiteKing:
    case PieceType.BlackKing:
      pieceString = "K";
      break;
  }

  var file: string = String.fromCharCode("a".charCodeAt(0) + endCol);
  var rank: number = 8 - endRow;
  
  return pieceString + file + rank;
}
  