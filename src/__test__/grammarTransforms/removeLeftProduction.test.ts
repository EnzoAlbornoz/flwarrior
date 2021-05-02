import { inspect } from "util";
import { IAlphabet } from "@/lib/Alphabet";
import Immutable from "immutable";
import {
    addNonTerminalSymbol,
    addTerminalSymbol,
    fromDBEntry as createGrammarFromDBEntry,
    removeTerminalSymbol,
    removeNonTerminalSymbol,
    IIGrammar,
    removeDirectLeftProduction,
    IGrammarWord,
} from "../../lib/grammar/Grammar";
import { GrammarType } from "../../database/schema/grammar";

function buildSimpleGrammar1(): IIGrammar {
    // S  -> Sa|b
    return createGrammarFromDBEntry({
        id: "test",
        name: "test",
        alphabetT: ["b", "a", "ε"],
        alphabetNT: ["S"],
        startSymbol: "S",
        transitions: [{ from: ["S"], to: [["S", "a"], ["b"]] }],
        type: GrammarType.REGULAR,
    });
}

test("test remove left production", () => {
    const grammar = buildSimpleGrammar1();
    // expected:
    // S  -> bS'
    // S' -> aS'| ε
    expect(
        (removeDirectLeftProduction(grammar).get(
            "productionRules"
        ) as Immutable.Map<IGrammarWord, Immutable.Set<IGrammarWord>>).equals(
            Immutable.Map()
                .set(
                    Immutable.List(["S"]),
                    Immutable.Set([Immutable.List(["b", "Δ"])])
                )
                .set(
                    Immutable.List(["Δ"]),
                    Immutable.Set([
                        Immutable.List(["a", "Δ"]),
                        Immutable.List(["ε"]),
                    ])
                )
        )
    ).toBeTruthy();
});
