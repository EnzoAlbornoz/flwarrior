import Immutable from "immutable";
import {
    MachineDBEntry,
    MachineType,
    MachineMemoryDirection,
} from "../../database/schema/machine";
import { getNewState, IIState, IState } from "./State";
import { IAlphabet } from "../Alphabet";
import { ASymbol, EPSILON } from "../AlphabetSymbol";

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
        // console.debug(`[Machine] Changing name from ${old} to ${newName}`);
        return newName;
    });

export const addState = (machine: IIMachine, newState: IState): IIMachine =>
    machine.update("states", (states: IMachine["states"]) => {
        if (newState.id === "") return states;
        // console.debug(`[Machine] Adding state ${newState.id}`);
        return states.find((_, v) => v === newState.id)
            ? // ? new Error("State Already Exists!")
              states
            : states.set(newState.id, Immutable.Map(newState) as IIState);
    });

export const removeState = (machine: IIMachine, state: IState): IIMachine =>
    machine.update("states", (states: IMachine["states"]) => {
        // console.debug(`[Machine] Removing state ${state.id}`);
        return states.remove(state.id);
    });

export const addAlphabetSymbol = (
    machine: IIMachine,
    newSymbol: ASymbol
): IIMachine =>
    machine.update("alphabet", (alphabet: IMachine["alphabet"]) => {
        // console.debug(`[Machine] Adding new Alphabet Symbol ${newSymbol}`);
        return alphabet.add(newSymbol);
    });

export const removeAlphabetSymbol = (
    machine: IIMachine,
    symbol: ASymbol
): IIMachine =>
    machine.update("alphabet", (alphabet: IMachine["alphabet"]) => {
        // console.debug(`[Machine] Removing Alphabet Symbol ${symbol}`);
        return alphabet.remove(symbol);
    });

export const getTransitionsOfStateAsIDSet = (
    machine: IIMachine,
    from: IState["id"],
    _with: ASymbol
): Immutable.List<string | Immutable.Set<string | Immutable.List<string>>> => {
    // returns [simbol, {{state1, state2}}]
    const transitions = (machine.get(
        "transitions"
    ) as Immutable.Set<IITransition>).filter(
        (transition: IITransition) =>
            transition.get("from") === from &&
            transition.get("with") === _with &&
            transition.get("with") !== EPSILON
    );
    const returnSet = Immutable.List([
        _with,
        transitions.map((transition) => transition.get("to")),
    ]);
    if ((returnSet.last() as Immutable.Set<string>).size > 1)
        return Immutable.List([
            returnSet.first(),
            Immutable.Set(
                Immutable.List(returnSet.last() as Immutable.Set<string>)
            ),
        ]);
    return returnSet;
};

export const getAllTransitionsOfStateAsIDSet = (
    machine: IIMachine,
    from: IState["id"]
): Immutable.List<
    Immutable.List<string | Immutable.Set<string | Immutable.List<string>>>
> => {
    // returns [[simbol1, {{state1, state2}}], [simbol2, {[state1, state2]}]]
    return (machine.get("alphabet") as IAlphabet).reduce((accum, symbol) => {
        if (symbol === EPSILON) return accum;
        return accum.push(getTransitionsOfStateAsIDSet(machine, from, symbol));
    }, Immutable.List<Immutable.List<string | Immutable.Set<string | Immutable.List<string>>>>());
};

export const getAllTransitionsOfStateAsIDMapSplitOnCharacter = (
    machine: IIMachine,
    from: IState["id"],
    character = ","
): Immutable.Map<string, Immutable.Set<string>> => {
    // returns { '0': [ 'r', 's' ], '1': [ 'q', 'r', 'p' ] }
    let symbolToStateSetMap = Immutable.Map<string, Immutable.Set<string>>();
    from.split(character).forEach((state) => {
        getAllTransitionsOfStateAsIDSet(machine, state).forEach((tran) => {
            symbolToStateSetMap = symbolToStateSetMap.set(
                tran.first() as string,
                (symbolToStateSetMap.get(
                    tran.first() as string,
                    tran.last()
                ) as Immutable.Set<string>).union(
                    tran.last() as Immutable.Set<string>
                )
            );
        });
    });
    return symbolToStateSetMap;
};

