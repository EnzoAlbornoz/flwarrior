// Import Dependencies
import Immutable from "immutable";
import { GrammarType } from "@/database/schema/grammar";
import { IMachine } from "@/lib/automaton/Machine";
import { inspect } from "util";
import { EPSILON } from "@/lib/AlphabetSymbol";
import { convertRegularGrammarToNonDeterministicFiniteMachine } from "../../lib/conversion";
import {
    fromDBEntry as grammarFromDB,
    IGrammar,
} from "../../lib/grammar/Grammar";
// Defne Setup
const grammar1 = grammarFromDB({
    id: "grammar1",
    name: "grammar1",
    type: GrammarType.REGULAR,
    startSymbol: "S",
    alphabetT: ["a"],
    alphabetNT: ["S", "A", "B", "C", "D", "E"],
    transitions: [
        {
            from: ["S"],
            to: [
                ["a", "A"],
                ["a", "B"],
            ],
        },
        {
            from: ["A"],
            to: [["a"], ["a", "C"]],
        },
        {
            from: ["B"],
            to: [["a", "D"]],
        },
        {
            from: ["C"],
            to: [["a", "A"]],
        },
        {
            from: ["D"],
            to: [["a"], ["a", "E"]],
        },
        {
            from: ["E"],
            to: [["a", "B"]],
        },
    ],
});
// Execute Tests
test("[convertRegularGrammarToNonDeterministicFiniteMachine]", () => {
    // Setup
    // SUT
    const machine = convertRegularGrammarToNonDeterministicFiniteMachine(
        grammar1,
        false
    );
    // Asserts
    expect(
        (machine.get("transitions") as IMachine["transitions"]).equals(
            Immutable.Set([
                Immutable.Map({
                    from: "S",
                    with: "a",
                    to: "A",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "D",
                    with: "a",
                    to: "q0",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "C",
                    with: "a",
                    to: "A",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "A",
                    with: "a",
                    to: "q0",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "A",
                    with: "a",
                    to: "C",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "E",
                    with: "a",
                    to: "B",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "S",
                    with: "a",
                    to: "B",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "D",
                    with: "a",
                    to: "E",
                    pop: null,
                    push: null,
                }),
                Immutable.Map({
                    from: "B",
                    with: "a",
                    to: "D",
                    pop: null,
                    push: null,
                }),
            ])
        )
    ).toBeTruthy();
});
