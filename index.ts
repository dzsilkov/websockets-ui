import dotenv from 'dotenv';

import { httpServer } from './src/http_server';


import {WebSocketServer} from 'ws';
import {randomUUID} from 'crypto';

dotenv.config();

const HTTP_PORT = process.env.HTTP_PORT || 8181;

console.log(process.env);

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

const port = parseInt(process.env.WS_PORT || '8080');

const wss = new WebSocketServer({port});

const clients = {};

wss.on('connection', (ws) => {
    const id = randomUUID();
    clients[id] = ws;
    console.log(`new client ${id}`);

    ws.on('message', (mes) => {
        console.log(`mes ${mes}`);
    });

    ws.on('close', () => {
        delete clients[id];
        console.log(`client ${id} closed`);
    });
});