export const findOutIfHasEpsilonTransition = (machine: IIMachine): boolean => {
    return (
        (machine.get("transitions") as Immutable.Set<IITransition>).find(
            (transition) => transition.get("with") === "ε"
        ) !== undefined
    );
};

export const getTransitionsOfState = (
    machine: IIMachine,
    from: IState["id"]
): Immutable.Set<IITransition> =>
    (machine.get("transitions") as Immutable.Set<IITransition>).filter(
        (transition: IITransition) => transition.get("from") === from
    );

export const isAnyExitState = (
    machine: IIMachine,
    stateSet: Immutable.Set<string>
): boolean =>
    stateSet.some(
        (stateId) =>
            ((machine.get("states") as IMachine["states"]).get(
                stateId
            ) as IIState).get("isExit") as IState["isExit"]
    );

export const addTransition = (
    machine: IIMachine,
    transition: ITransition
): IIMachine =>
    machine.update(
        "transitions",
        Immutable.Set<IITransition>(),
        (transitions: Immutable.Set<IITransition>) => {
            // console.debug(`[Machine] Adding transition from ${transition.from} to ${transition.to} when ${transition.with} occours`);
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
        // console.debug(`[Machine] Removing transition [(${transitionRef.from}) ==(${transitionRef.with})=> (${transitionRef.to})]`);
        return transitions.remove(Immutable.Map(transitionRef) as IITransition);
    });

