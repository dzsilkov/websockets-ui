import {Ship, ShipDirection} from '../models/models';

export const createBoard = (ships: Ship[]) => ({board: addShips(ships), shipCount: 10});

export const addShips = (ships: Ship[]): string[][] => {
    const fieldSize = 10;
    const board = new Array(fieldSize).fill(null).map(() => new Array(fieldSize).fill('-'));
    ships.forEach(ship => {
        const {position: {x, y}, direction: vertical, length} = ship;
        const start = vertical ? y : x;
        const end = start + length;
        for (let i = start; i < end; i++) {

            if (vertical) {
                // @ts-ignore: Unreachable code error
                board[x][i] = {
                    x,
                    y,
                    rowCount: length,
                    colCount: 1,
                    type: ship.type,
                    length,
                    direction: ShipDirection.Vertical
                };
            } else {
                // @ts-ignore: Unreachable code error
                board[i][y] = {
                    x,
                    y,
                    rowCount: 1,
                    colCount: length,
                    type: ship.type,
                    length,
                    direction: ShipDirection.Horizontal
                };
            }

        }
    });
    return board;
};