import { PieceType, Colour } from './Constants';

export interface CastlingRights {
  whiteKingSide: boolean;
  whiteQueenSide: boolean;
  blackKingSide: boolean;
  blackQueenSide: boolean;
}

export const FULL_CASTLING_RIGHTS: CastlingRights = {
  whiteKingSide: true,
  whiteQueenSide: true,
  blackKingSide: true,
  blackQueenSide: true,
};

export interface EnPassantTarget {
  row: number;
  col: number;
}

export function getPieceColour(piece: PieceType): Colour {
  if (piece >= PieceType.WhitePawn && piece <= PieceType.WhiteKing) return Colour.White;
  return Colour.Black;
}

// ---------------------------------------------------------------------------
// Piece movement shape validators (path-clear checks included)
// ---------------------------------------------------------------------------

export function isWhitePawnMoveValid(
  startRow: number, startCol: number,
  endRow: number, endCol: number,
  capturedPiece: PieceType,
  board: PieceType[][]
): boolean {
  if (capturedPiece !== PieceType.None) {
    return endRow === startRow - 1 && Math.abs(startCol - endCol) === 1;
  }
  if (startCol !== endCol) return false;
  if (endRow === startRow - 1) return true;
  if (startRow === 6 && endRow === 4) {
    return board[startRow - 1][startCol] === PieceType.None;
  }
  return false;
}

export function isBlackPawnMoveValid(
  startRow: number, startCol: number,
  endRow: number, endCol: number,
  capturedPiece: PieceType,
  board: PieceType[][]
): boolean {
  if (capturedPiece !== PieceType.None) {
    return endRow === startRow + 1 && Math.abs(startCol - endCol) === 1;
  }
  if (startCol !== endCol) return false;
  if (endRow === startRow + 1) return true;
  if (startRow === 1 && endRow === 3) {
    return board[startRow + 1][startCol] === PieceType.None;
  }
  return false;
}

export function isKnightMoveValid(
  startRow: number, startCol: number,
  endRow: number, endCol: number
): boolean {
  return (Math.abs(startRow - endRow) === 1 && Math.abs(startCol - endCol) === 2)
    || (Math.abs(startRow - endRow) === 2 && Math.abs(startCol - endCol) === 1);
}

export function isBishopMoveValid(
  startRow: number, startCol: number,
  endRow: number, endCol: number,
  board: PieceType[][]
): boolean {
  const rowDiff = endRow - startRow;
  const colDiff = endCol - startCol;
  if (Math.abs(rowDiff) !== Math.abs(colDiff) || rowDiff === 0) return false;

  const rowStep = rowDiff > 0 ? 1 : -1;
  const colStep = colDiff > 0 ? 1 : -1;
  let r = startRow + rowStep;
  let c = startCol + colStep;
  while (r !== endRow) {
    if (board[r][c] !== PieceType.None) return false;
    r += rowStep;
    c += colStep;
  }
  return true;
}

export function isRookMoveValid(
  startRow: number, startCol: number,
  endRow: number, endCol: number,
  board: PieceType[][]
): boolean {
  if (startRow === endRow && startCol === endCol) return false;
  if (startRow !== endRow && startCol !== endCol) return false;

  if (startRow === endRow) {
    const colStep = endCol > startCol ? 1 : -1;
    for (let c = startCol + colStep; c !== endCol; c += colStep) {
      if (board[startRow][c] !== PieceType.None) return false;
    }
  } else {
    const rowStep = endRow > startRow ? 1 : -1;
    for (let r = startRow + rowStep; r !== endRow; r += rowStep) {
      if (board[r][startCol] !== PieceType.None) return false;
    }
  }
  return true;
}

export function isQueenMoveValid(
  startRow: number, startCol: number,
  endRow: number, endCol: number,
  board: PieceType[][]
): boolean {
  return isBishopMoveValid(startRow, startCol, endRow, endCol, board)
    || isRookMoveValid(startRow, startCol, endRow, endCol, board);
}

export function isKingMoveValid(
  startRow: number, startCol: number,
  endRow: number, endCol: number
): boolean {
  return Math.abs(startRow - endRow) <= 1 && Math.abs(startCol - endCol) <= 1
    && (startRow !== endRow || startCol !== endCol);
}

/**
 * Returns true if the move is a valid en passant capture.
 */
export function isEnPassantCapture(
  piece: PieceType,
  startRow: number, startCol: number,
  endRow: number, endCol: number,
  enPassantTarget: EnPassantTarget | null
): boolean {
  if (!enPassantTarget) return false;
  if (endRow !== enPassantTarget.row || endCol !== enPassantTarget.col) return false;
  if (piece === PieceType.WhitePawn) {
    return endRow === startRow - 1 && Math.abs(startCol - endCol) === 1;
  }
  if (piece === PieceType.BlackPawn) {
    return endRow === startRow + 1 && Math.abs(startCol - endCol) === 1;
  }
  return false;
}

