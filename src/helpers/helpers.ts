import {WebSocketServer} from 'ws';
import {AttackStatus, Coordinates} from '../models/models';

export const sendToAllClients = (type: string, data: string, wss: WebSocketServer) => {
    const req = {
        type,
        id: 0,
        data,
    };

    wss.clients.forEach((client) => {
        client.send(JSON.stringify(req));
    });
};

export const checkWinner = (board) => board.shipCount === 0;

export const checkAvailableCell = (board, [x, y]: Coordinates): boolean => board[x][y] === 'o'
    || board[x][y].attackStatus === AttackStatus.Shot
    || board[x][y].attackStatus === AttackStatus.Killed;
