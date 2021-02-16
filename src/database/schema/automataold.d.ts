export enum MachineTypes {
    FINITE_STATE_MACHINE = "fsm",
    PUSHDOWN_MACHINE = "pdm",
    TURING_MACHINE = "trm",
}

export type State = string;
export type CharSymbol = string;
export type Direction = "left" | "right";

export interface Transition {
    from: State;
    with: {
        head: CharSymbol;
        memory: CharSymbol;
    };
    to: {
        newState: State;
        writeSymbol: CharSymbol;
        headDirection: Direction;
    };
}

export interface SerializedMachine {
    type: MachineTypes;
    deterministic: boolean;
    states: Array<State>;
    entryState: State;
    exitStates: Array<State>;
    entryAlphabet: Array<CharSymbol>;
    memoryAlphabet: Array<CharSymbol>;
    transitions: Array<Transition>;
}
