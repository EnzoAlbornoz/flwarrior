import Immutable from "immutable";
import { PassThrough } from "stream";
import {
    MachineDBEntry,
    MachineType,
    MachineMemoryDirection,
} from "../../database/schema/machine";
import { IIState, IState, State } from "./State";
import Alphabet, { IAlphabet } from "../Alphabet";
import AlphabetSymbol, { ASymbol } from "../AlphabetSymbol";
import { Tuple } from "../utils";
import Grammar from "../grammar/Grammar";
import grammar from "@/database/schema/grammar";

interface IFiniteAutomaton {
    id: string;
    name: string;
    states: Set<IState>;
    alphabet: Alphabet;
    transitions: Array<Tuple<Tuple<IState, AlphabetSymbol>, IState>>;
    entry: IState;
    exitStates: Set<IState>;
    addState: (state: IState) => void;
    removeState: (state: IState) => void;
    addTransition: (
        state: IState,
        reading: AlphabetSymbol,
        target: IState
    ) => void;
    getTransitions: () => Array<Tuple<Tuple<IState, AlphabetSymbol>, IState>>;
    getEntryState: () => IState;
    getExitStates: () => Set<IState>;
    setExitStates: (newExitStates: Set<IState>) => void;
    setAsEntry: (state: IState) => void;
    addToExits: (state: IState) => void;
    unExit: (state: IState) => void;
    // removeTransition: ()
    canTransition: (
        from: IState,
        to: IState,
        using?: AlphabetSymbol
    ) => boolean;
    fromDBEntry: (grammar: MachineDBEntry) => void;
    toString: () => string;
}

// interface IMachine {
//     id: string;
// }

// class FSMachine implements IMachine {

// }

export default class FiniteStateMachine implements IFiniteAutomaton {
    name: string;

    id: string;

    removeFromExits: (state: IState) => void;

    states: Set<IState>;

    alphabet: Alphabet;

    transitions: Array<Tuple<Tuple<IState, AlphabetSymbol>, IState>>;

    entry: IState;

    exitStates: Set<IState>;

    constructor(
        name: string,
        id: string,
        states: Set<IState>,
        alphabet: Alphabet,
        transitions: Array<Tuple<Tuple<IState, AlphabetSymbol>, IState>>,
        entry: IState,
        exitStates: Set<IState>
    ) {
        this.name = name;
        this.id = id;
        this.states = states;
        this.alphabet = alphabet;
        this.transitions = transitions;
        this.entry = entry;
        this.exitStates = exitStates;
    }

    addState(state: IState): void {
        this.states.add(state);
    }

    setAsEntry(state: IState) {
        this.entry.isEntry = false;
        this.entry = state;
        this.entry.isEntry = true;
    }

    addToExits(state: IState) {
        // eslint-disable-next-line no-param-reassign
        state.isExit = true;
        this.exitStates.add(state);
    }

    unExit(state: IState) {
        // eslint-disable-next-line no-param-reassign
        state.isExit = false;
        this.exitStates.delete(state);
    }

    unEntry() {
        this.entry.isEntry = false;
        this.entry = null;
    }

    removeState(state: IState): void {
        this.removeFromExits(state);
        this.states.delete(state);
        if (this.entry === state) {
            this.entry = null;
        }

        for (const [index, [[from], to]] of this.transitions.entries()) {
            if (to === state || from === state) {
                this.transitions.splice(index, 1);
            }
        }
    }

    addTransition(
        state: IState,
        reading: AlphabetSymbol,
        target: IState
    ): void {
        const toInsert: Tuple<Tuple<IState, AlphabetSymbol>, IState> = [
            [state, reading],
            target,
        ];
        if (this.transitions.includes(toInsert))
            console.log(
                `Already has this transition:${state}${reading}, will do nothing`
            );
        else this.transitions.push(toInsert);
    }

    getTransitions(): Array<Tuple<Tuple<IState, AlphabetSymbol>, IState>> {
        return this.transitions;
    }

