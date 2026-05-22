import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { DndProvider } from 'react-dnd';
import { MultiBackend } from 'react-dnd-multi-backend';
import { HTML5toTouch } from 'rdndmb-html5-to-touch';
import './index.css';
import Board from './Board';
import MoveList, { Move } from './MoveList';
import CustomDragLayer from './CustomDragLayer';
import PromotionPicker from './PromotionPicker';
import { BoardSize, PieceType, Colour } from './Constants';
import { isInCheck, isCheckmate, isStalemate, CastlingRights, FULL_CASTLING_RIGHTS, EnPassantTarget } from './ChessLogic';

type GameStatus = 'playing' | 'check' | 'checkmate' | 'stalemate';

interface PendingPromotion {
  endRow: number;
  endCol: number;
  startCol: number;
  piece: PieceType;
  turn: Colour;
  isCapture: boolean;
}

function createInitialBoard(): PieceType[][] {
  const board: PieceType[][] = Array.from({ length: BoardSize }, () =>
    Array(BoardSize).fill(PieceType.None)
  );
  board[7][0] = PieceType.WhiteRook;   board[7][1] = PieceType.WhiteKnight;
  board[7][2] = PieceType.WhiteBishop; board[7][3] = PieceType.WhiteQueen;
  board[7][4] = PieceType.WhiteKing;   board[7][5] = PieceType.WhiteBishop;
  board[7][6] = PieceType.WhiteKnight; board[7][7] = PieceType.WhiteRook;
  board[0][0] = PieceType.BlackRook;   board[0][1] = PieceType.BlackKnight;
  board[0][2] = PieceType.BlackBishop; board[0][3] = PieceType.BlackQueen;
  board[0][4] = PieceType.BlackKing;   board[0][5] = PieceType.BlackBishop;
  board[0][6] = PieceType.BlackKnight; board[0][7] = PieceType.BlackRook;
  for (let col = 0; col < BoardSize; col++) {
    board[6][col] = PieceType.WhitePawn;
    board[1][col] = PieceType.BlackPawn;
  }
  return board;
}

