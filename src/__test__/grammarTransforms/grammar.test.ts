import { IAlphabet } from "@/lib/Alphabet";
import Immutable from "immutable";
import {
    addNonTerminalSymbol,
    addTerminalSymbol,
    fromDBEntry as createGrammarFromDBEntry,
    removeTerminalSymbol,
    removeNonTerminalSymbol,
    getBodiesOfHead,
    IIGrammar,
} from "../../lib/grammar/Grammar";
import { GrammarType } from "../../database/schema/grammar";

function buildGrammar1(): IIGrammar {
    // S  -> Sa|b
    return createGrammarFromDBEntry({
        id: "test",
        name: "test",
        alphabetT: ["b", "a", "ε"],
        alphabetNT: ["S"],
        startSymbol: "S",
        transitions: [
            { from: ["S"], to: [["S", "a"], ["b"], ["B"]] },
            { from: ["B"], to: [["a"], ["b"]] },
        ],
        type: GrammarType.REGULAR,
    });
}

test("test add symbols to new IIGrammar", () => {
    // IIGrammar
    const immutableGrammar = createGrammarFromDBEntry({
        id: "test",
        name: "test",
        alphabetT: [],
        alphabetNT: [],
        startSymbol: "S",
        transitions: [],
        type: GrammarType.REGULAR,
    });

    let modifiedGrammar = addNonTerminalSymbol(immutableGrammar, "j");

    expect(
        (immutableGrammar.get("nonTerminalSymbols") as IAlphabet).includes("j")
    ).toBeFalsy();

    expect(
        (modifiedGrammar.get("nonTerminalSymbols") as IAlphabet).includes("j")
    ).toBeTruthy();

    modifiedGrammar = addTerminalSymbol(immutableGrammar, "s");

    expect(
        (immutableGrammar.get("nonTerminalSymbols") as IAlphabet).includes("j")
    ).toBeFalsy();

    expect(
        (modifiedGrammar.get("terminalSymbols") as IAlphabet).includes("s")
    ).toBeTruthy();
});

test("test remove symbols to new IIGrammar", () => {
    // IIGrammar
    const immutableGrammar = createGrammarFromDBEntry({
        id: "test",
        name: "test",
        alphabetT: ["c"],
        alphabetNT: ["C"],
        startSymbol: "S",
        transitions: [],
        type: GrammarType.REGULAR,
    });

    let modifiedGrammar = removeTerminalSymbol(immutableGrammar, "c");

    expect(
        (modifiedGrammar.get("terminalSymbols") as IAlphabet).includes("c")
    ).toBeFalsy();

    expect(
        (modifiedGrammar.get("nonTerminalSymbols") as IAlphabet).includes("C")
    ).toBeTruthy();

    modifiedGrammar = removeNonTerminalSymbol(modifiedGrammar, "C");

    expect(
        (modifiedGrammar.get("nonTerminalSymbols") as IAlphabet).includes("C")
    ).toBeFalsy();
});

test("test get bodies of head", () => {
    const grammar = buildGrammar1();
    expect(
        getBodiesOfHead(grammar, ["B"]).equals(
            Immutable.Set([Immutable.List(["a"]), Immutable.List(["b"])])
        )
    ).toBeTruthy();
    expect(
        getBodiesOfHead(grammar, ["S"]).equals(
            Immutable.Set([
                Immutable.List(["S", "a"]),
                Immutable.List(["b"]),
                Immutable.List(["B"]),
            ])
        )
    ).toBeTruthy();
});
