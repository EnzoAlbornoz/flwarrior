// Import Dependencies
import { getNewGrammar, GrammarType } from "@/database/schema/grammar";
import { MachineType } from "@/database/schema/machine";
import Immutable from "immutable";
import { EPSILON } from "../AlphabetSymbol";
import { IIMachine, IMachine } from "../automaton/Machine";
import { IIState } from "../automaton/State";
import { IGrammar, IIGrammar } from "../grammar/Grammar";
// Define Helpers
const UNICODE_UPPER_A_OFFSET = 0x0041;
const ALPHABET_SIZE = 26;
export function* generateGrammarIds(
    initialSymbol = "S"
): Generator<string, void> {
    // Setup Generator
    const availableChars = [];
    for (let i = 0; i < ALPHABET_SIZE; i += 1) {
        const currentChar = String.fromCharCode(UNICODE_UPPER_A_OFFSET + i);
        if (initialSymbol !== currentChar) {
            availableChars.push(currentChar);
        }
    }
    // First Iteration
    yield initialSymbol;
    let iterations = 0;
    // Next Iterations
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const repeats = Math.floor(iterations / availableChars.length);
        const currentChar = String.fromCharCode(
            UNICODE_UPPER_A_OFFSET + (iterations % availableChars.length)
        );
        yield new Array(repeats + 1).fill(currentChar, 0, repeats + 1).join();
        iterations += 1;
    }
}
// Define Funtions
export default function convertDeterministicFiniteStateMachineToRegularGrammar(
    machine: IIMachine,
    renameAll = true
): IIGrammar {
    // Check for DFA
    if (
        (machine.get("type") as IMachine["type"]) !==
        MachineType.FINITE_STATE_MACHINE
    ) {
        throw new TypeError("Machine is not a FINITE_STATE_MACHINE");
    }
    // Define Non Terminal Symbols
    const nonTerminalSymbols = (machine.get("states") as IMachine["states"])
        .toSet()
        .map((state) => state.get("id") as string);
    // Define Terminal Symbols
    const terminalSymbols = machine.get("alphabet") as IMachine["alphabet"];
    // Define Initial Symbol
    let initialSymbol = (machine.get("entry") as IMachine["entry"]).get(
        "id"
    ) as string;
    // Define Production Rules
    let productionRules = (machine.get(
        "transitions"
    ) as IMachine["transitions"]).reduce(
        (heads, transition) =>
            heads.update(
                Immutable.List([transition.get("from") as string]),
                Immutable.Set(),
                (bodies) => {
                    const toState = transition.get("to");
                    const withState = transition.get("with");
                    let modBodies = bodies;
                    // Apply Rule 1 -  'δ(B,a) -> C' => 'B -> aC'
                    modBodies = modBodies.add(
                        Immutable.List([withState, toState])
                    );
                    // Apply Rule 2 -  'δ(B,a) -> C ∧ C ∈ F' => 'B -> a'
                    if (
                        (machine.getIn(["states", toState]) as IIState).get(
                            "isExit"
                        )
                    ) {
                        modBodies = modBodies.add(Immutable.List([withState]));
                    }
                    return modBodies;
                }
            ),
        Immutable.Map() as IGrammar["productionRules"]
    );
    // Check Entry State is Exit too (Apply Rule 3)
    if (machine.getIn(["exitStates", initialSymbol])) {
        // Check if has cycle
        const initialHasCycle = (machine.get(
            "transitions"
        ) as IMachine["transitions"]).some(
            (transition) => transition.get("to") === initialSymbol
        );
        if (initialHasCycle) {
            // Create New Rule Head
            const newInitialSymbol = "__init__";
            const oldInitialSymbol = initialSymbol;
            initialSymbol = newInitialSymbol;
            const initialSymbolWord = Immutable.List([newInitialSymbol]);
            const oldInitialSymbolWord = Immutable.List([oldInitialSymbol]);
            productionRules = productionRules.set(
                initialSymbolWord,
                productionRules
                    .get(oldInitialSymbolWord)
                    .add(Immutable.List([EPSILON]))
            );
        } else {
            // Only Append
            const initialSymbolWord = Immutable.List([initialSymbol]);
            productionRules = productionRules.update(
                initialSymbolWord,
                (bodies) => bodies.add(Immutable.List([EPSILON]))
            );
        }
    }
    // Create Grammar
    const idGenerator = generateGrammarIds("S");
    const translateTable = nonTerminalSymbols
        .toMap()
        .map((original) =>
            renameAll ? (idGenerator.next().value as string) : original
        );
    const grammarNonTerminalSymbols = Immutable.OrderedSet(
        nonTerminalSymbols
    ).map((nts) => translateTable.get(nts));
    const grammarTerminalSymbols = terminalSymbols;
    const grammarInitialSymbol = translateTable.get(initialSymbol);
    const grammarProductionRules = productionRules.mapEntries(
        ([head, bodies]) => [
            head.map((h) => translateTable.get(h)),
            bodies.map((body) =>
                body.size > 1
                    ? body.set(1, translateTable.get(body.get(1)))
                    : body
            ),
        ]
    );
    const grammar = Immutable.Map({
        ...getNewGrammar(GrammarType.REGULAR),
        nonTerminalSymbols: grammarNonTerminalSymbols,
        terminalSymbols: grammarTerminalSymbols,
        startSymbol: grammarInitialSymbol,
        productionRules: grammarProductionRules,
    }) as IIGrammar;
    // Return Builded Grammar
    return grammar;
}