    getEntryState(): IState {
        // TODO implement return this.entry cache
        for (const state of this.states) {
            if (state.isEntry) {
                return state;
            }
        }
        console.log(`No Entry state found`);
        return null;
    }

    getExitStates(): Set<IState> {
        return this.exitStates;
    }

    setExitStates(newExitStates: Set<IState>): void {
        this.exitStates = newExitStates;
        for (const state of this.exitStates) state.isExit = true;
    }

    canTransition(from: IState, to: IState, using?: AlphabetSymbol): boolean {
        for (const [
            index,
            [[here, lWith], there],
        ] of this.transitions.entries()) {
            if (
                (from === here && to === there && using === undefined) ||
                (from === here && to === there && using === lWith)
            )
                return true;
        }
        return false;
    }

    // transformToRegularGrammar(): Grammar {

    // }

    findOutIfHasEpsilonTransition(): boolean {
        this.transitions.forEach((element) => {
            if (element[0][1].equals(AlphabetSymbol.EPSILON)) return true;
        });
        return false;
    }

    determinize(): void {
        const hasEpsilon = this.findOutIfHasEpsilonTransition();
        if (hasEpsilon) {
        } else {
            const QAnon = [];
            QAnon.push(this.entry); // push initial state
            const transitionsOfEntry = QAnon[0];
        }
    }

    // findTransitionsOfState(
    //     state: IState
    // ): Array<Tuple<Tuple<IState, AlphabetSymbol>, IState>> {
    //     const stateTransitions = [];
    //     this.transitions.forEach((transition) => {
    //         if (transition[0][0].equals(state))
    //             stateTransitions.push(transition);
    //     });
    //     return stateTransitions;
    // }

    fromDBEntry(machine: MachineDBEntry): void {
        this.id = machine.id;
        this.name = machine.name;
        // this.type = machine.type;
        this.states = new Set(
            machine.states.map(
                (dbState) =>
                    new State(dbState.id, dbState.isEntry, dbState.isExit)
            )
        );
        this.alphabet = new Alphabet(
            new Set(
                machine.entryAlphabet.map(
                    (_string) => new AlphabetSymbol(_string)
                )
            )
        );
        this.transitions = machine.transitions.map((transition) => {
            return [
                [
                    new State(transition.from, false, false),
                    new AlphabetSymbol(transition.with.head),
                ],
                new State(transition.to.newState, false, false),
            ];
        });
    }
    // transitions: Array<Tuple<Tuple<IState, AlphabetSymbol>, IState>>;

    toString(): string {
        const x: MachineDBEntry = {
            id: this.id,
            name: this.name,
            type: MachineType.FINITE_STATE_MACHINE,
            deterministic: true,
            states: Array.from(this.states.values()),
            entryAlphabet: Array.from(this.alphabet.symbols.values()).map(
                (as) => as.symbol
            ),
            memoryAlphabet: null,
            transitions: this.transitions.map(([[state, alpbs], toState]) => {
                return {
                    from: state.id,
                    with: {
                        head: alpbs.symbol,
                        memory: null,
                    },
                    to: {
                        newState: toState.id,
                        writeSymbol: null,
                        headDirection: null,
                    },
                };
            }),
        };
        return JSON.stringify(x);
    }
}

// Immutability Port
// export type IGrammarWord = Immutable.List<ASymbol>;
export type ITransition = {
    from: IState["id"]; // State ID
    with: ASymbol;
    to: IState["id"]; // State ID
    push: ASymbol | null;
    pop: ASymbol | null;
};

export type IITransition = Immutable.Map<
    keyof ITransition,
    ITransition[keyof ITransition]
>;

interface IMachine {
    id: string;
    name: string;
    entry: IIState;
    states: Immutable.Map<string, IIState>;
    alphabet: IAlphabet;
    transitions: Immutable.Set<IITransition>;
    exitStates: Immutable.Map<string, IIState>;
    type: MachineType;
}

export type IIMachine = Immutable.Map<keyof IMachine, IMachine[keyof IMachine]>;

