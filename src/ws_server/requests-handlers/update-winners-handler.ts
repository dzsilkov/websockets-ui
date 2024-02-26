import {WebSocketServer} from 'ws';
import {CommandsType} from '../../models/models';
import db from '../../db/db';
import {sendToAllClients} from '../../helpers/helpers';

export const updateWinnersHandler = (wss: WebSocketServer, winner?) => {

    if (winner) {
        db.winners.add(winner);
    }
    sendToAllClients(
        CommandsType.UpdateWinners,
        JSON.stringify(db.winners.getSortedWinnersRespData()),
        wss
    );
};
