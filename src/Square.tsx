import { useState } from 'react'
import Piece from './Piece'
import { Colour, PieceType } from './Constants';
import { useDrop } from 'react-dnd';
import React from 'react';

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
  onMove: (startRow: number, startCol: number, endRow: number, endCol: number) => void;
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
          props.onMove(item.startRow, item.startCol, props.row, props.col);
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
        // And if we're capturing a piece, it must be the opposite colour.
        return item.colour === props.currentTurn
          && (props.piece.valueOf() === PieceType.None
              || getColour(props.piece) !== item.colour)
      }
    }), [test, props.currentTurn]);
  
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