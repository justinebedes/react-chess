import React, { useMemo } from 'react';
import { useDragLayer } from 'react-dnd';
import { BoardSize, PieceType, Colour } from './Constants';
import Square from './Square';
import { CastlingRights, EnPassantTarget, getLegalMoves } from './ChessLogic';

export interface BoardProps {
  currentTurn: Colour,
  board: PieceType[][],
  statusMessage: string,
  gameOver: boolean,
  castlingRights: CastlingRights,
  enPassantTarget: EnPassantTarget | null,
  onMove: (startRow: number, startCol: number, endRow: number, endCol: number, piece: PieceType) => void;
}

function Board(props: BoardProps) { 
    const { dragItem } = useDragLayer(monitor => ({
      dragItem: monitor.isDragging() ? monitor.getItem() : null,
    }));

    const legalTargetSet = useMemo<Set<string>>(() => {
      if (!dragItem) return new Set();
      const moves = getLegalMoves(props.board, dragItem.startRow, dragItem.startCol, props.castlingRights, props.enPassantTarget);
      return new Set(moves.map(m => `${m.row},${m.col}`));
    }, [dragItem, props.board, props.castlingRights, props.enPassantTarget]);

    const renderSquare = (row: number, col: number, colour: Colour, piece: PieceType, turn: Colour) => {
      return <Square key={row + "," + col} row={row} col={col} colour={colour} piece={piece} 
                     currentTurn={turn} board={props.board} gameOver={props.gameOver}
                     castlingRights={props.castlingRights} enPassantTarget={props.enPassantTarget}
                     isLegalTarget={legalTargetSet.has(`${row},${col}`)}
                     showRank={col === 0} showFile={row === 7}
                     onMove={props.onMove} />;
    }

    const renderRow = (row: number) => {
        let squares: React.ReactElement[] = [];

        for (var col = 0; col < BoardSize; col++) {
          let colour = Colour.White;
          if (col % 2 === 0) {
            colour = row % 2 === 0 ? Colour.White : Colour.Black;
          } else {
            colour = row % 2 === 0 ? Colour.Black : Colour.White;
          }

          squares.push(renderSquare(row, col, colour, props.board && props.board[row] && props.board[row][col], props.currentTurn));
        }

        return (
            <div key={row}>
                {squares}
            </div>
        );
    }
  
    let rows: React.ReactElement[] = [];
    for (var row = 0; row < BoardSize; row++) {
        rows.push(renderRow(row))
    }

    return (
        <div>
          <div className="status">{props.statusMessage}</div>
          {rows}
        </div>
    );
}

export default Board;