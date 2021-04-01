import Immutable from "immutable";
import {
    MachineDBEntry,
    MachineType,
    MachineMemoryDirection,
} from "../../database/schema/machine";
import { IIState, IState } from "./State";
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
        // console.log((machine.get("alphabet") as IAlphabet).toJS());
        // console.log(symbol);
        // console.log(getTransitionsOfStateAsIDSet(machine, from, symbol).toJS());
        return accum.push(getTransitionsOfStateAsIDSet(machine, from, symbol));
    }, Immutable.List<Immutable.List<string | Immutable.Set<string | Immutable.List<string>>>>());
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
    return epsilonSet;
};

export const determinize = (machine: IIMachine): IIMachine => {
    // clone the machine to return
    let clonedMachine = machine;
    const hasEpsilon = findOutIfHasEpsilonTransition(machine);
    if (hasEpsilon) {
        // TODO
    } else {
        // add states as ids to set
        let stateStack = (machine.get("states") as IIState)
            .keySeq()
            .reduce((accum, id) => accum.push(id), Immutable.List());

        const stateSeenSetInit = (machine.get("states") as IIState)
            .keySeq()
            .reduce((accum, id) => accum.add(id), Immutable.Set());

        let state;
        // for every state
        while (!stateStack.isEmpty()) {
            state = stateStack.last();
            stateStack = stateStack.pop();
            // find transitions of this (these) state(s)
            const {
                iteratedMachine: machineIterated,
            } = getAllTransitionsOfStateAsIDSet(machine, state).reduce(
                (acc, elemt) => {
                    let { stateSeenSet, iteratedMachine } = acc;
                    const { currState } = acc;
                    // console.log(elemt.toJS())
                    // if ((elemt.last() as Immutable.Set<string>).isSubset(stateStack))
                    if ((elemt.last() as Immutable.Set<string>).size > 1) {
                        if (
                            !stateSeenSet.isSuperset([
                                elemt.last() as Immutable.Set<string>,
                            ])
                        ) {
                            // new state set

                            iteratedMachine = addState(iteratedMachine, {
                                id: (elemt.last() as Immutable.Set<string>)
                                    .sort()
                                    .join(),
                                isEntry: false,
                                isExit: isAnyExitState(
                                    machine,
                                    elemt.last() as Immutable.Set<string>
                                ),
                            } as IState);
                            // add this new state to the set
                            stateSeenSet = stateSeenSet.add(elemt.last());
                        }
                        // already exists state set, but new state or symbol takes to it
                        // must modify transitions of this state
                        iteratedMachine = addTransition(iteratedMachine, {
                            from: currState,
                            with: elemt.first() as ASymbol,
                            to: (elemt.last() as Immutable.Set<string>)
                                .sort()
                                .join(),
                            push: null,
                            pop: null,
                        } as ITransition);
                        (elemt.last() as Immutable.Set<string>).forEach(
                            (element) => {
                                iteratedMachine = removeTransition(
                                    iteratedMachine,
                                    {
                                        from: currState,
                                        with: elemt.first() as ASymbol,
                                        to: element as ASymbol,
                                        push: null,
                                        pop: null,
                                    } as ITransition
                                );
                            }
                        );
                    }
                    return {
                        stateSeenSet,
                        iteratedMachine,
                        currState,
                    };
                },
                {
                    stateSeenSet: stateSeenSetInit,
                    iteratedMachine: clonedMachine,
                    currState: state,
                }
            );
            clonedMachine = machineIterated;
        }
    }
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

export const getReachableStates = (
    machine: IIMachine,
    specificState?: IIState
): Immutable.Set<IIState> => {
    // Setup
    const initalState = specificState ?? (machine.get("entry") as IIState);
    let reachableStates = Immutable.Set<IIState>([initalState]);
    let newStates = Immutable.Set<IIState>([initalState]);
    // Iterate Over New States (Processing List)
    do {
        // Create Temp Set
        let temp = Immutable.Set<IIState>();
        newStates.forEach((fromState) => {
            const fromStateReachable = (machine.get(
                "transitions"
            ) as IMachine["transitions"])
                .filter(
                    (transition) =>
                        transition.get("from") === fromState.get("id")
                )
                .map((transitionFromSpecificState) =>
                    (machine.get("states") as IMachine["states"]).get(
                        transitionFromSpecificState.get("to")
                    )
                );
            temp = temp.union(fromStateReachable);
        });
        newStates = temp.subtract(reachableStates);
        reachableStates = reachableStates.union(newStates);
    } while (!newStates.isEmpty());

    return reachableStates;
};

export const getUnreachableStates = (
    machine: IIMachine
): Immutable.Set<IIState> =>
    (machine.get("states") as IMachine["states"])
        .toSet()
        .subtract(getReachableStates(machine));

export const getStatesThatReachStateInSetBy = (
    machine: IIMachine,
    toStates: Immutable.Set<IIState>,
    alphabetSymbol: ASymbol
): Immutable.Set<IIState> => {
    // Fetch Machine Data
    const states = machine.get("states") as IMachine["states"];
    const transitions = machine.get("transitions") as IMachine["transitions"];
    // Iterate to find out what states can reach the given state
    const statesThatReach = transitions.reduce((stateSet, transition) => {
        if (
            toStates.includes(states.get(transition.get("to"))) &&
            transition.get("with") === alphabetSymbol
        ) {
            return stateSet.add(states.get(transition.get("from")));
        }
        return stateSet;
    }, Immutable.Set<IIState>());
    return statesThatReach;
};

export const getEquivalentClasses = (
    machine: IIMachine
): Immutable.Set<Immutable.Set<IIState>> => {
    // Based on Hopcroft´s Algorithm
    // Pre-Setup
    const allStates = (machine.get("states") as IMachine["states"]).toSet();
    const exitSet = (machine.get(
        "exitStates"
    ) as IMachine["exitStates"]).toSet();
    // Algorithm Setup
    let P = Immutable.Set([exitSet, allStates.subtract(exitSet)]);
    let W = Immutable.Set([exitSet]);
    // While Working (W) not empty
    while (!W.isEmpty()) {
        // Choose and remove a set A in W
        const A = W.first<Immutable.Set<IIState>>();
        W = W.delete(A);
        // Iterate over alphabet
        for (const alphabetSymbol of machine.get(
            "alphabet"
        ) as IMachine["alphabet"]) {
            // Get states that can reach a state in A with alphabetSymbol
            const X = getStatesThatReachStateInSetBy(
                machine,
                A,
                alphabetSymbol
            );
            // Y is a set in P which X ∩ Y is nonempty
            const grpY = P.filter(
                (Y) => !X.intersect(Y).isEmpty() && !Y.subtract(X).isEmpty()
            );

            // console.log("Group Y \n", grpY.toJS());

            for (const Y of grpY) {
                const XintersectsY = X.intersect(Y);
                const YsubtractX = Y.subtract(X);
                P = P.delete(Y).add(XintersectsY).add(YsubtractX);

                if (W.includes(Y)) {
                    W = W.delete(Y).add(XintersectsY).add(YsubtractX);
                } else if (XintersectsY.size <= YsubtractX.size) {
                    W = W.add(XintersectsY);
                } else {
                    W = W.add(YsubtractX);
                }
            }
        }
    }
    // Return Partitions
    return P;
};

export const removeUnreachableStates = (machine: IIMachine): IIMachine => {
    // Get Only Reachable States
    const reachableStates = Immutable.Map<string, IIState>(
        getReachableStates(machine).map((state) => [
            state.get("id") as string,
            state,
        ])
    );
    // Remove Unreacheable States and Its transactions
    let machineReachable = machine.set("states", reachableStates);
    // Recompute Entry
    machineReachable = machine.set(
        "entry",
        reachableStates.find((state) => state.get("isEntry") as boolean)
    );
    // Recompute Exit States
    machineReachable = machine.set(
        "exitStates",
        reachableStates.filter((state) => state.get("isExit") as boolean)
    );
    // Recompute Transitions
    machineReachable = machineReachable.update(
        "transitions",
        (transitions: IMachine["transitions"]) =>
            transitions.filter((transition) =>
                (machineReachable.get("states") as IMachine["states"]).has(
                    transition.get("to")
                )
            )
    );
    // Return Recomputed Machine
    return machineReachable;
};

export const removeDeadStates = (machine: IIMachine) => {
    // Detect Not Dead States
    const notDeadStates = (machine.get(
        "transitions"
    ) as IMachine["transitions"])
        .reduce(
            (notDeads, transition) =>
                transition.get("from") !== transition.get("to")
                    ? notDeads.add(
                          (machine.get("states") as IMachine["states"]).get(
                              transition.get("from")
                          )
                      )
                    : notDeads,
            Immutable.Set<IIState>()
        )
        .union((machine.get("exitStates") as IMachine["exitStates"]).toSet());
    // Update Entry State
    const notDeadMachine = machine
        .set(
            "states",
            notDeadStates.toMap().mapKeys((state) => state.get("id") as string)
        )
        .set(
            "entry",
            notDeadStates.find((state) => state.get("isEntry") as boolean)
        )
        .update("transitions", (transitions: IMachine["transitions"]) =>
            transitions.filter((transition) =>
                notDeadStates.find(
                    (state) => state.get("id") === transition.get("to")
                )
            )
        );
    // Return Not Dead Machine
    return notDeadMachine;
};

export const minimize = (machine: IIMachine): IIMachine => {
    // Remove Unreacheable States
    const reacheableMachine = removeUnreachableStates(machine);
    // Remove Dead States
    const notDeadMachine = removeDeadStates(reacheableMachine);
    // Union Equivalent Clases
    const equivalentClasses = getEquivalentClasses(notDeadMachine);
    // Transform Equivalent Classes In States
    const newStatesMapping = Immutable.Map<Immutable.Set<IIState>, IIState>(
        equivalentClasses.toIndexedSeq().map((eqClass, idx) => [
            eqClass,
            Immutable.Map({
                id: `q${idx}`,
                isEntry: eqClass.some((state) => !!state.get("isEntry")),
                isExit: eqClass.some((state) => !!state.get("isExit")),
            }) as IIState,
        ])
    );
    const newStates = newStatesMapping.mapKeys(
        (_, newState) => newState.get("id") as string
    );
    // Get a translation table from old States to new States
    const newStatesIdMapping: Immutable.Map<string, string> = Immutable.Map(
        newStatesMapping.flatMap((newState, oldStates) =>
            oldStates
                .toKeyedSeq()
                .mapEntries(([oldState]) => [
                    oldState.get("id") as string,
                    newState.get("id") as string,
                ])
        )
    );
    // Compute new Transitions
    const newTransitions = Immutable.Set<IITransition>(
        (notDeadMachine.get("transitions") as IMachine["transitions"]).reduce(
            (accTransitions, transition) => {
                return accTransitions.add(
                    transition
                        .update("from", (from) => newStatesIdMapping.get(from))
                        .update("to", (to) => newStatesIdMapping.get(to))
                );
            },
            Immutable.Set()
        )
    );
    // Compute new Entry State
    const newEntryState = newStates.find(
        (newState) => newState.get("isEntry") as boolean
    );
    // Compute new Exit States
    const newExitStates = newStates.filter(
        (newState) => newState.get("isExit") as boolean
    );
    // Get Minimized Machine
    const minimizedMachine = notDeadMachine
        .set("states", newStates)
        .set("entry", newEntryState)
        .set("exitStates", newExitStates)
        .set("transitions", newTransitions);
    // Return Minimized Machine
    return minimizedMachine;
};
