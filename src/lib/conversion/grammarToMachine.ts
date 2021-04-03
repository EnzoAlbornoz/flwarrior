// Import Dependencies
import { GrammarType } from "@/database/schema/grammar";
import { getNewMachine, MachineType } from "@/database/schema/machine";
import Immutable from "immutable";
import { EPSILON } from "../AlphabetSymbol";
import { IIMachine, IITransition, ITransition } from "../automaton/Machine";
import { IIState, IState } from "../automaton/State";
import { IGrammar, IIGrammar, checkOwnType } from "../grammar/Grammar";
// Define Funtions
export default function convertRegularGrammarToNonDeterministicFiniteMachine(
    grammar: IIGrammar,
    renameAll = true
): IIMachine {
    // Check if Regular Grammar
    const grammarType = checkOwnType(grammar);
    if (grammarType !== GrammarType.REGULAR) {
        throw new TypeError(
            "Invalid grammar type. Need a regular grammar to convert"
        );
    }
    // Define Special Accept State
    const acceptState = "q0";
    const translationStateTable = (grammar.get(
        "nonTerminalSymbols"
    ) as IGrammar["nonTerminalSymbols"])
        .toMap()
        .mapEntries(([original], idx) => [
            original,
            renameAll ? `q${idx + 1}` : original,
        ])
        .set(acceptState, acceptState);
    // Define Machine Alphabet
    const machineAlphabet = grammar.get(
        "terminalSymbols"
    ) as IGrammar["terminalSymbols"];
    // Define Entry State
    const entryState = grammar.get("startSymbol") as IGrammar["startSymbol"];
    // Define Exit States
    const emptyWordPresent = (grammar.get(
        "productionRules"
    ) as IGrammar["productionRules"])
        .get(Immutable.List([entryState]))
        .contains(Immutable.List([EPSILON]));
    const exitStates = emptyWordPresent
        ? Immutable.Set([acceptState]).add(entryState)
        : Immutable.Set([acceptState]);
    // Define Convert Non Terminal Symbols to States (Include Accept State)
    const machineStates = (grammar.get(
        "nonTerminalSymbols"
    ) as IGrammar["nonTerminalSymbols"])
        .add(acceptState)
        .map(
            (state) =>
                Immutable.Map({
                    id: translationStateTable.get(state),
                    isEntry: state === entryState,
                    isExit: exitStates.includes(state),
                } as IState) as IIState
        )
        .toMap()
        .mapKeys((state) => state.get("id") as string);
    // Define Transition Rules
    const machineTransitions = (grammar.get(
        "productionRules"
    ) as IGrammar["productionRules"])
        .toKeyedSeq()
        .reduce(
            (acc, prods, head) =>
                acc.union(
                    prods.map(
                        (prod) =>
                            Immutable.Map({
                                from: translationStateTable.get(head.get(0)),
                                with: prod.get(0),
                                to: translationStateTable.get(
                                    prod.get(1, acceptState)
                                ),
                                pop: null,
                                push: null,
                            } as ITransition) as IITransition
                    )
                ),
            Immutable.Set<IITransition>()
        );
    // Build Machine
    const machine: IIMachine = Immutable.Map({
        ...getNewMachine(MachineType.FINITE_STATE_MACHINE, false),
        transitions: machineTransitions,
        states: machineStates,
        exitStates: machineStates.filter((state) => state.get("isExit")),
        entry: machineStates.find((state) => !!state.get("isEntry")),
        alphabet: machineAlphabet,
    }) as IIMachine;
    // Return Builded Machine
    return machine;
}
