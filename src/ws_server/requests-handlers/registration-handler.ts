import db from '../../db/db';
import {CommandsType} from '../../models/models';
import {updateRoomsHandler} from './update-rooms-handler';
import {updateWinnersHandler} from './update-winners-handler';
import {WebSocketServer} from 'ws';

export const registrationHandler = (ws, data, wss: WebSocketServer) => {
    const {name, password} = JSON.parse(data);
    const isPlayerExist = db.players.isPlayerExist(data);
    if (!isPlayerExist) {
        db.players.add({name, password}, ws);
    }

    const player = db.players.get(name);

    let res;

    if (player?.password !== password) {
        res = {
            name: data.name,
            index: player?.id,
            error: true,
            errorText: 'Wrong password'
        };
    }

    if (player?.password === password) {
        res = {
            name,
            index: player?.id,
            error: false,
            errorText: '',
        };
    }

    const responseData = {
        type: CommandsType.Reg,
        data: JSON.stringify(res),
        id: 0
    };

    ws.send(JSON.stringify(responseData));
    updateRoomsHandler(wss);
    updateWinnersHandler(wss);
};
