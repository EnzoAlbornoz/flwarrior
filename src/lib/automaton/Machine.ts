import Immutable from "immutable";
import {
    MachineDBEntry,
    MachineType,
    MachineMemoryDirection,
} from "../../database/schema/machine";
import { IIState, IState } from "./State";
import { IAlphabet } from "../Alphabet";
import { ASymbol } from "../AlphabetSymbol";

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
