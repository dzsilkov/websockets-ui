import db from '../../db/db';
import {Coordinates} from '../../models/models';
import {attackHandler} from './attack-handler';
import {checkAvailableCell} from '../../helpers/helpers';

export const randomAttackHandler = (ws, data, wss) => {
    const {gameId, indexPlayer} = JSON.parse(data);
    const {players: gamePlayers} = db.games.get(gameId);
    const [enemyId] = Object.keys(gamePlayers).filter(key => key !== indexPlayer.toString());
    if (!enemyId) {
        return;
    }
    const {board: {board: enemyBoard}} = gamePlayers[enemyId];

    const [x, y] = computerRandomAttack(enemyBoard);
    const newData = JSON.stringify({x, y, gameId, indexPlayer});

    attackHandler(ws, newData, wss);
};


const generateRandomAttack = (): Coordinates => {
    const x = Math.floor(Math.random() * 10);
    const y = Math.floor(Math.random() * 10);
    return [x, y];
};

const computerRandomAttack = (board: string[][]): Coordinates => {
    let attackCoordinates: Coordinates;
    do {
        attackCoordinates = generateRandomAttack();
    } while (checkAvailableCell(board, attackCoordinates));
    return attackCoordinates;
};


