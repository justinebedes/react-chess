import Piece from './Piece'
import { Colour, PieceType } from './Constants';
import { useDrop } from 'react-dnd';
import {
  isWhitePawnMoveValid,
  isBlackPawnMoveValid,
  isKnightMoveValid,
  isBishopMoveValid,
  isRookMoveValid,
  isQueenMoveValid,
  isKingMoveValid,
  wouldLeaveKingInCheck,
  isCastlingValid,
  isEnPassantCapture,
  getPieceColour,
  CastlingRights,
  EnPassantTarget,
} from './ChessLogic';


export interface SquareProps {
  row: number;
  col: number;
  colour: Colour;
  piece: PieceType;
  currentTurn: Colour;
  board: PieceType[][];
  gameOver: boolean;
  castlingRights: CastlingRights;
  enPassantTarget: EnPassantTarget | null;
  isLegalTarget: boolean;
  showRank: boolean;
  showFile: boolean;
  onMove: (startRow: number, startCol: number, endRow: number, endCol: number, piece: PieceType) => void;
}

function Square(props: SquareProps) {
    const [, drop] = useDrop(() => ({
      accept: 'PIECE',
      drop(item: any) {
          props.onMove(item.startRow, item.startCol, props.row, props.col, item.movedPiece);
        },
      canDrop(item: any) { 
        if (props.gameOver) return false;

        // Item that we're dragging must match the current turn.
        if (item.colour !== props.currentTurn) return false;

        // If we're capturing a piece, it must be the opposite colour.
        if (props.piece !== PieceType.None && getPieceColour(props.piece) === item.colour) {
          return false;
        }

        let shapeValid: boolean;
        switch (item.movedPiece) {
          case PieceType.WhitePawn:
            shapeValid = isWhitePawnMoveValid(item.startRow, item.startCol, props.row, props.col, props.piece, props.board);
            break;
          case PieceType.BlackPawn:
            shapeValid = isBlackPawnMoveValid(item.startRow, item.startCol, props.row, props.col, props.piece, props.board);
            break;
          case PieceType.WhiteKnight:
          case PieceType.BlackKnight:
            shapeValid = isKnightMoveValid(item.startRow, item.startCol, props.row, props.col);
            break;
          case PieceType.WhiteBishop:
          case PieceType.BlackBishop:
            shapeValid = isBishopMoveValid(item.startRow, item.startCol, props.row, props.col, props.board);
            break;
          case PieceType.WhiteRook:
          case PieceType.BlackRook:
            shapeValid = isRookMoveValid(item.startRow, item.startCol, props.row, props.col, props.board);
            break;
          case PieceType.WhiteQueen:
          case PieceType.BlackQueen:
            shapeValid = isQueenMoveValid(item.startRow, item.startCol, props.row, props.col, props.board);
            break;
          case PieceType.WhiteKing:
          case PieceType.BlackKing:
            shapeValid = isKingMoveValid(item.startRow, item.startCol, props.row, props.col);
            break;
          default:
            shapeValid = false;
        }

        if (!shapeValid) {
          // Check if this is a castling move (king moves 2 squares horizontally).
          if ((item.movedPiece === PieceType.WhiteKing || item.movedPiece === PieceType.BlackKing)
              && item.startRow === props.row
              && Math.abs(item.startCol - props.col) === 2) {
            const isKingSide = props.col > item.startCol;
            const colour = item.movedPiece === PieceType.WhiteKing ? Colour.White : Colour.Black;
            return isCastlingValid(props.board, colour, isKingSide, props.castlingRights);
          }
          // Check if this is an en passant capture.
          if (isEnPassantCapture(item.movedPiece, item.startRow, item.startCol, props.row, props.col, props.enPassantTarget)) {
            return !wouldLeaveKingInCheck(props.board, item.startRow, item.startCol, props.row, props.col, props.enPassantTarget);
          }
          return false;
        }
        return !wouldLeaveKingInCheck(props.board, item.startRow, item.startCol, props.row, props.col);
      }
    }), [props.currentTurn, props.piece, props.board, props.gameOver, props.castlingRights, props.enPassantTarget]);
  
    const baseClass = props.colour === Colour.White ? 'light-square' : 'dark-square';
    const className = props.isLegalTarget
      ? `${baseClass} ${props.piece === PieceType.None ? 'legal-dot' : 'legal-capture'}`
      : baseClass;

    const rankLabel = props.showRank
      ? <span className="coord-rank">{8 - props.row}</span>
      : null;
    const fileLabel = props.showFile
      ? <span className="coord-file">{String.fromCharCode('a'.charCodeAt(0) + props.col)}</span>
      : null;

    if (props.piece === PieceType.None) {
      return (
        <span ref={drop} className={className}>
          {rankLabel}{fileLabel}
        </span>
      );
    }
  
    return (
      <span ref={drop} className={className}>
        {rankLabel}{fileLabel}
        <Piece row={props.row} col={props.col} pieceType={props.piece} />
      </span>
    );
  };

  export default Square;

