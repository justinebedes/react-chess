import { PieceType, Colour } from "./Constants";
import {
  CastlingRights,
  EnPassantTarget,
  getLegalMoves,
  getPieceColour,
  isInCheck,
} from "./ChessLogic";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChessMove {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  score: number;
}

interface Node {
  board: PieceType[][];
  castlingRights: CastlingRights;
  enPassantTarget: EnPassantTarget | null;
  move: ChessMove;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AI_DEPTH = 4;

const PIECE_VALUES: Partial<Record<PieceType, number>> = {
  [PieceType.WhitePawn]:   100,
  [PieceType.WhiteKnight]: 320,
  [PieceType.WhiteBishop]: 330,
  [PieceType.WhiteRook]:   500,
  [PieceType.WhiteQueen]:  900,
  [PieceType.WhiteKing]:   20000,
  [PieceType.BlackPawn]:   100,
  [PieceType.BlackKnight]: 320,
  [PieceType.BlackBishop]: 330,
  [PieceType.BlackRook]:   500,
  [PieceType.BlackQueen]:  900,
  [PieceType.BlackKing]:   20000,
};

const CHECKMATE_SCORE = 1_000_000;

// ---------------------------------------------------------------------------
// Piece-square tables — White's perspective (row 0 = rank 8, row 7 = rank 1).
// For Black pieces use (7 - row) to mirror vertically.
// ---------------------------------------------------------------------------

const PST_PAWN: number[][] = [
  [ 0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [ 5,  5, 10, 25, 25, 10,  5,  5],
  [ 0,  0,  0, 20, 20,  0,  0,  0],
  [ 5, -5,-10,  0,  0,-10, -5,  5],
  [ 5, 10, 10,-20,-20, 10, 10,  5],
  [ 0,  0,  0,  0,  0,  0,  0,  0],
];

const PST_KNIGHT: number[][] = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50],
];

const PST_BISHOP: number[][] = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20],
];

const PST_ROOK: number[][] = [
  [ 0,  0,  0,  0,  0,  0,  0,  0],
  [ 5, 10, 10, 10, 10, 10, 10,  5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [ 0,  0,  0,  5,  5,  0,  0,  0],
];

const PST_QUEEN: number[][] = [
  [-20,-10,-10, -5, -5,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5,  5,  5,  5,  0,-10],
  [ -5,  0,  5,  5,  5,  5,  0, -5],
  [  0,  0,  5,  5,  5,  5,  0, -5],
  [-10,  5,  5,  5,  5,  5,  0,-10],
  [-10,  0,  5,  0,  0,  0,  0,-10],
  [-20,-10,-10, -5, -5,-10,-10,-20],
];

const PST_KING: number[][] = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [ 20, 20,  0,  0,  0,  0, 20, 20],
  [ 20, 30, 10,  0,  0, 10, 30, 20],
];

function getPST(piece: PieceType): number[][] | null {
  switch (piece) {
    case PieceType.WhitePawn:   case PieceType.BlackPawn:   return PST_PAWN;
    case PieceType.WhiteKnight: case PieceType.BlackKnight: return PST_KNIGHT;
    case PieceType.WhiteBishop: case PieceType.BlackBishop: return PST_BISHOP;
    case PieceType.WhiteRook:   case PieceType.BlackRook:   return PST_ROOK;
    case PieceType.WhiteQueen:  case PieceType.BlackQueen:  return PST_QUEEN;
    case PieceType.WhiteKing:   case PieceType.BlackKing:   return PST_KING;
    default: return null;
  }
}

// MVV-LVA score for move ordering: captures first, best captures first.
function scoreMoveForOrdering(board: PieceType[][], m: ChessMove): number {
  const target = board[m.toRow][m.toCol];
  if (target === PieceType.None) return 0;
  const attackerValue = PIECE_VALUES[board[m.fromRow][m.fromCol]] ?? 0;
  const victimValue   = PIECE_VALUES[target] ?? 0;
  // High victim value and low attacker value = search first.
  return victimValue * 10 - attackerValue;
}

