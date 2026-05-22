import { CSSProperties } from 'react';
import { useDragLayer, XYCoord } from 'react-dnd';
import { PieceType } from './Constants';

import { ReactComponent as WhitePawn } from './Images/WhitePawn.svg';
import { ReactComponent as WhiteKnight } from './Images/WhiteKnight.svg';
import { ReactComponent as WhiteBishop } from './Images/WhiteBishop.svg';
import { ReactComponent as WhiteRook } from './Images/WhiteRook.svg';
import { ReactComponent as WhiteQueen } from './Images/WhiteQueen.svg';
import { ReactComponent as WhiteKing } from './Images/WhiteKing.svg';
import { ReactComponent as BlackPawn } from './Images/BlackPawn.svg';
import { ReactComponent as BlackKnight } from './Images/BlackKnight.svg';
import { ReactComponent as BlackBishop } from './Images/BlackBishop.svg';
import { ReactComponent as BlackRook } from './Images/BlackRook.svg';
import { ReactComponent as BlackQueen } from './Images/BlackQueen.svg';
import { ReactComponent as BlackKing } from './Images/BlackKing.svg';

const SQUARE_SIZE = 68;

const layerStyle: CSSProperties = {
  position: 'fixed',
  pointerEvents: 'none',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  zIndex: 100,
};

function getPieceComponent(pieceType: PieceType) {
  switch (pieceType) {
    case PieceType.WhitePawn:   return <WhitePawn />;
    case PieceType.WhiteKnight: return <WhiteKnight />;
    case PieceType.WhiteBishop: return <WhiteBishop />;
    case PieceType.WhiteRook:   return <WhiteRook />;
    case PieceType.WhiteQueen:  return <WhiteQueen />;
    case PieceType.WhiteKing:   return <WhiteKing />;
    case PieceType.BlackPawn:   return <BlackPawn />;
    case PieceType.BlackKnight: return <BlackKnight />;
    case PieceType.BlackBishop: return <BlackBishop />;
    case PieceType.BlackRook:   return <BlackRook />;
    case PieceType.BlackQueen:  return <BlackQueen />;
    case PieceType.BlackKing:   return <BlackKing />;
    default: return null;
  }
}

function getPreviewStyle(clientOffset: XYCoord | null): CSSProperties {
  if (!clientOffset) return { display: 'none' };
  const x = clientOffset.x - SQUARE_SIZE / 2;
  const y = clientOffset.y - SQUARE_SIZE / 2;
  return {
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,
    transform: `translate(${x}px, ${y}px)`,
  };
}

function CustomDragLayer() {
  const { isDragging, item, clientOffset } = useDragLayer((monitor) => ({
    isDragging: monitor.isDragging(),
    item: monitor.getItem(),
    clientOffset: monitor.getClientOffset(),
  }));

  if (!isDragging || !item) return null;

  return (
    <div style={layerStyle}>
      <div style={getPreviewStyle(clientOffset)}>
        {getPieceComponent(item.movedPiece)}
      </div>
    </div>
  );
}

export default CustomDragLayer;
