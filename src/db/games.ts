import {Game} from '../models/models';

export class Games {
    private games: Map<number, Game> = new Map();
    private countId = 0;

    get(id: number): Game {
        const game = this.games.get(id);
        if (!game) {
            throw new Error('game doesn\'t exist');
        }
        return game;
    }

    get lastIndexId(): number {
        return this.countId;
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
