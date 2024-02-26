import {Rooms} from './rooms';
import {Players} from './players';
import {Winners} from './winners';
import {Games} from './games';

export class Db {
    private pPlayers: Players = new Players();
    private pRooms: Rooms = new Rooms();
    private pWinners: Winners = new Winners()
    private pGames: Games = new Games()

    private static instance?: Db;

    constructor() {
        if (!Db.instance) {
            Db.instance = this;
        }
        return Db.instance;
    }

    get rooms() {
        return this.pRooms;
    }

    get players() {
        return this.pPlayers;
    }

    get winners() {
        return this.pWinners;
    }

    get games() {
        return this.pGames;
    }
}

const instance = new Db();

export default instance;