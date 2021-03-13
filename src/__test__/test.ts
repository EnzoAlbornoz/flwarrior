import { Tuple } from "../lib/utils";
import Alphabet, { IAlphabet } from "../lib/Alphabet";
import AlphabetSymbol, { ASymbol, EPSILON } from "../lib/AlphabetSymbol";
import Grammar, {
    addNonTerminalSymbol,
    addTerminalSymbol,
    fromDBEntry as createGrammarFromDBEntry,
    IIGrammar,
    removeTerminalSymbol,
    removeNonTerminalSymbol,
} from "../lib/grammar/Grammar";
import { GrammarType, GrammarDBEntry } from "../database/schema/grammar";
import FiniteStateMachine, {
    findOutIfHasEpsilonTransition,
    fromDBEntry as createMachineFromDBEntry,
    IIMachine,
    IITransition,
    addTransition,
    ITransition,
    getTransitionsOfState,
    setEntry as setEntryMachine,
    // getTransitionsOfStateWithSymbolAsIDSet,

} from "../lib/automaton/Machine";
import { State, IIState, IState } from "../lib/automaton/State";
import machine, { MachineType } from "../database/schema/machine";
import Immutable from "immutable";

function buildRegularNonDeterministicWithoutEpsilonMachine(): FiniteStateMachine {
    const q0 = new State("q0", true, true);
    const q1 = new State("q1", false, false);
    const q2 = new State("q2", false, true);

    // Machine taken from https://www.javatpoint.com/automata-conversion-from-nfa-to-dfa example 1

    return new FiniteStateMachine(
        "nonDeterministicMess",
        "id2",
        new Set([q0, q1, q2]),
        new Alphabet(
            new Set([new AlphabetSymbol("0"), new AlphabetSymbol("1")])
        ),
        [
            [[q0, new AlphabetSymbol("0")], q0],
            [[q0, new AlphabetSymbol("1")], q1],
            [[q1, new AlphabetSymbol("1")], q1],
            [[q1, new AlphabetSymbol("0")], q1], // y States with same symbol transitions
            [[q1, new AlphabetSymbol("0")], q2], // y States with same symbol transitions
            [[q2, new AlphabetSymbol("1")], q2], // x States with same symbol transitions
            [[q2, new AlphabetSymbol("1")], q1], // x States with same symbol transitions
            [[q2, new AlphabetSymbol("0")], q2],
        ],
        q0,
        new Set([q2])
    );
}

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

test("Test Grammar add non redundant new Production Body", () => {
    const gram = buildRegularSadGrammar();
    expect(() =>
        gram.addProductionBody(
            [new AlphabetSymbol("L")],
            new Set([[new AlphabetSymbol("l"), new AlphabetSymbol("L")]])
        )
    ).toThrow(Error);

    // console.log(gram.productionRules);
});

test("Test Grammar add redundant Production Head", () => {
    const gram = buildRegularSadGrammar();
    gram.addProductionHead([new AlphabetSymbol("S")]);
    expect(gram.productionRules.length).toEqual(3); // check did not add
    // console.log(gram.productionRules);
});

test("Test Grammar add redundant Production Body", () => {
    const gram = buildRegularSadGrammar();
    gram.addProductionBody(
        [new AlphabetSymbol("S")],
        new Set([[new AlphabetSymbol("l"), new AlphabetSymbol("L")]])
    );
    expect(gram.productionRules.length).toEqual(3); // check no new production head
    expect(gram.productionRules[0][1].size).toEqual(3);
    expect(Array.from(gram.productionRules[0][1].keys())[0][0].symbol).toEqual(
        "a"
    );
    expect(Array.from(gram.productionRules[0][1].keys())[0][1].symbol).toEqual(
        "A"
    );
    expect(Array.from(gram.productionRules[0][1].keys())[1][0].symbol).toEqual(
        "ε"
    );
    expect(Array.from(gram.productionRules[0][1].keys())[2][0].symbol).toEqual(
        "l"
    );
    expect(Array.from(gram.productionRules[0][1].keys())[2][1].symbol).toEqual(
        "L"
    );
    // console.log(Array.from(gram.productionRules[0][1].keys())[0][0].symbol);
});

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

