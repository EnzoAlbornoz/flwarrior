import Immutable from "immutable";
import { GrammarType } from "@/database/schema/grammar";
import {
    factorize,
    fromDBEntry,
    removeUnitProductions,
    removeEpsilonProductions,
    removeImproductiveSymbols,
    removeUnreachableSymbols,
    getAnalysisTable,
    getFirsts,
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
            to: ["aF".split(""), "cCC".split(""), "dDC".split("")],
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
            to: ["eE".split("")],
        },
        {
            from: ["D"],
            to: ["fD".split(""), "CB".split("")],
        },
        {
            from: ["E"],
            to: ["C".split(""), "A".split("")],
        },
        {
            from: ["F"],
            to: ["BC".split(""), "DC".split("")],
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

const grammarToTestFirsts = fromDBEntry({
    id: "test7",
    name: "test7",
    alphabetNT: ["A", "B", "C", "S"],
    alphabetT: ["a", "b", "c", "d", EPSILON],
    startSymbol: "S",
    transitions: [
        {
            from: ["S"],
            to: ["ABC".split("")],
        },
        {
            from: ["A"],
            to: ["aA".split(""), [EPSILON]],
        },
        {
            from: ["B"],
            to: ["bB".split(""), "ACd".split("")],
        },
        {
            from: ["C"],
            to: ["cC".split(""), [EPSILON]],
        },
    ],
    type: GrammarType.CONTEXT_FREE,
});

const grammarToTestFirsts2 = fromDBEntry({
    id: "test7",
    name: "test7",
    alphabetT: ["c", "com", "ε", ";", "v", "f", "b", "e"],
    alphabetNT: ["P", "V", "C", "K", "F"],
    startSymbol: "P",
    transitions: [
        { from: ["P"], to: [["K", "V", "C"]] },
        { from: ["K"], to: [["c", "K"], ["ε"]] },
        { from: ["V"], to: [["v"], ["V"], ["F"]] },
        { from: ["F"], to: [["f", "P", ";", "F"], ["ε"]] },
        {
            from: ["C"],
            to: [["b", "V", "C", "e"], ["com", ";", "C"], ["ε"]],
        },
    ],
    type: GrammarType.CONTEXT_FREE,
});

test("factoring", () => {
    const factorizedGrammar = factorize(grammarCannonical);
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

test("get firsts", () => {
    const grammar = getFirsts(grammarToTestFirsts);
    console.log(inspect(grammar.toJS(), { depth: null, colors: true }));
});

test("get firsts 2", () => {
    const grammar = getFirsts(grammarToTestFirsts2);
    console.log(inspect(grammar.toJS(), { depth: null, colors: true }));
});

test("get analysis table", () => {
    const grammar = getAnalysisTable(grammarToTestFirsts2);
    console.log(inspect(grammar.toJS(), { depth: null, colors: true }));
});
