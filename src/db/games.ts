import {Game} from '../models/models';

export class Games {
    // private players: Map<number, number> = new Map();
    private games: Map<number, Game> = new Map();
    private countId = 0;

    private static instance?: Games;

    constructor() {
        if (!Games.instance) {
            Games.instance = this;
        }
        return Games.instance;
    }

    get(id: number): Game {
        const game = this.games.get(id);
        if (!game) {
            throw new Error('game doesn\'t exist');
        }
        return game;
    }

    createGame(roomId: number): Game {
        const game: Game = {id: this.countId++, players: {}, roomId};
        this.games.set(game.id, game);
        return game;
    }

    deleteGame(roomId: number) {
        this.games.delete(roomId);
    }
}

const instance = new Games();

export default instance;