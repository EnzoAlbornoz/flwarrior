import AlphabetSymbol from "./AlphabetSymbol";

export default class Alphabet {
    #symbols: Set<AlphabetSymbol>;

    constructor(symbols: Set<AlphabetSymbol>) {
        this.#symbols = symbols;
    }

    get symbols(): Set<AlphabetSymbol> {
        return this.#symbols;
    }

    set symbols(_symbols: Set<AlphabetSymbol>) {
        this.#symbols = _symbols;
    }

    toString(): string {
        const symbols: Array<AlphabetSymbol> = [];
        for (const symbol of this.#symbols.values()) {
            symbols.push(symbol);
        }
        return symbols.map((sbl) => sbl.symbol).toString();
    }
}

// console.log(
//     new Alphabet(
//         new Set([
//             new AlphabetSymbol("a"),
//             new AlphabetSymbol("b"),
//             new AlphabetSymbol("c"),
//             AlphabetSymbol.EPSILON,
//         ])
//     ).toString()
// );
