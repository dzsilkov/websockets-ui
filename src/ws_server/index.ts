import {WebSocketServer} from 'ws';
import {randomUUID} from 'crypto';
import players from '../db/players';
import rooms from '../db/rooms';
import {AttackStatus, Client, Clients, CommandsType} from '../models/models';
import {createBoard} from '../db/game-field';
import games from '../db/games';

const clients: Clients = {};
// const addClient = (clients: Clients, client: Client) => {
//     const id = randomUUID();
//     client.id = id;
//     clients[id] = client;
//     return clients;
// };

export const webSocketServer = (port: number) => {
    const wss = new WebSocketServer({port});
    console.log(`wss server starts ${port}`);

    wss.on('connection', (ws: Client) => {
        const id = randomUUID();
        ws.id = id;
        clients[id] = ws;

        // addClient(clients, ws);
        console.log(`new client ${ws.id}`);

        ws.on('message', (message: string) => {
            const request = JSON.parse(message);
            console.log('message', JSON.parse(message));
            try {
                handleRequest(request.type)(ws, request);
            } catch (e) {
                console.log(e);
            }
        });

        ws.on('close', () => {
            delete clients[ws.id];
            console.log(`client ${id} closed`);
        });
    });
};

export const handleRequest = (type) => {
    return {
        [CommandsType.Reg]: (ws, request) => handleRegRequest(ws, request),
        [CommandsType.CreateRoom]: (ws, request) => handleCreateRoom(ws, request),
        [CommandsType.AddUserToRoom]: (ws, request) => addUserToRoomRequest(ws, request),
        [CommandsType.AddShips]: (ws, request) => addShipsRequest(ws, request),
        [CommandsType.Attack]: (ws, request) => attackRequest(ws, request),
        [CommandsType.SinglePlay]: (ws, request) => handleSinglePlay(ws, request)
    }[type];
};

export const handleSinglePlay = (_, request) => {
    console.log('REQVEST', request);
};

export const handleRegRequest = (ws, request) => {
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
    updateRoom(ws);
    updateWinners(ws, data.name, 0);
    console.log(rooms);
};

export const handleCreateRoom = (ws: Client, _) => {
    const player = players.getByClientId(ws.id);
    if (!player) {
        return;
    }
    try {
        rooms.createRoom(player);
        updateRoom(ws);
        updateWinners(ws, player.name, player.wins);
    } catch (e) {
        console.log(e);
        return;
    }

};

