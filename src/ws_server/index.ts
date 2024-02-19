import {WebSocketServer} from 'ws';
import {randomUUID} from 'crypto';

const port = parseInt(process.env.WS_PORT || '8080');

const wss = new WebSocketServer({port});

const clients = {};

wss.on('connection', (ws) => {
    const id = randomUUID();
    clients[id] = ws;
    console.log(`new client ${id}`);

    ws.on('message', () => {

    });

    ws.on('close', () => {
        delete clients[id];
        console.log(`client ${id} closed`);
    });
});



