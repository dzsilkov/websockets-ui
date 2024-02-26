import {WebSocketServer} from 'ws';
import db from '../../db/db';
import {updateRoomsHandler} from './update-rooms-handler';
import {updateWinnersHandler} from './update-winners-handler';
import {Client} from '../../models/models';

export const createRoomHandler = (ws: Client, _, wss: WebSocketServer) => {
    const player = db.players.getByClientId(ws.id);
    if (!player) {
        return;
    }
    try {
        db.rooms.createRoom(player);
        updateRoomsHandler(wss);
        updateWinnersHandler(wss);
    } catch (e) {
        console.log(e);
        return;
    }

};