test("Test Finite State Machine conversion from NDFM to DFM without ε", () => {
    const nDFM = buildRegularNonDeterministicWithoutEpsilonMachine();
    const determinized = nDFM.determinize();
});

test("test find out if there is Epsilon Transition", () => {
    const nDFM = buildRegularNonDeterministicWithoutEpsilonMachine();
    const dFM = buildRegularSadFiniteMachine();
    expect(nDFM.findOutIfHasEpsilonTransition()).toEqual(false);
    expect(dFM.findOutIfHasEpsilonTransition()).toEqual(false);
});

// test("test get transitions from state", () => {
//     const dFM = buildRegularNonDeterministicWithoutEpsilonMachine();
//     // console.log(Array.from(dFM.states.keys())[0].toString());
//     const q0 = Array.from(dFM.states.keys())[0];
//     const transitions = dFM.findTransitionsOfState(q0);
//     expect(transitions[0][0][0].equals(q0)).toBe(true);
//     expect(transitions[1][0][0].equals(q0)).toBe(true);
//     expect(transitions[0][0][1].toString()).toBe("0");
//     expect(transitions[1][0][1].toString()).toBe("1");
//     expect(transitions[0][1].equals(q0)).toBe(true);
//     expect(transitions[1][1].id).toEqual("q1");
// });

test("test add symbols to new IIGrammar", () => {
    // IIGrammar
    const immutableGrammar = createGrammarFromDBEntry({
        id: "test",
        name: "test",
        alphabetT: [],
        alphabetNT: [],
        startSymbol: "S",
        transitions: [],
        type: GrammarType.REGULAR,
    });

    let modifiedGrammar = addNonTerminalSymbol(immutableGrammar, "j");

    expect(
        (immutableGrammar.get("nonTerminalSymbols") as IAlphabet).includes("j")
    ).toBeFalsy();

    expect(
        (modifiedGrammar.get("nonTerminalSymbols") as IAlphabet).includes("j")
    ).toBeTruthy();

    modifiedGrammar = addTerminalSymbol(immutableGrammar, "s");

    expect(
        (immutableGrammar.get("nonTerminalSymbols") as IAlphabet).includes("j")
    ).toBeFalsy();

    expect(
        (modifiedGrammar.get("terminalSymbols") as IAlphabet).includes("s")
    ).toBeTruthy();
});

test("test remove symbols to new IIGrammar", () => {
    // IIGrammar
    const immutableGrammar = createGrammarFromDBEntry({
        id: "test",
        name: "test",
        alphabetT: ["c"],
        alphabetNT: ["C"],
        startSymbol: "S",
        transitions: [],
        type: GrammarType.REGULAR,
    });

    let modifiedGrammar = removeTerminalSymbol(immutableGrammar, "c");

    expect(
        (modifiedGrammar.get("terminalSymbols") as IAlphabet).includes("c")
    ).toBeFalsy();

    expect(
        (modifiedGrammar.get("nonTerminalSymbols") as IAlphabet).includes("C")
    ).toBeTruthy();

    modifiedGrammar = removeNonTerminalSymbol(modifiedGrammar, "C");

    expect(
        (modifiedGrammar.get("nonTerminalSymbols") as IAlphabet).includes("C")
    ).toBeFalsy();
});

