import { useState } from 'react'
import Piece from './Piece'
import { Colour, PieceType } from './Constants';
import { useDrop } from 'react-dnd';

function getColour(pieceType) {
  if (pieceType >= 1 && pieceType <= 6) {
    return Colour.White;
  }
  if (pieceType >= 7) {
    return Colour.Black;
  }

  throw new Error('Piece type of 0 does not have a colour');
}

function Square(props) {

    const [test, setTest] = useState(false);
    
    const [collectedProps, drop] = useDrop(() => ({
      // The type (or types) to accept - strings or symbols
      accept: 'PIECE',
      hover: () => {
        setTest(true);
      },
      drop(item, monitor) {
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
        console.log("Is there no piece on the square we're dragging to? %s", props.piece === PieceType.None);
        
        // Item that we're dragging must match the current turn.
        // And if we're capturing a piece, it must be the opposite colour.
        return item.colour === props.currentTurn
          && (props.piece === PieceType.None
              || getColour(props.piece) !== item.colour)
      }
    }), [test, props.currentTurn]);
  
    if (props.piece === undefined || props.piece === PieceType.None) {
      return (
        <span ref={drop} className={props.colour === Colour.White ? "light-square" : "dark-square"} />
      );
    }
  
    return (
      <>
        <span ref={drop} className={props.colour === Colour.White ? "light-square" : "dark-square"} >
          <Piece row={props.row} col={props.col} pieceType={props.piece} />
        </span>
      </>
    );
  };

  export default Square;