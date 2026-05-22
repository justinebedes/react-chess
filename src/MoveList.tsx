import React from 'react';

export interface Move {
    whiteMove: string,
    blackMove: string
}

export interface MoveListProps {
    moves: Move[]
}

function MoveList(props: MoveListProps) {
    const moves = props.moves.map((move, index) => {
        return (
            <li key={index}>
                {move.whiteMove + " " + move.blackMove}
            </li>
        );
    });

    return (
        <>
            <ol>{moves}</ol>
        </>
    )
}

export default MoveList;