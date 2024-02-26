import {WebSocketServer} from 'ws';
import {randomUUID} from 'crypto';
import {Client} from '../models/models';
import {handlerRequests} from './requests-handlers';

export const webSocketServer = (port: number) => {
    const wss = new WebSocketServer({port});
    console.log(`wss server starts ${port}`);

    wss.on('connection', (ws: Client) => {
        const id = randomUUID();
        ws.id = id;

        ws.on('message', (message: string) => {
            const {type, data} = JSON.parse(message);
            try {
                handlerRequests(type)(ws, data, wss);
            } catch (e) {
                console.log(e);
            }
        });

        ws.on('close', () => {
            console.log(`client ${id} closed`);
        });
    });
};



