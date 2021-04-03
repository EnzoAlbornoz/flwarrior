import Immutable from "immutable";
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
    getTransitionsOfState,
    setEntryState as setEntryMachine,
    determinize,
    findEpsilonCLosureOfState,
    getEpsilonClosureOfAllStates,
    IMachine,
    updateExitStatesCache,
    minimize,
    union,
    unionAlphabets,
    complement,
} from "../lib/automaton/Machine";
import { IIState } from "../lib/automaton/State";
import { MachineType } from "../database/schema/machine";

// ░░░░░░█▐▓▓░████▄▄▄█▀▄▓▓▓▌█
// ░░░░░▄█▌▀▄▓▓▄▄▄▄▀▀▀▄▓▓▓▓▓▌█
// ░░░▄█▀▀▄▓█▓▓▓▓▓▓▓▓▓▓▓▓▀░▓▌█
// ░░█▀▄▓▓▓███▓▓▓███▓▓▓▄░░▄▓▐█▌
// ░█▌▓▓▓▀▀▓▓▓▓███▓▓▓▓▓▓▓▄▀▓▓▐█
// ░█▐██▐░▄▓▓▓▓▓▀▄░▀▓▓▓▓▓▓▓▓▓▌█▌
// █▌███▓▓▓▓▓▓▓▓▐░░▄▓▓███▓▓▓▄▀▐█
// █▐█▓▀░░▀▓▓▓▓▓▓▓▓▓██████▓▓▓▓▐█
// ▌▓▄▌▀░▀░▐▀█▄▓▓██████████▓▓▓▌█▌
// ▌▓▓▓▄▄▀▀▓▓▓▀▓▓▓▓▓▓▓▓█▓█▓█▓▓▌█▌
// █▐▓▓▓▓▓▓▄▄▄▓▓▓▓▓▓█▓█▓█▓█▓▓▓▐:theDoge:

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
        entryAlphabet: ["0", "1"],
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

function buildImmutableRegularNonDeterministicWithoutEpsilonMachine2(): IIMachine {
    return createMachineFromDBEntry({
        id: "test",
        name: "test",
        deterministic: true,
        type: MachineType.FINITE_STATE_MACHINE,
        states: [
            { id: "q0", isEntry: true, isExit: true },
            { id: "q1", isEntry: false, isExit: false },
            { id: "q2", isEntry: false, isExit: false },
        ],
        entryAlphabet: ["a"],
        memoryAlphabet: [],
        transitions: [
            {
                from: "q0",
                with: { head: "a", memory: "" },
                to: { newState: "q1", writeSymbol: "", headDirection: null },
            },
            {
                from: "q0",
                with: { head: "a", memory: "" },
                to: { newState: "q2", writeSymbol: "", headDirection: null },
            },
        ],
    });
}
// Exemplo 2 do gabarito da jeruza (esolvidas_Deteminização.pdf)
function buildImmutableRegularNonDeterministicWithoutEpsilonMachine4(): IIMachine {
    return createMachineFromDBEntry({
        id: "test",
        name: "test",
        deterministic: true,
        type: MachineType.FINITE_STATE_MACHINE,
        states: [
            { id: "q0", isEntry: true, isExit: false },
            { id: "q1", isEntry: false, isExit: true },
            { id: "q2", isEntry: false, isExit: true },
            { id: "q3", isEntry: false, isExit: false },
            { id: "q4", isEntry: false, isExit: false },
        ],
        entryAlphabet: ["0", "1"],
        memoryAlphabet: [],
        transitions: [
            {
                from: "q0",
                with: { head: "0", memory: "" },
                to: { newState: "q1", writeSymbol: "", headDirection: null },
            },
            {
                from: "q0",
                with: { head: "1", memory: "" },
                to: { newState: "q2", writeSymbol: "", headDirection: null },
            },
            {
                from: "q1",
                with: { head: "0", memory: "" },
                to: { newState: "q1", writeSymbol: "", headDirection: null },
            },
            {
                from: "q1",
                with: { head: "0", memory: "" },
                to: { newState: "q3", writeSymbol: "", headDirection: null },
            },
            {
                from: "q1",
                with: { head: "1", memory: "" },
                to: { newState: "q1", writeSymbol: "", headDirection: null },
            },
            {
                from: "q2",
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
                to: { newState: "q4", writeSymbol: "", headDirection: null },
            },
        ],
    });
}

