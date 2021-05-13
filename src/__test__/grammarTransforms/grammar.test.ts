import { IAlphabet } from "@/lib/Alphabet";
import Immutable from "immutable";
import { inspect } from "util";
import {
    addNonTerminalSymbol,
    addTerminalSymbol,
    fromDBEntry as createGrammarFromDBEntry,
    removeTerminalSymbol,
    removeNonTerminalSymbol,
    getBodiesOfHead,
    IIGrammar,
    getFollows,
    getAnalysisTable,
    runTableLL1,
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

function buildGrammar2(): IIGrammar {
    // S  -> Sa|b
    return createGrammarFromDBEntry({
        id: "test",
        name: "test",
        alphabetT: ["c", "com", "ε", ";", "v", "f", "b", "e"],
        alphabetNT: ["P", "V", "C", "K", "F"],
        startSymbol: "P",
        transitions: [
            { from: ["P"], to: [["K", "V", "C"]] },
            { from: ["K"], to: [["c", "K"], ["ε"]] },
            { from: ["V"], to: [["v", "V"], ["F"]] },
            { from: ["F"], to: [["f", "P", ";", "F"], ["ε"]] },
            {
                from: ["C"],
                to: [["b", "V", "C", "e"], ["com", ";", "C"], ["ε"]],
            },
        ],
        type: GrammarType.CONTEXT_FREE,
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

test("test get follows of grammar", () => {
    const grammar = buildGrammar2();
    const firsts = Immutable.Map({
        com: Immutable.Set(["com"]),
        b: Immutable.Set(["b"]),
        C: Immutable.Set(["b", "com", "ε"]),
        c: Immutable.Set(["c"]),
        F: Immutable.Set(["f", "ε"]),
        f: Immutable.Set(["f"]),
        K: Immutable.Set(["c", "ε"]),
        P: Immutable.Set(["c", "v", "f", "b", "com", "ε"]),
        ε: Immutable.Set(["ε"]),
        V: Immutable.Set(["v", "f", "ε"]),
        v: Immutable.Set(["v"]),
        ";": Immutable.Set([";"]),
        e: Immutable.Set(["e"]),
    });
    // console.log(inspect(getFollows(grammar, firsts).toJS(), false, null, true));
});

test("run table", () => {
    const grammar = buildGrammar2();
    const table = getAnalysisTable(grammar);
    console.log(runTableLL1("ccvfbe;", grammar, table));
});
