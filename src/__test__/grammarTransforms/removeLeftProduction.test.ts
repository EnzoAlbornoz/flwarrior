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
    removeLeftProduction,
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

function buildSimpleGrammar2(): IIGrammar {
    // S  -> Sa|b
    return createGrammarFromDBEntry({
        id: "test",
        name: "test",
        alphabetT: ["b", "a", "d"],
        alphabetNT: ["S", "A"],
        startSymbol: "S",
        transitions: [
            { from: ["S"], to: [["A", "a"], ["b"]] },
            {
                from: ["A"],
                to: [["A", "c"], ["A", "a", "d"], ["b", "d"], ["a"]],
            },
        ],
        type: GrammarType.REGULAR,
    });
}

function buildSimpleGrammar3(): IIGrammar {
    // Indirect left recursion
    // S  -> Sa | b
    // A -> Ac | Sd | a
    return createGrammarFromDBEntry({
        id: "test",
        name: "test",
        alphabetT: ["b", "a", "d"],
        alphabetNT: ["S", "A"],
        startSymbol: "S",
        transitions: [
            { from: ["S"], to: [["A", "a"], ["b"]] },
            {
                from: ["A"],
                to: [["A", "c"], ["S", "d"], ["a"]],
            },
        ],
        type: GrammarType.REGULAR,
    });
}

test("test remove direct left production", () => {
    let grammar = buildSimpleGrammar1();
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

    expect(
        (grammar.get("nonTerminalSymbols") as IAlphabet).equals(
            Immutable.OrderedSet(["Δ", "S"])
        )
    );
    expect(
        (grammar.get("terminalSymbols") as IAlphabet).equals(
            Immutable.OrderedSet(["b", "a", "ε"])
        )
    );

    grammar = removeDirectLeftProduction(buildSimpleGrammar2());
    // expected:
    // S  -> Aa | b
    // S' -> cS' | adS' | ε
    // A -> aS' | bdS'
    expect(
        (removeDirectLeftProduction(grammar).get(
            "productionRules"
        ) as Immutable.Map<IGrammarWord, Immutable.Set<IGrammarWord>>).equals(
            Immutable.Map()
                .set(
                    Immutable.List(["S"]),
                    Immutable.Set([
                        Immutable.List(["A", "a"]),
                        Immutable.List(["b"]),
                    ])
                )
                .set(
                    Immutable.List(["Δ"]),
                    Immutable.Set([
                        Immutable.List(["c", "Δ"]),
                        Immutable.List(["a", "d", "Δ"]),
                        Immutable.List(["ε"]),
                    ])
                )
                .set(
                    Immutable.List(["A"]),
                    Immutable.Set([
                        Immutable.List(["a", "Δ"]),
                        Immutable.List(["b", "d", "Δ"]),
                    ])
                )
        )
    ).toBeTruthy();
});

test("remove indirect left recursive production", () => {
    const grammar = removeLeftProduction(buildSimpleGrammar3());
    expect(
        (removeDirectLeftProduction(grammar).get(
            "productionRules"
        ) as Immutable.Map<IGrammarWord, Immutable.Set<IGrammarWord>>).equals(
            Immutable.Map()
                .set(
                    Immutable.List(["S"]),
                    Immutable.Set([
                        Immutable.List(["A", "a"]),
                        Immutable.List(["b"]),
                    ])
                )
                .set(
                    Immutable.List(["Δ"]),
                    Immutable.Set([
                        Immutable.List(["c", "Δ"]),
                        Immutable.List(["a", "d", "Δ"]),
                        Immutable.List(["ε"]),
                    ])
                )
                .set(
                    Immutable.List(["A"]),
                    Immutable.Set([
                        Immutable.List(["a", "Δ"]),
                        Immutable.List(["b", "d", "Δ"]),
                    ])
                )
        )
    ).toBeTruthy();
});
