import {WebSocket} from 'ws';
import {Players} from '../db/players';

export type Player = {
    id: number;
    name: string;
    password: string;
    clientId: string;
    wins: number;
    client: WebSocket
}

export type PlayerDto = {
    name: string;
    password: string;
}

export type Room = {
    id: number;
    players: Player[];
    game: Game | {};
}

export type Game = {
    id: number;
    players: GamePlayers | {};
    roomId: number;
}

export type GamePlayers = {
    id: GamePlayer
}

export type GamePlayer = Players & {
    board: Board;
    turn: number;
}

export type Board = {
    board: string[][],
    shipCount: number
}

export type Client = WebSocket & { id: string }

export enum CommandsType {
    Reg = 'reg',
    UpdateWinners = 'update_winners',
    CreateRoom = 'create_room',
    AddUserToRoom = 'add_user_to_room',
    CreateGame = 'create_game',
    UpdateRoom = 'update_room',
    AddShips = 'add_ships',
    StartGame = 'start_game',
    Attack = 'attack',
    RandomAttack = 'randomAttack',
    Turn = 'turn',
    Finish = 'finish',
    SinglePlay = 'single_play',
}

export enum AttackStatus {
    Miss = 'miss',
    Killed = 'killed',
    Shot = 'shot',
}

export enum ShipType {
    Small = 'small',
    Medium = 'medium',
    Large = 'large',
    Huge = 'huge',
}

export enum ShipDirection {
    Horizontal,
    Vertical,
}

export type Position = {
    x: number,
    y: number,
}

export type Ship = {
    position: Position,
    direction: boolean,
    length: number,
    type: ShipType
}

export type BoardShip = {
    x: number,
    y: number,
    rowCount,
    colCount,
    type: ShipType,
    length: number,
    direction: ShipDirection,
    attackStatus: AttackStatus,
}

export type Coordinates = [number, number];