function Game() {
  const [currentTurn, setCurrentTurn] = useState(Colour.White);
  const [board, setBoard] = useState<PieceType[][]>(() => createInitialBoard());
  const [moveList, setMoveList] = useState<Move[]>([]);
  const [castlingRights, setCastlingRights] = useState<CastlingRights>(FULL_CASTLING_RIGHTS);
  const [enPassantTarget, setEnPassantTarget] = useState<EnPassantTarget | null>(null);

  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);

  function computeStatusAfterMove(newBoard: PieceType[][], nextColour: Colour, newRights: CastlingRights, newEpTarget: EnPassantTarget | null): { status: GameStatus; suffix: string } {
    if (isCheckmate(newBoard, nextColour, newRights, newEpTarget)) return { status: 'checkmate', suffix: '#' };
    if (isStalemate(newBoard, nextColour, newRights, newEpTarget)) return { status: 'stalemate', suffix: '' };
    if (isInCheck(newBoard, nextColour))                           return { status: 'check',     suffix: '+' };
    return { status: 'playing', suffix: '' };
  }

  function applyRightsUpdate(rights: CastlingRights, piece: PieceType, startRow: number, startCol: number, endRow: number, endCol: number): CastlingRights {
    const r = { ...rights };
    if (piece === PieceType.WhiteKing) { r.whiteKingSide = false; r.whiteQueenSide = false; }
    if (piece === PieceType.BlackKing) { r.blackKingSide = false; r.blackQueenSide = false; }
    if (startRow === 7 && startCol === 7) r.whiteKingSide  = false;
    if (startRow === 7 && startCol === 0) r.whiteQueenSide = false;
    if (startRow === 0 && startCol === 7) r.blackKingSide  = false;
    if (startRow === 0 && startCol === 0) r.blackQueenSide = false;
    // Rook captured on its starting square.
    if (endRow === 7 && endCol === 7) r.whiteKingSide  = false;
    if (endRow === 7 && endCol === 0) r.whiteQueenSide = false;
    if (endRow === 0 && endCol === 7) r.blackKingSide  = false;
    if (endRow === 0 && endCol === 0) r.blackQueenSide = false;
    return r;
  }

  const isPromotion = (piece: PieceType, endRow: number): boolean => {
    return (piece === PieceType.WhitePawn && endRow === 0)
        || (piece === PieceType.BlackPawn && endRow === 7);
  };

  const commitMove = (endRow: number, endCol: number, startCol: number, piece: PieceType, promotedTo: PieceType, turn: Colour, isCapture: boolean) => {
    // board currently has the pawn on the promotion square; replace with chosen piece.
    const promotedBoard = board.map(arr => arr.slice());
    promotedBoard[endRow][endCol] = promotedTo;
    setBoard(promotedBoard);

    const nextColour = turn === Colour.White ? Colour.Black : Colour.White;
    const { status, suffix } = computeStatusAfterMove(promotedBoard, nextColour, castlingRights, null);
    setGameStatus(status);

    const moveStr = getMoveString(endRow, endCol, piece, startCol, isCapture) + '=' + getPieceChar(promotedTo) + suffix;
    setMoveList(moveList => {
      if (turn === Colour.White) {
        return [...moveList, { whiteMove: moveStr, blackMove: '' }];
      } else {
        const updated = [...moveList];
        updated[updated.length - 1].blackMove = moveStr;
        return updated;
      }
    });

    setCurrentTurn(nextColour);
  };

  const handlePromotion = (promotedPiece: PieceType) => {
    if (!pendingPromotion) return;
    commitMove(pendingPromotion.endRow, pendingPromotion.endCol, pendingPromotion.startCol, pendingPromotion.piece, promotedPiece, pendingPromotion.turn, pendingPromotion.isCapture);
    setPendingPromotion(null);
  };

  const handleMove = (startRow: number, startCol: number, endRow: number, endCol: number, piece: PieceType) => {
    if (startRow === endRow && startCol === endCol) return;
    if (gameStatus === 'checkmate' || gameStatus === 'stalemate') return;

    const newBoard = board.map(arr => arr.slice());
    newBoard[endRow][endCol] = newBoard[startRow][startCol];
    newBoard[startRow][startCol] = PieceType.None;

    // Detect castling: king moved 2 squares horizontally → also move the rook.
    const isCastle = (piece === PieceType.WhiteKing || piece === PieceType.BlackKing)
                     && startRow === endRow && Math.abs(startCol - endCol) === 2;
    if (isCastle) {
      const isKingSide = endCol > startCol;
      const rookFromCol = isKingSide ? 7 : 0;
      const rookToCol   = isKingSide ? 5 : 3;
      newBoard[endRow][rookToCol]   = newBoard[endRow][rookFromCol];
      newBoard[endRow][rookFromCol] = PieceType.None;
    }

    // Detect en passant: pawn moves diagonally to the en passant target (empty square).
    const isEpCapture = enPassantTarget !== null
      && (piece === PieceType.WhitePawn || piece === PieceType.BlackPawn)
      && endRow === enPassantTarget.row && endCol === enPassantTarget.col
      && startCol !== endCol;
    if (isEpCapture) {
      const capturedPawnRow = piece === PieceType.WhitePawn ? endRow + 1 : endRow - 1;
      newBoard[capturedPawnRow][endCol] = PieceType.None;
    }

    setBoard(newBoard);

    // Compute the new en passant target for the next move.
    const newEpTarget: EnPassantTarget | null =
      (piece === PieceType.WhitePawn && startRow === 6 && endRow === 4) ? { row: 5, col: endCol } :
      (piece === PieceType.BlackPawn && startRow === 1 && endRow === 3) ? { row: 2, col: endCol } :
      null;
    setEnPassantTarget(newEpTarget);

    if (!isCastle && isPromotion(piece, endRow)) {
      setCastlingRights(applyRightsUpdate(castlingRights, piece, startRow, startCol, endRow, endCol));
      setPendingPromotion({ endRow, endCol, startCol, piece, turn: currentTurn, isCapture: board[endRow][endCol] !== PieceType.None });
      return;
    }

    const newRights = applyRightsUpdate(castlingRights, piece, startRow, startCol, endRow, endCol);
    setCastlingRights(newRights);

    const nextColour = currentTurn === Colour.White ? Colour.Black : Colour.White;
    const { status, suffix } = computeStatusAfterMove(newBoard, nextColour, newRights, newEpTarget);
    setGameStatus(status);

    const isCapture = board[endRow][endCol] !== PieceType.None || isEpCapture;
    const moveStr = isCastle
      ? (endCol > startCol ? 'O-O' : 'O-O-O')
      : isEpCapture
        ? getMoveString(endRow, endCol, piece, startCol, true) + ' e.p.'
        : getMoveString(endRow, endCol, piece, startCol, isCapture);
    setMoveList(moveList => {
      if (currentTurn === Colour.White) {
        return [...moveList, { whiteMove: moveStr + suffix, blackMove: '' }];
      } else {
        const updated = [...moveList];
        updated[updated.length - 1].blackMove = moveStr + suffix;
        return updated;
      }
    });

    setCurrentTurn(nextColour);
  }

  return (
      <div className="game">
        <div className="game-board">
          <DndProvider backend={MultiBackend} options={HTML5toTouch}>
            <CustomDragLayer />
            <Board
              currentTurn={currentTurn}
              board={board}
              gameOver={gameStatus === 'checkmate' || gameStatus === 'stalemate'}
              statusMessage={getStatusMessage(currentTurn, gameStatus)}
              castlingRights={castlingRights}
              enPassantTarget={enPassantTarget}
              onMove={handleMove}
            />
          </DndProvider>
          {pendingPromotion && (
            <PromotionPicker
              colour={pendingPromotion.turn}
              onSelect={handlePromotion}
            />
          )}
        </div>
        <div className="move-list">
          <MoveList moves={moveList}/>
        </div>
      </div>
    )
}

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<Game />);

