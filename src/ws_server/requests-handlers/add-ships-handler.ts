import {createBoard} from '../../db/game-field';
import db from '../../db/db';

import {CommandsType} from '../../models/models';


export const addShipsHandler = (ws, requestData: string, _1) => {
    const data = JSON.parse(requestData);
    const {players: gamePlayers} = db.games.get(data.gameId);

    if (Object.keys(gamePlayers).length <= 2) {
        gamePlayers[data.indexPlayer] = {
            ...db.players.getByClientId(ws.id), ...data,
            board: createBoard(data.ships),
            turn: 0
        };

        if (Object.keys(gamePlayers).length === 2) {
            const playersTurn = data.indexPlayer;
            for (const id in gamePlayers) {
                let gamePlayer = gamePlayers[id];
                gamePlayer.client.send(JSON.stringify({
                    type: CommandsType.StartGame,
                    data: JSON.stringify({
                            ships: gamePlayer.ships,
                            currentPlayerIndex: gamePlayer.indexPlayer,
                        }
                    ),
                    id: 0
                }));
                db.games.get(data.gameId).players[gamePlayer.indexPlayer].turn = playersTurn;
            }

            turn(data.gameId);
        }
    }


};

export const turn = (gameId: number) => {
    const {players: gamePlayers} = db.games.get(gameId);

    for (const id in gamePlayers) {
        const gamePlayer = gamePlayers[id];
        gamePlayer.client.send(JSON.stringify({
            type: CommandsType.Turn,
            data: JSON.stringify({
                    currentPlayer: gamePlayer.turn,
                }
            ),
            id: 0
        }));
    }
};