/**
 * Returns true if castling is legal in the current position.
 * Checks: rights, king not in check, path clear, king doesn't cross/land on attacked square.
 */
export function isCastlingValid(
  board: PieceType[][],
  colour: Colour,
  isKingSide: boolean,
  castlingRights: CastlingRights
): boolean {
  if (colour === Colour.White) {
    if (isKingSide  && !castlingRights.whiteKingSide)  return false;
    if (!isKingSide && !castlingRights.whiteQueenSide) return false;
  } else {
    if (isKingSide  && !castlingRights.blackKingSide)  return false;
    if (!isKingSide && !castlingRights.blackQueenSide) return false;
  }

  if (isInCheck(board, colour)) return false;

  const opponent = colour === Colour.White ? Colour.Black : Colour.White;
  const row = colour === Colour.White ? 7 : 0;

  if (isKingSide) {
    // f and g files must be empty; king must not pass through f or land on g while attacked.
    if (board[row][5] !== PieceType.None) return false;
    if (board[row][6] !== PieceType.None) return false;
    if (isSquareAttacked(board, row, 5, opponent)) return false;
    if (isSquareAttacked(board, row, 6, opponent)) return false;
  } else {
    // b, c, d files must be empty; king must not pass through d or land on c while attacked.
    if (board[row][1] !== PieceType.None) return false;
    if (board[row][2] !== PieceType.None) return false;
    if (board[row][3] !== PieceType.None) return false;
    if (isSquareAttacked(board, row, 3, opponent)) return false;
    if (isSquareAttacked(board, row, 2, opponent)) return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Pseudo-legal move check (shape valid + no friendly capture; ignores check)
// ---------------------------------------------------------------------------

export function isPseudoLegalMove(
  board: PieceType[][],
  startRow: number, startCol: number,
  endRow: number, endCol: number
): boolean {
  const piece = board[startRow][startCol];
  if (piece === PieceType.None) return false;
  if (startRow === endRow && startCol === endCol) return false;

  const destPiece = board[endRow][endCol];
  if (destPiece !== PieceType.None && getPieceColour(destPiece) === getPieceColour(piece)) return false;

  switch (piece) {
    case PieceType.WhitePawn:
      return isWhitePawnMoveValid(startRow, startCol, endRow, endCol, destPiece, board);
    case PieceType.BlackPawn:
      return isBlackPawnMoveValid(startRow, startCol, endRow, endCol, destPiece, board);
    case PieceType.WhiteKnight:
    case PieceType.BlackKnight:
      return isKnightMoveValid(startRow, startCol, endRow, endCol);
    case PieceType.WhiteBishop:
    case PieceType.BlackBishop:
      return isBishopMoveValid(startRow, startCol, endRow, endCol, board);
    case PieceType.WhiteRook:
    case PieceType.BlackRook:
      return isRookMoveValid(startRow, startCol, endRow, endCol, board);
    case PieceType.WhiteQueen:
    case PieceType.BlackQueen:
      return isQueenMoveValid(startRow, startCol, endRow, endCol, board);
    case PieceType.WhiteKing:
    case PieceType.BlackKing:
      return isKingMoveValid(startRow, startCol, endRow, endCol);
  }
  return false;
}

// ---------------------------------------------------------------------------
// Check / checkmate / stalemate
// ---------------------------------------------------------------------------

/** Returns true if (row, col) is attacked by any piece of byColour. */
export function isSquareAttacked(
  board: PieceType[][], row: number, col: number, byColour: Colour
): boolean {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece === PieceType.None) continue;
      if (getPieceColour(piece) !== byColour) continue;

      // Pawns attack diagonally, not along their push direction.
      if (piece === PieceType.WhitePawn) {
        if (row === r - 1 && Math.abs(col - c) === 1) return true;
        continue;
      }
      if (piece === PieceType.BlackPawn) {
        if (row === r + 1 && Math.abs(col - c) === 1) return true;
        continue;
      }

      if ((piece === PieceType.WhiteKnight || piece === PieceType.BlackKnight)
          && isKnightMoveValid(r, c, row, col)) return true;
      if ((piece === PieceType.WhiteBishop || piece === PieceType.BlackBishop)
          && isBishopMoveValid(r, c, row, col, board)) return true;
      if ((piece === PieceType.WhiteRook || piece === PieceType.BlackRook)
          && isRookMoveValid(r, c, row, col, board)) return true;
      if ((piece === PieceType.WhiteQueen || piece === PieceType.BlackQueen)
          && isQueenMoveValid(r, c, row, col, board)) return true;
      if ((piece === PieceType.WhiteKing || piece === PieceType.BlackKing)
          && isKingMoveValid(r, c, row, col)) return true;
    }
  }
  return false;
}

export function isInCheck(board: PieceType[][], colour: Colour): boolean {
  const king = colour === Colour.White ? PieceType.WhiteKing : PieceType.BlackKing;
  const opponent = colour === Colour.White ? Colour.Black : Colour.White;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === king) {
        return isSquareAttacked(board, r, c, opponent);
      }
    }
  }
  return false;
}

