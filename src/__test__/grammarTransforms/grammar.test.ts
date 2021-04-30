import { IAlphabet } from "@/lib/Alphabet";
import {
    addNonTerminalSymbol,
    addTerminalSymbol,
    fromDBEntry as createGrammarFromDBEntry,
    removeTerminalSymbol,
    removeNonTerminalSymbol,
} from "../../lib/grammar/Grammar";
import { GrammarType } from "../../database/schema/grammar";

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
