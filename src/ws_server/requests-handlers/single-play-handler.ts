import db from '../../db/db';
import {Client, CommandsType} from '../../models/models';

export const singlePlayHandler = (ws: Client, _, _1) => {
    const game = db.games.createGame(db.games.lastIndexId + 1);

    const user = db.players.getByClientId(ws.id);

    if (!user) {
        return;
    }

    ws.send(
        JSON.stringify({
            type: CommandsType.CreateGame,
            id: 0,
            data: JSON.stringify({
                idGame: game.id,
                idPlayer: user.id,
            }),
        }),
    );
};
