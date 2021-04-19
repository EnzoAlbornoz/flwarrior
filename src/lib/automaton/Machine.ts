import Immutable from "immutable";
import { v4 as uuid } from "uuid";
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
    machine.update("name", () => {
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
    return !!(machine.get("transitions") as Immutable.Set<IITransition>).find(
        (transition) => transition.get("with") === "ε"
    );
};

export const isMachineDeterministic = (machine: IIMachine): boolean => {
    if (findOutIfHasEpsilonTransition(machine)) {
        return false;
    }
    let stateTransitionSet = Immutable.Set();
    for (const transition of machine.get(
        "transitions"
    ) as IMachine["transitions"]) {
        const transitionId = Immutable.Seq([
            transition.get("from"),
            transition.get("with"),
        ]);
        if (stateTransitionSet.includes(transitionId)) {
            // console.log(
            //     `Broke on transition ${transitionId.toJS()} where it goes to ${transition.get(
            //         "to"
            //     )}`
            // );
            return false;
        }
        stateTransitionSet = stateTransitionSet.add(transitionId);
    }
    return true;
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
    let machineReachable = machine;
    machineReachable = machineReachable.set("states", reachableStates);
    // Recompute Entry
    machineReachable = machineReachable.set(
        "entry",
        reachableStates.find((state) => state.get("isEntry") as boolean)
    );
    // Recompute Exit States
    machineReachable = machineReachable.set(
        "exitStates",
        reachableStates.filter((state) => state.get("isExit") as boolean)
    );
    // Recompute Transitions
    machineReachable = machineReachable.update(
        "transitions",
        (transitions: IMachine["transitions"]) =>
            transitions.filter(
                (transition) =>
                    reachableStates.has(transition.get("to")) &&
                    reachableStates.has(transition.get("from"))
            )
    );
    // Return Recomputed Machine
    return machineReachable;
};

export const removeDeadStates = (machine: IIMachine): IIMachine => {
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

export const updateExitStatesCache = (machine: IIMachine): IIMachine => {
    return machine.set(
        "exitStates",
        (machine.get("states") as Immutable.Map<string, IIState>).filter(
            (state) => !!state.get("isExit")
        )
    );
};

export const updateEntryStateCache = (machine: IIMachine): IIMachine => {
    return machine.set(
        "entry",
        (machine.get("states") as Immutable.Map<string, IIState>).find(
            (state) => !!state.get("isEntry")
        )
    );
};

export const unionAlphabetsPlusEpsilon = (
    machine1: IIMachine,
    machine2: IIMachine
): IIMachine => {
    const clonedMachine = machine1;
    return clonedMachine.set(
        "alphabet",
        (machine1.get("alphabet") as IAlphabet).union(
            machine2.get("alphabet") as IAlphabet,
            Immutable.OrderedSet(EPSILON)
        ) as IAlphabet
    );
};

export const complement = (
    machine: IIMachine,
    deadStateId = "_DSFC_"
): IIMachine => {
    // must be DFA
    if (!isMachineDeterministic(machine)) {
        // eslint-disable-next-line no-console
        console.error("asked for complement on non-deterministic machine");
        return machine;
    }
    let clonedMachine = machine;
    // Before we simply switch accepting with non accepting states
    // We have to first create a dead state and make every state that doesn't
    // have transitions with all symbols go to it with the unused symbols.
    // first create new state
    const newDeadState = {
        id: deadStateId,
        isEntry: false,
        isExit: false,
    } as IState;
    // insert it into machine
    clonedMachine = addState(clonedMachine, newDeadState);
    let createdTransitionToThisState = false;
    let createdTransitionsToAndFromThisState = Immutable.Set<ITransition>();
    // find states where there aren't transitions with a symbol
    // const numberOfSymbolsInAlphabet = (clonedMachine.get(
    //     "alphabet"
    // ) as IAlphabet).size;
    for (const [state /* , value */] of clonedMachine.get(
        "states"
    ) as Immutable.Map<string, IIState>) {
        const symbolToStateSetMap = getAllTransitionsOfStateAsIDMapSplitOnCharacter(
            clonedMachine,
            state
        );
        for (const [symbol, toSetStates] of symbolToStateSetMap) {
            if (toSetStates.isEmpty()) {
                // this means there isn't a transition from state with symbol
                // create a transition from state to the new "dead" state using with symbol
                const newTransition = {
                    from: state,
                    with: symbol,
                    to: newDeadState.id,
                    pop: null,
                    push: null,
                } as ITransition;
                clonedMachine = addTransition(clonedMachine, newTransition);
                if (state !== newDeadState.id)
                    createdTransitionToThisState = true;
                if (state === newDeadState.id)
                    createdTransitionsToAndFromThisState = createdTransitionsToAndFromThisState.add(
                        newTransition
                    );
            }
        }
    }

    // if we didn't add any transitions then we must remove the created state and transitions
    if (!createdTransitionToThisState) {
        clonedMachine = removeState(clonedMachine, newDeadState);
        for (const transition of createdTransitionsToAndFromThisState) {
            clonedMachine = removeTransition(clonedMachine, transition);
        }
    }
    // All states which were final, will no longer be
    // and those that were not, will now be
    // calculate and put in cache the final states
    clonedMachine = updateExitStatesCache(clonedMachine);
    // set all states as final
    for (const [key, value] of clonedMachine.get("states") as Immutable.Map<
        string,
        IIState
    >) {
        const modifiedValue = {
            id: value.get("id"),
            isEntry: value.get("isEntry"),
            isExit: true,
        } as IState;
        clonedMachine = clonedMachine.set(
            "states",
            (clonedMachine.get("states") as Immutable.Map<string, IIState>).set(
                key,
                Immutable.Map(modifiedValue) as IIState
            )
        ) as IIMachine;
    }
    // set all states which were final as not final
    for (const [key, value] of clonedMachine.get("exitStates") as Immutable.Map<
        string,
        IIState
    >) {
        const modifiedValue = {
            id: value.get("id"),
            isEntry: value.get("isEntry"),
            isExit: false,
        } as IState;
        clonedMachine = clonedMachine.set(
            "states",
            (clonedMachine.get("states") as Immutable.Map<string, IIState>).set(
                key,
                Immutable.Map(modifiedValue) as IIState
            )
        ) as IIMachine;
    }
    clonedMachine = updateEntryStateCache(clonedMachine);
    clonedMachine = updateExitStatesCache(clonedMachine);
    return clonedMachine;
};

export const union = (
    machine1: IIMachine,
    machine2: IIMachine,
    renameToken = "_U",
    generateNewIds = false,
    newUnionInitialStateName = "UInitial"
): IIMachine => {
    const machine1Size = (machine1.get("states") as Immutable.Map<
        string,
        IIState
    >).size;
    const machine2Size = (machine2.get("states") as Immutable.Map<
        string,
        IIState
    >).size;
    // first machine should be shorter
    let clonedMachine = machine1Size > machine2Size ? machine2 : machine1;
    // second machine should be longer
    let clonedMachine2 = machine1Size > machine2Size ? machine1 : machine2;
    // The alphabet of the new machine is the union of the alphabets + epsilon
    clonedMachine2 = unionAlphabetsPlusEpsilon(clonedMachine2, clonedMachine);
    // saving the names of the modified states
    let modifiedNames = Immutable.Map<string, string>();
    // let exclusiveStates = Immutable.Map<string, IIState>().toSet().toMap().mapKeys((s) => s.get("id") as string);
    // The states of the new machine is the union of their states
    // If there are states with the same name, we should rename them

    for (const [key] of clonedMachine2.get("states") as Immutable.Map<
        string,
        IIState
    >) {
        if (
            (clonedMachine.get("states") as Immutable.Map<string, IIState>).has(
                key
            )
        ) {
            // construct the new state
            const newState = Immutable.Map({
                id: ((clonedMachine.get("states") as Immutable.Map<
                    string,
                    IIState
                >)
                    .get(key)
                    .get("id") as string).concat(renameToken),
                isEntry: !!(clonedMachine.get("states") as Immutable.Map<
                    string,
                    IIState
                >)
                    .get(key)
                    .get("isEntry"),
                isExit: !!(clonedMachine.get("states") as Immutable.Map<
                    string,
                    IIState
                >)
                    .get(key)
                    .get("isExit"),
            } as IState) as IIState;

            // saving the modified states for later
            modifiedNames = modifiedNames.set(
                (clonedMachine.get("states") as Immutable.Map<string, IIState>)
                    .get(key)
                    .get("id") as string,
                ((clonedMachine.get("states") as Immutable.Map<string, IIState>)
                    .get(key)
                    .get("id") as string).concat(renameToken)
            );

            // add the state on the first machine (not the return machine)
            clonedMachine = clonedMachine.set(
                "states",
                (clonedMachine.get("states") as Immutable.Map<
                    string,
                    IIState
                >).set(key.concat(renameToken), newState)
            );
            // delete the old state
            clonedMachine = clonedMachine.set(
                "states",
                (clonedMachine.get("states") as Immutable.Map<
                    string,
                    IIState
                >).remove(key)
            );
            // append back this renamed state to the other machine
            clonedMachine2 = clonedMachine2.set(
                "states",
                (clonedMachine2.get("states") as Immutable.Map<
                    string,
                    IIState
                >).set(key.concat(renameToken), newState)
            );
        }
    }
    // Union the states of the machines
    clonedMachine2 = clonedMachine2.set(
        "states",
        (clonedMachine2.get("states") as Immutable.Map<string, IIState>)
            .toSet()
            .union(
                (clonedMachine.get("states") as Immutable.Map<
                    string,
                    IIState
                >).toSet()
            )
            .toMap()
            .mapKeys((s) => s.get("id") as string)
    );
    // In this machine where the names of the states have been altered
    // We should rename each transition with the new name
    for (const transition of clonedMachine2.get(
        "transitions"
    ) as Immutable.Set<IITransition>) {
        // build new transition
        const newTransition = {
            from: modifiedNames.get(
                transition.get("from"),
                transition.get("from")
            ),
            with: transition.get("with"),
            to: modifiedNames.get(transition.get("to"), transition.get("to")),
            pop: null,
            push: null,
        } as ITransition;
        clonedMachine2 = removeTransition(
            clonedMachine2,
            transition.toObject() as ITransition
        );
        clonedMachine2 = addTransition(clonedMachine2, newTransition);
    }

    // Perform union of transitions of each machine
    clonedMachine2 = clonedMachine2.set(
        "transitions",
        (clonedMachine2.get(
            "transitions"
        ) as Immutable.Set<IITransition>).union(
            clonedMachine.get("transitions") as Immutable.Set<IITransition>
        )
    );

    // get the entry states of the machines. ClonedMachine2 already contains the states which are entry from both
    const entryStates = Immutable.List(
        (clonedMachine2.get("states") as Immutable.Map<string, IIState>).filter(
            (state) => !!state.get("isEntry")
        )
    );
    if (entryStates.size !== 2)
        // eslint-disable-next-line no-console
        console.error("didn't find 2 entry states in the machines provided");

    // These states lose the entry attribute they had
    for (const [key, value] of entryStates) {
        // build new state
        const newState = Immutable.Map({
            id: value.get("id"),
            isEntry: false,
            isExit: value.get("isExit"),
        } as IState) as IIState;

        // set it in the machine
        clonedMachine2 = clonedMachine2.set(
            "states",
            (clonedMachine2.get("states") as Immutable.Map<
                string,
                IIState
            >).set(key, newState)
        );
    }

    // create a new initial state
    const newInitialState = {
        id: newUnionInitialStateName,
        isEntry: true,
        isExit: false,
    } as IState;
    // add it to the machine
    clonedMachine2 = addState(clonedMachine2, newInitialState);

    // add transitions from this state, with epsilon, to the states which were entry states of the machine
    for (const [key] of entryStates) {
        clonedMachine2 = addTransition(clonedMachine2, {
            from: newInitialState.id,
            with: EPSILON,
            to: key,
            pop: null,
            push: null,
        } as ITransition);
    }
    // set the entry state attribute
    clonedMachine2 = setEntryState(clonedMachine2, newInitialState);
    // update exitStates cache
    clonedMachine2 = updateExitStatesCache(clonedMachine2);
    if (generateNewIds) {
        const newId = uuid();
        clonedMachine2 = clonedMachine2.set("name", newId).set("id", newId);
    }
    return clonedMachine2;
};

export const determinize = (machine: IIMachine): IIMachine => {
    // Dont do anything if already determinized
    if (isMachineDeterministic(machine)) {
        return machine;
    }
    // clone the machine to return
    let clonedMachine = machine;
    const hasEpsilon = findOutIfHasEpsilonTransition(machine);
    if (hasEpsilon) {
        // change transitions in original machine so they take to the epsilon closures
        // find epsilon closure of each state
        const epsilonClosureMap = getEpsilonClosureOfAllStates(clonedMachine);
        // Remove the epsilon transitions
        (clonedMachine.get(
            "transitions"
        ) as Immutable.Set<IITransition>).forEach((transition) => {
            if ((transition as IITransition).get("with") === EPSILON)
                clonedMachine = removeTransition(
                    clonedMachine,
                    transition.toObject() as ITransition
                );
        });

        // creating the new state
        const currentEntryStateString = (clonedMachine.get(
            "entry"
        ) as IIState).get("id") as string;
        const newStateId = epsilonClosureMap
            .get(currentEntryStateString)
            .sort()
            .join();
        const newEntryState = {
            id: newStateId,
            isEntry: true,
            isExit: isAnyExitState(
                clonedMachine,
                epsilonClosureMap.get(currentEntryStateString)
            ),
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
                    for (const state of epsilonClosure) {
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

        clonedMachine = clonedMachine.set(
            "states",
            (clonedMachine.get("states") as IIState).removeAll(
                (clonedMachine.get("states") as IIState).keys()
            )
        );
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
        for (const [
            key,
            elemt,
        ] of getAllTransitionsOfStateAsIDMapSplitOnCharacter(
            hasEpsilon ? clonedMachine : machine,
            state
        )) {
            if (!elemt.isEmpty()) {
                const newStateId = (elemt as Immutable.Set<string>)
                    .sort()
                    .join();
                if (
                    !stateSeenSet.isSuperset([elemt as Immutable.Set<string>])
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
                    const symbolToStateSetMap = getAllTransitionsOfStateAsIDMapSplitOnCharacter(
                        machine,
                        state
                    );

                    for (const [, value] of symbolToStateSetMap) {
                        const newMachine = addState(clonedMachine, {
                            id: (value as Immutable.Set<string>).sort().join(),
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
                    }
                    // Now we remove the transitions which pointed to the states we just merged
                    if ((elemt as Immutable.Set<string>).toArray().length !== 1)
                        for (const element of elemt as Immutable.Set<string>) {
                            clonedMachine = removeTransition(clonedMachine, {
                                from: state,
                                with: key,
                                to: element as ASymbol,
                                push: null,
                                pop: null,
                            } as ITransition);
                        }
                    // add this new state to the set
                    stateSeenSet = stateSeenSet.add(elemt);

                    // Add this new state to the computationStack
                    stateStack = stateStack.push(newStateId);
                } else {
                    // already exists state set, but new state or symbol takes to it
                    // must modify transitions of this state
                    for (const element of elemt as Immutable.Set<string>) {
                        clonedMachine = removeTransition(clonedMachine, {
                            from: state,
                            with: key,
                            to: element as ASymbol,
                            push: null,
                            pop: null,
                        } as ITransition);
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
        }
    }
    return removeUnreachableStates(clonedMachine);
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

export function* nextStep(
    machine: IIMachine,
    word: string // the whole string
): Generator<IITransition> {
    if (!isMachineDeterministic(machine)) {
        return false;
    }
    let i = 0;
    let symbol = word[i];

    // get initial state
    let currState = (machine.get("entry") as IIState).get("id");
    // yields empty vector when done
    while (true) {
        let ret = Immutable.List<IITransition>();
        for (const transition of machine.get(
            "transitions"
        ) as Immutable.Set<IITransition>) {
            if (
                transition.get("with") === symbol &&
                transition.get("from") === currState
            ) {
                currState = transition.get("to");
                ret = ret.push(transition);
                break;
            }
        }
        if (ret.isEmpty()) {
            if (machine.hasIn(["exitStates", currState]) && i === word.length)
                return true;
            return false;
        }
        yield ret.first();
        i += 1;
        symbol = word[i];
    }
}

export const intersect = (
    machine1: IIMachine,
    machine2: IIMachine,
    generateNewId = false
): IIMachine => {
    // return machine1;
    // Start by constructing automata which recognise the complement of these automata:
    // must first determinize
    let clonedMachine1 = determinize(machine1);
    let clonedMachine2 = determinize(machine2);

    // now we compute the complement
    clonedMachine1 = complement(machine1);
    clonedMachine2 = complement(machine2);

    // Take the union of these resultant automata:
    let machineUnion = union(clonedMachine1, clonedMachine2);
    // Remove useless and unreachable states:
    machineUnion = removeDeadStates(removeUnreachableStates(machineUnion));
    // determinize automaton
    machineUnion = determinize(machineUnion);
    // Minimise automaton:
    machineUnion = minimize(machineUnion);

    // Construct an automaton accepting the complement of the language recognised by the minimised automaton:
    machineUnion = complement(machineUnion);
    // Generate New Id
    if (generateNewId) {
        const newId = uuid();
        machineUnion = machineUnion.set("id", newId).set("name", newId);
    }
    return minimize(machineUnion);
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
        deterministic: isMachineDeterministic(machine),
    };
};
