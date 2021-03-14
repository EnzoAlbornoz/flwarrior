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
    IITransition,
    findOutIfHasEpsilonTransition,
    fromDBEntry as createMachineFromDBEntry,
    IIMachine,
    addTransition,
    ITransition,
    getTransitionsOfState,
    setEntry as setEntryMachine,
    getTransitionsOfStateAsIDSet,
    getAllTransitionsOfStateAsIDSet,
    determinize,

} from "../lib/automaton/Machine";
import { IIState, IState } from "../lib/automaton/State";
import machine, { MachineType } from "../database/schema/machine";
import Immutable from "immutable";

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
        entryAlphabet: ["0", "1", "ε"],
        memoryAlphabet: [],
        transitions: [
            {
                from: "q0",
                with: { head: "0", memory: "" },
                to: { newState: "q0", writeSymbol: "", headDirection: null },
            },
            {
                from: "q0",
                with: { head: "1", memory: "" },
                to: { newState: "q1", writeSymbol: "", headDirection: null },
            },
            {
                from: "q1",
                with: { head: "1", memory: "" },
                to: { newState: "q1", writeSymbol: "", headDirection: null },
            },
            {
                from: "q1",
                with: { head: "0", memory: "" },
                to: { newState: "q1", writeSymbol: "", headDirection: null },
            },
            {
                from: "q1",
                with: { head: "0", memory: "" },
                to: { newState: "q2", writeSymbol: "", headDirection: null },
            },
            {
                from: "q2",
                with: { head: "1", memory: "" },
                to: { newState: "q2", writeSymbol: "", headDirection: null },
            },
            {
                from: "q2",
                with: { head: "1", memory: "" },
                to: { newState: "q1", writeSymbol: "", headDirection: null },
            },
            {
                from: "q2",
                with: { head: "0", memory: "" },
                to: { newState: "q2", writeSymbol: "", headDirection: null },
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
        push: null, pop: null,
    });
    expect(findOutIfHasEpsilonTransition(modifiedMachine)).toBe(true);
});

test("test set Entry On Machine", () => {
    let immutableMachine = buildImmutableRegularNonDeterministicWithoutEpsilonMachine();
    expect(immutableMachine["entry"]).toBe(undefined);
    let machineWithEntry = setEntryMachine(immutableMachine, {
        id: "q0",
        isEntry: true,
        isExit: true,
    });
    expect((machineWithEntry.get("entry") as IIState).get("id")).toBe("q0");
});

test("test determinization", () => {
    const immutableMachine = buildImmutableRegularNonDeterministicWithoutEpsilonMachine();
    let machineWithEntry = setEntryMachine(immutableMachine, {
        id: "q0",
        isEntry: true,
        isExit: true,
    });
});

test("test find transitions of state", () => {
    const immutableMachine = buildImmutableRegularNonDeterministicWithoutEpsilonMachine();
    const machineWithEntry = setEntryMachine(immutableMachine, {
        id: "q0",
        isEntry: true,
        isExit: true,
    });
    let transitions = getTransitionsOfState(machineWithEntry, "q0");
    const last: IITransition = Immutable.Map({
        from: "q0",
        with: "0",
        to: "q0",
        push: null,
        pop: null
    }) as IITransition;
    const expected: IITransition = Immutable.Map({
        from: "q0",
        with: "1",
        to: "q1",
        push: null,
        pop: null
    }) as IITransition;

    expect(transitions.equals(Immutable.Set([last, expected]))).toBe(true);
    expect(transitions.isSubset(Immutable.Set([last, expected]))).toBe(true);

    // console.log(getTransitionsOfStateWithSymbolAsIDSet(machineWithEntry, "q1", "0"));
    // playin around

    const setu = (machineWithEntry.get("states") as IIState).keySeq().reduce((accumSet, id) => accumSet.add(id), Immutable.Set());
    
    // setu.add();
    const setup = getAllTransitionsOfStateAsIDSet(machineWithEntry, "q1");
    console.log(setup.toJS());
    determinize(machineWithEntry);
    console.log(getTransitionsOfStateAsIDSet(machineWithEntry, "q1", "0").toJS());
    // var setu2 = Immutable.Set(["q2", "q1"]);
    // console.log(setu.toJS());
    // console.log(setu2.toJS());
    // console.log(setu.equals(setu2));
});

