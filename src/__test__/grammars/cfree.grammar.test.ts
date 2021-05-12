import Immutable from "immutable";
import { GrammarType } from "@/database/schema/grammar";
import {
    directFatorization,
    factorize,
    firstDerivatedBodies,
    fromDBEntry,
    generateNonTerminalSymbols,
    getRuleBodiesGroupedByPrefix,
    IGrammar,
    IGrammarWord,
    indirectFactorization,
    removeUnitProductions,
    removeEpsilonProductions,
    removeImproductiveSymbols,
    removeUnreachableSymbols,
} from "@/lib/grammar/Grammar";
import { test } from "@jest/globals";
import { inspect } from "util";
import { EPSILON } from "@/lib/AlphabetSymbol";

const grammar1 = fromDBEntry({
    id: "test1",
    name: "test1",
    alphabetNT: ["S", "A", "B", "C"],
    alphabetT: ["a", "b", "c"],
    startSymbol: "S",
    transitions: [
        {
            from: ["S"],
            to: [
                ["a", "B", "C"],
                ["a", "A", "C"],
                ["b", "B"],
            ],
        },
        {
            from: ["A"],
            to: [["a", "B"]],
        },
        {
            from: ["B"],
            to: [["a", "B"], ["b"]],
        },
        {
            from: ["C"],
            to: [["c"]],
        },
    ],
    type: GrammarType.CONTEXT_FREE,
});

const grammarCannonical = fromDBEntry({
    id: "test2",
    name: "test2",
    alphabetNT: ["S", "A", "B", "C", "D"],
    alphabetT: ["a", "c", "d", "e", "f"],
    startSymbol: "S",
    transitions: [
        {
            from: ["S"],
            to: ["AC".split(""), "BC".split("")],
        },
        {
            from: ["A"],
            to: ["aD".split(""), "cC".split("")],
        },
        {
            from: ["B"],
            to: ["aB".split(""), "dD".split("")],
        },
        {
            from: ["C"],
            to: ["eC".split(""), "eA".split("")],
        },
        {
            from: ["D"],
            to: ["fD".split(""), "CB".split("")],
        },
    ],
    type: GrammarType.CONTEXT_FREE,
});

const grammarCannonicalFactorized = fromDBEntry({
    id: "test2",
    name: "test2",
    alphabetNT: ["S", "A", "B", "C", "D", "E", "F"],
    alphabetT: ["a", "c", "d", "e", "f"],
    startSymbol: "S",
    transitions: [
        {
            from: ["S"],
            to: ["aE".split(""), "cCC".split(""), "dDC".split("")],
        },
        {
            from: ["A"],
            to: ["aD".split(""), "cC".split("")],
        },
        {
            from: ["B"],
            to: ["aB".split(""), "dD".split("")],
        },
        {
            from: ["C"],
            to: ["eF".split("")],
        },
        {
            from: ["D"],
            to: ["fD".split(""), "CB".split("")],
        },
        {
            from: ["E"],
            to: ["DC".split(""), "BC".split("")],
        },
        {
            from: ["F"],
            to: ["C".split(""), "A".split("")],
        },
    ],
    type: GrammarType.CONTEXT_FREE,
});

const grammarWithImproductive = fromDBEntry({
    id: "test3",
    name: "test3",
    alphabetNT: ["S", "A", "B", "C"],
    alphabetT: ["a", "b", "c"],
    startSymbol: "S",
    transitions: [
        {
            from: ["S"],
            to: ["ABB".split(""), "CAC".split("")],
        },
        {
            from: ["A"],
            to: ["a".split("")],
        },
        {
            from: ["B"],
            to: ["Bc".split(""), "ABB".split("")],
        },
        {
            from: ["C"],
            to: ["bB".split(""), "a".split("")],
        },
    ],
    type: GrammarType.CONTEXT_FREE,
});

const grammarWithUnreachable = fromDBEntry({
    id: "test4",
    name: "test4",
    alphabetNT: ["S", "A", "B"],
    alphabetT: ["a", "b", "c"],
    startSymbol: "S",
    transitions: [
        {
            from: ["S"],
            to: ["aS".split(""), "SB".split(""), "SS".split(""), "b".split("")],
        },
        {
            from: ["A"],
            to: ["ASB".split(""), "c".split("")],
        },
        {
            from: ["B"],
            to: ["b".split("")],
        },
    ],
    type: GrammarType.CONTEXT_FREE,
});

const grammarWithEpsilonProd = fromDBEntry({
    id: "test5",
    name: "test5",
    alphabetNT: ["S", "A", "B"],
    alphabetT: ["a", "b", "c"],
    startSymbol: "S",
    transitions: [
        {
            from: ["S"],
            to: ["AB".split(""), "Sc".split("")],
        },
        {
            from: ["A"],
            to: ["aA".split(""), [EPSILON]],
        },
        {
            from: ["B"],
            to: ["bB".split(""), [EPSILON]],
        },
    ],
    type: GrammarType.CONTEXT_FREE,
});

const grammarWithUnitProd = fromDBEntry({
    id: "test6",
    name: "test6",
    alphabetNT: ["D", "A", "B", "C", "S"],
    alphabetT: ["0", "1"],
    startSymbol: "D",
    transitions: [
        {
            from: ["D"],
            to: ["S".split(""), [EPSILON]],
        },
        {
            from: ["S"],
            to: [
                "0A0".split(""),
                "1B1".split(""),
                "BB".split(""),
                "00".split(""),
                "11".split(""),
                "B".split(""),
            ],
        },
        {
            from: ["A"],
            to: ["C".split("")],
        },
        {
            from: ["B"],
            to: ["S".split(""), "A".split("")],
        },
        {
            from: ["C"],
            to: ["S".split("")],
        },
    ],
    type: GrammarType.CONTEXT_FREE,
});

test("factoring", () => {
    const dateInit = Date.now();
    const factorizedGrammar = factorize(grammarCannonical);
    const dateEnd = Date.now();
    console.log(dateEnd - dateInit);
    expect(factorizedGrammar).toEqual(grammarCannonicalFactorized);
});

test("remove improductive symbols", () => {
    const grammar = removeImproductiveSymbols(grammarWithImproductive);
    console.log(inspect(grammar.toJS(), { depth: null, colors: true }));
});

test("remove unreachable symbols", () => {
    const grammar = removeUnreachableSymbols(grammarWithUnreachable);
    console.log(inspect(grammar.toJS(), { depth: null, colors: true }));
});

test("remove epsilon productions", () => {
    const grammar = removeEpsilonProductions(grammarWithEpsilonProd);
    console.log(inspect(grammar.toJS(), { depth: null, colors: true }));
});

test("remove unit productions", () => {
    const grammar = removeUnitProductions(grammarWithUnitProd);
    console.log(inspect(grammar.toJS(), { depth: null, colors: true }));
});
