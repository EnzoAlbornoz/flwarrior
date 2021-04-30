import { inspect } from "util";
import Immutable from "immutable";
import { IAlphabet } from "../../lib/Alphabet";
import { EPSILON } from "../../lib/AlphabetSymbol";

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
    unionAlphabetsPlusEpsilon,
    complement,
    intersect,
    nextStep,
    stateNameGenerator,
    fromDBEntry,
    getEquivalentClasses,
    getReachableStates,
    getStatesThatReachStateInSetBy,
    getUnreachableStates,
    removeDeadStates,
} from "../../lib/automaton/Machine";
import { IIState } from "../../lib/automaton/State";
import { getNewMachine, MachineType } from "../../database/schema/machine";

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

// self conceived пример
function buildImmutableRegularDeterministicWithoutEpsilonMachineForIntersection1(): IIMachine {
    return createMachineFromDBEntry({
        id: "test",
        name: "test",
        deterministic: true,
        type: MachineType.FINITE_STATE_MACHINE,
        states: [
            { id: "q0", isEntry: true, isExit: false },
            { id: "q1", isEntry: false, isExit: false },
            { id: "q2", isEntry: false, isExit: true },
        ],
        entryAlphabet: ["a", "b"],
        memoryAlphabet: [],
        transitions: [
            {
                from: "q0",
                with: { head: "a", memory: "" },
                to: { newState: "q1", writeSymbol: "", headDirection: null },
            },
            {
                from: "q0",
                with: { head: "b", memory: "" },
                to: { newState: "q0", writeSymbol: "", headDirection: null },
            },
            {
                from: "q1",
                with: { head: "a", memory: "" },
                to: { newState: "q1", writeSymbol: "", headDirection: null },
            },
            {
                from: "q1",
                with: { head: "b", memory: "" },
                to: { newState: "q2", writeSymbol: "", headDirection: null },
            },
            {
                from: "q2",
                with: { head: "a", memory: "" },
                to: { newState: "q2", writeSymbol: "", headDirection: null },
            },
            {
                from: "q2",
                with: { head: "b", memory: "" },
                to: { newState: "q2", writeSymbol: "", headDirection: null },
            },
        ],
    });
}
// self conceived пример
function buildImmutableRegularDeterministicWithoutEpsilonMachineForIntersection2(): IIMachine {
    return createMachineFromDBEntry({
        id: "test",
        name: "test",
        deterministic: true,
        type: MachineType.FINITE_STATE_MACHINE,
        states: [
            { id: "q3", isEntry: true, isExit: false },
            { id: "q4", isEntry: false, isExit: false },
            { id: "q5", isEntry: false, isExit: true },
        ],
        entryAlphabet: ["a", "b"],
        memoryAlphabet: [],
        transitions: [
            {
                from: "q3",
                with: { head: "a", memory: "" },
                to: { newState: "q3", writeSymbol: "", headDirection: null },
            },
            {
                from: "q3",
                with: { head: "b", memory: "" },
                to: { newState: "q4", writeSymbol: "", headDirection: null },
            },
            {
                from: "q4",
                with: { head: "a", memory: "" },
                to: { newState: "q3", writeSymbol: "", headDirection: null },
            },
            {
                from: "q4",
                with: { head: "b", memory: "" },
                to: { newState: "q5", writeSymbol: "", headDirection: null },
            },
            {
                from: "q5",
                with: { head: "a", memory: "" },
                to: { newState: "q5", writeSymbol: "", headDirection: null },
            },
            {
                from: "q5",
                with: { head: "b", memory: "" },
                to: { newState: "q5", writeSymbol: "", headDirection: null },
            },
        ],
    });
}
// taken from http://www.cs.um.edu.mt/gordon.pace/Research/Software/Relic/Transformations/FSA/intersection.html
function buildImmutableRegularDeterministicWithoutEpsilonMachineForIntersection3(): IIMachine {
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
function buildImmutableRegularDeterministicWithoutEpsilonMachineForIntersection4(): IIMachine {
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
        entryAlphabet: ["a", "b"],
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

function buildImmutableRegularDeterministicWithoutEpsilonMachineForUnion1(): IIMachine {
    return createMachineFromDBEntry({
        id: "test",
        name: "test",
        deterministic: true,
        type: MachineType.FINITE_STATE_MACHINE,
        states: [
            { id: "q0", isEntry: true, isExit: false },
            { id: "q1", isEntry: false, isExit: false },
            { id: "q2", isEntry: false, isExit: false },
            { id: "AND_FINAL", isEntry: false, isExit: true },
        ],
        entryAlphabet: ["a", "n", "d"],
        memoryAlphabet: [],
        transitions: [
            {
                from: "q0",
                with: { head: "a", memory: "" },
                to: { newState: "q1", writeSymbol: "", headDirection: null },
            },
            {
                from: "q1",
                with: { head: "n", memory: "" },
                to: { newState: "q2", writeSymbol: "", headDirection: null },
            },
            {
                from: "q2",
                with: { head: "d", memory: "" },
                to: {
                    newState: "AND_FINAL",
                    writeSymbol: "",
                    headDirection: null,
                },
            },
        ],
    });
}

function buildImmutableRegularDeterministicWithoutEpsilonMachineForUnion2(): IIMachine {
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
            { id: "q4", isEntry: false, isExit: false },
            { id: "BEGIN_FINAL", isEntry: false, isExit: true },
        ],
        entryAlphabet: ["b", "e", "g", "i", "n"],
        memoryAlphabet: [],
        transitions: [
            {
                from: "q0",
                with: { head: "b", memory: "" },
                to: { newState: "q1", writeSymbol: "", headDirection: null },
            },
            {
                from: "q1",
                with: { head: "e", memory: "" },
                to: { newState: "q2", writeSymbol: "", headDirection: null },
            },
            {
                from: "q2",
                with: { head: "g", memory: "" },
                to: { newState: "q3", writeSymbol: "", headDirection: null },
            },
            {
                from: "q3",
                with: { head: "i", memory: "" },
                to: { newState: "q4", writeSymbol: "", headDirection: null },
            },
            {
                from: "q4",
                with: { head: "n", memory: "" },
                to: {
                    newState: "BEGIN_FINAL",
                    writeSymbol: "",
                    headDirection: null,
                },
            },
        ],
    });
}

