import { Colour, PieceType } from './Constants';
import { useDrag } from 'react-dnd';

import { ReactComponent as WhitePawn } from './Images/WhitePawn.svg';
import { ReactComponent as WhiteNight } from './Images/WhiteNight.svg';
import { ReactComponent as WhiteBishop } from './Images/WhiteBishop.svg';
import { ReactComponent as WhiteRook } from './Images/WhiteRook.svg';
import { ReactComponent as WhiteQueen } from './Images/WhiteQueen.svg';
import { ReactComponent as WhiteKing } from './Images/WhiteKing.svg';

import { ReactComponent as BlackPawn } from './Images/BlackPawn.svg';
import { ReactComponent as BlackNight } from './Images/BlackNight.svg';
import { ReactComponent as BlackBishop } from './Images/BlackBishop.svg';
import { ReactComponent as BlackRook } from './Images/BlackRook.svg';
import { ReactComponent as BlackQueen } from './Images/BlackQueen.svg';
import { ReactComponent as BlackKing } from './Images/BlackKing.svg';


function Piece(props) {
    const [{ isDragging }, drag, dragPreview] = useDrag(() => ({
        type: 'PIECE',
        item: {
            startRow: props.row, 
            startCol: props.col, 
            movedPiece: props.pieceType,
            colour: props.pieceType >= 1 && props.pieceType <= 6 ? Colour.White : Colour.Black
        },
        collect: (monitor) => ({
          isDragging: monitor.isDragging(),
        })
      }))
    
    switch (props.pieceType)
    {
        case PieceType.WhitePawn:
            //return <WhitePawn />;

            // return isDragging ? (
            //     <div ref={dragPreview}>
            //         <WhitePawn />
            //     </div>
            // ) : (

            return <div ref={drag}><WhitePawn /></div>;
        case PieceType.WhiteNight:
            return <div ref={drag}><WhiteNight /></div>;
        case PieceType.WhiteBishop:
            return <div ref={drag}><WhiteBishop /></div>;
        case PieceType.WhiteRook:
            return <div ref={drag}><WhiteRook /></div>;
        case PieceType.WhiteQueen:
            return <div ref={drag}><WhiteQueen /></div>;
        case PieceType.WhiteKing:
            return <div ref={drag}><WhiteKing /></div>;
        case PieceType.BlackPawn:
            return <div ref={drag}><BlackPawn /></div>;
        case PieceType.BlackNight:
            return <div ref={drag}><BlackNight /></div>;
        case PieceType.BlackBishop:
            return <div ref={drag}><BlackBishop /></div>;
        case PieceType.BlackRook:
            return <div ref={drag}><BlackRook /></div>;
        case PieceType.BlackQueen:
            return <div ref={drag}><BlackQueen /></div>;
        case PieceType.BlackKing:
            return <div ref={drag}><BlackKing /></div>;
        default:
            return <div/>;
    }
}

export default Piece;