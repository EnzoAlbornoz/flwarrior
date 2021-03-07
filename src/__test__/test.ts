import { IAlphabet } from "../lib/Alphabet";
import { EPSILON } from "../lib/AlphabetSymbol";
import {
    addNonTerminalSymbol,
    addTerminalSymbol,
    fromDBEntry as createGrammarFromDBEntry,
    removeTerminalSymbol,
    removeNonTerminalSymbol,
} from "../lib/grammar/Grammar";
import { GrammarType } from "../database/schema/grammar";
import {
    findOutIfHasEpsilonTransition,
    fromDBEntry as createMachineFromDBEntry,
    IIMachine,
    addTransition,
} from "../lib/automaton/Machine";
import { MachineType } from "../database/schema/machine";

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

function buildImmutableRegularNonDeterministicWithoutEpsilonMachine(): IIMachine {
    return createMachineFromDBEntry({
        id: "test",
        name: "test",
        deterministic: true,
        type: MachineType.FINITE_STATE_MACHINE,
        states: [
            { id: "q0", isEntry: true, isExit: true },
            { id: "q1", isEntry: false, isExit: false },
            { id: "q2", isEntry: false, isExit: true },
        ],
        entryAlphabet: ["0, 1, ε"],
        memoryAlphabet: [],
        transitions: [
            {
                from: "q0",
                with: { head: "0", memory: "" },
                to: { newState: "q0", writeSymbol: "", headDirection: "left" },
            },
            {
                from: "q0",
                with: { head: "1", memory: "" },
                to: { newState: "q1", writeSymbol: "", headDirection: "left" },
            },
            {
                from: "q1",
                with: { head: "1", memory: "" },
                to: { newState: "q1", writeSymbol: "", headDirection: "left" },
            },
            {
                from: "q1",
                with: { head: "0", memory: "" },
                to: { newState: "q1", writeSymbol: "", headDirection: "left" },
            },
            {
                from: "q1",
                with: { head: "0", memory: "" },
                to: { newState: "q2", writeSymbol: "", headDirection: "left" },
            },
            {
                from: "q2",
                with: { head: "1", memory: "" },
                to: { newState: "q2", writeSymbol: "", headDirection: "left" },
            },
            {
                from: "q2",
                with: { head: "1", memory: "" },
                to: { newState: "q1", writeSymbol: "", headDirection: "left" },
            },
            {
                from: "q2",
                with: { head: "0", memory: "" },
                to: { newState: "q2", writeSymbol: "", headDirection: "left" },
            },
        ],
    });
}

test("test find Out If Has Epsilon on IIMachine", () => {
    const immutableMachine = buildImmutableRegularNonDeterministicWithoutEpsilonMachine();
    expect(findOutIfHasEpsilonTransition(immutableMachine)).toBe(false);
    const modifiedMachine = addTransition(immutableMachine, {
        from: "q2",
        with: EPSILON,
        to: "q2",
        stack: { push: null, pop: null },
    });
    expect(findOutIfHasEpsilonTransition(modifiedMachine)).toBe(true);
});