export const setEntryState = (
    machine: IIMachine,
    stateRef: IState
): IIMachine =>
    machine
        .update("states", (states: IMachine["states"]) =>
            states.map((state, stateId) => {
                if (stateId === stateRef.id) {
                    // console.debug(`[Machine] Changing entry state of ${stateRef.id}`);
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

export const getEpsilonClosureOfAllStates = (
    machine: IIMachine
): Immutable.Map<string, Immutable.Set<string>> => {
    let epsilonClosures = Immutable.Map<string, Immutable.Set<string>>();
    epsilonClosures = (machine.get("states") as Immutable.Map<
        string,
        IIState
    >).reduce((epsilonClosuresAcc, _, key) => {
        return (epsilonClosuresAcc as Immutable.Map<
            string,
            Immutable.Set<string>
        >).set(
            key,
            findEpsilonCLosureOfState(machine, key, Immutable.Set<string>())
        );
    }, epsilonClosures);
    return epsilonClosures;
};

export const findEpsilonCLosureOfState = (
    machine: IIMachine,
    from: IState["id"],
    current_iteration: Immutable.Set<string>
): Immutable.Set<string> => {
    let epsilonSet = current_iteration;
    // By definition the epsilon closure of q0 contains q0.
    epsilonSet = epsilonSet.add(from);

    // Add states which are reachable by ε
    (machine.get("states") as Immutable.Map<string, IIState>)
        .keySeq()
        .forEach((state) => {
            (getTransitionsOfState(
                machine,
                state
            ) as Immutable.Set<IITransition>).forEach((transition) => {
                if (
                    transition.get("from") === from &&
                    transition.get("with") === EPSILON &&
                    !current_iteration.contains(transition.get("to"))
                ) {
                    // add ε-closure of the state reachable by ε.
                    epsilonSet = epsilonSet.union(
                        findEpsilonCLosureOfState(
                            machine,
                            transition.get("to"),
                            epsilonSet
                        )
                    );
                }
            });
        });
    return epsilonSet.sort();
};

export const determinize = (machine: IIMachine): IIMachine => {
    // clone the machine to return
    let clonedMachine = machine;
    const hasEpsilon = findOutIfHasEpsilonTransition(machine);
    if (hasEpsilon) {
        // change transitions in original machine so they take to the epsilon closures
        // find epsilon closure of each state
        let epsilonClosureMap = getEpsilonClosureOfAllStates(clonedMachine);
        // Remove the epsilon transitions
        (clonedMachine.get("transitions") as Immutable.Set<IITransition>).forEach(
            (transition) => {
                if ((transition as IITransition).get("with") === EPSILON)
                clonedMachine = removeTransition(
                    clonedMachine,
                        transition.toObject() as ITransition
                    );
            }
        );
        
        // creating the new state
        let currentEntryStateString = (clonedMachine.get("entry") as IIState).get("id") as string;
        const newStateId = epsilonClosureMap.get(currentEntryStateString).sort().join();
        const newEntryState = {
            id: newStateId,
            isEntry: true,
            isExit: isAnyExitState(clonedMachine, epsilonClosureMap.get(currentEntryStateString)),
        } as IState;
        // Set the new entry
        clonedMachine = setEntryState(clonedMachine, newEntryState);
        
        // remove epsilon from its alphabet
        clonedMachine = removeAlphabetSymbol(clonedMachine, EPSILON);
        
        // every transition which took to a state n, will now take to the epsilon-closure of n
        // in practice we iterate over each original transition get the epsilon-closure of the target state
        // then add transitions from each state in the closure to it
        for (const transition of clonedMachine.get("transitions")) {
            for (const [key, epsilonClosure] of epsilonClosureMap.entries()) {
                if (key === (transition as IITransition).get("to"))
                for (const state of epsilonClosure ) {
                    // if (key !== state)
                    clonedMachine = addTransition(clonedMachine, {
                        from: (transition as IITransition).get("from"),
                        with: (transition as IITransition).get("with"),
                        to: state,
                        push: null,
                        pop: null,
                    });
                }
            }
        }

        clonedMachine = clonedMachine.set("states" , (clonedMachine.get("states") as IIState).removeAll((clonedMachine.get("states") as IIState).keys()));
        clonedMachine = addState(clonedMachine, newEntryState);
    }
        let stateStack = (clonedMachine.get("states") as IIState)
            .keySeq()
            .reduce((accum, id) => accum.push(id), Immutable.List());
            
        let stateSeenSet = Immutable.Set();

        let state;
        // for every state
        while (!stateStack.isEmpty()) {
            state = stateStack.last() as string;
            stateStack = stateStack.pop();
            // find transitions of this (these) state(s)
            for (const [key, elemt] of getAllTransitionsOfStateAsIDMapSplitOnCharacter(hasEpsilon ? clonedMachine : machine, state))
                {
                    // let { stateSeenSet, iteratedMachine } = acc;
                    // const { currState } = acc;
                    // if ((elemt as Immutable.Set<string>).isSubset(stateStack))
                    // if ( state.split().length > 1)
                    if (!elemt.isEmpty()) {
                        let newStateId = (elemt as Immutable.Set<string>)
                            .sort()
                            .join();
                        if (
                            !stateSeenSet.isSuperset([
                                elemt as Immutable.Set<string>,
                            ])
                        ) {
                            // new state string
                            // create the new state
                            clonedMachine = addState(clonedMachine, {
                                id: newStateId,
                                isEntry: false,
                                isExit: isAnyExitState(
                                    machine,
                                    elemt as Immutable.Set<string>
                                ),
                            } as IState);
                            // create a transition to it, from the current state
                            clonedMachine = addTransition(clonedMachine, {
                                from: state,
                                with: key,
                                to: newStateId,
                                push: null,
                                pop: null,
                            } as ITransition);

                            // Add transitions from this new state to the states reachable by the new state's components
                            let symbolToStateSetMap = getAllTransitionsOfStateAsIDMapSplitOnCharacter(
                                machine,
                                state
                            );

                            for (const [key, value] of symbolToStateSetMap) {
                                let newMachine = addState(clonedMachine, {
                                    id: (value as Immutable.Set<string>)
                                        .sort()
                                        .join(),
                                    isEntry: false,
                                    isExit: isAnyExitState(
                                        machine,
                                        value as Immutable.Set<string>
                                    ),
                                } as IState);

                                if (clonedMachine !== newMachine) {
                                    clonedMachine = newMachine;
                                    if (
                                        !stateSeenSet.contains(
                                            (value as Immutable.Set<string>)
                                                .sort()
                                                .join()
                                        )
                                    ) {
                                        stateStack.push(
                                            (value as Immutable.Set<string>)
                                                .sort()
                                                .join()
                                        );
                                    }
                                }

                                // clonedMachine = addTransition(clonedMachine,
                                //     {
                                //         from: newStateId,
                                //         with: key as string,
                                //         to: (value as Immutable.Set<string>).sort().join(), // wrong
                                //         push: null,
                                //         pop: null
                                //     } as ITransition);
                            }

                            // Now we remove the transitions which pointed to the states we just merged
                            if (
                                (elemt as Immutable.Set<string>).toArray()
                                    .length != 1
                            )
                            for (const element of (elemt as Immutable.Set<string>)) {
                                    clonedMachine = removeTransition(
                                        clonedMachine,
                                        {
                                            from: state,
                                            with: key,
                                            to: element as ASymbol,
                                            push: null,
                                            pop: null,
                                        } as ITransition
                                    );
                                }
                            // add this new state to the set
                            stateSeenSet = stateSeenSet.add(elemt);

                            // Add this new state to the computationStack
                            stateStack = stateStack.push(newStateId);
                        } else {
                            // already exists state set, but new state or symbol takes to it
                            // must modify transitions of this state
                            for (const element of (elemt as Immutable.Set<string>)) {
                                    clonedMachine = removeTransition(
                                        clonedMachine,
                                        {
                                            from: state,
                                            with: key,
                                            to: element as ASymbol,
                                            push: null,
                                            pop: null,
                                        } as ITransition
                                    );
                                }
                            clonedMachine = addTransition(clonedMachine, {
                                from: state,
                                with: key,
                                to: newStateId,
                                push: null,
                                pop: null,
                            } as ITransition);
                        }
                    }
                    // return {
                    //     stateSeenSet,
                    //     iteratedMachine,
                    //     currState,
                    // };
                }
                // ,
                // {
                //     stateSeenSet: stateSeenSetInit,
                //     iteratedMachine: clonedMachine,
                //     currState: state,
                // }
            // clonedMachine = machineIterated;
        }
    // }
    return clonedMachine;
};

export const fromDBEntry = (dbEntry: MachineDBEntry): IIMachine => {
    const states = Immutable.Map(
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
    );

    return Immutable.Map<IMachine[keyof IMachine]>({
        id: dbEntry.id,
        name: dbEntry.name,
        entry: states.find((state) => !!state.get("isEntry")),
        states,
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
        exitStates: states.filter((state) => !!state.get("isExit")),
        type: dbEntry.type,
    }) as IIMachine;
};

export const toDBEntry = (machine: IIMachine): MachineDBEntry => {
    interface IMachineJS {
        id: string;
        name: string;
        entry: IState;
        states: Record<string, IState>;
        alphabet: Array<string>;
        transitions: Array<ITransition>;
        exitStates: Record<string, IState>;
        type: MachineType;
    }

    const intermediate = machine.toJS() as IMachineJS;
    return {
        id: intermediate.id,
        name: intermediate.name,
        states: Object.values(intermediate.states),
        entryAlphabet: intermediate.alphabet,
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
        type: intermediate.type,
        memoryAlphabet: null,
        deterministic: true,
    };
};
