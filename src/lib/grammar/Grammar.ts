import { GrammarType, GrammarDBEntry } from "@database/schema/grammar";
import Alphabet from "../Alphabet";
import AlphabetSymbol from "../AlphabetSymbol";
import { Tuple } from "../utils";

interface IGrammar {
    id: string;
    nonTerminalSymbols: Alphabet;
    terminalSymbols: Alphabet;
    productionRules: Array<
        Tuple<Array<AlphabetSymbol>, Set<Array<AlphabetSymbol>>>
    >;
    startSymbol: AlphabetSymbol;
    type: GrammarType;

    toString: () => string;
}

class Grammar implements IGrammar {
    id: string;

    type: GrammarType;

    nonTerminalSymbols: Alphabet;

    terminalSymbols: Alphabet;

    productionRules: Array<
        Tuple<Array<AlphabetSymbol>, Set<Array<AlphabetSymbol>>>
    >;

    startSymbol: AlphabetSymbol;

    toString(): string {
        const x: GrammarDBEntry = {
            id: this.id,
            type: this.type,
            alphabetNT: Array.from(this.nonTerminalSymbols.symbols.values()),
            alphabetT: Array.from(this.terminalSymbols.symbols.values()),
            transitions: this.productionRules.map(([leftSymbols, [right]) => {
                return {
                    from: leftSymbols,
                    to: right,
                };
            }),
        };
        return JSON.stringify(x);
    }
}
