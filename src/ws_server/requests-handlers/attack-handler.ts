import db from '../../db/db';
import {AttackStatus, CommandsType} from '../../models/models';
import {updateWinnersHandler} from './update-winners-handler';
import {WebSocketServer} from 'ws';
import {turn} from './add-ships-handler';
import {updateRoomsHandler} from './update-rooms-handler';
import {checkWinner} from '../../helpers/helpers';

export const attackHandler = (_, data, wss: WebSocketServer) => {
    const {x, y, gameId, indexPlayer} = JSON.parse(data);
    const {players: gamePlayers} = db.games.get(gameId);
    const [enemyId] = Object.keys(gamePlayers).filter(key => key !== indexPlayer.toString());
    if (!enemyId) {
        return;
    }
    const {board: {board}} = gamePlayers[enemyId];

    if (board[x][y] === 'o' || board[x][y].attackStatus === AttackStatus.Shot) {
        return;
    }

    const statusAttack = attackStatusGet(data);

    if (!statusAttack) {
        return;
    }

    for (const id in gamePlayers) {
        const gamePlayer = gamePlayers[id];

        if (gamePlayer && gamePlayer.turn === indexPlayer) {

            gamePlayer.client.send(JSON.stringify({
                type: CommandsType.Attack,
                data: JSON.stringify({
                        position:
                            {
                                x,
                                y,
                            },
                        currentPlayer: indexPlayer,
                        status: statusAttack,
                    }
                ),
                id: 0
            }));
        }
        db.games.get(gameId).players[gamePlayer.indexPlayer].turn = statusAttack === AttackStatus.Miss ? +enemyId : indexPlayer;
    }

    turn(gameId);

    const gamePlayer = gamePlayers[indexPlayer];

    if (checkWinner(gamePlayer.board)) {
        for (const id in gamePlayers) {
            let gamePlayer = gamePlayers[id];

            gamePlayer.client.send(JSON.stringify({
                type: CommandsType.Finish,
                data: JSON.stringify({
                        winPlayer: indexPlayer
                    }
                ),
                id: 0
            }));

        }

        updateWinnersHandler(wss, {name: gamePlayer.name, wins: gamePlayer.wins++});
        db.rooms.deleteRoom(db.games.get(gameId).roomId);
        db.games.deleteGame(gameId);
        updateRoomsHandler(wss);
    }
};

export const attackStatusGet = (data): AttackStatus | undefined => {
    const {x, y, gameId, indexPlayer} = JSON.parse(data);
    const {players: gamePlayers} = db.games.get(gameId);
    const [enemyId] = Object.keys(gamePlayers).filter(key => key !== indexPlayer.toString());
    if (!enemyId) {
        return;
    }
    const {board: {board}} = gamePlayers[enemyId];

    if (board[x][y] === '-') {
        board[x][y] = 'o';
        return AttackStatus.Miss;
    } else {
        board[x][y] = {
            ...board[x][y],
            attackStatus: AttackStatus.Shot
        };
        const ship = [];
        let cell = board[x][y];
        for (let i = cell.x; i < cell.x + cell.colCount; i++) {
            for (let j = cell.y; j < cell.y + cell.rowCount; j++) {
                // @ts-ignore: Unreachable code error
                ship.push({
                        ...board[i][j],
                        x: i,
                        y: j,
                        relatedCells: {x: i - 1, y: j - 1, colCount: 3, rowCount: 3}
                    },
                );
            }
        }

        if (ship.every(({attackStatus}) => attackStatus === AttackStatus.Shot)) {
            const {players: gamePlayers} = db.games.get(gameId);
            for (const id in gamePlayers) {
                const gamePlayer = gamePlayers[id];

                if (gamePlayer) {

                    ship.forEach(({x, y}) => {
                        gamePlayer.client.send(JSON.stringify({
                            type: CommandsType.Attack,
                            data: JSON.stringify({
                                    position:
                                        {
                                            x,
                                            y,
                                        },
                                    currentPlayer: indexPlayer,
                                    status: AttackStatus.Killed,
                                }
                            ),
                            id: 0
                        }));
                    });

                    ship.forEach(({relatedCells: {x, y, rowCount, colCount}}) => {
                        const colEnd = x + colCount > 10 ? 10 : x + colCount;
                        const rowEnd = y + rowCount > 10 ? 10 : y + rowCount;
                        for (let i = x; i < colEnd; i++) {
                            if (i >= 0) {
                                for (let j = y; j < rowEnd; j++) {
                                    if (j >= 0 && board[i][j] === '-') {
                                        gamePlayer.client.send(JSON.stringify({
                                            type: CommandsType.Attack,
                                            data: JSON.stringify({
                                                    position:
                                                        {
                                                            x: i,
                                                            y: j,
                                                        },
                                                    currentPlayer: indexPlayer,
                                                    status: AttackStatus.Miss,
                                                }
                                            ),
                                            id: 0
                                        }));
                                    }
                                }
                            }

                        }
                    });
                }
            }
            gamePlayers[indexPlayer].board.shipCount--;
            return AttackStatus.Killed;
        }

        return AttackStatus.Shot;
    }


};