function buildImmutableRegularNonDeterministicWithEpsilonMachine(): IIMachine {
    return createMachineFromDBEntry({
        id: "test",
        name: "test",
        deterministic: true,
        type: MachineType.FINITE_STATE_MACHINE,
        states: [
            { id: "q0", isEntry: true, isExit: false },
            { id: "q1", isEntry: false, isExit: false },
            { id: "q2", isEntry: false, isExit: false },
            { id: "q3", isEntry: false, isExit: false },
            { id: "q4", isEntry: false, isExit: true },
        ],
        entryAlphabet: ["0", "1", "ε"],
        memoryAlphabet: [],
        transitions: [
            {
                from: "q0",
                with: { head: "ε", memory: "" },
                to: { newState: "q1", writeSymbol: "", headDirection: null },
            },
            {
                from: "q0",
                with: { head: "ε", memory: "" },
                to: { newState: "q2", writeSymbol: "", headDirection: null },
            },
            {
                from: "q1",
                with: { head: "0", memory: "" },
                to: { newState: "q3", writeSymbol: "", headDirection: null },
            },
            {
                from: "q2",
                with: { head: "1", memory: "" },
                to: { newState: "q3", writeSymbol: "", headDirection: null },
            },
            {
                from: "q3",
                with: { head: "1", memory: "" },
                to: { newState: "q4", writeSymbol: "", headDirection: null },
            },
        ],
    });
}

function buildImmutableRegularNonDeterministicWithEpsilonMachine2(): IIMachine {
    return createMachineFromDBEntry({
        id: "test",
        name: "test",
        deterministic: true,
        type: MachineType.FINITE_STATE_MACHINE,
        states: [
            { id: "q0", isEntry: true, isExit: false },
            { id: "q1", isEntry: false, isExit: false },
            { id: "q2", isEntry: false, isExit: false },
            { id: "q3", isEntry: false, isExit: false },
            { id: "q4", isEntry: false, isExit: true },
        ],
        entryAlphabet: ["0", "1", "ε"],
        memoryAlphabet: [],
        transitions: [
            {
                from: "q0",
                with: { head: "ε", memory: "" },
                to: { newState: "q1", writeSymbol: "", headDirection: null },
            },
            {
                from: "q0",
                with: { head: "1", memory: "" },
                to: { newState: "q4", writeSymbol: "", headDirection: null },
            },
            {
                from: "q0",
                with: { head: "ε", memory: "" },
                to: { newState: "q3", writeSymbol: "", headDirection: null },
            },
            {
                from: "q1",
                with: { head: "0", memory: "" },
                to: { newState: "q1", writeSymbol: "", headDirection: null },
            },
            {
                from: "q1",
                with: { head: "1", memory: "" },
                to: { newState: "q4", writeSymbol: "", headDirection: null },
            },
            {
                from: "q1",
                with: { head: "1", memory: "" },
                to: { newState: "q2", writeSymbol: "", headDirection: null },
            },
            {
                from: "q1",
                with: { head: "ε", memory: "" },
                to: { newState: "q0", writeSymbol: "", headDirection: null },
            },
            {
                from: "q2",
                with: { head: "ε", memory: "" },
                to: { newState: "q1", writeSymbol: "", headDirection: null },
            },
            {
                from: "q3",
                with: { head: "0", memory: "" },
                to: { newState: "q4", writeSymbol: "", headDirection: null },
            },
        ],
    });
}

// Exemplo 1 do gabarito da jeruza (esolvidas_Deteminização.pdf)
function buildImmutableRegularNonDeterministicWithEpsilonMachine3(): IIMachine {
    return createMachineFromDBEntry({
        id: "test",
        name: "test",
        deterministic: true,
        type: MachineType.FINITE_STATE_MACHINE,
        states: [
            { id: "p", isEntry: true, isExit: false },
            { id: "q", isEntry: false, isExit: false },
            { id: "r", isEntry: false, isExit: true },
        ],
        entryAlphabet: ["a", "b", "c", "ε"],
        memoryAlphabet: [],
        transitions: [
            {
                from: "p",
                with: { head: "ε", memory: "" },
                to: { newState: "p", writeSymbol: "", headDirection: null },
            },
            {
                from: "p",
                with: { head: "ε", memory: "" },
                to: { newState: "q", writeSymbol: "", headDirection: null },
            },
            {
                from: "p",
                with: { head: "b", memory: "" },
                to: { newState: "q", writeSymbol: "", headDirection: null },
            },
            {
                from: "p",
                with: { head: "c", memory: "" },
                to: { newState: "r", writeSymbol: "", headDirection: null },
            },
            {
                from: "q",
                with: { head: "a", memory: "" },
                to: { newState: "p", writeSymbol: "", headDirection: null },
            },
            {
                from: "q",
                with: { head: "b", memory: "" },
                to: { newState: "r", writeSymbol: "", headDirection: null },
            },
            {
                from: "q",
                with: { head: "c", memory: "" },
                to: { newState: "p", writeSymbol: "", headDirection: null },
            },
            {
                from: "q",
                with: { head: "c", memory: "" },
                to: { newState: "q", writeSymbol: "", headDirection: null },
            },
        ],
    });
}