// ---------------------------------------------------------------------------
// Board application
// ---------------------------------------------------------------------------

interface AppliedMove {
  newBoard: PieceType[][];
  newCastlingRights: CastlingRights;
  newEnPassantTarget: EnPassantTarget | null;
}

function applyMoveToBoard(
  board: PieceType[][],
  castlingRights: CastlingRights,
  fromRow: number, fromCol: number,
  toRow: number, toCol: number
): AppliedMove {
  const piece = board[fromRow][fromCol];
  const newBoard = board.map(r => r.slice());

  newBoard[toRow][toCol] = piece;
  newBoard[fromRow][fromCol] = PieceType.None;

  // Castling: move the rook too.
  const isCastle = (piece === PieceType.WhiteKing || piece === PieceType.BlackKing)
    && fromRow === toRow && Math.abs(fromCol - toCol) === 2;
  if (isCastle) {
    const isKingSide = toCol > fromCol;
    const rookFromCol = isKingSide ? 7 : 0;
    const rookToCol   = isKingSide ? 5 : 3;
    newBoard[toRow][rookToCol]   = newBoard[toRow][rookFromCol];
    newBoard[toRow][rookFromCol] = PieceType.None;
  }

  // En passant: remove the captured pawn.
  const isEpCapture = (piece === PieceType.WhitePawn || piece === PieceType.BlackPawn)
    && fromCol !== toCol
    && board[toRow][toCol] === PieceType.None;
  if (isEpCapture) {
    const capturedPawnRow = piece === PieceType.WhitePawn ? toRow + 1 : toRow - 1;
    newBoard[capturedPawnRow][toCol] = PieceType.None;
  }

  // Promotion: auto-queen inside the search tree.
  if (piece === PieceType.WhitePawn && toRow === 0) newBoard[toRow][toCol] = PieceType.WhiteQueen;
  if (piece === PieceType.BlackPawn && toRow === 7) newBoard[toRow][toCol] = PieceType.BlackQueen;

  // Update castling rights.
  const r = { ...castlingRights };
  if (piece === PieceType.WhiteKing) { r.whiteKingSide = false; r.whiteQueenSide = false; }
  if (piece === PieceType.BlackKing) { r.blackKingSide = false; r.blackQueenSide = false; }
  if (fromRow === 7 && fromCol === 7) r.whiteKingSide  = false;
  if (fromRow === 7 && fromCol === 0) r.whiteQueenSide = false;
  if (fromRow === 0 && fromCol === 7) r.blackKingSide  = false;
  if (fromRow === 0 && fromCol === 0) r.blackQueenSide = false;
  if (toRow === 7 && toCol === 7)     r.whiteKingSide  = false;
  if (toRow === 7 && toCol === 0)     r.whiteQueenSide = false;
  if (toRow === 0 && toCol === 7)     r.blackKingSide  = false;
  if (toRow === 0 && toCol === 0)     r.blackQueenSide = false;

  // Update en passant target.
  let newEnPassantTarget: EnPassantTarget | null = null;
  if (piece === PieceType.WhitePawn && fromRow === 6 && toRow === 4)
    newEnPassantTarget = { row: 5, col: toCol };
  if (piece === PieceType.BlackPawn && fromRow === 1 && toRow === 3)
    newEnPassantTarget = { row: 2, col: toCol };

  return { newBoard, newCastlingRights: r, newEnPassantTarget };
}

// ---------------------------------------------------------------------------
// Move generation — delegates to the existing getLegalMoves from ChessLogic
// ---------------------------------------------------------------------------

function getAllLegalMoves(
  board: PieceType[][],
  castlingRights: CastlingRights,
  enPassantTarget: EnPassantTarget | null,
  colour: Colour
): ChessMove[] {
  const moves: ChessMove[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece === PieceType.None) continue;
      if (getPieceColour(piece) !== colour) continue;
      const dests = getLegalMoves(board, r, c, castlingRights, enPassantTarget);
      for (const { row, col } of dests) {
        moves.push({ fromRow: r, fromCol: c, toRow: row, toCol: col, score: 0 });
      }
    }
  }
  return moves;
}

