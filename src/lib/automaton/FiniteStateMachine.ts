import { MachineDBEntry, MachineType } from "@database/schema/machine";
import { IState } from "./State";
import Alphabet from "../Alphabet";
import AlphabetSymbol from "../AlphabetSymbol";
import { Tuple } from "../utils";

interface IFiniteAutomaton {
    id: string;
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

    toString: () => string;
}

interface IMachine {
    id: string;
}

class FiniteStateMachine implements IFiniteAutomaton {
    removeState: (state: IState) => void;
    addTransition: (state: IState, reading: AlphabetSymbol, target: IState) => void;
    getTransitions: () => Tuple<Tuple<IState, AlphabetSymbol>, IState>[];
    getEntryState: () => IState;
    getExitStates: () => Set<IState>;
    unExit: (state: IState) => void;
    id: string;

    states: Set<IState>;

    alphabet: Alphabet;

    transitions: Array<Tuple<Tuple<IState, AlphabetSymbol>, IState>>;

    entry: IState;

    exitStates: Set<IState>;

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

    toString(): string {
        const x: MachineDBEntry = {
            id: this.id,
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
export type Tuple<T1, T2> = [T1, T2];
export type Tuple<T1, T2> = [T1, T2];
