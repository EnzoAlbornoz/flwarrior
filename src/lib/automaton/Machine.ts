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

export interface IMachine {
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

export const rename = (machine: IIMachine, newName: string): IIMachine =>
    machine.update("name", (old) => {
        console.debug(`[Machine] Changing name from ${old} to ${newName}`);
        return newName;
    });

export const addState = (machine: IIMachine, newState: IState): IIMachine =>
    machine.update("states", (states: IMachine["states"]) => {
        console.debug(`[Machine] Adding state ${newState.id}`);
        return states.find((_, v) => v === newState.id)
            ? // ? new Error("State Already Exists!")
              states
            : states.set(newState.id, Immutable.Map(newState) as IIState);
    });

export const removeState = (machine: IIMachine, state: IState): IIMachine =>
    machine.update("states", (states: IMachine["states"]) => {
        console.debug(`[Machine] Removing state ${state.id}`);
        return states.remove(state.id);
    });

export const addAlphabetSymbol = (
    machine: IIMachine,
    newSymbol: ASymbol
): IIMachine =>
    machine.update("alphabet", (alphabet: IMachine["alphabet"]) => {
        console.debug(`[Machine] Adding new Alphabet Symbol ${newSymbol}`);
        return alphabet.add(newSymbol);
    });

export const removeAlphabetSymbol = (
    machine: IIMachine,
    symbol: ASymbol
): IIMachine =>
    machine.update("alphabet", (alphabet: IMachine["alphabet"]) => {
        console.debug(`[Machine] Removing Alphabet Symbol ${symbol}`);
        return alphabet.remove(symbol);
    });

export const addTransition = (
    machine: IIMachine,
    transition: ITransition
): IIMachine =>
    machine.update(
        "transitions",
        Immutable.Set<IITransition>(),
        (transitions: Immutable.Set<IITransition>) => {
            console.debug(
                `[Machine] Adding transition from ${transition.from} to ${transition.to} when ${transition.with} occours`
            );
            return transitions.union([
                Immutable.Map(transition) as IITransition,
            ]);
        }
    );

export const removeTransition = (
    machine: IIMachine,
    transitionRef: ITransition
): IIMachine =>
    machine.update("transitions", (transitions: IMachine["transitions"]) => {
        console.debug(
            `[Machine] Removing transition [(${transitionRef.from}) ==(${transitionRef.with})=> (${transitionRef.to})]`
        );
        return transitions.remove(Immutable.Map(transitionRef) as IITransition);
    });

export const getTransitionsOfState = (
    machine: IIMachine,
    from: IState["id"]
): Immutable.Set<IITransition> =>
    (machine.get("transitions") as Immutable.Set<IITransition>).filter(
        (transition: IITransition) => transition.get("from") === from
    );

export const setEntryState = (
    machine: IIMachine,
    stateRef: IState
): IIMachine =>
    machine
        .update("states", (states: IMachine["states"]) =>
            states.map((state, stateId) => {
                if (stateId === stateRef.id) {
                    console.debug(
                        `[Machine] Changing entry state to ${stateRef.id}`
                    );
                    return state.update("isEntry", () => true);
                }
                return state.update("isEntry", () => false);
            })
        )
        // Update Cache
        .update("entry", () => Immutable.Map(stateRef) as IIState);

export const setAsExitState = (
    machine: IIMachine,
    stateRef: IState
): IIMachine =>
    machine
        .update("states", (states: IMachine["states"]) =>
            states.update(stateRef.id, (state) => {
                return state.update("isExit", () => true);
            })
        )
        // Update Cache
        .update("exitStates", (exitStates: IMachine["exitStates"]) => {
            return exitStates.set(
                stateRef.id,
                Immutable.Map(stateRef) as IIState
            );
        });

export const setAsNonExitState = (
    machine: IIMachine,
    stateRef: IState
): IIMachine =>
    machine
        .update("states", (states: IMachine["states"]) =>
            states.update(stateRef.id, (state) =>
                state.update("isExit", () => false)
            )
        )
        // Update Cache
        .update("exitStates", (exitStates: IMachine["exitStates"]) =>
            exitStates.remove(stateRef.id)
        );

// export const getTransitionsOfStateWithSymbolAsIDSet = (machine: IIMachine, from: IState["id"], _with: ASymbol): Immutable.Set<string> => {
//     return (machine.get("transitions") as Immutable.Set<IITransition>).filter(
//         (transition: IITransition) => (transition.get("from") === from && transition.get("with") === _with)
//     ).map((transition: IITransition) => transition.get("to")).map();
// }

export const findOutIfHasEpsilonTransition = (machine: IIMachine): boolean => {
    return (
        (machine.get("transitions") as Immutable.Set<IITransition>).find(
            (transition) => transition.get("with") === "ε"
        ) !== undefined
    );
};

// export const determinize = (machine: IIMachine): IIMachine => {
//     const hasEpsilon = findOutIfHasEpsilonTransition(machine);
//     if (hasEpsilon) {
//     } else {
//         const QAnon = Immutable.Set();
//         const initialStateId = (machine.get("entry") as IIState).get(
//             "id"
//         ) as string;
//         QAnon.add(initialStateId);
//         getTransitionsOfState(machine, initialStateId);
//     }
//     return machine;
// };

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
                    push: null,
                    pop: null,
                }) as IITransition;
            })
        ),
        exitStates: Immutable.Map() as IMachine["exitStates"],
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