// ---------------------------------------------------------------------------
// Static evaluation — positive = White better, negative = Black better
// ---------------------------------------------------------------------------

function evaluateBoard(board: PieceType[][]): number {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece === PieceType.None) continue;
      const isWhite = getPieceColour(piece) === Colour.White;
      const material = PIECE_VALUES[piece] ?? 0;
      const pst = getPST(piece);
      const pstRow = isWhite ? r : 7 - r;
      const positional = pst ? pst[pstRow][c] : 0;
      score += isWhite ? (material + positional) : -(material + positional);
    }
  }
  return score;
}

// ---------------------------------------------------------------------------
// Alpha-beta minimax
// ---------------------------------------------------------------------------

const NULL_MOVE: ChessMove = { fromRow: -1, fromCol: -1, toRow: -1, toCol: -1, score: 0 };

const alphaBeta = (
  { board, castlingRights, enPassantTarget, move }: Node,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): ChessMove => {
  const colour = isMaximizing ? Colour.White : Colour.Black;
  // Generate moves once — reuse for both terminal detection and the search loop.
  const legalMoves = getAllLegalMoves(board, castlingRights, enPassantTarget, colour);

  if (legalMoves.length === 0) {
    // No legal moves: checkmate or stalemate. isInCheck is cheap (single king scan).
    return { ...move, score: isInCheck(board, colour)
      ? (isMaximizing ? -(CHECKMATE_SCORE + depth) : (CHECKMATE_SCORE + depth))
      : 0 };
  }
  if (depth === 0) {
    return { ...move, score: evaluateBoard(board) };
  }

  // Move ordering: search captures first (MVV-LVA) to maximise alpha-beta cutoffs.
  legalMoves.sort((a, b) => scoreMoveForOrdering(board, b) - scoreMoveForOrdering(board, a));

  if (isMaximizing) {
    let bestMove: ChessMove = { ...NULL_MOVE, score: -Infinity };
    for (const m of legalMoves) {
      const { newBoard, newCastlingRights, newEnPassantTarget } =
        applyMoveToBoard(board, castlingRights, m.fromRow, m.fromCol, m.toRow, m.toCol);
      const child = alphaBeta(
        { board: newBoard, castlingRights: newCastlingRights, enPassantTarget: newEnPassantTarget, move: m },
        depth - 1, alpha, beta, false
      );
      if (child.score > bestMove.score) bestMove = { ...m, score: child.score };
      else if (child.score === bestMove.score && Math.random() < 0.5) bestMove = { ...m, score: child.score };
      alpha = Math.max(alpha, child.score);
      if (alpha >= beta) break;
    }
    return bestMove;
  } else {
    let bestMove: ChessMove = { ...NULL_MOVE, score: Infinity };
    for (const m of legalMoves) {
      const { newBoard, newCastlingRights, newEnPassantTarget } =
        applyMoveToBoard(board, castlingRights, m.fromRow, m.fromCol, m.toRow, m.toCol);
      const child = alphaBeta(
        { board: newBoard, castlingRights: newCastlingRights, enPassantTarget: newEnPassantTarget, move: m },
        depth - 1, alpha, beta, true
      );
      if (child.score < bestMove.score) bestMove = { ...m, score: child.score };
      else if (child.score === bestMove.score && Math.random() < 0.5) bestMove = { ...m, score: child.score };
      beta = Math.min(beta, child.score);
      if (alpha >= beta) break;
    }
    return bestMove;
  }
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Returns the best move for Black (the AI) using minimax with alpha-beta pruning. */
export const getBestMove = async (
  board: PieceType[][],
  castlingRights: CastlingRights,
  enPassantTarget: EnPassantTarget | null
): Promise<ChessMove> => {
  // Yield to the event loop so React can render the "thinking" state before blocking.
  await new Promise<void>(resolve => setTimeout(resolve, 0));
  return alphaBeta(
    { board, castlingRights, enPassantTarget, move: NULL_MOVE },
    AI_DEPTH, -Infinity, Infinity,
    false  // AI plays Black → minimizing
  );
};