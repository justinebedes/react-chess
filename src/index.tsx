import React from 'react';
import ReactDOM from 'react-dom/client';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import './index.css';
import Board from './Board';

function Game() {
  return (
      <div className="game">
        <div className="game-board">
          <DndProvider backend={HTML5Backend}>
            <Board />
          </DndProvider>
        </div>
        <div className="game-info">
          <div>{/* status */}</div>
          <ol>{/* TODO */}</ol>
        </div>
      </div>
    )
}

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<Game />);
  