function buildImmutableRegularDeterministicWithoutEpsilonMachineForUnion3(): IIMachine {
    return createMachineFromDBEntry({
        id: "test",
        name: "test",
        deterministic: true,
        type: MachineType.FINITE_STATE_MACHINE,
        states: [
            { id: "q0", isEntry: true, isExit: false },
            { id: "q1", isEntry: false, isExit: false },
            { id: "q2", isEntry: false, isExit: false },
            { id: "END_FINAL", isEntry: false, isExit: true },
        ],
        entryAlphabet: ["e", "n", "d"],
        memoryAlphabet: [],
        transitions: [
            {
                from: "q0",
                with: { head: "e", memory: "" },
                to: { newState: "q1", writeSymbol: "", headDirection: null },
            },
            {
                from: "q1",
                with: { head: "n", memory: "" },
                to: { newState: "q2", writeSymbol: "", headDirection: null },
            },
            {
                from: "q2",
                with: { head: "d", memory: "" },
                to: {
                    newState: "END_FINAL",
                    writeSymbol: "",
                    headDirection: null,
                },
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
                    from: "q0",
                    with: "0",
                    to: "q0",
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
                    from: "p,q",
                    with: "b",
                    to: "q,r",
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
            })
        )
    ).toBe(true);
});

test("test union alphabet", () => {
    let machine1 = buildImmutableRegularNonDeterministicWithEpsilonMachine4();
    let machine2 = buildImmutableRegularNonDeterministicWithEpsilonMachine2();
    let machine = unionAlphabetsPlusEpsilon(machine1, machine2);
    expect(
        (machine.get("alphabet") as IAlphabet)
            .sort()
            .equals(Immutable.Set(["a", "b", "ε", "0", "1"]).sort())
    ).toBe(true);

    machine1 = buildImmutableRegularNonDeterministicWithoutEpsilonMachine();
    machine2 = buildImmutableRegularNonDeterministicWithoutEpsilonMachine2();
    machine = unionAlphabetsPlusEpsilon(machine1, machine2);
    expect(
        (machine.get("alphabet") as IAlphabet)
            .sort()
            .equals(Immutable.Set(["a", "ε", "0", "1"]).sort())
    ).toBe(true);
});

