export class Winners {
    private winners: Map<string, number> = new Map();

    add({name, wins}) {
        this.winners.set(name, wins);
    }

    getAll() {
        return Array.from(this.winners.entries());
    }


    getSortedWinnersRespData() {
        return this.getAll()
            .map(([name, wins]) => ({name, wins}))
            .sort(({wins: a}, {wins: b}) => b - a);
    }
}
