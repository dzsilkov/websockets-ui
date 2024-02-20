export type Player = {
    id: number;
    name: string;
    password: string;
    clientId: string;
}

export type PlayerDto = {
    name: string;
    password: string;
}

export type Room = {
    id: number;
    players: Player[];
}