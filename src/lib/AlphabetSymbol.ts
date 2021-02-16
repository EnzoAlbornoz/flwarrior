import { createHash } from "crypto";

export default class AlphabetSymbol {
    static readonly EPSILON = new AlphabetSymbol("ε");

    static readonly EMPTY = new AlphabetSymbol("∅");

    #symbol: string;

    constructor(symbol: string) {
        this.#symbol = symbol;
    }

    get symbol(): string {
        return this.#symbol;
    }

    hash(): string {
        return createHash("sha256")
            .update(this.#symbol, "utf8")
            .digest("hex")
            .toString();
    }

    equals(that: AlphabetSymbol): boolean {
        return this.#symbol === that.symbol;
    }

    toString(): string {
        return this.#symbol;
    }
}
