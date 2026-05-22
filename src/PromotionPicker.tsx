import React from 'react';
import { Colour, PieceType } from './Constants';

import { ReactComponent as WhiteQueen } from './Images/WhiteQueen.svg';
import { ReactComponent as WhiteRook } from './Images/WhiteRook.svg';
import { ReactComponent as WhiteBishop } from './Images/WhiteBishop.svg';
import { ReactComponent as WhiteKnight } from './Images/WhiteKnight.svg';
import { ReactComponent as BlackQueen } from './Images/BlackQueen.svg';
import { ReactComponent as BlackRook } from './Images/BlackRook.svg';
import { ReactComponent as BlackBishop } from './Images/BlackBishop.svg';
import { ReactComponent as BlackKnight } from './Images/BlackKnight.svg';

interface PromotionPickerProps {
  colour: Colour;
  onSelect: (piece: PieceType) => void;
}

function PromotionPicker(props: PromotionPickerProps) {
  const isWhite = props.colour === Colour.White;

  const options: { piece: PieceType; label: string; Icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = isWhite
    ? [
        { piece: PieceType.WhiteQueen,  label: 'Queen',  Icon: WhiteQueen  },
        { piece: PieceType.WhiteRook,   label: 'Rook',   Icon: WhiteRook   },
        { piece: PieceType.WhiteBishop, label: 'Bishop', Icon: WhiteBishop },
        { piece: PieceType.WhiteKnight, label: 'Knight', Icon: WhiteKnight },
      ]
    : [
        { piece: PieceType.BlackQueen,  label: 'Queen',  Icon: BlackQueen  },
        { piece: PieceType.BlackRook,   label: 'Rook',   Icon: BlackRook   },
        { piece: PieceType.BlackBishop, label: 'Bishop', Icon: BlackBishop },
        { piece: PieceType.BlackKnight, label: 'Knight', Icon: BlackKnight },
      ];

  return (
    <div className="promotion-overlay">
      <div className="promotion-picker">
        <p className="promotion-title">Promote pawn to:</p>
        <div className="promotion-options">
          {options.map(({ piece, label, Icon }) => (
            <button
              key={piece}
              className="promotion-option"
              onClick={() => props.onSelect(piece)}
              aria-label={label}
            >
              <Icon />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PromotionPicker;
