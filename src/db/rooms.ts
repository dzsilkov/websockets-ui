import {Player, Room} from '../models/models';

export class Rooms {
    // private players: Map<number, number> = new Map();
    private rooms: Map<number, Room> = new Map();
    private countId = 0;

    private static instance?: Rooms;

    constructor() {
        if (!Rooms.instance) {
            Rooms.instance = this;
        }
        return Rooms.instance;
    }

    add(players: (Player | null)[]): Room | undefined {
        if (!players || !players.length || players.some(player => player === null)) {
            return;
        }
        const room: Room = <Room>{id: this.countId++, players};
        this.rooms.set(room.id, room);
        return room;
    }

    addPlayer(player: Player | null, roomId: number) {
        let room = this.get(roomId);

        if (room && player) {
            room = {...room, players: [...room.players, player]};
            this.rooms.set(roomId, <Room>room);
        }
    }

    get(id: number): Room | null {
        return this.rooms.get(id) ?? null;
    }

    getAll(): Room[] {
        return Array.from(this.rooms.values());
    }
}

const instance = new Rooms();

export default instance;