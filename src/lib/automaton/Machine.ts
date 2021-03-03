import { MachineDBEntry, MachineType } from "../../database/schema/machine";
import { IState, State } from "./State";
import Alphabet from "../Alphabet";
import AlphabetSymbol from "../AlphabetSymbol";
import { Tuple } from "../utils";
import { Grammar } from "../grammar/Grammar";
import { PassThrough } from "stream";

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

interface IMachine {
    id: string;
}

// class FSMachine implements IMachine {

// }

export class FiniteStateMachine implements IFiniteAutomaton {
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
            transitions:
            Array<Tuple<Tuple<IState, AlphabetSymbol>, IState>>,
            entry: IState,
            exitStates: Set<IState>) {
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
        state.isExit = true;
        this.exitStates.add(state);
    }

    unExit(state: IState) {
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