function buildImmutableRegularNonDeterministicWithoutEpsilonMachine(): IIMachine {
    return createMachineFromDBEntry({
        id: "test",
        name: "test",
        deterministic: true,
        type: MachineType.FINITE_STATE_MACHINE,
        states: [
            { id: "q0", isEntry: true, isExit: true },
            { id: "q1", isEntry: false, isExit: false },
            { id: "q2", isEntry: false, isExit: true },
        ],
        entryAlphabet: ["0, 1, ε"],
        memoryAlphabet: [],
        transitions: [
            {
                from: "q0",
                with: { head: "0", memory: "" },
                to: { newState: "q0", writeSymbol: "", headDirection: null },
            },
            {
                from: "q0",
                with: { head: "1", memory: "" },
                to: { newState: "q1", writeSymbol: "", headDirection: null },
            },
            {
                from: "q1",
                with: { head: "1", memory: "" },
                to: { newState: "q1", writeSymbol: "", headDirection: null },
            },
            {
                from: "q1",
                with: { head: "0", memory: "" },
                to: { newState: "q1", writeSymbol: "", headDirection: null },
            },
            {
                from: "q1",
                with: { head: "0", memory: "" },
                to: { newState: "q2", writeSymbol: "", headDirection: null },
            },
            {
                from: "q2",
                with: { head: "1", memory: "" },
                to: { newState: "q2", writeSymbol: "", headDirection: null },
            },
            {
                from: "q2",
                with: { head: "1", memory: "" },
                to: { newState: "q1", writeSymbol: "", headDirection: null },
            },
            {
                from: "q2",
                with: { head: "0", memory: "" },
                to: { newState: "q2", writeSymbol: "", headDirection: null },
            },
        ],
    });
}

test("test find Out If Has Epsilon on IIMachine", () => {
    let immutableMachine = buildImmutableRegularNonDeterministicWithoutEpsilonMachine();
    expect(findOutIfHasEpsilonTransition(immutableMachine)).toBe(false);
    const modifiedMachine = addTransition(immutableMachine, {
        from: "q2",
        with: EPSILON,
        to: "q2",
        push: null, pop: null,
    });
    expect(findOutIfHasEpsilonTransition(modifiedMachine)).toBe(true);
});

test("test set Entry On Machine", () => {
    let immutableMachine = buildImmutableRegularNonDeterministicWithoutEpsilonMachine();
    expect(immutableMachine["entry"]).toBe(undefined);
    let machineWithEntry = setEntryMachine(immutableMachine, {
        id: "q0",
        isEntry: true,
        isExit: true,
    });
    expect((machineWithEntry.get("entry") as IIState).get("id")).toBe("q0");
});

test("test determinization", () => {
    const immutableMachine = buildImmutableRegularNonDeterministicWithoutEpsilonMachine();
    let machineWithEntry = setEntryMachine(immutableMachine, {
        id: "q0",
        isEntry: true,
        isExit: true,
    });
});

test("test find transitions of state", () => {
    const immutableMachine = buildImmutableRegularNonDeterministicWithoutEpsilonMachine();
    const machineWithEntry = setEntryMachine(immutableMachine, {
        id: "q0",
        isEntry: true,
        isExit: true,
    });
    let transitions = getTransitionsOfState(machineWithEntry, "q0");
    const last: IITransition = Immutable.Map({
        from: "q0",
        with: "0",
        to: "q0",
        push: null,
        pop: null
    }) as IITransition;
    const expected: IITransition = Immutable.Map({
        from: "q0",
        with: "1",
        to: "q1",
        push: null,
        pop: null
    }) as IITransition;

    expect(transitions.equals(Immutable.Set([last, expected]))).toBe(true);
    expect(transitions.isSubset(Immutable.Set([last, expected]))).toBe(true);

    // console.log(getTransitionsOfStateWithSymbolAsIDSet(machineWithEntry, "q1", "0"));
    // playin around

    // var setu = Immutable.Set(["q1", "q2"]);
    // var setu2 = Immutable.Set(["q2", "q1"]);
    // console.log(setu.toJS());
    // console.log(setu2.toJS());
    // console.log(setu.equals(setu2));

});

