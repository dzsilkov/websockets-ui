import db from '../../db/db';
import {CommandsType} from '../../models/models';

export const createGameHandler = (indexRoom: number) => {
    const game = db.games.createGame(indexRoom);
    const room = db.rooms.get(indexRoom);
    if (!room) {
        return;
    }
    room.players.forEach((player) => {
        player.client.send(
            JSON.stringify({
                type: CommandsType.CreateGame,
                data: JSON.stringify({
                    idGame: game.id,
                    idPlayer: player.id
                }),
                id: 0
            })
        );
    });
};
