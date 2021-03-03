import { Tuple } from "../lib/utils";
import Alphabet from "../lib/Alphabet";
import AlphabetSymbol from "../lib/AlphabetSymbol";
import Grammar from "../lib/grammar/Grammar";
import { GrammarType } from "../database/schema/grammar";
import FiniteStateMachine from "../lib/automaton/Machine";
import { State } from "../lib/automaton/State";

function buildRegularSadGrammar(): Grammar {
    // S -> aA | epsilon.
    // B -> b | b | Bb. this is by design
    // A -> aA | a | Bb.
    return new Grammar(
        "id0", // id
        new Alphabet( // nonTerminal
            new Set([
                new AlphabetSymbol("S"),
                new AlphabetSymbol("A"),
                new AlphabetSymbol("B"),
            ])
        ),
        new Alphabet( // Terminal
            new Set([
                new AlphabetSymbol("a"),
                new AlphabetSymbol("b"),
                AlphabetSymbol.EPSILON,
            ])
        ),
        [
            // Productions
            [
                [new AlphabetSymbol("S")],
                new Set([
                    [new AlphabetSymbol("a"), new AlphabetSymbol("A")],
                    [AlphabetSymbol.EPSILON],
                ]),
            ],
            [
                [new AlphabetSymbol("A")],
                new Set([
                    [new AlphabetSymbol("a"), new AlphabetSymbol("A")],
                    [new AlphabetSymbol("a")],
                    [new AlphabetSymbol("B"), new AlphabetSymbol("b")],
                ]),
            ],
            [
                [new AlphabetSymbol("B")],
                new Set([
                    [new AlphabetSymbol("b")],
                    [new AlphabetSymbol("b")],
                    [new AlphabetSymbol("B"), new AlphabetSymbol("b")],
                ]),
            ],
        ],
        new AlphabetSymbol("S"), // startSymbol
        GrammarType.REGULAR, // grammar type
        "sad" // name
    );
}

function buildRegularSadFiniteMachine(): FiniteStateMachine {
    const entryState = new State("q0", true, true);
    const otherState = new State("q1", false, true);
    return new FiniteStateMachine(
        "sad",
        "id1",
        new Set([entryState, otherState]),
        new Alphabet(
            new Set([
                new AlphabetSymbol("b"),
                new AlphabetSymbol("a"),
                AlphabetSymbol.EPSILON,
            ])
        ),
        [
            [[entryState, new AlphabetSymbol("a")], entryState],
            [[entryState, new AlphabetSymbol("b")], otherState],
            [[otherState, new AlphabetSymbol("b")], otherState],
        ],
        entryState,
        new Set([entryState, otherState])
    );
}

test("Test Grammar creation", () => {
    const gram = buildRegularSadGrammar();
    expect(gram.type).toBe(GrammarType.REGULAR);
    expect(gram.id).toEqual("id0");
    expect(gram.name).toEqual("sad");
    expect(gram.startSymbol).toEqual(new AlphabetSymbol("S"));

    expect(
        Array.from(gram.nonTerminalSymbols.symbols).toString()
    ).not.toContain(new AlphabetSymbol("X").toString());
    expect(Array.from(gram.nonTerminalSymbols.symbols).toString()).toContain(
        new AlphabetSymbol("S").toString()
    );
    expect(Array.from(gram.nonTerminalSymbols.symbols).toString()).toContain(
        new AlphabetSymbol("A").toString()
    );
    expect(Array.from(gram.nonTerminalSymbols.symbols).toString()).toContain(
        new AlphabetSymbol("B").toString()
    );

    expect(Array.from(gram.terminalSymbols.symbols).toString()).not.toContain(
        new AlphabetSymbol("X").toString()
    );
    expect(Array.from(gram.terminalSymbols.symbols).toString()).toContain(
        new AlphabetSymbol("a").toString()
    );
    expect(Array.from(gram.terminalSymbols.symbols).toString()).toContain(
        new AlphabetSymbol("b").toString()
    );
    expect(Array.from(gram.terminalSymbols.symbols).toString()).toContain(
        AlphabetSymbol.EPSILON.toString()
    );

    // TODO test productions
});

test("Test Grammar adding nonTerminal Symbol", () => {
    const gram = buildRegularSadGrammar();
    gram.addNonTerminalSymbol(new AlphabetSymbol("X"));
    expect(gram.nonTerminalSymbols.symbols.size).toEqual(4);
});

test("Test Grammar add non redundant new Production Head", () => {
    const gram = buildRegularSadGrammar();
    gram.addProductionHead([new AlphabetSymbol("X"), new AlphabetSymbol("Y")]);
    expect(gram.productionRules.length).toEqual(4);
    expect(gram.productionRules[3][0][0].toString()).toEqual("X");
    expect(gram.productionRules[3][0][1].toString()).toEqual("Y");
    expect(gram.productionRules[3][1].size).toEqual(0);
    // console.log(gram.productionRules);
});

// test("Test Grammar add non redundant new Production Body", () => {
//     var gram = buildRegularSadGrammar();
//     gram.addProductionBody([new AlphabetSymbol("L")], new Set([[new AlphabetSymbol("X"), new AlphabetSymbol("Y")]]));
//     expect(gram.productionRules.length).toEqual(4);
//     expect(gram.productionRules[3][0][0].toString()).toEqual("X");
//     expect(gram.productionRules[3][0][1].toString()).toEqual("Y");
//     expect(gram.productionRules[3][1].size).toEqual(0);
//     // console.log(gram.productionRules);
// });

test("Test Grammar add redundant Production Head", () => {
    const gram = buildRegularSadGrammar();
    gram.addProductionHead([new AlphabetSymbol("S")]);
    expect(gram.productionRules.length).toEqual(3); // check did not add
    console.log(gram.productionRules);
});

// test("Test Grammar add redundant Production Body", () => {
//     var gram = buildRegularSadGrammar();
//     gram.addProductionHead([new AlphabetSymbol("S")]);
//     expect(gram.productionRules.length).toEqual(3); // check did not add
//     console.log(gram.productionRules);
// });

test("Test Finite State Machine creation", () => {
    const machine = buildRegularSadFiniteMachine();
    expect(machine.id).toEqual("id1");
    expect(machine.name).toEqual("sad");
    expect(machine.entry.id).toEqual("q0");
    expect(machine.entry.isEntry).toBe(true);

    expect(Array.from(machine.states).toString()).toContain("q0");
    expect(Array.from(machine.states).toString()).toContain("q1");
    expect(
        Array.from(
            machine.alphabet.symbols
        ).map((alphabetSymbol: AlphabetSymbol) => alphabetSymbol.toString())
    ).toEqual(expect.arrayContaining(["b", "a", "ε"]));

    // TODO rest
});
