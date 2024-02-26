import {Player, Room} from '../models/models';

export class Rooms {
    private rooms: Map<number, Room> = new Map();
    private countId = 0;

    createRoom(player: Player): Room {
        if (this.playerCreatesRoom(player)) {
            throw new Error('Player already has created room');
        }

        const room: Room = <Room>{id: this.countId++, players: [player]};
        this.rooms.set(room.id, room);

        return room;
    }

    addPlayer(player: Player, roomId: number): void {
        if (this.playerInTheRoom(player, roomId)) {
            throw new Error('Player already added in the room');
        }
        let room = this.get(roomId);

        if (room) {
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

    getAvailableRooms(): Room[] {
        return this.getAll().filter(room => room.players.length === 1);
    }

    playerCreatesRoom(player: Player): boolean {
        let playerInRoom = false;
        this.getAvailableRooms().forEach(({players}) => {
            if (players.find(({id}) => id === player.id)) {
                playerInRoom = true;
            }
        });
        return playerInRoom;
    }

    playerInTheRoom(player: Player, roomId: number): boolean {
        const room = this.get(roomId);
        if (room) {
            return !!(room.players.find(({id}) => id === player.id));
        }

        return false;
    }

    deleteRoom(roomId: number) {
        this.rooms.delete(roomId);
    }
}
