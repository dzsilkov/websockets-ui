import db from '../../db/db';
import {CommandsType} from '../../models/models';
import {WebSocketServer} from 'ws';
import {sendToAllClients} from '../../helpers/helpers';

export const updateRoomsHandler = (wss: WebSocketServer) => {
    const rooms = db.rooms.getAll();

    sendToAllClients(
        CommandsType.UpdateRoom,
        JSON.stringify(rooms.length
            ? rooms.map(({id, players}) => ({
                roomId: id,
                roomUsers: players.map(({name}, index) => ({name, index})),
            }))
            : ''
        ),
        wss
    );
};
