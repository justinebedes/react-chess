import { useState } from 'react'
import Piece from './Piece'
import { Colour, PieceType } from './Constants';
import { useDrop } from 'react-dnd';

function getColour(pieceType: PieceType) {
  if (pieceType >= 1 && pieceType <= 6) {
    return Colour.White;
  }
  if (pieceType >= 7) {
    return Colour.Black;
  }

  throw new Error('Piece type of 0 does not have a colour');
}

export interface SquareProps {
  row: number;
  col: number;
  colour: Colour;
  piece: PieceType;
  currentTurn: Colour;
  onMove: (startRow: number, startCol: number, endRow: number, endCol: number, piece: PieceType) => void;
}

function Square(props: SquareProps) {

    const [test, setTest] = useState(false);
    
    const [collectedProps, drop] = useDrop(() => ({
      // The type (or types) to accept - strings or symbols
      accept: 'PIECE',
      hover: () => {
        setTest(true);
      },
      drop(item: any, monitor) {
          props.onMove(item.startRow, item.startCol, props.row, props.col, item.movedPiece);
        },
      collect: (monitor) => ({
          isOver: monitor.isOver(),
          isOverCurrent: monitor.isOver({ shallow: true }),
       }),
      canDrop(item, monitor) { 
        //console.log("COLLECTED PROPS: ");
        //console.log(collectedProps);
        console.log("props.currentTurn: " + props.currentTurn);
        console.log("props.piece" + props.piece);
        console.log("ITEM:");
        console.log(item);
        console.log("Is there no piece on the square we're dragging to? %s", props.piece.valueOf() === PieceType.None);
        
        // Item that we're dragging must match the current turn.
        if (item.colour !== props.currentTurn) {
          console.log("Dragging a piece that's the wrong colour");
          return false;
        }

        // If we're capturing a piece, it must be the opposite colour.
        if (props.piece.valueOf() !== PieceType.None
              && getColour(props.piece) === item.colour)
        {
          return false;
        }

        switch (item.movedPiece) {
          case PieceType.WhitePawn:
            return isWhitePawnMoveValid(item.startRow, item.startCol, props.row, props.col, props.piece.valueOf())

          case PieceType.BlackPawn:
            return isBlackPawnMoveValid(item.startRow, item.startCol, props.row, props.col, props.piece.valueOf())

          case PieceType.WhiteKnight:
          case PieceType.BlackKnight:
            return isKnightMoveValid(item.startRow, item.startCol, props.row, props.col)
        }

        return true;
      }
    }), [test, props.currentTurn, props.piece]);
  
    if (props.piece === undefined || props.piece.valueOf() === PieceType.None) {
      return (
        <span ref={drop} className={props.colour.valueOf() === Colour.White ? "light-square" : "dark-square"} />
      );
    }
  
    return (
      <>
        <span ref={drop} className={props.colour.valueOf() === Colour.White ? "light-square" : "dark-square"} >
          <Piece row={props.row} col={props.col} pieceType={props.piece} />
        </span>
      </>
    );
  };

  export default Square;

function isWhitePawnMoveValid(startRow: number, startCol: number, endRow: number, endCol: number, capturedPiece: PieceType): boolean {
  console.log("Moving a white pawn");
  // TODO: What if we're moving two squares but there's a piece in the way? Need access to board array to check this.

  // Can only capture diagonally.
  if (capturedPiece !== PieceType.None) {
    return endRow === startRow - 1 && (Math.abs(startCol - endCol) === 1);
  }
  
  // Can move one or two squares on first move. Otherwise only one square.
  if (startRow === 6) {
    return (endRow === 4 || endRow === 5) && startCol === endCol;
  }
  return endRow === startRow - 1 && startCol === endCol;
}

function isBlackPawnMoveValid(startRow: number, startCol: number, endRow: number, endCol: number, capturedPiece: PieceType): boolean {
  console.log("Moving a black pawn");
  // TODO: What if we're moving two squares but there's a piece in the way? Need access to board array to check this.

  // Can only capture diagonally.
  if (capturedPiece !== PieceType.None) {
    return endRow === startRow + 1 && (Math.abs(startCol - endCol) === 1);
  }
  
  // Can move one or two squares on first move. Otherwise only one square.
  if (startRow === 1) {
    return (endRow === 2 || endRow === 3) && startCol === endCol;
  }
  return endRow === startRow + 1 && startCol === endCol;
}

function isKnightMoveValid(startRow: number, startCol: number, endRow: number, endCol: number): boolean {
  console.log("Moving a knight");

  return (Math.abs(startRow - endRow) === 1 && Math.abs(startCol - endCol) === 2)
  || (Math.abs(startRow - endRow) === 2 && Math.abs(startCol - endCol) === 1);
}