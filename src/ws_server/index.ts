import {WebSocket, WebSocketServer} from 'ws';
import {randomUUID} from 'crypto';
import players from '../db/players';
import rooms from '../db/rooms';

const clients = {};
const games = {};

export const webSocketServer = (port: number) => {
    const wss = new WebSocketServer({port});
    console.log(`wss server starts ${port}`);

    wss.on('connection', (ws: WebSocket & { id: string }) => {
        const id = randomUUID();
        ws.id = id;
        clients[id] = ws;
        console.log(`new client ${ws.id}`);

        ws.on('message', (message: string) => {
            const request = JSON.parse(message);
            try {
                handleRequest(request.type)(ws, request);
            } catch (e) {
                console.log(e);
            }
        });

        ws.on('close', () => {
            delete clients[id];
            console.log(`client ${id} closed`);
        });
    });
};

export const handleRequest = (type) => {
    return {
        ['reg']: (ws, request) => handleRegRequest(ws, request),
        ['create_room']: (ws, request) => handleCreateRoomRequest(ws, request),
        ['add_user_to_room']: (ws, request) => addUserToRoomRequest(ws, request),
        ['add_ships']: (ws, request) => addShipsRequest(ws, request)
    }[type];
};

export const handleRegRequest = (ws, request) => {
    console.log(request);
    const data = JSON.parse(request.data);
    const isPlayerExist = players.isPlayerExist(data);
    if (!isPlayerExist) {
        players.add(data, ws);
    }

    const player = players.get(data.name);

    let res;

    if (player?.password !== data.password) {
        res = {
            name: data.name,
            index: player?.id,
            error: true,
            errorText: 'Wrong password'
        };
    }

    if (player?.password === data.password) {
        res = {
            name: data.name,
            index: player?.id,
            error: false,
            errorText: '',
        };
    }

    const responseData = {
        type: 'reg',
        data: JSON.stringify(res),
        id: 0
    };

    ws.send(JSON.stringify(responseData));
    console.log(players);
    updateRoom(ws);
    updateWinners(ws);
    console.log(rooms);
};

export const handleCreateRoomRequest = (ws, request) => {
    console.log(request);
    // const data = JSON.parse(request.data);
    // console.log(data);
    rooms.add([players.getByClientId(ws.id)]);


    // const isPlayerExist = rooms.isPlayerExist(data);
    // rooms.add(data);
    // const responseData = {
    //     type: "add_user_to_room",
    //     data:
    //         {
    //             indexRoom: 0,
    //         },
    //     id: 0,
    // };
    //
    // ws.send(JSON.stringify(responseData));

    // console.log(JSON.parse(request.data));
    updateRoom(ws);
    updateWinners(ws);
    console.log(rooms);
};

const updateRoom = (ws) => {
    const availableRooms = rooms.getAll().filter(room => room.players.length === 1);
    console.log('availableRooms', availableRooms);
    if (availableRooms.length) {
        ws.send(JSON.stringify({
            type: 'update_room',
            data: JSON.stringify(availableRooms.map(room => {
                console.log('available_players', room.players);
                const roomUsers = room.players.map(player => ({
                    name: player.name,
                    index: player.id
                }));

                return {
                    roomId: room.id,
                    roomUsers,
                };
            })),
            id: 0
        }));
    } else {
        ws.send(JSON.stringify({
            type: 'update_room',
            data: JSON.stringify({
                roomId: -1,
                roomUser: [],
            }),
            id: 0
        }));
    }

};

const updateWinners = (ws) => {
    const winners = [];
    ws.send(JSON.stringify({
        type: 'update_winners',
        data: JSON.stringify(winners),
        id: 0
    }));
};

const addUserToRoomRequest = (ws, request) => {
    console.log('addUserToRoomRequest', request);
    const data = JSON.parse(request.data);
    console.log('data', request.data);
    const player = players.getByClientId(ws.id);
    rooms.addPlayer(player, data.indexRoom);
    console.log('rooms', rooms);

    updateRoom(ws);

    if (player) {

        const game = {id: 0};
        games[game.id] = game;

        for (const id in clients) {
            clients[id].send(JSON.stringify({
                type: 'create_game',
                data: JSON.stringify({
                    idGame: game,
                    idPlayer: player.id
                }),
                id: 0
            }));
        }
    }


};

const addShipsRequest = (_, request) => {
    console.log('addShipsRequest', request);
    // const data = JSON.parse(request.data);
    // console.log('data', request.data);
    // const player = players.getByClientId(ws.id);
    // rooms.addPlayer(player, data.indexRoom);
    // console.log('rooms', rooms);
    //
    // updateRoom(ws);
    //
    // if (player) {
    //
    //     const game = {id: 0};
    //     games[game.id] = game;
    //
    //     for (const id in clients) {
    //         clients[id].send(JSON.stringify({
    //             type: 'create_game',
    //             data: JSON.stringify({
    //                 idGame: game,
    //                 idPlayer: player.id
    //             }),
    //             id: 0
    //         }));
    //     }
    // }


};


