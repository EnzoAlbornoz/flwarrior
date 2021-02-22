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

    async hash(): Promise<string> {
        return new TextDecoder().decode(
            await crypto.subtle.digest(
                "SHA-256",
                new TextEncoder().encode(this.#symbol)
            )
        );
    }

    equals(that: AlphabetSymbol): boolean {
        return this.#symbol === that.symbol;
    }

    toString(): string {
        return this.#symbol;
    }
}