const updateRoom = (ws) => {
    const availableRooms = rooms.getAvailableRooms();

    if (availableRooms.length) {
        ws.send(JSON.stringify({
            type: CommandsType.UpdateRoom,
            data: JSON.stringify(availableRooms.map(room => {
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

const updateWinners = (ws, name: string, wins: number) => {
    ws.send(JSON.stringify({
        type: CommandsType.UpdateWinners,
        data: JSON.stringify([
            name,
            wins
        ]),
        id: 0
    }));
};

const addUserToRoomRequest = (ws, request) => {
    const {indexRoom} = JSON.parse(request.data);
    const player = players.getByClientId(ws.id);

    if (!player) {
        return;
    }

    try {
        rooms.addPlayer(player, indexRoom);
        updateRoom(ws);
        createGame(indexRoom);
    } catch (e) {
        console.log(e);
        return;
    }
};

const createGame = (indexRoom: number) => {
    const game = games.createGame(indexRoom);
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
    const data = JSON.parse(request.data);
    const game = games.get(data.gameId);
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

            // for (const id in clients) {
            //     const player = players.getByClientId(id);
            //
            //     if (player) {
            //         clients[id].send(JSON.stringify({
            //             type: CommandsType.Turn,
            //             data: JSON.stringify({
            //                     currentPlayerIndex: 1,
            //                 }
            //             ),
            //             id: 0
            //         }));
            //     }
            // }

        }
    }


};

export const attackRequest = (ws, request) => {
    const {x, y, gameId, indexPlayer} = JSON.parse(request.data);
    const {players: gameP} = games.get(gameId);
    const [enemyId] = Object.keys(gameP).filter(key => key !== indexPlayer.toString());
    if (!enemyId) {
        return;
    }
    const {board: {board}} = gameP[enemyId];

    if (board[x][y] === 'o' || board[x][y].attackStatus === AttackStatus.Shot) {
        return;
    }

    const statusAttack = attackStatusGet(request);

    if (!statusAttack) {
        return;
    }

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
                        status: statusAttack,
                    }
                ),
                id: 0
            }));
        }
    }


    const {players: gamePlayers} = games.get(gameId);
    const gamePlayer = gamePlayers[indexPlayer];

    if (checkWinner(gamePlayer.board)) {
        for (const id in clients) {
            let player = players.getByClientId(id);

            if (player) {

                player = {...player, wins: player.wins++}

                clients[id].send(JSON.stringify({
                    type: CommandsType.Finish,
                    data: JSON.stringify({
                            winPlayer: indexPlayer
                        }
                    ),
                    id: 0
                }));

            }
        }

        console.log('WINNER', gamePlayer);
        const player = players.getByClientId(indexPlayer);

        if (player) {
            updateWinners(ws, player.name, player.wins++);
            rooms.deleteRoom(games.get(gameId).roomId);
            games.deleteGame(gameId);
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

const attackStatusGet = (request): AttackStatus | undefined => {
    const {x, y, gameId, indexPlayer} = JSON.parse(request.data);
    const {players: gamePlayers} = games.get(gameId);
    const [enemyId] = Object.keys(gamePlayers).filter(key => key !== indexPlayer.toString());
    if (!enemyId) {
        return;
    }
    const {board: {board}} = gamePlayers[enemyId];

    if (board[x][y] === '-') {
        board[x][y] = 'o';
        return AttackStatus.Miss;
    } else {
        board[x][y] = {
            ...board[x][y],
            attackStatus: AttackStatus.Shot
        };
        const ship = [];
        console.log('cell', board[x][y]);
        let cell = board[x][y];
        for (let i = cell.x; i < cell.x + cell.colCount; i++) {
            for (let j = cell.y; j < cell.y + cell.rowCount; j++) {
                // @ts-ignore: Unreachable code error
                ship.push({
                        ...board[i][j],
                        x: i,
                        y: j,
                        relatedCells: {x: i - 1, y: j - 1, colCount: 3, rowCount: 3}
                    },
                );
            }
        }

        console.log('ship', ship);

        if (ship.every(({attackStatus}) => attackStatus === AttackStatus.Shot)) {
            for (const id in clients) {
                const player = players.getByClientId(id);

                if (player) {

                    ship.forEach(({x, y}) => {
                        clients[id].send(JSON.stringify({
                            type: CommandsType.Attack,
                            data: JSON.stringify({
                                    position:
                                        {
                                            x,
                                            y,
                                        },
                                    currentPlayer: indexPlayer,
                                    status: AttackStatus.Killed,
                                }
                            ),
                            id: 0
                        }));
                    });

                    ship.forEach(({relatedCells: {x, y, rowCount, colCount}}) => {
                        const colEnd = x + colCount > 10 ? 10 : x + colCount;
                        const rowEnd = y + rowCount > 10 ? 10 : y + rowCount;
                        for (let i = x; i < colEnd; i++) {
                            if (i >= 0) {
                                for (let j = y; j < rowEnd; j++) {
                                    if (j >= 0 && board[i][j] === '-') {
                                        clients[id].send(JSON.stringify({
                                            type: CommandsType.Attack,
                                            data: JSON.stringify({
                                                    position:
                                                        {
                                                            x: i,
                                                            y: j,
                                                        },
                                                    currentPlayer: indexPlayer,
                                                    status: AttackStatus.Miss,
                                                }
                                            ),
                                            id: 0
                                        }));
                                    }
                                }
                            }

                        }
                    });
                }
            }
            gamePlayers[indexPlayer].board.shipCount--;
            return AttackStatus.Killed;
        }

        return AttackStatus.Shot;
    }


};

const checkWinner = (board) => board.shipCount === 0;