function getMoveString(endRow: number, endCol: number, piece: PieceType, startCol: number, isCapture: boolean): string {
  const destFile = String.fromCharCode('a'.charCodeAt(0) + endCol);
  const rank = 8 - endRow;
  const capture = isCapture ? 'x' : '';

  switch (piece) {
    case PieceType.WhitePawn:
    case PieceType.BlackPawn: {
      const srcFile = String.fromCharCode('a'.charCodeAt(0) + startCol);
      return isCapture ? `${srcFile}x${destFile}${rank}` : `${destFile}${rank}`;
    }
    case PieceType.WhiteKnight: case PieceType.BlackKnight: return `N${capture}${destFile}${rank}`;
    case PieceType.WhiteBishop: case PieceType.BlackBishop: return `B${capture}${destFile}${rank}`;
    case PieceType.WhiteRook:   case PieceType.BlackRook:   return `R${capture}${destFile}${rank}`;
    case PieceType.WhiteQueen:  case PieceType.BlackQueen:  return `Q${capture}${destFile}${rank}`;
    case PieceType.WhiteKing:   case PieceType.BlackKing:   return `K${capture}${destFile}${rank}`;
    default: return `${destFile}${rank}`;
  }
}

function getPieceChar(piece: PieceType): string {
  switch (piece) {
    case PieceType.WhiteQueen:  case PieceType.BlackQueen:  return 'Q';
    case PieceType.WhiteRook:   case PieceType.BlackRook:   return 'R';
    case PieceType.WhiteBishop: case PieceType.BlackBishop: return 'B';
    case PieceType.WhiteKnight: case PieceType.BlackKnight: return 'N';
    default: return '';
  }
}

function getStatusMessage(currentTurn: Colour, gameStatus: string): string {
  switch (gameStatus) {
    case 'checkmate': {
      const winner = currentTurn === Colour.White ? Colour.Black : Colour.White;
      return `Checkmate — ${winner} wins!`;
    }
    case 'stalemate':
      return 'Stalemate — draw!';
    case 'check':
      return `${currentTurn} is in check`;
    default:
      return `Next player: ${currentTurn}`;
  }
}
  