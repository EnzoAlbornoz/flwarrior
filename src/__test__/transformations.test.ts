/* eslint-disable import/no-extraneous-dependencies */
// Import Dependencies
import { expect, test } from "@jest/globals";
import Immutable from "immutable";
import {
    fromDBEntry,
    getEquivalentClasses,
    getReachableStates,
    getStatesThatReachStateInSetBy,
    getUnreachableStates,
    IMachine,
    minimize,
    removeDeadStates,
} from "../lib/automaton/Machine";
import { getNewMachine, MachineType } from "../database/schema/machine";
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
    expect((minimizedMachine.get("states") as IMachine["states"]).size).toBe(2);
});

test("[removeDeadStates] Test Working", () => {
    // Setup
    // SUT
    const notDeadMachine = removeDeadStates(machine2);
    // Assert
    expect(notDeadMachine.getIn(["states", "f"])).toBeFalsy();
});