// Exemplo 2 do gabarito da jeruza (esolvidas_Deteminização.pdf)
function buildImmutableRegularNonDeterministicWithEpsilonMachine4(): IIMachine {
    return createMachineFromDBEntry({
        id: "test",
        name: "test",
        deterministic: true,
        type: MachineType.FINITE_STATE_MACHINE,
        states: [
            { id: "q0", isEntry: true, isExit: false },
            { id: "q1", isEntry: false, isExit: true },
            { id: "q2", isEntry: false, isExit: true },
            { id: "q3", isEntry: false, isExit: false },
            { id: "q4", isEntry: false, isExit: false },
        ],
        entryAlphabet: ["a", "b", "ε"],
        memoryAlphabet: [],
        transitions: [
            {
                from: "q0",
                with: { head: "a", memory: "" },
                to: { newState: "q0", writeSymbol: "", headDirection: null },
            },
            {
                from: "q0",
                with: { head: "a", memory: "" },
                to: { newState: "q1", writeSymbol: "", headDirection: null },
            },
            {
                from: "q0",
                with: { head: "b", memory: "" },
                to: { newState: "q2", writeSymbol: "", headDirection: null },
            },
            {
                from: "q0",
                with: { head: "ε", memory: "" },
                to: { newState: "q3", writeSymbol: "", headDirection: null },
            },
            {
                from: "q1",
                with: { head: "a", memory: "" },
                to: { newState: "q1", writeSymbol: "", headDirection: null },
            },
            {
                from: "q1",
                with: { head: "b", memory: "" },
                to: { newState: "q3", writeSymbol: "", headDirection: null },
            },
            {
                from: "q1",
                with: { head: "ε", memory: "" },
                to: { newState: "q3", writeSymbol: "", headDirection: null },
            },
            {
                from: "q2",
                with: { head: "b", memory: "" },
                to: { newState: "q2", writeSymbol: "", headDirection: null },
            },
            {
                from: "q2",
                with: { head: "b", memory: "" },
                to: { newState: "q4", writeSymbol: "", headDirection: null },
            },
            {
                from: "q3",
                with: { head: "a", memory: "" },
                to: { newState: "q1", writeSymbol: "", headDirection: null },
            },
            {
                from: "q3",
                with: { head: "a", memory: "" },
                to: { newState: "q3", writeSymbol: "", headDirection: null },
            },
            {
                from: "q3",
                with: { head: "b", memory: "" },
                to: { newState: "q2", writeSymbol: "", headDirection: null },
            },
            {
                from: "q3",
                with: { head: "b", memory: "" },
                to: { newState: "q3", writeSymbol: "", headDirection: null },
            },
            {
                from: "q3",
                with: { head: "ε", memory: "" },
                to: { newState: "q4", writeSymbol: "", headDirection: null },
            },
            {
                from: "q4",
                with: { head: "b", memory: "" },
                to: { newState: "q2", writeSymbol: "", headDirection: null },
            },
            {
                from: "q4",
                with: { head: "a", memory: "" },
                to: { newState: "q4", writeSymbol: "", headDirection: null },
            },
            {
                from: "q4",
                with: { head: "ε", memory: "" },
                to: { newState: "q3", writeSymbol: "", headDirection: null },
            },
        ],
    });
}

