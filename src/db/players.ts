import {Player, PlayerDto} from '../models/models';

export class Players {
    private players: Map<string, Player> = new Map();
    private countId = 0;

    private static instance?: Players;

    constructor() {
        if (!Players.instance) {
            Players.instance = this;
        }
        return Players.instance;
    }

    add({name, password}: PlayerDto, ws): Player {
        console.log(name, password);
        const player = {name, password, id: this.countId++, clientId: ws.id, wins: 0};
        this.players.set(name, player);

        return player;
    }

    get(name: string): Player | null {
        return this.players.get(name) ?? null;
    }

    isPlayerExist({name, password}: PlayerDto): boolean {
        return this.players.has(name) && this.players.get(name)?.password === password;
    }

    getByClientId(id: string): Player | null {
        for (const player of this.players.values()) {
            if (player.clientId === id) {
                return player;
            }
        }
        return null;
    }
}

const instance = new Players();

export default instance;