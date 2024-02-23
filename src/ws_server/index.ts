import {WebSocket, WebSocketServer} from 'ws';
import {randomUUID} from 'crypto';
import players from '../db/players';
import rooms from '../db/rooms';
import {AttackStatus, CommandsType} from '../models/models';
import {createBoard} from '../db/game-field';

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
        [CommandsType.Reg]: (ws, request) => handleRegRequest(ws, request),
        [CommandsType.CreateRoom]: (ws, request) => handleCreateRoomRequest(ws, request),
        [CommandsType.AddUserToRoom]: (ws, request) => addUserToRoomRequest(ws, request),
        [CommandsType.AddShips]: (ws, request) => addShipsRequest(ws, request),
        [CommandsType.Attack]: (ws, request) => attackRequest(ws, request)
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
        type: CommandsType.Reg,
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
    rooms.add([players.getByClientId(ws.id)]);
    updateRoom(ws);
    updateWinners(ws);
};

const updateRoom = (ws) => {
    const availableRooms = rooms.getAll().filter(room => room.players.length === 1);
    console.log('availableRooms', availableRooms);
    if (availableRooms.length) {
        ws.send(JSON.stringify({
            type: CommandsType.UpdateRoom,
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
            type: CommandsType.UpdateRoom,
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
        type: CommandsType.UpdateWinners,
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


    let gameId = 0;
    const game = {id: gameId, players: {}};
    games[game.id] = game;
    gameId++;

    for (const id in clients) {
        const player = players.getByClientId(id);
        if (player) {
            clients[id].send(JSON.stringify({
                type: CommandsType.CreateGame,
                data: JSON.stringify({
                    idGame: game.id,
                    idPlayer: player.id
                }),
                id: 0
            }));
        }

    }
};

const addShipsRequest = (_, request) => {
    console.log('addShipsRequest', request);
    const data = JSON.parse(request.data);
    console.log('data', data);

    const game = games[data.gameId];
    const gamePlayers = game.players;

    if (Object.keys(gamePlayers).length <= 2) {
        gamePlayers[data.indexPlayer] = {...data, board: createBoard(data.ships)};

        if (Object.keys(gamePlayers).length === 2) {
            for (const id in clients) {
                const player = players.getByClientId(id);

                if (player) {
                    const {ships} = gamePlayers[player.id];
                    clients[id].send(JSON.stringify({
                        type: CommandsType.StartGame,
                        data: JSON.stringify({
                                ships,
                                currentPlayerIndex: player.id,
                            }
                        ),
                        id: 0
                    }));
                }
            }

            for (const id in clients) {
                const player = players.getByClientId(id);

                if (player) {
                    clients[id].send(JSON.stringify({
                        type: CommandsType.Turn,
                        data: JSON.stringify({
                                currentPlayerIndex: 1,
                            }
                        ),
                        id: 0
                    }));
                }
            }

        }
    }


};

export const attackRequest = (_, request) => {
    const data = JSON.parse(request.data);
    const {x, y, indexPlayer} = data;
    for (const id in clients) {
        const player = players.getByClientId(id);

        if (player) {

            clients[id].send(JSON.stringify({
                type: CommandsType.Attack,
                data: JSON.stringify({
                        position:
                            {
                                x,
                                y,
                            },
                        currentPlayer: indexPlayer,
                        status: attackStatusGet(request),
                    }
                ),
                id: 0
            }));
        }
    }

    for (const id in clients) {
        const player = players.getByClientId(id);

        if (player) {
            clients[id].send(JSON.stringify({
                type: CommandsType.Turn,
                data: JSON.stringify({
                        currentPlayerIndex: 1,
                    }
                ),
                id: 0
            }));
        }
    }
};

const attackStatusGet = (request): AttackStatus => {
    const {x, y, gameId, indexPlayer} = JSON.parse(request.data);
    const {players: gamePlayers} = games[gameId];
    const enemyKey = Object.keys(gamePlayers).filter(key => key !== indexPlayer.toString());
    const {board} = gamePlayers[enemyKey];
    let cell = board[x][y];
    console.log(board);
    if (cell === '-') {
        return AttackStatus.Miss;
    } else {
        cell = {
            ...cell,
            attackStatus: AttackStatus.Shot
        }
        const ship = [];
        console.log('cell',cell)
        for (let i = cell.row; i < cell.rowCount; i++) {
            for (let j = cell.col; j < cell.colCount; j++) {
                // @ts-ignore: Unreachable code error
               ship.push(board[i][j]);
            }
        }

        console.log('ship',ship)

        return AttackStatus.Shot;
    }



};