// Exemplo 1 do gabarito da jeruza (esolvidas_Deteminização.pdf)
function buildImmutableRegularNonDeterministicWithoutEpsilonMachine3(): IIMachine {
    return createMachineFromDBEntry({
        id: "test",
        name: "test",
        deterministic: true,
        type: MachineType.FINITE_STATE_MACHINE,
        states: [
            { id: "p", isEntry: true, isExit: false },
            { id: "q", isEntry: false, isExit: true },
            { id: "r", isEntry: false, isExit: false },
            { id: "s", isEntry: false, isExit: true },
        ],
        entryAlphabet: ["0", "1", "ε"],
        memoryAlphabet: [],
        transitions: [
            {
                from: "p",
                with: { head: "0", memory: "" },
                to: { newState: "q", writeSymbol: "", headDirection: null },
            },
            {
                from: "p",
                with: { head: "1", memory: "" },
                to: { newState: "q", writeSymbol: "", headDirection: null },
            },
            {
                from: "p",
                with: { head: "0", memory: "" },
                to: { newState: "s", writeSymbol: "", headDirection: null },
            },
            {
                from: "q",
                with: { head: "0", memory: "" },
                to: { newState: "r", writeSymbol: "", headDirection: null },
            },
            {
                from: "q",
                with: { head: "1", memory: "" },
                to: { newState: "q", writeSymbol: "", headDirection: null },
            },
            {
                from: "q",
                with: { head: "1", memory: "" },
                to: { newState: "r", writeSymbol: "", headDirection: null },
            },
            {
                from: "r",
                with: { head: "0", memory: "" },
                to: { newState: "s", writeSymbol: "", headDirection: null },
            },
            {
                from: "r",
                with: { head: "1", memory: "" },
                to: { newState: "p", writeSymbol: "", headDirection: null },
            },
            {
                from: "s",
                with: { head: "1", memory: "" },
                to: { newState: "p", writeSymbol: "", headDirection: null },
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
        push: null,
        pop: null,
    });
    expect(findOutIfHasEpsilonTransition(modifiedMachine)).toBe(true);
});

test("test set Entry On Machine", () => {
    const immutableMachine = buildImmutableRegularNonDeterministicWithoutEpsilonMachine();
    expect(
        (immutableMachine.get("entry") as IIState).equals(
            Immutable.Map({ id: "q0", isEntry: true, isExit: true })
        )
    ).toBe(true);
    const machineWithEntry = setEntryMachine(immutableMachine, {
        id: "q1",
        isEntry: true,
        isExit: true,
    });
    expect((machineWithEntry.get("entry") as IIState).get("id")).toBe("q1");
});

// taken from http://www.cs.um.edu.mt/gordon.pace/Research/Software/Relic/Transformations/FSA/intersection.html
function buildImmutableRegularDeterministicWithoutEpsilonMachineForIntersection(): IIMachine {
    return createMachineFromDBEntry({
        id: "test",
        name: "test",
        deterministic: true,
        type: MachineType.FINITE_STATE_MACHINE,
        states: [
            { id: "S", isEntry: true, isExit: false },
            { id: "A", isEntry: false, isExit: true },
        ],
        entryAlphabet: ["a"],
        memoryAlphabet: [],
        transitions: [
            {
                from: "S",
                with: { head: "a", memory: "" },
                to: { newState: "A", writeSymbol: "", headDirection: null },
            },
            {
                from: "A",
                with: { head: "a", memory: "" },
                to: { newState: "S", writeSymbol: "", headDirection: null },
            },
        ],
    });
}
// also taken from http://www.cs.um.edu.mt/gordon.pace/Research/Software/Relic/Transformations/FSA/intersection.html
function buildImmutableRegularDeterministicWithoutEpsilonMachineForIntersection2(): IIMachine {
    return createMachineFromDBEntry({
        id: "test",
        name: "test",
        deterministic: true,
        type: MachineType.FINITE_STATE_MACHINE,
        states: [
            { id: "S", isEntry: true, isExit: true },
            { id: "A", isEntry: false, isExit: false },
            { id: "B", isEntry: false, isExit: false },
        ],
        entryAlphabet: ["a"],
        memoryAlphabet: [],
        transitions: [
            {
                from: "S",
                with: { head: "a", memory: "" },
                to: { newState: "A", writeSymbol: "", headDirection: null },
            },
            {
                from: "A",
                with: { head: "a", memory: "" },
                to: { newState: "A", writeSymbol: "", headDirection: null },
            },
            {
                from: "A",
                with: { head: "b", memory: "" },
                to: { newState: "B", writeSymbol: "", headDirection: null },
            },
            {
                from: "B",
                with: { head: "b", memory: "" },
                to: { newState: "B", writeSymbol: "", headDirection: null },
            },
        ],
    });
}

test("test determinization without ε", () => {
    const mac1 = buildImmutableRegularNonDeterministicWithoutEpsilonMachine3();
    let immutableMachine = determinize(mac1);
    expect(
        (immutableMachine.get("transitions") as Immutable.Set<IITransition>)
            .sort()
            .equals(
                Immutable.Set([
                    Immutable.Map({
                        from: "s",
                        with: "1",
                        to: "p",
                        push: null,
                        pop: null,
                    }),
                    Immutable.Map({
                        from: "q,r",
                        with: "0",
                        to: "r,s",
                        push: null,
                        pop: null,
                    }),
                    Immutable.Map({
                        from: "q,r,s",
                        with: "0",
                        to: "r,s",
                        push: null,
                        pop: null,
                    }),
                    Immutable.Map({
                        from: "q,r,s",
                        with: "1",
                        to: "p,q,r",
                        push: null,
                        pop: null,
                    }),
                    Immutable.Map({
                        from: "r",
                        with: "0",
                        to: "s",
                        push: null,
                        pop: null,
                    }),
                    Immutable.Map({
                        from: "r,s",
                        with: "0",
                        to: "s",
                        push: null,
                        pop: null,
                    }),
                    Immutable.Map({
                        from: "r",
                        with: "1",
                        to: "p",
                        push: null,
                        pop: null,
                    }),
                    Immutable.Map({
                        from: "r,s",
                        with: "1",
                        to: "p",
                        push: null,
                        pop: null,
                    }),
                    Immutable.Map({
                        from: "q",
                        with: "1",
                        to: "q,r",
                        push: null,
                        pop: null,
                    }),
                    Immutable.Map({
                        from: "q,s",
                        with: "0",
                        to: "r",
                        push: null,
                        pop: null,
                    }),
                    Immutable.Map({
                        from: "q",
                        with: "0",
                        to: "r",
                        push: null,
                        pop: null,
                    }),
                    Immutable.Map({
                        from: "p",
                        with: "1",
                        to: "q",
                        push: null,
                        pop: null,
                    }),
                    Immutable.Map({
                        from: "p,q,r",
                        with: "1",
                        to: "p,q,r",
                        push: null,
                        pop: null,
                    }),
                    Immutable.Map({
                        from: "p",
                        with: "0",
                        to: "q,s",
                        push: null,
                        pop: null,
                    }),
                    Immutable.Map({
                        from: "p,q,r",
                        with: "0",
                        to: "q,r,s",
                        push: null,
                        pop: null,
                    }),
                    Immutable.Map({
                        from: "q,s",
                        with: "1",
                        to: "p,q,r",
                        push: null,
                        pop: null,
                    }),
                    Immutable.Map({
                        from: "q,r",
                        with: "1",
                        to: "p,q,r",
                        push: null,
                        pop: null,
                    }),
                ]).sort()
            )
    ).toBe(true);

    expect(
        (immutableMachine.get("states") as Immutable.Map<
            string,
            IIState
        >).equals(
            Immutable.Map({
                p: Immutable.Map({ id: "p", isEntry: true, isExit: false }),
                q: Immutable.Map({ id: "q", isEntry: false, isExit: true }),
                r: Immutable.Map({ id: "r", isEntry: false, isExit: false }),
                s: Immutable.Map({ id: "s", isEntry: false, isExit: true }),
                "q,r": Immutable.Map({
                    id: "q,r",
                    isEntry: false,
                    isExit: true,
                }),
                "q,s": Immutable.Map({
                    id: "q,s",
                    isEntry: false,
                    isExit: true,
                }),
                "r,s": Immutable.Map({
                    id: "r,s",
                    isEntry: false,
                    isExit: true,
                }),
                "p,q,r": Immutable.Map({
                    id: "p,q,r",
                    isEntry: false,
                    isExit: true,
                }),
                "q,r,s": Immutable.Map({
                    id: "q,r,s",
                    isEntry: false,
                    isExit: true,
                }),
            })
        )
    ).toBe(true);

    immutableMachine = determinize(
        buildImmutableRegularNonDeterministicWithoutEpsilonMachine()
    );

    expect(
        (immutableMachine.get("states") as Immutable.Map<
            string,
            IIState
        >).equals(
            Immutable.Map({
                q0: Immutable.Map({ id: "q0", isEntry: true, isExit: true }),
                q1: Immutable.Map({ id: "q1", isEntry: false, isExit: false }),
                q2: Immutable.Map({ id: "q2", isEntry: false, isExit: true }),
                "q1,q2": Immutable.Map({
                    id: "q1,q2",
                    isEntry: false,
                    isExit: true,
                }),
            })
        )
    ).toBe(true);

    expect(
        (immutableMachine.get(
            "transitions"
        ) as Immutable.Set<IITransition>).equals(
            Immutable.Set([
                Immutable.Map({
                    from: "q1,q2",
                    with: "1",
                    to: "q1,q2",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q1",
                    with: "0",
                    to: "q1,q2",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q0",
                    with: "1",
                    to: "q1",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q2",
                    with: "0",
                    to: "q2",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q0",
                    with: "0",
                    to: "q0",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q2",
                    with: "1",
                    to: "q1,q2",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q1,q2",
                    with: "0",
                    to: "q1,q2",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q1",
                    with: "1",
                    to: "q1",
                    push: null,
                    pop: null,
                }),
            ])
        )
    ).toBe(true);

    immutableMachine = determinize(
        buildImmutableRegularNonDeterministicWithoutEpsilonMachine4()
    );

    expect(
        (immutableMachine.get("states") as Immutable.Map<
            string,
            IIState
        >).equals(
            Immutable.Map({
                q0: Immutable.Map({ id: "q0", isEntry: true, isExit: false }),
                q1: Immutable.Map({ id: "q1", isEntry: false, isExit: true }),
                q2: Immutable.Map({ id: "q2", isEntry: false, isExit: true }),
                q3: Immutable.Map({ id: "q3", isEntry: false, isExit: false }),
                q4: Immutable.Map({ id: "q4", isEntry: false, isExit: false }),
                "q2,q4": Immutable.Map({
                    id: "q2,q4",
                    isEntry: false,
                    isExit: true,
                }),
                "q1,q3": Immutable.Map({
                    id: "q1,q3",
                    isEntry: false,
                    isExit: true,
                }),
            })
        )
    ).toBe(true);

    expect(
        (immutableMachine.get(
            "transitions"
        ) as Immutable.Set<IITransition>).equals(
            Immutable.Set([
                Immutable.Map({
                    from: "q1,q3",
                    with: "1",
                    to: "q1",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q2,q4",
                    with: "1",
                    to: "q2,q4",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q2,q4",
                    with: "0",
                    to: "q2",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q2",
                    with: "0",
                    to: "q2",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q1",
                    with: "0",
                    to: "q1,q3",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q2",
                    with: "1",
                    to: "q2,q4",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q0",
                    with: "0",
                    to: "q1",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q0",
                    with: "1",
                    to: "q2",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q1,q3",
                    with: "0",
                    to: "q1,q3",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q1",
                    with: "1",
                    to: "q1",
                    push: null,
                    pop: null,
                }),
            ])
        )
    ).toBe(true);

    immutableMachine = determinize(
        buildImmutableRegularNonDeterministicWithoutEpsilonMachine2()
    );
    expect(
        (immutableMachine.get("states") as Immutable.Map<
            string,
            IIState
        >).equals(
            Immutable.Map({
                q0: Immutable.Map({ id: "q0", isEntry: true, isExit: true }),
                q1: Immutable.Map({ id: "q1", isEntry: false, isExit: false }),
                q2: Immutable.Map({ id: "q2", isEntry: false, isExit: false }),
                "q1,q2": Immutable.Map({
                    id: "q1,q2",
                    isEntry: false,
                    isExit: false,
                }),
            })
        )
    ).toBe(true);
    expect(
        (immutableMachine.get(
            "transitions"
        ) as Immutable.Set<IITransition>).equals(
            Immutable.Set([
                Immutable.Map({
                    from: "q0",
                    with: "a",
                    to: "q1,q2",
                    push: null,
                    pop: null,
                }),
            ])
        )
    ).toBe(true);
});

test("test determinization with ε", () => {
    let machine = determinize(
        buildImmutableRegularNonDeterministicWithEpsilonMachine3()
    );

    expect(
        (machine.get("states") as Immutable.Map<string, IIState>)
            .toSet()
            .isSuperset(
                Immutable.Set([
                    Immutable.Map({
                        id: "p,q",
                        isEntry: true,
                        isExit: false,
                    }) as IIState,
                    // Immutable.Map({ id: "p", isEntry: false, isExit: false }),
                    Immutable.Map({
                        id: "q,r",
                        isEntry: false,
                        isExit: true,
                    }) as IIState,
                    Immutable.Map({
                        id: "p,q,r",
                        isEntry: false,
                        isExit: true,
                    }) as IIState,
                    Immutable.Map({
                        id: "r",
                        isEntry: false,
                        isExit: true,
                    }) as IIState,
                ])
            )
    ).toBe(true);

    expect(
        (machine.get("transitions") as Immutable.Set<IITransition>).equals(
            Immutable.Set([
                Immutable.Map({
                    from: "p,q",
                    with: "c",
                    to: "p,q,r",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q,r",
                    with: "a",
                    to: "p,q",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q",
                    with: "c",
                    to: "p",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q,r",
                    with: "c",
                    to: "p,q",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "p,q,r",
                    with: "b",
                    to: "q,r",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q",
                    with: "a",
                    to: "p",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "p,q",
                    with: "b",
                    to: "q,r",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "p",
                    with: "c",
                    to: "r",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "p,q",
                    with: "a",
                    to: "p,q",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q",
                    with: "b",
                    to: "r",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "p,q,r",
                    with: "c",
                    to: "p,q,r",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q,r",
                    with: "b",
                    to: "r",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "p,q,r",
                    with: "a",
                    to: "p,q",
                    push: null,
                    pop: null,
                }),
            ])
        )
    ).toBe(true);

    machine = determinize(
        buildImmutableRegularNonDeterministicWithEpsilonMachine4()
    );

    expect(
        (machine.get("states") as Immutable.Map<string, IIState>)
            .toSet()
            .isSuperset([
                Immutable.Map({
                    id: "q0,q3,q4",
                    isEntry: true,
                    isExit: false,
                }) as IIState,
                Immutable.Map({
                    id: "q0,q1,q3,q4",
                    isEntry: false,
                    isExit: true,
                }) as IIState,
                Immutable.Map({
                    id: "q2,q3",
                    isEntry: false,
                    isExit: true,
                }) as IIState,
                Immutable.Map({
                    id: "q2,q3,q4",
                    isEntry: false,
                    isExit: true,
                }) as IIState,
                Immutable.Map({
                    id: "q1,q3,q4",
                    isEntry: false,
                    isExit: true,
                }) as IIState,
            ])
    ).toBe(true);

    expect(
        (machine.get("transitions") as Immutable.Set<IITransition>).equals(
            Immutable.Set([
                Immutable.Map({
                    from: "q2,q3,q4",
                    with: "a",
                    to: "q1,q3,q4",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q1,q3,q4",
                    with: "a",
                    to: "q1,q3,q4",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q0,q3,q4",
                    with: "b",
                    to: "q2,q3,q4",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q0,q1,q3,q4",
                    with: "b",
                    to: "q2,q3,q4",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q2,q3,q4",
                    with: "b",
                    to: "q2,q3,q4",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q0,q1,q3,q4",
                    with: "a",
                    to: "q0,q1,q3,q4",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q0,q3,q4",
                    with: "a",
                    to: "q0,q1,q3,q4",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q1,q3,q4",
                    with: "b",
                    to: "q2,q3,q4",
                    push: null,
                    pop: null,
                }),
            ])
        )
    ).toBe(true);
});

test("test findEpsilonCLosureOfState with ε  on machine1", () => {
    const immutableMachine = buildImmutableRegularNonDeterministicWithEpsilonMachine();
    const closureOfQ0 = findEpsilonCLosureOfState(
        immutableMachine,
        "q0",
        Immutable.Set()
    );
    expect(closureOfQ0.equals(Immutable.Set(["q0", "q1", "q2"]).sort())).toBe(
        true
    );
});

test("test findEpsilonCLosureOfState with ε on machine2", () => {
    const immutableMachine = buildImmutableRegularNonDeterministicWithEpsilonMachine2();
    const determinized = findEpsilonCLosureOfState(
        immutableMachine,
        "q0",
        Immutable.Set()
    );
    expect(determinized.equals(Immutable.Set(["q0", "q1", "q3"]).sort())).toBe(
        true
    );
    const determinized2 = findEpsilonCLosureOfState(
        immutableMachine,
        "q2",
        Immutable.Set()
    );
    expect(
        determinized2.equals(Immutable.Set(["q2", "q3", "q1", "q0"]).sort())
    ).toBe(true);
});

test("test find EpsilonClosure on 4th machine with epsilon", () => {
    const map = getEpsilonClosureOfAllStates(
        buildImmutableRegularNonDeterministicWithEpsilonMachine4()
    );
    expect(
        map.equals(
            Immutable.Map({
                q0: Immutable.OrderedSet(["q0", "q3", "q4"]),
                q1: Immutable.OrderedSet(["q1", "q3", "q4"]),
                q2: Immutable.OrderedSet(["q2"]),
                q3: Immutable.OrderedSet(["q3", "q4"]),
                q4: Immutable.OrderedSet(["q3", "q4"]),
            })
        )
    ).toBe(true);
});

test("test find EpsilonClosure on 3rd machine with epsilon", () => {
    const map = getEpsilonClosureOfAllStates(
        buildImmutableRegularNonDeterministicWithEpsilonMachine3()
    );
    expect(
        map.equals(
            Immutable.Map({
                p: Immutable.OrderedSet(["p", "q"]),
                q: Immutable.OrderedSet(["q"]),
                r: Immutable.OrderedSet(["r"]),
            })
        )
    ).toBe(true);
});

test("test find transitions of state", () => {
    const immutableMachine = buildImmutableRegularNonDeterministicWithoutEpsilonMachine();
    const machineWithEntry = setEntryMachine(immutableMachine, {
        id: "q0",
        isEntry: true,
        isExit: true,
    });
    const transitions = getTransitionsOfState(machineWithEntry, "q0");
    const last: IITransition = Immutable.Map({
        from: "q0",
        with: "0",
        to: "q0",
        push: null,
        pop: null,
    }) as IITransition;
    const expected: IITransition = Immutable.Map({
        from: "q0",
        with: "1",
        to: "q1",
        push: null,
        pop: null,
    }) as IITransition;

    expect(transitions.equals(Immutable.Set([last, expected]))).toBe(true);
    expect(transitions.isSubset(Immutable.Set([last, expected]))).toBe(true);
});

test("test update exitstates Cache", () => {
    let machine = buildImmutableRegularNonDeterministicWithEpsilonMachine4();
    expect(
        (machine.get("exitStates") as Immutable.Map<string, IIState>).equals(
            Immutable.Map({
                q1: Immutable.Map({ id: "q1", isEntry: false, isExit: true }),
                q2: Immutable.Map({ id: "q2", isEntry: false, isExit: true }),
            })
        )
    ).toBe(true);
    machine = determinize(machine);
    expect(
        (machine.get("exitStates") as Immutable.Map<string, IIState>).equals(
            Immutable.Map({
                "q2,q3,q4": Immutable.Map({
                    id: "q2,q3,q4",
                    isEntry: false,
                    isExit: true,
                }),
                "q0,q1,q3,q4": Immutable.Map({
                    id: "q0,q1,q3,q4",
                    isEntry: false,
                    isExit: true,
                }),
                "q1,q3,q4": Immutable.Map({
                    id: "q1,q3,q4",
                    isEntry: false,
                    isExit: true,
                }),
            })
        )
    ).toBe(true);
    machine = updateExitStatesCache(machine);
    expect(
        (machine.get("exitStates") as Immutable.Map<string, IIState>).equals(
            Immutable.Map({
                "q2,q3,q4": Immutable.Map({
                    id: "q2,q3,q4",
                    isEntry: false,
                    isExit: true,
                }),
                "q0,q1,q3,q4": Immutable.Map({
                    id: "q0,q1,q3,q4",
                    isEntry: false,
                    isExit: true,
                }),
                "q1,q3,q4": Immutable.Map({
                    id: "q1,q3,q4",
                    isEntry: false,
                    isExit: true,
                }),
                // "dead state", useful to test the update method
                "q2,q3": Immutable.Map({
                    id: "q2,q3",
                    isEntry: false,
                    isExit: true,
                }),
            })
        )
    ).toBe(true);
});

test("test union alphabet", () => {
    const machine1 = buildImmutableRegularNonDeterministicWithEpsilonMachine4();
    const machine2 = buildImmutableRegularNonDeterministicWithEpsilonMachine2();
    const machine = unionAlphabets(machine1, machine2);
    expect(
        (machine.get("alphabet") as IAlphabet)
            .sort()
            .equals(Immutable.Set(["a", "b", "ε", "0", "1"]).sort())
    ).toBe(true);
});

test("test union on machines", () => {
    const machine1 = buildImmutableRegularNonDeterministicWithoutEpsilonMachine();
    const machine2 = buildImmutableRegularNonDeterministicWithEpsilonMachine();
    const machine = union(machine1, machine2);
    expect(machine.equals(union(machine2, machine1))).toBe(true);
    expect(
        (machine.get("exitStates") as Immutable.Map<string, IIState>).equals(
            Immutable.Map({
                q4: Immutable.Map({ id: "q4", isEntry: false, isExit: true }),
                q2_FROM_UNION: Immutable.Map({
                    id: "q2_FROM_UNION",
                    isEntry: false,
                    isExit: true,
                }),
                q0_FROM_UNION: Immutable.Map({
                    id: "q0_FROM_UNION",
                    isEntry: false,
                    isExit: true,
                }),
            })
        )
    ).toBe(true);

    expect(
        (machine.get("states") as Immutable.Map<string, IIState>).equals(
            Immutable.Map({
                q1: Immutable.Map({ id: "q1", isEntry: false, isExit: false }),
                q2: Immutable.Map({ id: "q2", isEntry: false, isExit: false }),
                q3: Immutable.Map({ id: "q3", isEntry: false, isExit: false }),
                q4: Immutable.Map({ id: "q4", isEntry: false, isExit: true }),
                q2_FROM_UNION: Immutable.Map({
                    id: "q2_FROM_UNION",
                    isEntry: false,
                    isExit: true,
                }),
                q1_FROM_UNION: Immutable.Map({
                    id: "q1_FROM_UNION",
                    isEntry: false,
                    isExit: false,
                }),
                q0_FROM_UNION: Immutable.Map({
                    id: "q0_FROM_UNION",
                    isEntry: false,
                    isExit: true,
                }),
                newUnionInitialState: Immutable.Map({
                    id: "newUnionInitialState",
                    isEntry: true,
                    isExit: false,
                }),
                q0: Immutable.Map({ id: "q0", isEntry: false, isExit: false }),
            })
        )
    ).toBe(true);

    expect(
        (machine.get("transitions") as Immutable.Set<IITransition>).equals(
            Immutable.Set([
                Immutable.Map({
                    from: "q1",
                    with: "0",
                    to: "q2",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "newUnionInitialState",
                    with: "ε",
                    to: "q0",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "newUnionInitialState",
                    with: "ε",
                    to: "q0_FROM_UNION",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "q2",
                    with: "1",
                    to: "q1",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q0",
                    with: "1",
                    to: "q1",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q2",
                    with: "0",
                    to: "q2",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q2",
                    with: "1",
                    to: "q2",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q0_FROM_UNION",
                    with: "ε",
                    to: "q1_FROM_UNION",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "q1_FROM_UNION",
                    with: "0",
                    to: "q3",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "q0",
                    with: "0",
                    to: "q0",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q3",
                    with: "1",
                    to: "q4",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "q2_FROM_UNION",
                    with: "1",
                    to: "q3",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "q1",
                    with: "1",
                    to: "q1",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q1",
                    with: "0",
                    to: "q1",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q0_FROM_UNION",
                    with: "ε",
                    to: "q2_FROM_UNION",
                    pop: null,
                    push: null,
                }),
            ])
        )
    ).toBe(true);
});

test("prodcution", () => {
    const machine = complement(
        buildImmutableRegularDeterministicWithoutEpsilonMachineForIntersection()
    );
    console.log(
        complement(
            buildImmutableRegularNonDeterministicWithEpsilonMachine4()
        ).toJS()
    );
    expect(
        (machine.get("exitStates") as Immutable.Map<string, IIState>).equals(
            Immutable.Map({
                S: Immutable.Map({ id: "S", isEntry: true, isExit: true }),
            })
        )
    ).toBe(true);
    expect(
        (machine.get("transitions") as Immutable.Set<IITransition>).equals(
            Immutable.Set([
                Immutable.Map({
                    from: "S",
                    with: "a",
                    to: "A",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "A",
                    with: "a",
                    to: "S",
                    push: null,
                    pop: null,
                }),
            ])
        )
    ).toBe(true);

    expect(
        (machine.get("states") as Immutable.Map<string, IIState>).equals(
            Immutable.Map({
                S: Immutable.Map({ id: "S", isEntry: true, isExit: true }),
                A: Immutable.Map({ id: "A", isEntry: false, isExit: false }),
            })
        )
    ).toBe(true);
});
