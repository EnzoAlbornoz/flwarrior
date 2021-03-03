import { OrderedSet } from "immutable";
import AlphabetSymbol from "./AlphabetSymbol";
import type { ASymbol } from "./AlphabetSymbol";

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

// Immutability Port
export type IAlphabet = OrderedSet<ASymbol>;
export const createAlphabet = (...symbols: ASymbol[]): OrderedSet<string> =>
    OrderedSet(symbols);