test("test union on machines", () => {
    const machine1 = buildImmutableRegularNonDeterministicWithoutEpsilonMachine();
    const machine2 = buildImmutableRegularNonDeterministicWithEpsilonMachine();
    const newUnionInitialStateName = "UInitial";
    const machine = union(machine1, machine2, false, newUnionInitialStateName);
    expect(
        machine.equals(
            union(machine2, machine1, false, newUnionInitialStateName)
        )
    ).toBe(true);
    expect(
        (machine.get("exitStates") as Immutable.Map<string, IIState>).equals(
            Immutable.Map({
                q4: Immutable.Map({ id: "q4", isEntry: false, isExit: true }),
                q20: Immutable.Map({
                    id: "q20",
                    isEntry: false,
                    isExit: true,
                }),
                q00: Immutable.Map({
                    id: "q00",
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
                q20: Immutable.Map({
                    id: "q20",
                    isEntry: false,
                    isExit: true,
                }),
                q10: Immutable.Map({
                    id: "q10",
                    isEntry: false,
                    isExit: false,
                }),
                q00: Immutable.Map({
                    id: "q00",
                    isEntry: false,
                    isExit: true,
                }),
                [newUnionInitialStateName.concat("0")]: Immutable.Map({
                    id: newUnionInitialStateName.concat("0"),
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
                    from: "q0",
                    with: "ε",
                    to: "q2",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q10",
                    with: "0",
                    to: "q10",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "q00",
                    with: "0",
                    to: "q00",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "q10",
                    with: "0",
                    to: "q20",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "UInitial0",
                    with: "ε",
                    to: "q0",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "q20",
                    with: "1",
                    to: "q20",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "q00",
                    with: "1",
                    to: "q10",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "q1",
                    with: "0",
                    to: "q3",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q10",
                    with: "1",
                    to: "q10",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "UInitial0",
                    with: "ε",
                    to: "q00",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "q2",
                    with: "1",
                    to: "q3",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q3",
                    with: "1",
                    to: "q4",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q0",
                    with: "ε",
                    to: "q1",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q20",
                    with: "0",
                    to: "q20",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "q20",
                    with: "1",
                    to: "q10",
                    pop: null,
                    push: null,
                }),
            ])
        )
    ).toBe(true);
});

test("test complement on machine", () => {
    let machine = complement(
        buildImmutableRegularDeterministicWithoutEpsilonMachineForIntersection1()
    );
    expect(
        (machine.get("exitStates") as Immutable.Map<string, IIState>).equals(
            Immutable.Map({
                q0: Immutable.Map({ id: "q0", isEntry: true, isExit: true }),
                q1: Immutable.Map({ id: "q1", isEntry: false, isExit: true }),
            })
        )
    ).toBe(true);
    expect(
        (machine.get("transitions") as Immutable.Set<IITransition>).equals(
            Immutable.Set([
                Immutable.Map({
                    from: "q0",
                    with: "a",
                    to: "q1",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q0",
                    with: "b",
                    to: "q0",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q1",
                    with: "a",
                    to: "q1",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q1",
                    with: "b",
                    to: "q2",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q2",
                    with: "a",
                    to: "q2",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q2",
                    with: "b",
                    to: "q2",
                    push: null,
                    pop: null,
                }),
            ])
        )
    ).toBe(true);

    expect(
        (machine.get("states") as Immutable.Map<string, IIState>).equals(
            Immutable.Map({
                q0: Immutable.Map({ id: "q0", isEntry: true, isExit: true }),
                q1: Immutable.Map({ id: "q1", isEntry: false, isExit: true }),
                q2: Immutable.Map({ id: "q2", isEntry: false, isExit: false }),
            })
        )
    ).toBe(true);
    machine = complement(
        buildImmutableRegularDeterministicWithoutEpsilonMachineForIntersection2()
    );

    expect(
        (machine.get("exitStates") as Immutable.Map<string, IIState>).equals(
            Immutable.Map({
                q3: Immutable.Map({ id: "q3", isEntry: true, isExit: true }),
                q4: Immutable.Map({ id: "q4", isEntry: false, isExit: true }),
            })
        )
    ).toBe(true);
    expect(
        (machine.get("transitions") as Immutable.Set<IITransition>).equals(
            Immutable.Set([
                Immutable.Map({
                    from: "q3",
                    with: "a",
                    to: "q3",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q3",
                    with: "b",
                    to: "q4",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q4",
                    with: "a",
                    to: "q3",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q4",
                    with: "b",
                    to: "q5",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q5",
                    with: "a",
                    to: "q5",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "q5",
                    with: "b",
                    to: "q5",
                    pop: null,
                    push: null,
                }),
            ])
        )
    ).toBe(true);

    expect(
        (machine.get("states") as Immutable.Map<string, IIState>).equals(
            Immutable.Map({
                q3: Immutable.Map({ id: "q3", isEntry: true, isExit: true }),
                q4: Immutable.Map({ id: "q4", isEntry: false, isExit: true }),
                q5: Immutable.Map({ id: "q5", isEntry: false, isExit: false }),
            })
        )
    ).toBe(true);
    machine = complement(
        buildImmutableRegularDeterministicWithoutEpsilonMachineForIntersection3()
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
    machine = complement(
        buildImmutableRegularDeterministicWithoutEpsilonMachineForIntersection4()
    );
    expect(
        (machine.get("exitStates") as Immutable.Map<string, IIState>).equals(
            Immutable.Map({
                A: Immutable.Map({ id: "A", isEntry: false, isExit: true }),
                B: Immutable.Map({ id: "B", isEntry: false, isExit: true }),
                _DSFC_: Immutable.Map({
                    id: "_DSFC_",
                    isEntry: false,
                    isExit: true,
                }),
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
                    to: "A",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "A",
                    with: "b",
                    to: "B",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "B",
                    with: "b",
                    to: "B",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "S",
                    with: "b",
                    to: "_DSFC_",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "B",
                    with: "a",
                    to: "_DSFC_",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "_DSFC_",
                    with: "a",
                    to: "_DSFC_",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "_DSFC_",
                    with: "b",
                    to: "_DSFC_",
                    pop: null,
                    push: null,
                }),
            ])
        )
    ).toBe(true);

    expect(
        (machine.get("states") as Immutable.Map<string, IIState>).equals(
            Immutable.Map({
                S: Immutable.Map({ id: "S", isEntry: true, isExit: false }),
                A: Immutable.Map({ id: "A", isEntry: false, isExit: true }),
                B: Immutable.Map({ id: "B", isEntry: false, isExit: true }),
                _DSFC_: Immutable.Map({
                    id: "_DSFC_",
                    isEntry: false,
                    isExit: true,
                }),
            })
        )
    ).toBe(true);
});

test(" test simple intersect on DFA", () => {
    const machine1 = buildImmutableRegularDeterministicWithoutEpsilonMachineForIntersection1();
    const machine2 = buildImmutableRegularDeterministicWithoutEpsilonMachineForIntersection2();
    const machine = intersect(machine1, machine2);

    expect(
        (machine.get("states") as Immutable.Map<string, IIState>).equals(
            Immutable.Map({
                q0: Immutable.Map({ id: "q0", isEntry: false, isExit: true }),
                q1: Immutable.Map({ id: "q1", isEntry: false, isExit: false }),
                q2: Immutable.Map({ id: "q2", isEntry: false, isExit: false }),
                q3: Immutable.Map({ id: "q3", isEntry: false, isExit: false }),
                q4: Immutable.Map({ id: "q4", isEntry: false, isExit: false }),
                q5: Immutable.Map({ id: "q5", isEntry: false, isExit: false }),
                q6: Immutable.Map({ id: "q6", isEntry: true, isExit: false }),
            })
        )
    ).toBe(true);

    expect(
        (machine.get("transitions") as Immutable.Set<IITransition>).equals(
            Immutable.Set([
                Immutable.Map({
                    from: "q5",
                    with: "a",
                    to: "q4",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q6",
                    with: "b",
                    to: "q5",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q4",
                    with: "a",
                    to: "q4",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q2",
                    with: "a",
                    to: "q2",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q6",
                    with: "a",
                    to: "q4",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q1",
                    with: "a",
                    to: "q4",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q3",
                    with: "a",
                    to: "q2",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q0",
                    with: "b",
                    to: "q0",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "q1",
                    with: "b",
                    to: "q0",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "q3",
                    with: "b",
                    to: "q3",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q5",
                    with: "b",
                    to: "q3",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q4",
                    with: "b",
                    to: "q1",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q2",
                    with: "b",
                    to: "q0",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "q0",
                    with: "a",
                    to: "q0",
                    pop: null,
                    push: null,
                }),
            ])
        )
    ).toBe(true);
});

test("test generator for next", () => {
    const machine = buildImmutableRegularDeterministicWithoutEpsilonMachineForIntersection1();
    let gen = nextStep(machine, "acbabba");

    expect(
        (gen.next().value as IITransition).equals(
            Immutable.Map({
                from: "q0",
                with: "a",
                to: "q1",
                push: null,
                pop: null,
            }) as IITransition
        )
    ).toBe(true);
    let next = gen.next();
    // succcesfull computation?
    expect(next.value).toBe(false);
    expect(next.done).toBe(true);

    gen = nextStep(machine, "aabba");

    expect(
        (gen.next().value as IITransition).equals(
            Immutable.Map({
                from: "q0",
                with: "a",
                to: "q1",
                push: null,
                pop: null,
            }) as IITransition
        )
    ).toBe(true);
    expect(
        (gen.next().value as IITransition).equals(
            Immutable.Map({
                from: "q1",
                with: "a",
                to: "q1",
                push: null,
                pop: null,
            }) as IITransition
        )
    ).toBe(true);
    expect(
        (gen.next().value as IITransition).equals(
            Immutable.Map({
                from: "q1",
                with: "b",
                to: "q2",
                push: null,
                pop: null,
            }) as IITransition
        )
    ).toBe(true);
    expect(
        (gen.next().value as IITransition).equals(
            Immutable.Map({
                from: "q2",
                with: "b",
                to: "q2",
                push: null,
                pop: null,
            }) as IITransition
        )
    ).toBe(true);
    expect(
        (gen.next().value as IITransition).equals(
            Immutable.Map({
                from: "q2",
                with: "a",
                to: "q2",
                push: null,
                pop: null,
            }) as IITransition
        )
    ).toBe(true);
    // succcesfull computation?
    next = gen.next();
    expect(next.value).toBe(true);
    expect(next.done).toBe(true);
});

test("test stateNameGenerator", () => {
    const generator = stateNameGenerator("Test");
    let next = generator.next();
    for (const i of [0, 1, 2, 3, 4]) {
        expect(next.value).toBe(`Test${i}`);
        next = generator.next();
    }
});

test("test Union", () => {
    const machine1 = buildImmutableRegularDeterministicWithoutEpsilonMachineForUnion1();
    const machine2 = buildImmutableRegularDeterministicWithoutEpsilonMachineForUnion2();
    const machine3 = buildImmutableRegularDeterministicWithoutEpsilonMachineForUnion3();
    const newUnionInitialStateName = "UInitial";
    const machineUnion = union(
        machine1,
        machine2,
        false,
        newUnionInitialStateName
    );
    expect(
        machineUnion.equals(
            union(machine2, machine1, false, newUnionInitialStateName)
        )
    ).toBe(true);

    expect(
        (machineUnion.get("states") as Immutable.Map<string, IIState>).equals(
            Immutable.Map({
                q1: Immutable.Map({ id: "q1", isEntry: false, isExit: false }),
                BEGIN_FINAL: Immutable.Map({
                    id: "BEGIN_FINAL",
                    isEntry: false,
                    isExit: true,
                }),
                UInitial0: Immutable.Map({
                    id: "UInitial0",
                    isEntry: true,
                    isExit: false,
                }),
                q2: Immutable.Map({ id: "q2", isEntry: false, isExit: false }),
                q3: Immutable.Map({ id: "q3", isEntry: false, isExit: false }),
                q4: Immutable.Map({ id: "q4", isEntry: false, isExit: false }),
                AND_FINAL: Immutable.Map({
                    id: "AND_FINAL",
                    isEntry: false,
                    isExit: true,
                }),
                q20: Immutable.Map({
                    id: "q20",
                    isEntry: false,
                    isExit: false,
                }),
                q10: Immutable.Map({
                    id: "q10",
                    isEntry: false,
                    isExit: false,
                }),
                q00: Immutable.Map({
                    id: "q00",
                    isEntry: false,
                    isExit: false,
                }),
                q0: Immutable.Map({ id: "q0", isEntry: false, isExit: false }),
            })
        )
    ).toBe(true);

    expect(
        (machineUnion.get("transitions") as Immutable.Set<IITransition>).equals(
            Immutable.Set([
                Immutable.Map({
                    from: "q2",
                    with: "g",
                    to: "q3",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q0",
                    with: "b",
                    to: "q1",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "UInitial0",
                    with: "ε",
                    to: "q0",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "q00",
                    with: "a",
                    to: "q10",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "UInitial0",
                    with: "ε",
                    to: "q00",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "q3",
                    with: "i",
                    to: "q4",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q20",
                    with: "d",
                    to: "AND_FINAL",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "q10",
                    with: "n",
                    to: "q20",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "q1",
                    with: "e",
                    to: "q2",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q4",
                    with: "n",
                    to: "BEGIN_FINAL",
                    push: null,
                    pop: null,
                }),
            ])
        )
    ).toBe(true);
    const thirdUnion = union(machineUnion, machine3, false, "bing");
    expect(
        (thirdUnion.get("states") as Immutable.Map<string, IIState>).equals(
            Immutable.Map({
                q1: Immutable.Map({ id: "q1", isEntry: false, isExit: false }),
                BEGIN_FINAL: Immutable.Map({
                    id: "BEGIN_FINAL",
                    isEntry: false,
                    isExit: true,
                }),
                UInitial0: Immutable.Map({
                    id: "UInitial0",
                    isEntry: false,
                    isExit: false,
                }),
                q2: Immutable.Map({ id: "q2", isEntry: false, isExit: false }),
                q3: Immutable.Map({ id: "q3", isEntry: false, isExit: false }),
                q4: Immutable.Map({ id: "q4", isEntry: false, isExit: false }),
                AND_FINAL: Immutable.Map({
                    id: "AND_FINAL",
                    isEntry: false,
                    isExit: true,
                }),
                q20: Immutable.Map({
                    id: "q20",
                    isEntry: false,
                    isExit: false,
                }),
                q10: Immutable.Map({
                    id: "q10",
                    isEntry: false,
                    isExit: false,
                }),
                q21: Immutable.Map({
                    id: "q21",
                    isEntry: false,
                    isExit: false,
                }),
                bing0: Immutable.Map({
                    id: "bing0",
                    isEntry: true,
                    isExit: false,
                }),
                q00: Immutable.Map({
                    id: "q00",
                    isEntry: false,
                    isExit: false,
                }),
                q11: Immutable.Map({
                    id: "q11",
                    isEntry: false,
                    isExit: false,
                }),
                END_FINAL: Immutable.Map({
                    id: "END_FINAL",
                    isEntry: false,
                    isExit: true,
                }),
                q01: Immutable.Map({
                    id: "q01",
                    isEntry: false,
                    isExit: false,
                }),
                q0: Immutable.Map({ id: "q0", isEntry: false, isExit: false }),
            })
        )
    ).toBe(true);

    expect(
        (thirdUnion.get("transitions") as Immutable.Set<IITransition>).equals(
            Immutable.Set([
                Immutable.Map({
                    from: "bing0",
                    with: "ε",
                    to: "UInitial0",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "q2",
                    with: "g",
                    to: "q3",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q21",
                    with: "d",
                    to: "END_FINAL",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "q0",
                    with: "b",
                    to: "q1",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "UInitial0",
                    with: "ε",
                    to: "q0",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "q00",
                    with: "a",
                    to: "q10",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "UInitial0",
                    with: "ε",
                    to: "q00",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "q01",
                    with: "e",
                    to: "q11",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "q3",
                    with: "i",
                    to: "q4",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q20",
                    with: "d",
                    to: "AND_FINAL",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "q11",
                    with: "n",
                    to: "q21",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "q10",
                    with: "n",
                    to: "q20",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "q1",
                    with: "e",
                    to: "q2",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "q4",
                    with: "n",
                    to: "BEGIN_FINAL",
                    push: null,
                    pop: null,
                }),
                Immutable.Map({
                    from: "bing0",
                    with: "ε",
                    to: "q01",
                    pop: null,
                    push: null,
                }),
            ])
        )
    ).toBe(true);
});

{
    // Setup Premade Machines
    const machine1 = fromDBEntry({
        ...getNewMachine(MachineType.FINITE_STATE_MACHINE, true),
        states: [
            { id: "q0", isEntry: true, isExit: false },
            { id: "q1", isEntry: false, isExit: true },
            { id: "q2", isEntry: false, isExit: true },
        ],
        entryAlphabet: ["1"],
        transitions: [
            {
                from: "q0",
                to: {
                    newState: "q1",
                    writeSymbol: null,
                    headDirection: null,
                },
                with: {
                    head: "1",
                    memory: null,
                },
            },
            {
                from: "q2",
                to: {
                    newState: "q1",
                    writeSymbol: null,
                    headDirection: null,
                },
                with: {
                    head: "1",
                    memory: null,
                },
            },
        ],
    });
    const machine2 = fromDBEntry({
        ...getNewMachine(MachineType.FINITE_STATE_MACHINE, true),
        states: [
            { id: "a", isEntry: true, isExit: false },
            { id: "b", isEntry: false, isExit: false },
            { id: "c", isEntry: false, isExit: true },
            { id: "d", isEntry: false, isExit: true },
            { id: "e", isEntry: false, isExit: true },
            { id: "f", isEntry: false, isExit: false },
        ],
        entryAlphabet: ["0", "1"],
        transitions: [
            {
                from: "a",
                to: {
                    newState: "b",
                    writeSymbol: null,
                    headDirection: null,
                },
                with: {
                    head: "0",
                    memory: null,
                },
            },
            {
                from: "b",
                to: {
                    newState: "a",
                    writeSymbol: null,
                    headDirection: null,
                },
                with: {
                    head: "0",
                    memory: null,
                },
            },
            {
                from: "b",
                to: {
                    newState: "d",
                    writeSymbol: null,
                    headDirection: null,
                },
                with: {
                    head: "1",
                    memory: null,
                },
            },
            {
                from: "a",
                to: {
                    newState: "c",
                    writeSymbol: null,
                    headDirection: null,
                },
                with: {
                    head: "1",
                    memory: null,
                },
            },
            {
                from: "c",
                to: {
                    newState: "e",
                    writeSymbol: null,
                    headDirection: null,
                },
                with: {
                    head: "0",
                    memory: null,
                },
            },
            {
                from: "c",
                to: {
                    newState: "f",
                    writeSymbol: null,
                    headDirection: null,
                },
                with: {
                    head: "1",
                    memory: null,
                },
            },
            {
                from: "d",
                to: {
                    newState: "e",
                    writeSymbol: null,
                    headDirection: null,
                },
                with: {
                    head: "0",
                    memory: null,
                },
            },
            {
                from: "d",
                to: {
                    newState: "f",
                    writeSymbol: null,
                    headDirection: null,
                },
                with: {
                    head: "1",
                    memory: null,
                },
            },
            {
                from: "e",
                to: {
                    newState: "e",
                    writeSymbol: null,
                    headDirection: null,
                },
                with: {
                    head: "0",
                    memory: null,
                },
            },
            {
                from: "e",
                to: {
                    newState: "f",
                    writeSymbol: null,
                    headDirection: null,
                },
                with: {
                    head: "1",
                    memory: null,
                },
            },
            {
                from: "f",
                to: {
                    newState: "f",
                    writeSymbol: null,
                    headDirection: null,
                },
                with: {
                    head: "0",
                    memory: null,
                },
            },
            {
                from: "f",
                to: {
                    newState: "f",
                    writeSymbol: null,
                    headDirection: null,
                },
                with: {
                    head: "1",
                    memory: null,
                },
            },
        ],
    });
    // Set Tests
    test("[getReachableStates] Test Working", () => {
        // Setup
        // SUT
        const states = getReachableStates(machine1);
        // Assert
        expect(
            states.equals(
                Immutable.Set([
                    Immutable.Map({
                        id: "q0",
                        isEntry: true,
                        isExit: false,
                    }),
                    Immutable.Map({
                        id: "q1",
                        isEntry: false,
                        isExit: true,
                    }),
                ])
            )
        );
    });

    test("[getUnreachableStates] Test Working", () => {
        // Setup
        // SUT
        const states = getUnreachableStates(machine1);
        // Assert
        expect(
            states.equals(
                Immutable.Set([
                    Immutable.Map({
                        id: "q2",
                        isEntry: false,
                        isExit: true,
                    }),
                ])
            )
        );
    });

    test("[getStatesThatReachStateInSetBy] Test Working", () => {
        // Setup
        const mstates = machine2.get("states") as IMachine["states"];
        const toStates = Immutable.Set([mstates.get("e")]);
        // SUT
        const states = getStatesThatReachStateInSetBy(machine2, toStates, "0");
        // Assert
        expect(states.size).toBe(3);
    });

    test("[getEquivalentClasses] Test Working", () => {
        // Setup
        // SUT
        const equivalentClasses = getEquivalentClasses(machine2);
        // Assert
        expect(equivalentClasses.size).toBe(3);
    });

    test("[minimize] Test Working", () => {
        // Setup
        // SUT
        const minimizedMachine = minimize(machine2);
        // Assert
        expect(
            (minimizedMachine.get("states") as IMachine["states"]).size
        ).toBe(2);
    });

    test("[removeDeadStates] Test Working", () => {
        // Setup
        // SUT
        const notDeadMachine = removeDeadStates(machine2);
        // Assert
        expect(notDeadMachine.getIn(["states", "f"])).toBeFalsy();
    });
}