/**
 * Returns true if making the move from (startRow,startCol) → (endRow,endCol)
 * would leave the moving side's king in check.
 */
export function wouldLeaveKingInCheck(
  board: PieceType[][],
  startRow: number, startCol: number,
  endRow: number, endCol: number,
  enPassantTarget: EnPassantTarget | null = null
): boolean {
  const piece = board[startRow][startCol];
  if (piece === PieceType.None) return false;
  const colour = getPieceColour(piece);

  const newBoard: PieceType[][] = board.map(row => [...row]);
  newBoard[endRow][endCol] = piece;
  newBoard[startRow][startCol] = PieceType.None;

  // For en passant, also remove the captured pawn.
  if (isEnPassantCapture(piece, startRow, startCol, endRow, endCol, enPassantTarget)) {
    const capturedRow = piece === PieceType.WhitePawn ? endRow + 1 : endRow - 1;
    newBoard[capturedRow][endCol] = PieceType.None;
  }

  return isInCheck(newBoard, colour);
}

export function hasAnyLegalMove(board: PieceType[][], colour: Colour, castlingRights: CastlingRights, enPassantTarget: EnPassantTarget | null = null): boolean {
  for (let startRow = 0; startRow < 8; startRow++) {
    for (let startCol = 0; startCol < 8; startCol++) {
      const piece = board[startRow][startCol];
      if (piece === PieceType.None) continue;
      if (getPieceColour(piece) !== colour) continue;

      for (let endRow = 0; endRow < 8; endRow++) {
        for (let endCol = 0; endCol < 8; endCol++) {
          if (isPseudoLegalMove(board, startRow, startCol, endRow, endCol)
              && !wouldLeaveKingInCheck(board, startRow, startCol, endRow, endCol)) {
            return true;
          }
        }
      }
    }
  }
  // Check castling as a potential legal move.
  if (isCastlingValid(board, colour, true,  castlingRights)) return true;
  if (isCastlingValid(board, colour, false, castlingRights)) return true;
  // Check en passant captures.
  if (enPassantTarget) {
    const pawn = colour === Colour.White ? PieceType.WhitePawn : PieceType.BlackPawn;
    const startRow = colour === Colour.White ? enPassantTarget.row + 1 : enPassantTarget.row - 1;
    for (const startCol of [enPassantTarget.col - 1, enPassantTarget.col + 1]) {
      if (startCol < 0 || startCol > 7) continue;
      if (board[startRow][startCol] === pawn) {
        if (!wouldLeaveKingInCheck(board, startRow, startCol, enPassantTarget.row, enPassantTarget.col, enPassantTarget)) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Returns all legal destination squares for the piece at (startRow, startCol).
 */
export function getLegalMoves(
  board: PieceType[][],
  startRow: number,
  startCol: number,
  castlingRights: CastlingRights,
  enPassantTarget: EnPassantTarget | null
): { row: number; col: number }[] {
  const piece = board[startRow][startCol];
  if (piece === PieceType.None) return [];

  const colour = getPieceColour(piece);
  const moves: { row: number; col: number }[] = [];

  for (let endRow = 0; endRow < 8; endRow++) {
    for (let endCol = 0; endCol < 8; endCol++) {
      if (isPseudoLegalMove(board, startRow, startCol, endRow, endCol)) {
        if (!wouldLeaveKingInCheck(board, startRow, startCol, endRow, endCol)) {
          moves.push({ row: endRow, col: endCol });
        }
        continue;
      }
      // Castling: king moving 2 squares horizontally.
      if ((piece === PieceType.WhiteKing || piece === PieceType.BlackKing)
          && startRow === endRow
          && Math.abs(startCol - endCol) === 2) {
        const isKingSide = endCol > startCol;
        if (isCastlingValid(board, colour, isKingSide, castlingRights)) {
          moves.push({ row: endRow, col: endCol });
        }
        continue;
      }
      // En passant.
      if (isEnPassantCapture(piece, startRow, startCol, endRow, endCol, enPassantTarget)) {
        if (!wouldLeaveKingInCheck(board, startRow, startCol, endRow, endCol, enPassantTarget)) {
          moves.push({ row: endRow, col: endCol });
        }
      }
    }
  }

  return moves;
}

export function isCheckmate(board: PieceType[][], colour: Colour, castlingRights: CastlingRights, enPassantTarget: EnPassantTarget | null = null): boolean {
  return isInCheck(board, colour) && !hasAnyLegalMove(board, colour, castlingRights, enPassantTarget);
}

export function isStalemate(board: PieceType[][], colour: Colour, castlingRights: CastlingRights, enPassantTarget: EnPassantTarget | null = null): boolean {
  return !isInCheck(board, colour) && !hasAnyLegalMove(board, colour, castlingRights, enPassantTarget);
}
