// Import Dependencies
import Immutable from "immutable";
import { inspect } from "util";
import { getNewMachine, MachineType } from "@/database/schema/machine";
import { IGrammar } from "@/lib/grammar/Grammar";
import { convertFiniteStateMachineToRegularGrammar } from "../../lib/conversion";
import { fromDBEntry as machineFromDB } from "../../lib/automaton/Machine";
// Defne Setup
const machine1 = machineFromDB({
    ...getNewMachine(MachineType.FINITE_STATE_MACHINE, true),
    states: [
        {
            id: "q0",
            isEntry: true,
            isExit: false,
        },
        {
            id: "q1",
            isEntry: false,
            isExit: false,
        },
        {
            id: "q2",
            isEntry: false,
            isExit: false,
        },
        {
            id: "q3",
            isEntry: false,
            isExit: true,
        },
        {
            id: "q4",
            isEntry: false,
            isExit: false,
        },

        {
            id: "q5",
            isEntry: false,
            isExit: true,
        },
    ],
    entryAlphabet: ["a"],
    transitions: [
        {
            from: "q0",
            with: {
                head: "a",
                memory: null,
            },
            to: {
                newState: "q1",
                headDirection: null,
                writeSymbol: null,
            },
        },
        {
            from: "q1",
            with: {
                head: "a",
                memory: null,
            },
            to: {
                newState: "q3",
                headDirection: null,
                writeSymbol: null,
            },
        },
        {
            from: "q3",
            with: {
                head: "a",
                memory: null,
            },
            to: {
                newState: "q1",
                headDirection: null,
                writeSymbol: null,
            },
        },
        {
            from: "q0",
            with: {
                head: "a",
                memory: null,
            },
            to: {
                newState: "q2",
                headDirection: null,
                writeSymbol: null,
            },
        },
        {
            from: "q2",
            with: {
                head: "a",
                memory: null,
            },
            to: {
                newState: "q4",
                headDirection: null,
                writeSymbol: null,
            },
        },
        {
            from: "q4",
            with: {
                head: "a",
                memory: null,
            },
            to: {
                newState: "q5",
                headDirection: null,
                writeSymbol: null,
            },
        },
        {
            from: "q5",
            with: {
                head: "a",
                memory: null,
            },
            to: {
                newState: "q2",
                headDirection: null,
                writeSymbol: null,
            },
        },
    ],
});
// Execute Tests
test("[convertFiniteStateMachineToRegularGrammar]", () => {
    // Setup
    // SUT
    const grammar = convertFiniteStateMachineToRegularGrammar(machine1, false);
    // Assert
    expect(
        (grammar.get("productionRules") as IGrammar["productionRules"]).equals(
            Immutable.Map([
                [
                    Immutable.List(["q0"]),
                    Immutable.Set([
                        Immutable.List(["a", "q1"]),
                        Immutable.List(["a", "q2"]),
                    ]),
                ],
                [
                    Immutable.List(["q1"]),
                    Immutable.Set([
                        Immutable.List(["a", "q3"]),
                        Immutable.List(["a"]),
                    ]),
                ],
                [
                    Immutable.List(["q3"]),
                    Immutable.Set([Immutable.List(["a", "q1"])]),
                ],
                [
                    Immutable.List(["q2"]),
                    Immutable.Set([Immutable.List(["a", "q4"])]),
                ],
                [
                    Immutable.List(["q4"]),
                    Immutable.Set([
                        Immutable.List(["a", "q5"]),
                        Immutable.List(["a"]),
                    ]),
                ],
                [
                    Immutable.List(["q5"]),
                    Immutable.Set([Immutable.List(["a", "q2"])]),
                ],
            ])
        )
    ).toBeTruthy();
});