// export const determinize = (grammar: IIMachine) => void {
//     const hasEpsilon = this.findOutIfHasEpsilonTransition();
//     if (hasEpsilon) {
//     } else {
//         const QAnon = [];
//         QAnon.push(this.entry); // push initial state
//         const transitionsOfEntry = QAnon[0];
//     }
// }

export const determinize = (machine: IIMachine): IIMachine => {
    const hasEpsilon = findOutIfHasEpsilonTransition(machine);
    if (hasEpsilon) {
    } else {
        const QAnon = Immutable.Set();
        const initialStateId = (machine.get("entry") as IIState).get("id") as string;
        QAnon.add(initialStateId);
        getTransitionsOfState(machine, initialStateId);
    }
    return machine;
};

export const addTransition = (
    machine: IIMachine,
    transition: ITransition
): IIMachine =>
    machine.update(
        "transitions",
        Immutable.Set<IITransition>(),
        (old: Immutable.Set<IITransition>) =>
            old.union([Immutable.Map(transition) as IITransition])
    );

export const getTransitionsOfState = (machine: IIMachine, from: IState["id"]): Immutable.Set<IITransition> =>
    (machine.get("transitions") as Immutable.Set<IITransition>).filter(
        (transition: IITransition) => transition.get("from") === from
    );

// export const getTransitionsOfStateWithSymbolAsIDSet = (machine: IIMachine, from: IState["id"], _with: ASymbol): Immutable.Set<string> => {
//     return (machine.get("transitions") as Immutable.Set<IITransition>).filter(
//         (transition: IITransition) => (transition.get("from") === from && transition.get("with") === _with)
//     ).map((transition: IITransition) => transition.get("to")).map();
// }

export const findOutIfHasEpsilonTransition = (machine: IIMachine): boolean => {
    return (machine.get("transitions") as Immutable.Set<IITransition>).find(
        (transition) => transition.get("with") === "ε"
    ) == undefined
        ? false
        : true;
};

export const setEntry = (machine: IIMachine, state: IState): IIMachine =>
    machine.update(
        "entry",
        Immutable.Map<keyof IState, IState[keyof IState]>(),
        (_: IIState) => Immutable.Map(state) as IIState
    );

export const fromDBEntry = (dbEntry: MachineDBEntry): IIMachine => {
    return Immutable.Map<IMachine[keyof IMachine]>({
        id: dbEntry.id,
        name: dbEntry.name,
        entry: {} as IIState,
        states: Immutable.Map(
            dbEntry.states.map((machineState) => {
                return [
                    machineState.id,
                    Immutable.Map<IState[keyof IState]>({
                        id: machineState.id,
                        isEntry: machineState.isEntry,
                        isExit: machineState.isExit,
                    }) as IIState,
                ];
            })
        ),
        alphabet: Immutable.OrderedSet(dbEntry.entryAlphabet),
        transitions: Immutable.Set(
            dbEntry.transitions.map((transition) => {
                return Immutable.Map<ITransition[keyof ITransition]>({
                    from: transition.from,
                    with: transition.with.head,
                    to: transition.to.newState,
                    push: null, pop: null
                }) as IITransition;
            })
        ),
        exitStates: null,
        type: dbEntry.type,
    }) as IIMachine;
};

export const toDBEntry = (machine: IIMachine): MachineDBEntry => {
    interface IntermediateEntry
        extends Omit<MachineDBEntry, "states" | "transitions" | "exitStates"> {
        states: Record<string, IState>;
        transitions: Array<ITransition>;
        exitStates: Record<string, IState>;
    }

    const intermediate = machine.toJS() as IntermediateEntry;
    return {
        ...intermediate,
        states: Object.values(intermediate.states),
        transitions: intermediate.transitions.map((t) => ({
            from: t.from,
            with: {
                head: t.with,
                memory: null,
            },
            to: {
                newState: t.to,
                writeSymbol: t.pop || t.push,
                // eslint-disable-next-line no-nested-ternary
                headDirection: (t.pop
                    ? "left"
                    : t.push
                    ? "right"
                    : null) as MachineMemoryDirection,
            },
        })),
    };
};
