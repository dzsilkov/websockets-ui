import dotenv from 'dotenv';

import {httpServer} from './src/http_server';

import {webSocketServer} from './src/ws_server';

dotenv.config();

const HTTP_PORT = process.env.HTTP_PORT || 8181;
console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

webSocketServer(parseInt(process.env.WS_PORT || '3000'));
