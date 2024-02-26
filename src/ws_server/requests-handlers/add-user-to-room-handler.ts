import db from '../../db/db';
import {updateRoomsHandler} from './update-rooms-handler';
import {createGameHandler} from './create-game-handler';
import {WebSocketServer} from 'ws';
import {Client} from '../../models/models';

export const addUserToRoomHandler = (ws: Client, data: string, wss: WebSocketServer) => {
    const {indexRoom} = JSON.parse(data);
    const player = db.players.getByClientId(ws.id);

    if (!player) {
        return;
    }

    try {
        db.rooms.addPlayer(player, indexRoom);
        updateRoomsHandler(wss);
        createGameHandler(indexRoom);
    } catch (e) {
        console.log(e);
        return;
    }
};